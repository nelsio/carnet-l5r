/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
import { describe, expect, it } from "vitest";
import {
  applicableModifiers, armorModifierBonus, armorTN, CharacterSchema, computePool, defaultModifiers,
  describeModifier, mergeCharacter, migrate, modifierApplies, modifiersOf, poolStats,
  type Character, type Modifier, type PoolAction,
} from "@carnet/core";
import { MODIFIER_TEMPLATES, NAMED_MODIFIERS } from "../src/rules/l5r4e";
import kakita from "../reference/exemple-personnage.json";

const base = () => structuredClone(kakita) as Character;
const mod = (patch: Partial<Modifier>): Modifier => ({
  id: "m", name: "Bonus", source: "technique", appliesTo: "all", rolled: 0, kept: 0, flat: 0, freeRaises: 0,
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
    // 9 + 2 + 1 = 12g9 → 10g11 → 10g10 +2
    expect(computePool(big, kenjutsu, { modifiers: [m] })).toMatchObject({ rolled: 10, kept: 10, bonus: 2 });
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
  it("champ facultatif : une fiche v1 sans bonus reste identique", () => {
    expect(migrate(base())).toEqual(base());
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
    for (const t of [...MODIFIER_TEMPLATES, ...NAMED_MODIFIERS]) {
      const { id, label, ...effect } = t;
      const m = { id, name: label, skill: effect.appliesTo === "skill" ? "Kenjutsu" : undefined, trait: effect.appliesTo === "trait" ? "agility" as const : undefined, note: "", ...effect };
      expect(() => CharacterSchema.parse({ ...base(), modifiers: [m] })).not.toThrow();
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
