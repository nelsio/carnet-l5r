/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
import { describe, expect, it } from "vitest";
import {
  applicableModifiers, armorModifierBonus, armorTN, CharacterSchema, computePool, defaultModifiers,
  describeModifier, mergeCharacter, migrate, modifierApplies, modifiersOf, modifierTN, poolStats, woundState,
  type Character, type Modifier, type PoolAction, type Stance,
} from "@carnet/core";
import * as rules from "../src/rules/l5r4e";
import { MODIFIER_TEMPLATES } from "../src/rules/l5r4e";
import kakita from "./fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
const mod = (patch: Partial<Modifier>): Modifier => ({
  id: "m", name: "Bonus", source: "technique", appliesTo: "all", rolled: 0, kept: 0, flat: 0, freeRaises: 0, tn: 0,
  mode: "always", note: "", ...patch,
});
const kenjutsu: PoolAction = { kind: "skill", skill: "Kenjutsu", trait: "agility", attack: true };
const notice: PoolAction = { kind: "skill", skill: "Investigation", trait: "perception" };
const sword = { name: "Katana", skill: "Kenjutsu", dr: "3k2" };

describe("À quels jets s'applique un bonus", () => {
  it.each([
    ["all", {}, [true, true, true, false, false]],
    ["skill", { skill: "kenjutsu" }, [true, false, false, false, false]],
    ["trait", { trait: "agility" }, [true, false, false, false, false]],
    ["attack", {}, [true, false, false, false, false]],
    ["damage", {}, [false, false, false, true, false]],
    ["initiative", {}, [false, false, false, false, true]],
    ["armor", {}, [false, false, false, false, false]],
  ] as const)("%s", (appliesTo, extra, expected) => {
    const m = mod({ appliesTo, ...extra });
    const actions: PoolAction[] = [kenjutsu, notice, { kind: "trait", trait: "stamina" }, { kind: "damage", weapon: sword }, { kind: "initiative" }];
    expect(actions.map((a) => modifierApplies(m, a))).toEqual(expected);
  });
  it("une compétence visée mais non renseignée ne s'applique à rien", () => {
    expect(modifierApplies(mod({ appliesTo: "skill" }), kenjutsu)).toBe(false);
  });
  it("sépare bonus d'office et bonus situationnels", () => {
    const c = { ...base(), modifiers: [mod({ id: "a" }), mod({ id: "b", mode: "optional" }), mod({ id: "c", appliesTo: "damage" })] };
    expect(applicableModifiers(c, notice).map((m) => m.id)).toEqual(["a", "b"]);
    expect(defaultModifiers(c, notice).map((m) => m.id)).toEqual(["a"]);
    expect(modifiersOf(base())).toEqual([]);
  });
});

describe("Effet sur la réserve", () => {
  it("+1g0 à Kenjutsu : 5g3 → 6g3, avant le point de Vide et la règle des dix dés", () => {
    const m = mod({ name: "Voie de la Grue", appliesTo: "skill", skill: "Kenjutsu", rolled: 1 });
    expect(computePool(base(), kenjutsu, { modifiers: [m] })).toMatchObject({ rolled: 6, kept: 3 });
    expect(computePool(base(), kenjutsu, { modifiers: [m], voidPoint: true })).toMatchObject({ rolled: 7, kept: 4 });
    const big = { ...base(), traits: { ...base().traits, agility: 9 } };
    // 9 + 2 + 1 = 12g9 → 2 lancés en trop = 1 gardé → 10g10
    expect(computePool(big, kenjutsu, { modifiers: [m] })).toMatchObject({ rolled: 10, kept: 10, bonus: 0 });
  });
  it("bonus fixe ajouté au total, augmentations gratuites remontées, notes lisibles", () => {
    const pool = computePool(base(), notice, { modifiers: [mod({ name: "Avantage", rolled: 1, kept: 1, flat: 3, freeRaises: 1 })] });
    expect(pool).toMatchObject({ rolled: 4, kept: 3, bonus: 3, freeRaises: 1 });
    expect(pool.notes).toContain("Avantage : +1g1, +3 au total, 1 augm. gratuite");
    expect(computePool(base(), notice, {}).freeRaises).toBeUndefined();
  });
  it("un malus ne descend jamais sous zéro dé", () => {
    expect(computePool(base(), notice, { modifiers: [mod({ rolled: -10, kept: -10 })] })).toMatchObject({ rolled: 0, kept: 0 });
  });
  it("les statistiques tiennent compte du bonus fixe", () => {
    const pool = computePool(base(), notice, { modifiers: [mod({ flat: 5 })] });
    expect(poolStats(pool, { emphasis: false, samples: 500, seed: 1 })).toMatchObject({ min: 7, max: 25 });
  });
});

