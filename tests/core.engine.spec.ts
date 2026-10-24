/**
 * Compléments à la spécification (core.rules.spec.ts) : cas limites du moteur,
 * catalogue d'actions et couleurs de clan. Couverture visée : 100 % de src/core.
 */
import { describe, it, expect } from "vitest";
import {
  assessmentTN, attackTrait, buildActions, CharacterFormatError, CharacterSchema, createCharacter, clanAccent, computePool,
  DEFAULT_MANEUVERS, emphasisMatches, formatDice, formatPath, mergeCharacter, migrate, poolStats, rollDice,
  woundState, type Character,
} from "@carnet/core";
import kakita from "./fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
const sword = { name: "Katana", skill: "Kenjutsu", dr: "3k2" };
const bow = { name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3 };

describe("Moteur : cas limites", () => {
  it("formate une réserve en notation g", () => {
    expect(formatDice(5, 3)).toBe("5g3");
  });
  it("attaque sur Réflexes à distance, Agilité au contact", () => {
    expect(attackTrait(bow)).toBe("reflexes");
    expect(attackTrait(sword)).toBe("agility");
    expect(attackTrait({ name: "Grand arc", skill: "Tir", dr: "2g2" })).toBe("reflexes");
  });
  it("arc sans force renseignée : 0 + VD", () => {
    expect(computePool(base(), { kind: "damage", weapon: { name: "Yumi", skill: "Kyujutsu", dr: "2k2" } }, {})).toMatchObject({ rolled: 2, kept: 2 });
  });
  it("dés en moins : jamais sous zéro, gardés ramenés aux lancés", () => {
    expect(computePool(base(), { kind: "damage", weapon: sword }, { extraRolled: -10 })).toMatchObject({ rolled: 0, kept: 0 });
  });
  it("explique la réserve dans les notes", () => {
    const grapple = { kind: "skill", skill: "Jiujutsu", trait: "agility", attack: true } as const;
    expect(computePool(base(), grapple, {}).notes).toContain("Sans compétence : pas d'explosion ni d'augmentation");
    const c = base();
    c.traits.agility = 9;
    const notes = computePool(c, { kind: "skill", skill: "Kenjutsu", trait: "agility", attack: true }, { stance: "fullAttack", voidPoint: true, extraRolled: 1 }).notes;
    expect(notes).toEqual(["Assaut : +2g1", "+1 dé(s) lancé(s)", "Point de Vide : +1g1", "Règle des dix dés : +12"]);
  });
  it("la spécialisation ne s'applique pas à une réserve non qualifiée", () => {
    const pool = { rolled: 1, kept: 1, bonus: 0, explodes: false, canRaise: false, notes: [] };
    const r = rollDice(pool, { emphasis: true }, () => 1);
    expect(r.total).toBe(1);
    expect(r.dice[0]?.rerolledOne).toBe(false);
  });
  it("au-delà du dernier seuil, le personnage est mort", () => {
    const c = base();
    c.wounds = 100;
    expect(woundState(c)).toMatchObject({ label: "Mort", status: "dead", penalty: null });
  });
  it("statistiques : graine et tirages par défaut, résultat mis en cache", () => {
    const pool = { rolled: 4, kept: 2, bonus: 0, explodes: true, canRaise: true, notes: [] };
    const a = poolStats(pool, { emphasis: false });
    expect(a.mean).toBe(poolStats(pool, { emphasis: false }).mean);
    expect(a.chance(2)).toBe(1);
  });
});

