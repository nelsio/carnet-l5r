/**
 * Lot 12, v2.5.0 (HANDOFF annexe E.6, E.10) : multiplicateur de blessures, nouvelle journée, méditation.
 * Personnage : reference/perso-test-ecoles.json (Terre 2, Constitution 2, Rang 1, Vide 2).
 */
import { describe, expect, it } from "vitest";
import { dailyHealing, meditate, newDay, schoolContext, woundState, woundThresholds, type Character } from "@carnet/core";
import perso from "../reference/perso-test-ecoles.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const withSkill = (c: Character, name: string, rank: number): Character =>
  ({ ...c, skills: [...c.skills.filter((s) => s.name !== name), { name, rank, trait: "void", emphases: [] }] });

describe("Multiplicateur de blessures (E-d)", () => {
  it("par défaut Terre × 2 : seuils 10, 14, 18, 22, 26, 30, 34, 38", () => {
    expect(woundThresholds(char())).toEqual([10, 14, 18, 22, 26, 30, 34, 38]);
  });

  it("L25 : × 3, Terre 2 → seuils 10, 16, 22, 28, 34, 40, 46, 52", () => {
    expect(woundThresholds(char(), { woundMultiplier: 3 })).toEqual([10, 16, 22, 28, 34, 40, 46, 52]);
  });

  it("× 5 : Indemne reste Terre × 5", () => {
    expect(woundThresholds(char(), { woundMultiplier: 5 }).slice(0, 2)).toEqual([10, 20]);
  });

  it("l'état de blessure suit le multiplicateur : 15 blessures, Égratigné en × 3, Éraflé en × 2", () => {
    expect(woundState(char({ wounds: 15 }), { woundMultiplier: 3 }).label).toBe("Égratigné");
    expect(woundState(char({ wounds: 15 })).label).toBe("Éraflé");
  });

  it("schoolContext garde le multiplicateur", () => {
    expect(schoolContext({ woundMultiplier: 4 }).woundMultiplier).toBe(4);
    expect(schoolContext({}).woundMultiplier).toBeUndefined();
  });
});

describe("Nouvelle journée (E.6)", () => {
  it("L17 : 20 blessures, Constitution 2, Insight 1 → 15 blessures, Vide plein", () => {
    const c = newDay(char({ wounds: 20, voidPoints: 0 }));
    expect(c.wounds).toBe(15);
    expect(c.voidPoints).toBe(2);
  });

  it("soins = 2 × Constitution + Rang d'Insight, plancher 0", () => {
    const c = char({ insightRank: 3, traits: { ...char().traits, stamina: 4 } });
    expect(dailyHealing(c)).toBe(11);
    expect(newDay({ ...c, wounds: 4 }).wounds).toBe(0);
  });

  it("ne modifie pas la fiche d'origine", () => {
    const c = char({ wounds: 20 });
    newDay(c);
    expect(c.wounds).toBe(20);
  });
});

describe("Méditation (E.6)", () => {
  it("L18 : Vide 0/2 → 1/2 ; avec Méditation 3 → 2/2", () => {
    expect(meditate(char({ voidPoints: 0 })).voidPoints).toBe(1);
    expect(meditate(withSkill(char({ voidPoints: 0 }), "Méditation", 3)).voidPoints).toBe(2);
  });

  it("plafonnée à l'Anneau de Vide : Méditation 7, Vide 1/2 → 2/2", () => {
    expect(meditate(withSkill(char({ voidPoints: 1 }), "Méditation", 7)).voidPoints).toBe(2);
  });
});