describe("ND d'armure", () => {
  it("ajoute les bonus de ND d'armure actifs", () => {
    const active = [mod({ appliesTo: "armor", flat: 5 }), mod({ appliesTo: "skill", flat: 9 })];
    expect(armorModifierBonus(active)).toBe(5);
    expect(armorTN(base(), { stance: "attack", bonus: armorModifierBonus(active) })).toBe(25);
  });
});

describe("Format de fiche", () => {
  it("champ facultatif : une fiche sans bonus n'en reçoit pas", () => {
    expect(migrate(base()).modifiers).toBeUndefined();
  });
  it("valeurs par défaut et validation", () => {
    const c = migrate({ ...base(), modifiers: [{ id: "x", name: "Bien-né", source: "advantage", appliesTo: "all" }] });
    expect(c.modifiers).toEqual([mod({ id: "x", name: "Bien-né", source: "advantage" })]);
    expect(() => migrate({ ...base(), modifiers: [{ id: "x", name: "y", source: "magie", appliesTo: "all" }] })).toThrow(/modifiers\[0\]\.source/);
  });
  it("fusion : ajout dans une fiche sans bonus, puis mise à jour par id", () => {
    const r = mergeCharacter(base(), { schemaVersion: 1, modifiers: [mod({ id: "g", name: "Voie de la Grue", appliesTo: "skill", skill: "Iaijutsu", rolled: 1 })] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.changes).toEqual([expect.objectContaining({ path: "modifiers[Voie de la Grue]", kind: "add" })]);
    const r2 = mergeCharacter(r.character, { schemaVersion: 1, modifiers: [{ id: "g", rolled: 2 }] });
    if (!r2.ok) throw new Error("fusion refusée");
    expect(r2.character.modifiers?.[0]?.rolled).toBe(2);
  });
});

describe("Modèles", () => {
  it("chaque modèle donne un bonus valide", () => {
    for (const t of MODIFIER_TEMPLATES) {
      const { id, label, ...effect } = t;
      const m = { id, name: label, skill: effect.appliesTo === "skill" ? "Kenjutsu" : undefined, trait: effect.appliesTo === "trait" ? "agility" as const : undefined, note: "", ...effect };
      expect(() => CharacterSchema.parse({ ...base(), schemaVersion: 2, modifiers: [m] })).not.toThrow();
    }
  });
  it("résume un effet en clair", () => {
    expect(describeModifier(mod({ rolled: 1 }))).toBe("+1g0");
    expect(describeModifier(mod({ rolled: -1 }))).toBe("-1g0");
    expect(describeModifier(mod({ flat: -5 }))).toBe("-5 au total");
    expect(describeModifier(mod({ freeRaises: 2 }))).toBe("2 augm. gratuites");
    expect(describeModifier(mod({ appliesTo: "armor", flat: 5 }))).toBe("+5 au ND d'armure");
    expect(describeModifier(mod({}))).toBe("sans effet");
  });
});

describe("Compétences sociales, pénalité de blessure, ND, posture", () => {
  it("compétences sociales : Courtoisie, Intimidation, Représentation : Chant ; pas Kenjutsu ni Investigation", async () => {
    const { isSocialSkill } = await import("@carnet/core");
    expect(["Courtoisie", "Étiquette", "sincerite", "Intimidation", "Tentation", "Comédie", "Représentation : Chant", "Courtier"].map(isSocialSkill)).toEqual(Array(8).fill(true));
    expect(["Kenjutsu", "Investigation", "Représentations"].map(isSocialSkill)).toEqual([false, false, false]);
    const social = mod({ appliesTo: "social", tn: 5 });
    expect(modifierApplies(social, { kind: "skill", skill: "Étiquette", trait: "awareness" })).toBe(true);
    expect(modifierApplies(social, kenjutsu)).toBe(false);
    expect(modifierApplies(social, { kind: "trait", trait: "awareness" })).toBe(false);
  });

  it("pénalité de blessure réduite, jamais négative ; Hors de combat inchangé", async () => {
    const { woundState } = await import("@carnet/core");
    const c = (wounds: number) => ({ ...base(), wounds, modifiers: [mod({ appliesTo: "wounds", flat: 3 })] });
    expect(woundState(c(11))).toMatchObject({ label: "Égratigné", penalty: 0 });
    expect(woundState(c(18))).toMatchObject({ label: "Éraflé", penalty: 2 });
    expect(woundState(c(34))).toMatchObject({ label: "À terre", penalty: 37 });
    expect(woundState(c(35))).toMatchObject({ penalty: null, status: "out" });
    expect(modifierApplies(mod({ appliesTo: "wounds" }), kenjutsu)).toBe(false);
  });

  it("effet sur le ND : additionné au ND final", async () => {
    const { modifierTN, targetNumber } = await import("@carnet/core");
    expect(modifierTN([mod({ tn: 5 }), mod({ tn: -2 })])).toBe(3);
    expect(targetNumber({ base: 15, calledRaises: 1, woundPenalty: 3, modifier: 5 })).toBe(28);
    expect(targetNumber({ base: "opposed", calledRaises: 0, woundPenalty: 0, modifier: 5 })).toBe("opposed");
  });

  it("posture requise : le bonus ne vaut que dans cette posture, ND d'armure compris", () => {
    const attackOnly = mod({ appliesTo: "attack", rolled: 1, stance: "attack" });
    expect(modifierApplies(attackOnly, kenjutsu)).toBe(true);
    expect(modifierApplies(attackOnly, kenjutsu, "attack")).toBe(true);
    expect(modifierApplies(attackOnly, kenjutsu, "fullAttack")).toBe(false);
    const c = { ...base(), modifiers: [attackOnly] };
    expect(defaultModifiers(c, kenjutsu, "defense")).toEqual([]);
    const armor = [mod({ appliesTo: "armor", flat: 5, stance: "attack" })];
    expect(armorModifierBonus(armor, "attack")).toBe(5);
    expect(armorModifierBonus(armor, "defense")).toBe(0);
  });

  it("résumés", () => {
    expect(describeModifier(mod({ appliesTo: "wounds", flat: 3 }))).toBe("-3 à la pénalité de blessure");
    expect(describeModifier(mod({ appliesTo: "social", tn: 5 }))).toBe("+5 au ND");
    expect(describeModifier(mod({ rolled: 1, tn: -5 }))).toBe("+1g0, -5 au ND");
  });
});

describe("Modèles par source, sans catalogue nommé (annexe J.4)", () => {
  it("Q6 : plus de catalogue nommé ; quatre sources, « Bonus libre » en tête", () => {
    expect("NAMED_MODIFIERS" in rules).toBe(false);
    expect(new Set(MODIFIER_TEMPLATES.map((t) => t.source))).toEqual(new Set(["other", "advantage", "disadvantage", "technique"]));
    expect(MODIFIER_TEMPLATES[0]).toMatchObject({ id: "free", label: "Bonus libre", source: "other", appliesTo: "skill", rolled: 0, mode: "always" });
  });
  it("identifiants stables et uniques, un placeholder de nom par modèle", () => {
    const ids = MODIFIER_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["adv-skill-dice", "dis-social-tn", "tech-stance"]));
    for (const t of MODIFIER_TEMPLATES) expect(t.placeholder).toMatch(/^Nom /);
  });
  it("Q7 : « ND augmenté sur les jets sociaux » → désavantage, social, ND +5", () => {
    expect(MODIFIER_TEMPLATES.find((t) => t.id === "dis-social-tn")).toMatchObject({ source: "disadvantage", appliesTo: "social", tn: 5, mode: "always" });
  });
});

