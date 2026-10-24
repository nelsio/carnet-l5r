/**
 * Techniques des courtisans et de Shosuro (HANDOFF annexe D.6) : cas T25 à T42.
 * Personnage : reference/perso-test-courtisans.json ; `insightRank` = rang d'école du cas ; posture Attaque.
 */
import { describe, expect, it } from "vitest";
import {
  activeEffects, armorTN, buildActions, computePool, describeEffect, isSimpleAttack, matchingEmphasis, onMatches, reminderText,
  rollEffects, sameEmphasis, schoolContext, schoolsByClan, suggestSchool, techniqueCategories, voidPointBonus, voidSpendOption,
  REFERENCE_CONTEXT,
  type Character, type PoolAction, type PoolMods, type RollTrait, type WeaponLike,
} from "@carnet/core";
import { SCHOOLS } from "../src/rules/ecoles";
import perso from "../reference/perso-test-courtisans.json";
import bushiPerso from "../reference/perso-test-ecoles.json";

const char = (schoolId: string, rank: number, patch: Partial<Character> = {}): Character =>
  ({ ...(structuredClone(perso) as Character), schoolId, insightRank: rank, ...patch });

const skill = (name: string, trait: RollTrait): PoolAction => ({ kind: "skill", skill: name, trait });
const weapon = (c: Character, name: string): WeaponLike => c.weapons.find((w) => w.name === name)!;
const attack = (c: Character, name: string): PoolAction =>
  ({ kind: "skill", skill: weapon(c, name).skill, trait: "agility", attack: true, weapon: weapon(c, name) });

/** Réserve au format « 6g3 +6 ». */
function show(c: Character, a: PoolAction, mods: PoolMods = {}): string {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
}

const free = (c: Character, a: PoolAction, mods: PoolMods = {}) => computePool(c, a, mods).freeRaises ?? 0;

/** Clé de l'effet à cocher dont le libellé contient `label`. */
function optionKey(c: Character, a: PoolAction, label: string, emphasis?: string): string {
  const e = rollEffects(c, a, schoolContext({ emphasis })).find((x) => "label" in x && x.label?.includes(label));
  if (!e) throw new Error(`option introuvable : ${label}`);
  return e.key;
}

const courtier = skill("Courtoisie", "awareness");
const etiquette = skill("Étiquette", "awareness");
const sincerity = skill("Sincérité", "awareness");
const intimidation = skill("Intimidation", "willpower");
const history = skill("Connaissance : Histoire", "intelligence");

