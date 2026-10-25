/**
 * Lot 12, v2.7.0 (HANDOFF annexe E.8, E.10) : bataille de masse.
 * Personnage : reference/perso-test-ecoles.json (Eau 2 : Force 2, Perception 2), sans Bataille sauf mention.
 */
import { describe, expect, it } from "vitest";
import { armyStatus, battleOutcome, battleRollBonus, battleRollTotal, buildActions, rollBattleDice, type Character } from "@carnet/core";
import { BATTLE_TABLE } from "../src/rules/l5r4e";
import table from "../src/rules/table-bataille.json";
import reference from "../reference/table-bataille.json";
import perso from "../reference/perso-test-ecoles.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const withBattle = (c: Character, rank: number): Character =>
  ({ ...c, skills: [...c.skills, { name: "Bataille", rank, trait: "perception", emphases: [] }] });
const cell = (o: ReturnType<typeof battleOutcome>) => [o.wounds, o.glory, o.event];

describe("Table de bataille (données)", () => {
  it("src/rules/table-bataille.json est la copie de la référence", () => {
    expect(table).toEqual(reference);
  });

  it("10 lignes de 3 en 3, de 1 à 30, 6 colonnes chacune", () => {
    expect(BATTLE_TABLE.map((r) => [r.min, r.max])).toEqual([[1, 3], [4, 6], [7, 9], [10, 12], [13, 15], [16, 18], [19, 21], [22, 24], [25, 27], [28, 30]]);
    expect(BATTLE_TABLE.every((r) => r.cells.length === 6)).toBe(true);
  });
});

describe("Commandement : état de l'armée (5 d'écart)", () => {
  it.each([
    [5, "winning"], [12, "winning"], [4, "stalemate"], [0, "stalemate"], [-4, "stalemate"], [-5, "losing"], [-20, "losing"],
  ] as const)("écart %i → %s", (gap, status) => {
    expect(armyStatus(gap)).toBe(status);
  });
});

describe("Jet de bataille : 1d10 + Eau + Bataille", () => {
  it("Eau 2, sans Bataille : d10 7 → 9", () => {
    expect(battleRollBonus(char())).toEqual({ water: 2, skill: 0 });
    expect(battleRollTotal(char(), 7)).toBe(9);
  });

  it("Bataille 3 : d10 7 → 12", () => {
    expect(battleRollTotal(withBattle(char(), 3), 7)).toBe(12);
  });

  it("dés sans explosion : un tirage par dé, un 10 reste 10", () => {
    const faces = [10, 10, 3];
    expect(rollBattleDice(3, () => faces.shift() ?? 1)).toEqual([10, 10, 3]);
    expect(rollBattleDice(0, () => 5)).toEqual([]);
  });
});

describe("L19 : case de la table", () => {
  it("total 8, Engagé, armée gagnante → 2 dés de blessures, 1 Gloire", () => {
    expect(cell(battleOutcome(8, "engaged", "winning"))).toEqual([2, 1, null]);
  });

  it("total 8, Engagé, égalité → 3 dés, 1 Gloire, Duel", () => {
    expect(cell(battleOutcome(8, "engaged", "stalemate"))).toEqual([3, 1, "duel"]);
  });

  it("total 31, Fortement engagé, armée perdante → 3 dés, 5 Gloire, Occasion héroïque (ligne 28-30)", () => {
    const o = battleOutcome(31, "heavilyEngaged", "losing");
    expect(cell(o)).toEqual([3, 5, "heroic"]);
    expect(o.row).toEqual({ min: 28, max: 30 });
    expect(o.column).toBe(5);
    expect(o.shift).toBe(2);
  });

  it("colonne = engagement + décalage de l'état : Réserve perdante = Engagé gagnant", () => {
    expect(cell(battleOutcome(14, "reserves", "losing"))).toEqual(cell(battleOutcome(14, "engaged", "winning")));
  });

  it("total inférieur à 1 (Tacticien −5) : première ligne", () => {
    expect(battleOutcome(-2, "reserves", "winning").row).toEqual({ min: 1, max: 3 });
  });

  it("bornes de ligne : 9 → 7-9, 10 → 10-12", () => {
    expect(battleOutcome(9, "engaged", "winning").row.min).toBe(7);
    expect(battleOutcome(10, "engaged", "winning").row.min).toBe(10);
  });
});

describe("Actions de la Bataille", () => {
  it("Commander en tête, plus de carte « Niveau d'engagement » (dans le panneau)", () => {
    const ids = buildActions(char(), "combat", "battle").map((a) => a.id);
    expect(ids[0]).toBe("tactics");
    expect(ids).not.toContain("engagement");
  });
});