describe("Fusion : cas limites", () => {
  it("refuse ce qui n'est pas un objet JSON", () => {
    expect(mergeCharacter(base(), [1, 2])).toEqual({ ok: false, errors: [{ path: "", message: "doit être un objet JSON" }] });
  });
  it("laisse remonter une erreur inattendue", () => {
    expect(() => mergeCharacter(base(), { f: () => 1 })).toThrow();
  });
  it("signale un objet ou une liste mal formés", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, traits: 3, skills: "Kenjutsu", weapons: [42] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toEqual([
      { path: "traits", message: "doit être un objet" },
      { path: "skills", message: "doit être une liste" },
      { path: "weapons[0]", message: "doit être un objet" },
    ]);
  });
  it("ignore null et signale les clés inconnues dans les objets et les listes", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, traits: { agility: null, luck: 3 }, skills: [{ name: "Kenjutsu", rank: null, color: "rouge" }] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.warnings).toEqual(["traits.luck", "skills[0].color"]);
    expect(r.changes).toEqual([]);
  });
  it("garde le nom d'origine d'un élément mis à jour", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, skills: [{ name: "KENJUTSU", rank: 4, emphases: ["Katana", "Nodachi"] }] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.changes).toEqual([
      { path: "skills[Kenjutsu].rank", before: 2, after: 4, kind: "update" },
      { path: "skills[Kenjutsu].emphases", before: ["Katana"], after: ["Katana", "Nodachi"], kind: "update" },
    ]);
    expect(r.character.skills[1]?.name).toBe("Kenjutsu");
  });
  it("valide un nouvel élément complet, avec le chemin du fichier importé", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, weapons: [{ name: "Naginata", skill: "Polearms" }] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toEqual(["weapons[0].dr"]);
  });
  it("manœuvres : part des manœuvres par défaut, correspondance par id puis par nom", () => {
    const r = mergeCharacter(base(), {
      schemaVersion: 1,
      maneuvers: [{ id: "feint", cost: 1 }, { id: "autre", name: "désarmement", cost: 2 }],
    });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.maneuvers).toHaveLength(DEFAULT_MANEUVERS.length);
    expect(r.character.maneuvers.find((m) => m.id === "feint")?.cost).toBe(1);
    expect(r.character.maneuvers.find((m) => m.id === "disarm")?.cost).toBe(2);
  });
  it("contrôle croisé : points de Vide au plus égaux à l'Anneau de Vide", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, voidPoints: 5 });
    expect(r).toEqual({ ok: false, errors: [{ path: "voidPoints", message: "ne peut pas dépasser l'Anneau de Vide" }] });
  });
  it("convertit un fichier du prototype (v0) avant la fusion", () => {
    const r = mergeCharacter(base(), { insight: 2, honor: "7.0", xpSpent: 38, skills: [{ name: "Kenjutsu", emph: "Katana; Nodachi" }] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character).toMatchObject({ insightRank: 2, honor: 7, xp: { total: 40, spent: 38 } });
    expect(r.character.skills[1]?.emphases).toEqual(["Katana", "Nodachi"]);
  });
});

describe("Migration : cas limites", () => {
  it("refuse ce qui n'est pas un objet", () => {
    expect(() => migrate("texte")).toThrow(CharacterFormatError);
  });
  it("refuse une fiche invalide avec un message par champ", () => {
    const c = { ...base(), traits: { ...base().traits, agility: 0 } };
    expect(() => migrate(c)).toThrow("traits.agility : doit être un entier entre 1 et 10");
  });
  it("refuse une version plus récente", () => {
    expect(() => migrate({ ...base(), schemaVersion: 3 })).toThrow(/version plus récente/);
  });
  it("v0 : arc vide, manœuvre non cumulable, honneur illisible, éléments non objets", () => {
    const { insightRank, voidRing, xp, ...v1 } = base();
    const rest: Partial<Character> = { ...v1 };
    delete rest.schemaVersion;
    const v0 = {
      ...rest, insight: insightRank, void: voidRing, xpTotal: xp.total, xpSpent: xp.spent, honor: "beaucoup",
      weapons: [{ name: "Yumi", skill: "Kyujutsu", dr: "2g2", bow: "" }],
      maneuvers: [{ k: "feint", n: "Feinte", cost: 2, eff: "" }],
    };
    const c = migrate(v0);
    expect(c.honor).toBe(0);
    expect(c.xp).toEqual({ total: 40, spent: 34 });
    expect(c.weapons[0]).toEqual({ name: "Yumi", skill: "Kyujutsu", dr: "2g2", keywords: ["arc", "distance", "grande"] });
    expect(c.maneuvers[0]?.stackable).toBe(false);
    expect(() => migrate({ ...v0, skills: [1], weapons: [2], maneuvers: [3] })).toThrow(CharacterFormatError);
  });
  it("formate les chemins d'erreur", () => {
    expect(formatPath(["skills", 0, "rank"])).toBe("skills[0].rank");
    expect(formatPath([0, "name"], "weapons")).toBe("weapons[0].name");
  });
});

