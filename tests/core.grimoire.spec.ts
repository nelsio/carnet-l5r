/** Lot 30, v2.22.0 (HANDOFF annexe N.3) : lecture, validation, conversion et recherche des sorts du grimoire, cas GR1 à GR10. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpell, fillFromGrimoire, grimoireConflicts, GrimoireFormatError, parseGrimoireFile, readGrimoireFile, sameSpell, searchGrimoire, toCarnetSpell, toGrimoireSpell, SpellSchema,
  type GrimoireSpell, type Spell,
} from "@carnet/core";
import { GRIMOIRE_KEYS, grimoireFile, grimoireFixture } from "./helpers/grimoire";

const all = () => GRIMOIRE_KEYS.flatMap((k) => readGrimoireFile(grimoireFixture(k)));
const entry = (patch: Record<string, unknown> = {}) => ({
  id: "earth-1-jade-strike", name: "Frappe de Jade (Jade Strike)", element: "Terre", mastery: 1,
  keywords: ["Jade", "Tonnerre"], range: "30 mètres (100')", area: "Une créature", duration: "Instantanée",
  raises: "Dégâts (+1g0), Cibles (+1)", desc: "Texte de l'auteur.", ...patch,
});

afterEach(() => vi.restoreAllMocks());

describe("GR1 : les 6 fichiers réels", () => {
  it("162 sorts : 3, 35, 36, 36, 25, 27", () => {
    const counts = GRIMOIRE_KEYS.map((k) => parseGrimoireFile(grimoireFixture(k)).length);
    expect(counts).toEqual([3, 35, 36, 36, 25, 27]);
    expect(GRIMOIRE_KEYS.map((k) => readGrimoireFile(grimoireFixture(k)).length)).toEqual(counts);
    expect(all()).toHaveLength(162);
  });

  it("chaque sort converti est un sort valide du Carnet", () => {
    for (const g of all()) expect(SpellSchema.safeParse(toCarnetSpell(g)).success, g.gid).toBe(true);
  });
});

describe("GR2 : fichier illisible", () => {
  it("texte sans tableau, JSON5 invalide, tableau qui n'en est pas un", () => {
    expect(() => parseGrimoireFile("const X = {};")).toThrow(GrimoireFormatError);
    expect(() => parseGrimoireFile("<!doctype html><title>404</title>")).toThrow(GrimoireFormatError);
    expect(() => parseGrimoireFile(grimoireFile('{ id: "a", name: }'))).toThrow(GrimoireFormatError);
    expect(() => parseGrimoireFile('const X = "[1]";')).toThrow(GrimoireFormatError);
  });
});

describe("GR3 : lecture sans exécution", () => {
  it("le code hors du tableau n'est jamais exécuté ; une valeur piégée reste du texte", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const trap = "</script><img src=x onerror=alert(1)>";
    const text = `alert(1); fetch("https://exemple.invalid/");\n${grimoireFile(`{ id: "t", name: ${JSON.stringify(trap)}, element: "Feu", mastery: 1, range: "alert(2)" }`)}alert(3);`;
    const [g] = readGrimoireFile(text);
    expect(alert).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(g?.name).toBe(trap);
    expect(g?.range).toBe("alert(2)");
    vi.unstubAllGlobals();
  });

  it("une expression JavaScript dans le tableau rend le fichier illisible au lieu d'être évaluée", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    expect(() => parseGrimoireFile(grimoireFile('{ id: "t", name: alert(1), element: "Feu", mastery: 1 }'))).toThrow(GrimoireFormatError);
    expect(alert).not.toHaveBeenCalled();
  });
});

describe("GR4 : validation", () => {
  it("Mahō, Kihō, maîtrise 7, nom absent : entrées ignorées, les autres gardées", () => {
    const rows = [
      entry({ id: "ok" }),
      entry({ id: "maho", element: "Maho" }),
      entry({ id: "maho2", element: "Mahō" }),
      entry({ id: "flag", isMaho: true }),
      entry({ id: "kiho", element: "Kiho" }),
      entry({ id: "m7", mastery: 7 }),
      entry({ id: "m0", mastery: 0 }),
      entry({ id: "noname", name: undefined }),
      entry({ id: "" }),
      entry({ id: "ok2", element: "Feu" }),
    ];
    expect(readGrimoireFile(grimoireFile(rows.map((r) => JSON.stringify(r)).join(",\n"))).map((g) => g.gid)).toEqual(["ok", "ok2"]);
  });

  it("mots-clés trop longs ou non textuels ignorés ; champs facultatifs absents → vides", () => {
    const g = toGrimoireSpell({ id: "x", name: "Brise", element: "air", mastery: 2, keywords: ["Air", 3, "x".repeat(41)] })!;
    expect(g.keywords).toEqual(["Air"]);
    expect([g.range, g.area, g.duration, g.raises]).toEqual(["", "", "", ""]);
  });
});

describe("GR5 et GR6 : conversion", () => {
  it("« Frappe de Jade (Jade Strike) », Terre, 1", () => {
    const g = toGrimoireSpell(entry())!;
    expect(g).toMatchObject({ gid: "earth-1-jade-strike", name: "Frappe de Jade", nameAlt: "Jade Strike", element: "earth", mastery: 1 });
    const s = toCarnetSpell(g);
    expect(s).toMatchObject({ name: "Frappe de Jade", element: "earth", mastery: 1, effect: "", memorized: false, range: "30 mètres (100')" });
    expect(s.damage).toBeUndefined();
    expect(s.id).toMatch(/^s/);
  });

  it("universel « Sentir les Kami (Sense) » : élément all, maîtrise 1", () => {
    const g = toGrimoireSpell({ id: "univ-sense", name: "Sentir les Kami (Sense)", element: "Universel", mastery: "Universel" })!;
    expect(toCarnetSpell(g)).toMatchObject({ name: "Sentir les Kami", element: "all", mastery: 1 });
  });

  it("éléments du grimoire, accents et casse ignorés", () => {
    const el = (element: string) => toGrimoireSpell(entry({ element }))?.element;
    expect(["Air", "terre", "FEU", "Eau", "Vide", "Universel"].map(el)).toEqual(["air", "earth", "fire", "water", "void", "all"]);
  });

  it("limites du schéma : portée, zone, durée coupées", () => {
    const g = toGrimoireSpell(entry({ range: "r".repeat(100), area: "a".repeat(150), duration: "d".repeat(100) }))!;
    expect([g.range.length, g.area.length, g.duration.length]).toEqual([80, 120, 80]);
  });
});

describe("GR7 : augmentations", () => {
  it("virgule entre parenthèses gardée ; « Aucune » → vide", () => {
    const g = toGrimoireSpell(entry({ raises: "Durée (+2 rounds), Portée (+3 m / +10'), Cibles (+1, max 4 cibles au total)" }))!;
    expect(g.raises.split("\n")).toEqual(["Durée (+2 rounds)", "Portée (+3 m / +10')", "Cibles (+1, max 4 cibles au total)"]);
    expect(toGrimoireSpell(entry({ raises: "Aucune" }))!.raises).toBe("");
    expect(toGrimoireSpell(entry({ raises: "Aucun" }))!.raises).toBe("");
  });

  it("sur les vrais fichiers : « +1,5 m » reste sur une ligne", () => {
    const g = all().find((x) => x.raises.includes("+1,5 m en largeur"))!;
    expect(g.raises.split("\n")[0]).toBe("Zone (+1,5 m en largeur)");
  });
});

describe("GR8 : VD", () => {
  it("« 3 k 3 » et « 3g3 » → 3g3 ; « Anneau g Anneau » ignoré ; damageNote seul → effet « VD : … »", () => {
    expect(toGrimoireSpell(entry({ damage: "3 k 3" }))!.damage).toBe("3g3");
    expect(toCarnetSpell(toGrimoireSpell(entry({ damage: "3g3" }))!).damage).toBe("3g3");
    expect(toGrimoireSpell(entry({ damage: "Anneau g Anneau" }))!.damage).toBeUndefined();
    const noted = toCarnetSpell(toGrimoireSpell(entry({ damageNote: "Anneau de Feu g Anneau de Feu" }))!);
    expect(noted.effect).toBe("VD : Anneau de Feu g Anneau de Feu");
    expect(noted.damage).toBeUndefined();
    expect(toCarnetSpell(toGrimoireSpell(entry({ damage: "2g2", damageNote: "x" }))!).effect).toBe("");
    expect(toGrimoireSpell(entry({ damageNote: "n".repeat(121) }))!.damageNote).toBeUndefined();
  });
});

describe("GR9 : description", () => {
  it("jamais conservée", () => {
    const g = toGrimoireSpell(entry())!;
    expect(g).not.toHaveProperty("desc");
    expect(JSON.stringify(g)).not.toContain("Texte de l'auteur");
  });
});

describe("GR10 : recherche", () => {
  const list = all();
  const names = (r: GrimoireSpell[]) => r.map((g) => g.name);

  it("« arm » : Armure de Terre en tête", () => {
    expect(names(searchGrimoire(list, "arm"))[0]).toBe("Armure de Terre");
  });

  it("par le nom anglais, sans accents ni casse", () => {
    expect(names(searchGrimoire(list, "jade strike"))).toEqual(["Frappe de Jade"]);
    expect(names(searchGrimoire(list, "eteindre"))).toContain("Éteindre");
    expect(names(searchGrimoire(list, "ÉTEINDRE"))[0]).toBe("Éteindre");
  });

  it("filtre Terre ; limite", () => {
    const earth = searchGrimoire(list, "", "earth");
    expect(earth).toHaveLength(36);
    expect(earth.every((g) => g.element === "earth")).toBe(true);
    expect(searchGrimoire(list, "de", "all-elements", 8)).toHaveLength(8);
  });

  it("sans requête : universels, Air, Terre, Feu, Eau, Vide, puis maîtrise", () => {
    const r = searchGrimoire(list, "");
    expect(r).toHaveLength(162);
    expect(r.slice(0, 3).map((g) => g.element)).toEqual(["all", "all", "all"]);
    const order = ["all", "air", "earth", "fire", "water", "void"];
    for (let i = 1; i < r.length; i++) {
      const [a, b] = [r[i - 1]!, r[i]!];
      const d = order.indexOf(a.element) - order.indexOf(b.element);
      expect(d < 0 || (d === 0 && a.mastery <= b.mastery)).toBe(true);
    }
  });

  it("sameSpell : noms normalisés égaux", () => {
    const g = toGrimoireSpell(entry())!;
    expect(sameSpell({ name: " frappe de jade " }, g)).toBe(true);
    expect(sameSpell({ name: "Frappe" }, g)).toBe(false);
  });
});

/** Lot 31, v2.23.0 (HANDOFF annexe N.8) : remplir un sort existant depuis le grimoire, cas GR26 et GR27 côté moteur. */
describe("N.8 : remplir un sort saisi", () => {
  const jade = () => toGrimoireSpell(entry({ area: "Une cible", duration: "Instantanée" }))!;
  const typed = (patch: Partial<Spell> = {}): Spell => ({
    ...createSpell("Frappe de jade", "earth"), keywords: ["Jade", "Tonnerre"], range: "30 m", area: "une cible", duration: "INSTANTANEE",
    raises: "Dégâts (+1g0)\nCibles (+1)", damage: "2k2", memorized: true, effect: "Projectile de jade.", ...patch,
  });

  it("grimoireConflicts : seuls les champs remplis et différents (sans accents ni casse) ; VD absente du grimoire non comparée", () => {
    expect(grimoireConflicts(typed(), jade())).toEqual([{ field: "range", from: "30 m", to: "30 mètres (100')" }]);
    expect(grimoireConflicts(typed({ range: "", keywords: [], raises: "" }), jade())).toEqual([]);
    expect(grimoireConflicts(createSpell(), jade())).toEqual([]);
  });

  it("augmentations sur une ligne avec « · », mots-clés joints ; VD comparée au format du Carnet", () => {
    const g = { ...jade(), damage: "3g3" };
    expect(grimoireConflicts(typed({ range: "30 mètres (100')", raises: "Portée (+10 pieds)\nCibles (+1)", keywords: ["Jade"], damage: "3 k 3" }), g)).toEqual([
      { field: "raises", from: "Portée (+10 pieds) · Cibles (+1)", to: "Dégâts (+1g0) · Cibles (+1)" },
      { field: "keywords", from: "Jade", to: "Jade, Tonnerre" },
    ]);
    expect(grimoireConflicts(typed({ range: "" }), g)).toEqual([{ field: "damage", from: "2g2", to: "3g3" }]);
  });

  it("Remplacer : tout est remplacé, sauf effet et mémorisé", () => {
    const s = fillFromGrimoire(typed({ element: "fire", mastery: 3 }), jade(), "all");
    expect(s).toMatchObject({ name: "Frappe de Jade", element: "earth", mastery: 1, range: "30 mètres (100')", area: "Une cible", duration: "Instantanée" });
    expect(s).toMatchObject({ damage: "2k2", memorized: true, effect: "Projectile de jade." });
  });

  it("Compléter les vides : nom, élément et maîtrise, puis seulement les champs vides", () => {
    const s = fillFromGrimoire(typed({ area: "", raises: "", keywords: [] }), jade(), "empty");
    expect(s).toMatchObject({ name: "Frappe de Jade", range: "30 m", area: "Une cible", raises: "Dégâts (+1g0)\nCibles (+1)", keywords: ["Jade", "Tonnerre"] });
    expect(s.memorized).toBe(true);
  });

  it("un champ vide dans le grimoire n'efface rien ; VD remplie si le grimoire en a une et le champ est vide", () => {
    const g = { ...jade(), raises: "", keywords: [], damage: "3g3" };
    const s = fillFromGrimoire(typed({ damage: undefined }), g, "all");
    expect(s).toMatchObject({ raises: "Dégâts (+1g0)\nCibles (+1)", keywords: ["Jade", "Tonnerre"], damage: "3g3" });
  });

  it("note de dégâts : « VD : … » seulement dans un effet vide", () => {
    const g = { ...jade(), damageNote: "Feu + Maîtrise" };
    expect(fillFromGrimoire(typed({ effect: "" }), g, "all").effect).toBe("VD : Feu + Maîtrise");
    expect(fillFromGrimoire(typed(), g, "empty").effect).toBe("Projectile de jade.");
  });
});
