/**
 * Lot 12, v2.8.0 (HANDOFF annexe E.18) : bloc « Armure » de la fiche.
 * Personnage : reference/perso-test-ecoles.json (Réflexes 3, Terre 2, sans école sauf mention).
 */
import { describe, expect, it } from "vitest";
import { armorSheet, computePool, type Character, type PoolAction } from "@carnet/core";
import { ARMOR_CATALOG } from "../src/rules/l5r4e";
import perso from "../reference/perso-test-ecoles.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const armored = (id: string, patch: Partial<Character> = {}): Character => {
  const a = ARMOR_CATALOG.find((x) => x.id === id)!;
  return char({ armor: { name: a.name, bonus: a.bonus, reduction: a.reduction, catalogId: a.id }, ...patch });
};
const withSkill = (c: Character, name: string, trait: Character["skills"][number]["trait"]): Character =>
  ({ ...c, skills: [...c.skills.filter((s) => s.name !== name), { name, rank: 1, trait, emphases: [] }] });
const rollTn = (c: Character, a: PoolAction) => computePool(c, a, {}).armorTn ?? 0;

describe("L28 : bloc Armure (E.18)", () => {
  it("armure légère, Réflexes 3 : ND 25 (5 × 3 + 5 + 5), Réduction 3 ; Athlétisme/Force : ND du jet +5", () => {
    const c = withSkill(armored("light"), "Athlétisme", "strength");
    const a = armorSheet(c);
    expect(a.catalog?.id).toBe("light");
    expect(a.tn).toEqual({ reflexes: 3, armor: 5, auto: [], total: 25 });
    expect(a.reduction).toEqual({ armor: 3, parts: [], total: 3 });
    expect(rollTn(c, { kind: "skill", skill: "Athlétisme", trait: "strength" })).toBe(5);
  });

  it("Hida R1 avec armure lourde : Discrétion ND +5, Kenjutsu sans pénalité ; la règle nomme la technique", () => {
    let c = armored("heavy", { schoolId: "hida-bushi" });
    c = withSkill(withSkill(c, "Discrétion", "agility"), "Kenjutsu", "agility");
    expect(rollTn(c, { kind: "skill", skill: "Discrétion", trait: "agility" })).toBe(5);
    expect(rollTn(c, { kind: "skill", skill: "Kenjutsu", trait: "agility" })).toBe(0);
    expect(armorSheet(c).waiver).toEqual({ source: "Hida R1", except: ["Discrétion"] });
  });

  it("Réduction des techniques : armure 3 + Hida R2 2 = 5", () => {
    const a = armorSheet(armored("light", { schoolId: "hida-bushi", insightRank: 2 }));
    expect(a.reduction).toEqual({ armor: 3, parts: [{ value: 2, source: "Hida R2" }], total: 5 });
    // Pas d'armure lourde : aucune levée de malus à afficher.
    expect(a.waiver).toBeUndefined();
  });

  it("bonus d'office des techniques et des bonus de jet « toujours » : Kitsuki R1 + Perception 2", () => {
    const c = armored("light", {
      schoolId: "kitsuki-enqueteur",
      modifiers: [{ id: "m1", name: "Bouclier", source: "advantage", appliesTo: "armor", rolled: 0, kept: 0, flat: 2, tn: 0, freeRaises: 0, note: "", mode: "always" }],
    });
    const a = armorSheet(c);
    expect(a.tn.auto).toEqual([{ value: 2, source: "Kitsuki R1" }, { value: 2, source: "Bouclier" }]);
    expect(a.tn.total).toBe(29);
  });

  it("armure de cavalerie : ND à cheval en plus (+8)", () => {
    expect(armorSheet(armored("riding")).tn).toEqual({ reflexes: 3, armor: 4, auto: [], total: 24, mounted: 32 });
  });

  it("bonus à cocher en combat : techniques facultatives, compteurs et bonus de jet facultatifs", () => {
    const c = char({
      schoolId: "hiruma-bushi", insightRank: 3,
      modifiers: [{ id: "m1", name: "Parade", source: "technique", appliesTo: "armor", rolled: 0, kept: 0, flat: 5, tn: 0, freeRaises: 0, note: "", mode: "optional" }],
    });
    expect(armorSheet(c).optional).toEqual([
      "La Petite Leçon du loup (+5 × Touches au corps à corps, Hiruma R2)",
      "Ailes du colibri (1 fois par round) (+6, Hiruma R3)",
      "Parade (+5)",
    ]);
  });

  it("armure personnalisée : pas d'armure du livre", () => {
    const a = armorSheet(char({ armor: { name: "Cuir", bonus: 2, reduction: 1 } }));
    expect(a.catalog).toBeUndefined();
    expect(a.tn.total).toBe(22);
  });
});