describe("Cas B1 à B11 (HANDOFF §10.1 bis)", () => {
  const skill = (name: string, trait: "agility" | "awareness"): PoolAction => ({ kind: "skill", skill: name, trait });
  const withMods = (...modifiers: Modifier[]) => ({ ...base(), modifiers });
  const pool = (c: Character, a: PoolAction, extra = {}) => computePool(c, a, { modifiers: defaultModifiers(c, a), ...extra });

  it("B1 : +1g0 à Kenjutsu → attaque 5g3 → 6g3 ; Investigation inchangée", () => {
    const c = withMods(mod({ appliesTo: "skill", skill: "Kenjutsu", rolled: 1 }));
    expect(pool(c, kenjutsu)).toMatchObject({ rolled: 6, kept: 3 });
    expect(pool(c, notice)).toMatchObject({ rolled: 3, kept: 2 });
  });
  it("B2 : +0g1 à l'Agilité → Kenjutsu et Équitation +0g1 ; Constitution inchangée", () => {
    const c = withMods(mod({ appliesTo: "trait", trait: "agility", kept: 1 }));
    expect(pool(c, kenjutsu)).toMatchObject({ rolled: 5, kept: 4 });
    expect(pool(c, skill("Équitation", "agility"))).toMatchObject({ rolled: 4, kept: 4 });
    expect(pool(c, { kind: "trait", trait: "stamina" })).toMatchObject({ rolled: 2, kept: 2 });
  });
  it("B3 : social +5 au ND → Courtoisie, Étiquette, Sincérité +5 ; Kenjutsu inchangé", () => {
    const c = withMods(mod({ appliesTo: "social", tn: 5 }));
    for (const name of ["Courtoisie", "Étiquette", "Sincérité"]) expect(modifierTN(defaultModifiers(c, skill(name, "awareness")))).toBe(5);
    expect(modifierTN(defaultModifiers(c, kenjutsu))).toBe(0);
  });
  it("B4 : Hiruma rang 1, +1g0 aux attaques en posture Attaque seulement", () => {
    const c = withMods(mod({ appliesTo: "attack", rolled: 1, stance: "attack" }));
    const at = (stance: Stance) => computePool(c, kenjutsu, { stance, modifiers: defaultModifiers(c, kenjutsu, stance) });
    expect(at("attack")).toMatchObject({ rolled: 6, kept: 3 });
    expect(at("fullAttack")).toMatchObject({ rolled: 7, kept: 4 });
    expect(at("defense")).toMatchObject({ rolled: 5, kept: 3 });
  });
  it("B5 : +5 au ND d'armure en posture Défense seulement", () => {
    const armor = [mod({ appliesTo: "armor", flat: 5, stance: "defense" })];
    const c = base();
    expect(armorTN(c, { stance: "defense", bonus: armorModifierBonus(armor, "defense") }) - armorTN(c, { stance: "defense" })).toBe(5);
    expect(armorTN(c, { stance: "attack", bonus: armorModifierBonus(armor, "attack") })).toBe(armorTN(c, { stance: "attack" }));
  });
  it("B6 : Force de la Terre (3) → pénalité 0 à 11 blessures, 2 à 18", () => {
    const c = (wounds: number) => ({ ...withMods(mod({ appliesTo: "wounds", flat: 3 })), wounds });
    expect(woundState(c(11))).toMatchObject({ label: "Égratigné", penalty: 0 });
    expect(woundState(c(18))).toMatchObject({ label: "Éraflé", penalty: 2 });
  });
  it("B7 : −3g0 sur 2g2 → 0g0 au minimum", () => {
    const c = withMods(mod({ rolled: -3 }));
    expect(pool(c, { kind: "trait", trait: "stamina" })).toMatchObject({ rolled: 0, kept: 0 });
  });
  it("B8 : +6g0 sur 7g3 en Assaut avec Vide → 9g4 → 15g4 → 16g5 → 10g8", () => {
    const c = base();
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 4;
    const m = mod({ appliesTo: "skill", skill: "Kenjutsu", rolled: 6 });
    expect(computePool(c, kenjutsu, { modifiers: [m], stance: "fullAttack", voidPoint: true })).toMatchObject({ rolled: 10, kept: 8, bonus: 0 });
  });
  it("B9 : bonus situationnel absent des réserves de la fiche, proposé dans le lanceur", () => {
    const c = withMods(mod({ id: "o", appliesTo: "skill", skill: "Kenjutsu", rolled: 1, mode: "optional" }));
    expect(defaultModifiers(c, kenjutsu)).toEqual([]);
    expect(pool(c, kenjutsu)).toMatchObject({ rolled: 5, kept: 3 });
    expect(applicableModifiers(c, kenjutsu).map((m) => m.id)).toEqual(["o"]);
  });
  it("B10 : +1 augmentation gratuite, sans changer le ND", () => {
    const c = withMods(mod({ freeRaises: 1 }));
    expect(pool(c, notice).freeRaises).toBe(1);
    expect(modifierTN(defaultModifiers(c, notice))).toBe(0);
  });
  it("B11 : fusion d'un bonus de même id → mise à jour, pas de doublon", () => {
    const c = withMods(mod({ id: "g", name: "Voie de la Grue", rolled: 1 }));
    const r = mergeCharacter(c, { schemaVersion: 1, modifiers: [{ id: "g", rolled: 2 }] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.modifiers).toHaveLength(1);
    expect(r.character.modifiers?.[0]).toMatchObject({ id: "g", name: "Voie de la Grue", rolled: 2 });
  });
});