describe("Catalogue d'actions", () => {
  const c = () => {
    const ch = base();
    ch.weapons.push(bow);
    return ch;
  };
  it("Enquête et Déplacement : actions fixes", () => {
    expect(buildActions(c(), "investigation").map((a) => a.id)).toContain("notice");
    expect(buildActions(c(), "movement")[0]?.id).toBe("move");
  });
  it("Escarmouche : Initiative en tête, attaque puis dégâts rattachés, Défense totale en dernier", () => {
    const acts = buildActions(c(), "combat", "skirmish");
    expect(acts[0]?.kind).toBe("initiative");
    expect(acts[1]).toMatchObject({ label: "Attaque · Katana", attack: true, trait: "agility" });
    expect(acts[2]).toMatchObject({ label: "Dégâts · Katana", parent: acts[1]?.id, kind: "damage", dr: "3k2" });
    expect(acts.find((a) => a.label === "Tir · Yumi")?.trait).toBe("reflexes");
    expect(acts.find((a) => a.label === "Dégâts · Yumi")?.description).toContain("Force de l'arc 3");
    expect(acts.find((a) => a.id === "unarmed-dmg")?.parent).toBe("unarmed");
    expect(acts.at(-1)?.fullDefense).toBe(true);
    expect(buildActions(c(), "combat")).toEqual(acts);
  });
  it("Duel : Frappe puis dégâts des sabres seulement", () => {
    const acts = buildActions(c(), "combat", "duel");
    expect(acts.slice(0, 3).map((a) => a.id)).toEqual(["assess", "focus", "strike"]);
    expect(acts.filter((a) => a.parent === "strike").map((a) => a.label)).toEqual(["Dégâts · Katana", "Dégâts · Wakizashi"]);
  });
  it("Bataille : actions de bataille puis armes", () => {
    const acts = buildActions(c(), "combat", "battle");
    expect(acts[0]?.id).toBe("tactics");
    expect(acts.filter((a) => a.attack)).toHaveLength(3);
  });
  it("ND d'Évaluation en duel : 10 + 5 × Rang adverse", () => {
    expect(assessmentTN(2)).toBe(20);
  });
});

describe("Couleur de clan", () => {
  it.each([
    ["Scorpion", "scorpion", "#a82828"],
    ["crane", "grue", "#2f7fb5"],
    ["Clan du Phénix", "phenix", "#c25a14"],
    ["PHOENIX", "phenix", "#c25a14"],
    ["Famille impériale", "imperial", "#8a6d12"],
  ])("%s → %s", (clan, id, light) => {
    expect(clanAccent(clan)).toMatchObject({ id, light });
  });
  it("clan non reconnu : couleur par défaut", () => {
    expect(clanAccent("Ronin")).toEqual({ id: null, label: null, light: "#7a6a3a", dark: "#cdb67a" });
  });
});

describe("Spécialisation suggérée", () => {
  it("coche la spécialisation qui correspond à l'action, sans accents ni casse", () => {
    expect(emphasisMatches(base(), "Investigation", "Remarquer")).toBe(true);
    expect(emphasisMatches(base(), "investigation", "remarquer un détail")).toBe(true);
    expect(emphasisMatches(base(), "Investigation", "Fouille")).toBe(false);
    expect(emphasisMatches(base(), "Investigation", undefined)).toBe(false);
    expect(emphasisMatches(base(), "Jiujutsu", "Saisie")).toBe(false);
  });
});

describe("Fiche vierge", () => {
  it("est valide pour le schéma", () => {
    expect(CharacterSchema.parse(createCharacter())).toEqual(createCharacter());
  });
});
