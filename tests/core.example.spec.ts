/** Fiche d'exemple livrée (Kakita Haruto, HANDOFF annexe E.9 S4) : réserves, ND d'armure, vocabulaire. */
import { describe, expect, it } from "vitest";
import { armorTN, buildActions, computePool, findSkill, schoolReduction, type Character, type PoolAction, type PoolMods } from "@carnet/core";
import { EXAMPLES } from "../src/rules/example";

const exampleCharacter = () => EXAMPLES[0]!.build();

const show = (c: Character, a: PoolAction, mods: PoolMods = {}) => {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
};

describe("Fiche d'exemple (annexe E.9 S4)", () => {
  it("L22 : ND d'armure 25, Réduction 3, Initiative 4g3 +6, Représentation : Art oratoire 5g4 (4g3 + Voix 1g1)", () => {
    const c = exampleCharacter();
    expect(c).toMatchObject({ name: "Kakita Haruto", schoolId: "kakita-bushi" });
    expect(armorTN(c, { stance: "attack" })).toBe(25);
    expect(c.armor.reduction + schoolReduction(c)).toBe(3);
    expect(show(c, { kind: "initiative" })).toBe("4g3 +6");
    const oratory: PoolAction = { kind: "skill", skill: "Représentation : Art oratoire", trait: "awareness" };
    expect(show(c, oratory)).toBe("4g3");
    expect(show(c, oratory, { modifiers: c.modifiers })).toBe("5g4");
    expect(c.techniques).toEqual([]);
  });

  it("vocabulaire E.7 déjà compris : « Courtisan » répond aux actions de Courtoisie", () => {
    const c = exampleCharacter();
    expect(findSkill(c, "Courtoisie")?.name).toBe("Courtisan");
    const persuade = buildActions(c, "court").find((a) => a.id === "persuade")!;
    expect(show(c, { kind: "skill", skill: persuade.skill ?? "", trait: "awareness" })).toBe("4g3");
    // L'action « Se produire » reprend le nom de la fiche.
    expect(buildActions(c, "court").map((a) => a.label)).toContainEqual({ key: "action.perform", detail: "Art oratoire" });
  });
});