describe("Techniques des courtisans et de Shosuro : cas T25 à T42 (annexe D.6)", () => {
  it("T25 : Doji 1, augmentation gratuite selon l'Honneur, pas en Intimidation", () => {
    const c = char("doji-courtisan", 1);
    expect(show(c, courtier)).toBe("6g3");
    expect(free(c, courtier)).toBe(1);
    expect(free(char("doji-courtisan", 1, { honor: 5.9 }), courtier)).toBe(0);
    expect(free(char("doji-courtisan", 1, { honor: 6.0 }), courtier)).toBe(1);
    expect(show(c, intimidation)).toBe("5g3");
    expect(free(c, intimidation)).toBe(0);
  });

  it("T26 : Asako 1, Connaissance 5g3 + 1 augm. ; Vide en Étiquette 9g4 (7g4 sans école)", () => {
    const c = char("asako-maitre-du-savoir", 1);
    expect(show(c, history)).toBe("5g3");
    expect(free(c, history)).toBe(1);
    expect(show(c, etiquette, { voidPoint: true })).toBe("9g4");
    expect(show(char("", 1), etiquette, { voidPoint: true })).toBe("7g4");
    // Le Vide ordinaire ailleurs.
    expect(show(c, courtier, { voidPoint: true })).toBe("7g4");
  });

  it("T27 : Asako 5, Connaissance 10g3 + 1 augm.", () => {
    const c = char("asako-maitre-du-savoir", 5);
    expect(show(c, history)).toBe("10g3");
    expect(free(c, history)).toBe(1);
  });

  it("T28 : Ide 1, Sincérité : Honnêteté 1 augm. ; Duperie ND +5 ; sans spécialisation rien", () => {
    const c = char("ide-emissaire", 1);
    expect(free(c, sincerity, { emphasis: "Honnêteté" })).toBe(1);
    expect(computePool(c, sincerity, { emphasis: "Honnêteté" }).techTn).toBeUndefined();
    expect(computePool(c, sincerity, { emphasis: "Duperie" }).techTn).toBe(5);
    expect(free(c, sincerity, { emphasis: "Duperie" })).toBe(0);
    expect(computePool(c, sincerity, { emphasis: "Deceit" }).techTn).toBe(5);
    const bare = computePool(c, sincerity, {});
    expect([bare.freeRaises ?? 0, bare.techTn ?? 0, bare.applied]).toEqual([0, 0, []]);
  });

  it("T29 : Kitsuki 1, ND d'armure 18 ; Investigation 5g3 + 1 augm.", () => {
    const c = char("kitsuki-enqueteur", 1);
    expect(armorTN(c, { stance: "attack" })).toBe(18);
    expect(armorTN(char("", 1), { stance: "attack" })).toBe(15);
    const inv = skill("Investigation", "perception");
    expect(show(c, inv)).toBe("5g3");
    expect(free(c, inv)).toBe(1);
  });

  it("T30 : Shosuro Acteur 1, + 1 Vide : Comédie 8g4, Duperie 8g4, Honnêteté 6g4", () => {
    const c = char("shosuro-acteur", 1);
    expect(show(c, skill("Comédie", "awareness"), { voidPoint: true })).toBe("8g4");
    expect(show(c, sincerity, { voidPoint: true, emphasis: "Duperie" })).toBe("8g4");
    expect(show(c, sincerity, { voidPoint: true, emphasis: "Honnêteté" })).toBe("6g4");
  });

  it("T31 : Shosuro Acteur 3, + 2 Vide : Duperie 10g5 (11g5, P8) ; Étiquette 8g5", () => {
    const c = char("shosuro-acteur", 3);
    expect(show(c, sincerity, { voidSpend: true, emphasis: "Duperie" })).toBe("10g5");
    expect(show(c, etiquette, { voidSpend: true })).toBe("8g5");
    // Option limitée aux compétences d'école.
    expect(voidSpendOption(c, sincerity)).toBeDefined();
    expect(voidSpendOption(c, courtier)).toBeUndefined();
    expect(show(c, courtier, { voidSpend: true })).toBe("6g3");
  });

  it("T32 : Shosuro Acteur 2, attaque tanto 6g2 ; katana 2g2", () => {
    const c = char("shosuro-acteur", 2);
    expect(show(c, attack(c, "Tanto"))).toBe("6g2");
    expect(show(c, attack(c, "Katana"))).toBe("2g2");
  });

  it("T33 : Shosuro Acteur 4, badge Action simple au tanto, pas au katana", () => {
    const c = char("shosuro-acteur", 4);
    expect(isSimpleAttack(c, attack(c, "Tanto"), REFERENCE_CONTEXT)).toBe(true);
    expect(isSimpleAttack(c, attack(c, "Katana"), REFERENCE_CONTEXT)).toBe(false);
    expect(isSimpleAttack(char("shosuro-acteur", 3), attack(c, "Tanto"), REFERENCE_CONTEXT)).toBe(false);
  });

  it("T34 : Yoritomo courtisan 2, Intimidation : Contrôle 6g4 ; Statut inférieur 7g5 ; sans spécialisation 5g3", () => {
    const c = char("yoritomo-courtisan", 2);
    expect(show(c, intimidation, { emphasis: "Contrôle" })).toBe("6g4");
    const key = optionKey(c, intimidation, "Statut inférieur", "Contrôle");
    expect(show(c, intimidation, { emphasis: "Contrôle", selected: new Set([key]) })).toBe("7g5");
    expect(show(c, intimidation)).toBe("5g3");
    expect(show(c, intimidation, { selected: new Set([key]) })).toBe("5g3");
  });

  it("T35 : Yoritomo courtisan 5, Intimidation : Contrôle 10g4 (11g4, P8) ; sans spécialisation 10g3", () => {
    const c = char("yoritomo-courtisan", 5);
    expect(show(c, intimidation, { emphasis: "Contrôle" })).toBe("10g4");
    expect(show(c, intimidation)).toBe("10g3");
  });

  it("T36 : Miya 2, Étiquette « Résister à une influence » 6g3 +6", () => {
    const c = char("miya-heraut", 2);
    expect(show(c, etiquette)).toBe("6g3");
    expect(show(c, etiquette, { selected: new Set([optionKey(c, etiquette, "Résister")]) })).toBe("6g3 +6");
  });

  it("T37 : Bayushi courtisan 1, 7 points de désavantages → 2 augm. ; 16 → 5", () => {
    const c = char("bayushi-courtisan", 1);
    const key = optionKey(c, courtier, "Faiblesses");
    expect(free(c, courtier, { selected: new Set([key]), inputs: { [key]: 7 } })).toBe(2);
    expect(free(c, courtier, { selected: new Set([key]), inputs: { [key]: 16 } })).toBe(5);
    expect(free(c, courtier, { inputs: { [key]: 16 } })).toBe(0);
  });

  it("T38 : Shosuro Infiltré 2, Furtivité 6g2 ; tanto contre une cible qui ne te voit pas 6g2, augmentations non limitées", () => {
    const c = char("shosuro-infiltre", 2);
    expect(show(c, skill("Furtivité", "agility"))).toBe("6g2");
    const a = attack(c, "Tanto");
    const key = optionKey(c, a, "ne te voit pas");
    const p = computePool(c, a, { selected: new Set([key]) });
    expect(`${p.rolled}g${p.kept}`).toBe("6g2");
    expect(p.unlimitedRaises).toBe(true);
    expect(computePool(c, a, {}).unlimitedRaises).toBeUndefined();
  });

  it("T39 : Ikoma 5, Courtoisie avec « Précédent historique » 9g3", () => {
    const c = char("ikoma-barde", 5);
    expect(show(c, courtier, { selected: new Set([optionKey(c, courtier, "Précédent")]) })).toBe("9g3");
  });

  it("T40 : rappels chiffrés, Kitsuki 2 et Yasuki 4", () => {
    const texts = (id: string, rank: number) => {
      const c = char(id, rank);
      return activeEffects(c).filter((e) => e.kind === "reminder").map((e) => reminderText(e, c));
    };
    expect(texts("kitsuki-enqueteur", 2)).toContain("+10 au ND de qui te ment.");
    expect(texts("yasuki-courtisan", 4)).toContain("+20 au ND de qui tente de te tromper.");
  });

  it("T41 : suggestion d'école d'après le champ libre", () => {
    const named = (school: string) => suggestSchool(char("", 1, { school }))?.id;
    expect(named("Bayushi")).toBe("bayushi-bushi");
    expect(named("Courtisan Bayushi")).toBe("bayushi-courtisan");
    expect(named("Shosuro")).toBeUndefined();
    expect(named("Acteur Shosuro")).toBe("shosuro-acteur");
    expect(named("Infiltré Shosuro")).toBe("shosuro-infiltre");
    expect(named("Doji")).toBe("doji-courtisan");
    expect(named("École de bushi Kakita")).toBe("kakita-bushi");
  });

  it("T42 : non-régression, personnage de test bushi sans école inchangé", () => {
    const c = { ...(structuredClone(bushiPerso) as Character), schoolId: "" };
    expect(show(c, etiquette)).toBe("3g3");
    expect(show(c, skill("Kenjutsu", "agility"), { voidPoint: true })).toBe("6g4");
  });
});

