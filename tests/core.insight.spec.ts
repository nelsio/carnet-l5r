/** Lot 21, v2.18.0 (HANDOFF annexe K) : points d'Insight calculés, cas I1 à I9 (I8 et I9 aussi en interface). */
import { describe, expect, it } from "vitest";
import {
  computePool, serializeCharacter, importCharacter, insightPoints, mergeCharacter, migrate, suggestedInsightRank, type Character,
} from "@carnet/core";
import ecoles from "../reference/perso-test-ecoles.json";
import kakita from "../reference/exemple-personnage.json";

const haruto = (): Character => migrate(structuredClone(kakita));

describe("Points d'Insight (annexe K)", () => {
  it("I1 : perso-test-ecoles (Anneaux 2/3/2/2/2) → 119 pts, Rang 1", () => {
    const c = migrate(structuredClone(ecoles));
    expect(insightPoints(c)).toBe(119);
    expect(suggestedInsightRank(insightPoints(c))).toBe(1);
  });

  it("I2 : exemple-personnage → 125 pts, Rang 1", () => {
    expect(insightPoints(haruto())).toBe(125);
    expect(suggestedInsightRank(125)).toBe(1);
  });

  it("I3 : seuils 149 / 150 / 174 / 175 / 200 / 349 / 350 / 420 → 1 / 2 / 2 / 3 / 4 / 9 / 10 / 10", () => {
    expect([149, 150, 174, 175, 200, 349, 350, 420].map(suggestedInsightRank)).toEqual([1, 2, 2, 3, 4, 9, 10, 10]);
  });

  it("I4 : monter un seul Trait d'une paire ne change pas les points (l'Anneau est le minimum)", () => {
    const c = haruto();
    const low = c.traits.stamina <= c.traits.willpower ? "willpower" : "stamina";
    const before = insightPoints(c);
    expect(insightPoints({ ...c, traits: { ...c.traits, [low]: c.traits[low] + 1 } })).toBe(before);
  });

  it("I5 : les spécialisations ne comptent pas", () => {
    const c = haruto();
    const skills = c.skills.map((s, i) => (i === 0 ? { ...s, emphases: [...s.emphases, "Un", "Deux"] } : s));
    expect(insightPoints({ ...c, skills })).toBe(insightPoints(c));
  });

  it("I6 : insightBonus 10 sur I2 → 135 pts", () => {
    expect(insightPoints({ ...haruto(), insightBonus: 10 })).toBe(135);
  });

  it("I7 : fiche sans insightBonus importée puis exportée → champ absent, fiche valide", () => {
    const r = importCharacter(structuredClone(kakita));
    if (!r.ok) throw new Error("import refusé");
    const json = JSON.parse(serializeCharacter(r.character)) as Record<string, unknown>;
    expect("insightBonus" in json).toBe(false);
    expect(importCharacter(json).ok).toBe(true);
  });

  it("insightBonus : bornes −50 à 200, fusion comme un champ scalaire", () => {
    expect(importCharacter({ ...structuredClone(kakita), insightBonus: 201 }).ok).toBe(false);
    const r = mergeCharacter(haruto(), { schemaVersion: 2, insightBonus: 15 });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.insightBonus).toBe(15);
    expect(r.changes).toContainEqual(expect.objectContaining({ path: "insightBonus", after: 15 }));
  });

  it("I8 : insightRank 3 → le calcul ne touche pas au rang saisi, l'initiative utilise 3", () => {
    const c = { ...haruto(), insightRank: 3 };
    expect(suggestedInsightRank(insightPoints(c))).toBe(1);
    const init = computePool(c, { kind: "initiative" }, {});
    expect(init.rolled).toBe(computePool(haruto(), { kind: "initiative" }, {}).rolled + 2);
    expect(c.insightRank).toBe(3);
  });
});