describe("Moteur d'effets : spécialisations, groupes de compétences, catalogue", () => {
  it("spécialisations équivalentes (alias FR/EN, Courtoisie = Politesse)", () => {
    expect(sameEmphasis("Duperie", "deceit")).toBe(true);
    expect(sameEmphasis("Courtoisie", "Politesse")).toBe(true);
    expect(sameEmphasis("Honnêteté", "Duperie")).toBe(false);
    expect(sameEmphasis("", "")).toBe(false);
    expect(sameEmphasis("Héraldique", "heraldique")).toBe(true);
  });

  it("spécialisation présélectionnée au lanceur, alias compris", () => {
    const c = char("", 1, {
      skills: [{ name: "Étiquette", rank: 2, trait: "awareness", emphases: ["Courtoisie"] }],
    });
    expect(matchingEmphasis(c, "Étiquette", "Politesse")).toBe("Courtoisie");
    expect(matchingEmphasis(c, "Étiquette", undefined)).toBeUndefined();
  });

  it("groupes : social, Connaissance, compétences d'école, variantes « X : … »", () => {
    const c = char("shosuro-acteur", 1);
    expect(onMatches(["social"], courtier)).toBe(true);
    expect(onMatches(["social"], history)).toBe(false);
    expect(onMatches(["lore"], history)).toBe(true);
    expect(onMatches(["lore"], skill("Lore: Theology", "intelligence"))).toBe(true);
    expect(onMatches(["school"], etiquette, c)).toBe(true);
    expect(onMatches(["school"], courtier, c)).toBe(false);
    expect(onMatches(["school"], etiquette)).toBe(false);
    expect(onMatches(["skill:Connaissance"], history)).toBe(true);
    expect(onMatches(["social"], attack(c, "Tanto"))).toBe(false);
  });

  it("Vide : 1g1 par défaut, 3g1 avec le Premier Visage ; hors spécialisation Duperie : 1g1", () => {
    const c = char("shosuro-acteur", 1);
    expect(voidPointBonus(c, sincerity, schoolContext({ emphasis: "Duperie" }))).toEqual({ rolled: 3, kept: 1 });
    expect(voidPointBonus(c, sincerity)).toEqual({ rolled: 1, kept: 1 });
    expect(voidPointBonus(c, undefined)).toEqual({ rolled: 1, kept: 1 });
  });

  it("résumés : ND, augmentations non limitées, Vide, saisie", () => {
    const text = (id: string, rank: number, kind: string) => {
      const c = char(id, rank);
      return activeEffects(c).filter((e) => e.kind === kind).map((e) => describeEffect(e, c));
    };
    expect(text("ide-emissaire", 1, "roll")).toEqual(["1 augm. gratuite", "ND +5"]);
    expect(text("shosuro-acteur", 5, "roll").at(-1)).toBe("augmentations non limitées");
    expect(text("asako-maitre-du-savoir", 1, "voidBoost")).toEqual(["Vide : +3g1 par point"]);
    expect(text("bayushi-courtisan", 1, "roll")[0]).toBe("0 augm. gratuite");
  });

  it("catalogue : 12 écoles du lot 11, 5 rangs chacune, badges et compétences connues", () => {
    const lot11 = SCHOOLS.filter((s) => s.class === "Courtisan" || s.class === "Ninja");
    expect(lot11).toHaveLength(12);
    for (const s of lot11) {
      expect(s.ranks.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
      for (const r of s.ranks) expect(techniqueCategories(r).length).toBeGreaterThan(0);
    }
    expect(new Set(SCHOOLS.map((s) => s.id)).size).toBe(SCHOOLS.length);
    expect(schoolsByClan().map((g) => g.clan)).toContain("Impérial");
  });

  it("actions : situation Cour, Représentations et Connaissances de la fiche", () => {
    const c = char("", 1);
    const court = buildActions(c, "court");
    expect(court.map((a) => a.skill)).toEqual(expect.arrayContaining(["Sincérité", "Intimidation", "Comédie", "Commerce", "Représentation : Conteur"]));
    expect(court.find((a) => a.id === "perform-Représentation : Conteur")?.label).toBe("Se produire · Conteur");
    const lore = buildActions(c, "investigation").filter((a) => a.skill?.startsWith("Connaissance"));
    expect(lore.map((a) => a.label)).toEqual(["Se souvenir · Histoire"]);
    const none = buildActions(char("", 1, { skills: [] }), "investigation").filter((a) => a.id === "lore");
    expect(none).toHaveLength(1);
  });
});
