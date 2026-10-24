/**
 * Lot 12, v2.3.0 : combat complet (HANDOFF annexe E.3, cas L7, L10, L11, L14, L15, L16).
 * Personnage : reference/perso-test-ecoles.json (sans école sauf mention), posture Attaque.
 */
import { describe, expect, it } from "vitest";
import {
  armorTN, computePool, feintBonus, focusOutcome, fullAttackAllowed, guardRule, initiativeScore, opposedMargin, opposedVerdict,
  rollStance, stanceRestriction, techniqueCategories, woundEffectNote, woundsFromDamage,
  type Character, type PoolAction, type PoolMods, type WeaponLike,
} from "@carnet/core";
import { SCHOOLS } from "../src/rules/ecoles";
import perso from "../reference/perso-test-ecoles.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const skills = (perso as Character).skills;
const school = (schoolId: string, insightRank: number, patch: Partial<Character> = {}) => char({ schoolId, insightRank, ...patch });
const weapon = (c: Character, name: string): WeaponLike => c.weapons.find((w) => w.name === name)!;
const attack = (c: Character, name: string): PoolAction => {
  const w = weapon(c, name);
  return { kind: "skill", skill: w.skill, trait: w.skill === "Kyujutsu" ? "reflexes" : "agility", attack: true, weapon: w };
};
const show = (c: Character, a: PoolAction, mods: PoolMods = {}) => {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
};
const withRiding = (rank: number) => char({ skills: [...skills.filter((s) => s.name !== "Équitation"), { name: "Équitation", rank, trait: "agility", emphases: [] }] });

describe("Lot 12, v2.3.0 : combat complet (annexe E.3)", () => {
  it("L7 : round après le Centre, attaque katana avec le Bonus de Centre → 6g4 +2 ; Initiative +10 (F1)", () => {
    const c = char();
    expect(show(c, attack(c, "Katana"))).toBe("5g3");
    expect(show(c, attack(c, "Katana"), { centerBonus: true })).toBe("6g4 +2");
    // Les dégâts ne sont pas concernés.
    expect(show(c, { kind: "damage", weapon: weapon(c, "Katana") }, { centerBonus: true })).toBe("5g2");
    expect(initiativeScore(c, 15, { centerLastRound: true })).toBe(25);
    expect(initiativeScore(c, 15, {})).toBe(15);
    // Se cumule avec Kakita R1 (Centre au round précédent).
    const kakita = school("kakita-bushi", 1);
    expect(show(kakita, attack(kakita, "Katana"), { centerLastRound: true, centerBonus: true })).toBe("7g5 +3");
  });

  it("F1, F2 : en Centre, aucune action sauf l'Initiative ; le duel est en Centre implicite sans restriction", () => {
    const c = char();
    expect(stanceRestriction(attack(c, "Katana"), { stance: "center" })).toMatch(/aucune action/);
    expect(stanceRestriction({ kind: "skill", skill: "Investigation", trait: "perception" }, { stance: "center" })).toMatch(/aucune action/);
    expect(stanceRestriction({ kind: "initiative" }, { stance: "center" })).toBeNull();
    expect(stanceRestriction(attack(c, "Katana"), { stance: "attack", sub: "duel" })).toBeNull();
    expect(rollStance({ stance: "attack", sub: "duel" })).toBe("center");
    expect(rollStance({ stance: "fullAttack", sub: "skirmish" })).toBe("fullAttack");
  });

  it("L10 : Assaut → tir yumi empêché ; Assaut monté refusé avec Équitation 1, permis avec Équitation 3 (F2)", () => {
    const c = char();
    expect(stanceRestriction(attack(c, "Yumi"), { stance: "fullAttack" })).toMatch(/pas d'attaque à distance/);
    expect(stanceRestriction(attack(c, "Katana"), { stance: "fullAttack" })).toBeNull();
    expect(stanceRestriction(attack(c, "Katana"), { stance: "defense" })).toMatch(/Défense/);
    expect(stanceRestriction(attack(c, "Katana"), { stance: "fullDefense" })).toMatch(/Défense/);
    expect(stanceRestriction({ kind: "skill", skill: "Défense", trait: "reflexes" }, { stance: "fullDefense" })).toBeNull();
    expect(fullAttackAllowed(withRiding(1), true)).toBe(false);
    expect(fullAttackAllowed(withRiding(1), false)).toBe(true);
    expect(fullAttackAllowed(withRiding(3), true)).toBe(true);
  });

  it("L11 : Feinte réussie, total 32 contre ND 30 → +1 ; total 45 → +5 (plafond 5 × Insight 1) (F4)", () => {
    const c = char();
    expect(feintBonus(c, 32, 30)).toBe(1);
    expect(feintBonus(c, 45, 30)).toBe(5);
    expect(feintBonus(c, 29, 30)).toBe(0);
    expect(feintBonus({ ...c, insightRank: 3 }, 45, 30)).toBe(7);
  });

  it("L14 : Garde → ND 15 ; Daidoji R2 → ND 20, allié +15 ; Shiba R1 : action gratuite, allié +5 (F5)", () => {
    const c = char();
    expect(armorTN(c, { stance: "attack" })).toBe(20);
    expect(armorTN(c, { stance: "attack", guard: true })).toBe(15);
    expect(guardRule(c)).toMatchObject({ selfPenalty: 5, allyBonus: 10, free: false, extraRound: false });
    const daidoji = school("daidoji-bushi", 2);
    expect(armorTN(daidoji, { stance: "attack", guard: true })).toBe(20);
    expect(guardRule(daidoji)).toMatchObject({ selfPenalty: 0, allyBonus: 15, extraRound: true, source: "Daidoji R2" });
    expect(guardRule(school("daidoji-bushi", 1)).allyBonus).toBe(10);
    expect(guardRule(school("shiba-bushi", 1))).toMatchObject({ selfPenalty: 5, allyBonus: 5, free: true });
  });

  it("L15 : encaisser 12 dégâts, armure légère (Réduction 3) → +9 ; avec Vide −10 → +0 ; Hida R2 → +7 (F6)", () => {
    const light = char({ armor: { name: "Armure légère", bonus: 5, reduction: 3 } });
    expect(woundsFromDamage(light, 12)).toBe(9);
    expect(woundsFromDamage(light, 12, true)).toBe(0);
    expect(woundsFromDamage({ ...light, schoolId: "hida-bushi", insightRank: 2 }, 12)).toBe(7);
    expect(woundsFromDamage(light, 2)).toBe(0);
  });

  it("L16 : duel, écart 12 → premier, 1 augm. gratuite ; Kakita R3 écart 12 → 3 ; écart 4 → frappe simultanée (F10)", () => {
    const c = char();
    expect(focusOutcome(c, 12)).toMatchObject({ first: true, freeRaises: 1 });
    expect(focusOutcome(c, 4)).toMatchObject({ first: false, freeRaises: 0 });
    expect(focusOutcome(c, 5)).toMatchObject({ first: true, freeRaises: 0 });
    const kakita = school("kakita-bushi", 3);
    expect(focusOutcome(kakita, 12)).toMatchObject({ first: true, freeRaises: 3 });
    expect(focusOutcome(kakita, 4)).toMatchObject({ first: true, freeRaises: 0 });
    // Kakita R3 devient un effet appliqué, plus un simple rappel.
    const r3 = SCHOOLS.find((s) => s.id === "kakita-bushi")!.ranks[2]!;
    expect(techniqueCategories(r3)).toEqual(["auto"]);
  });

  it("F10 : Évaluation gagnée de 10 → +1g1 à la Concentration ; +2g2 avec Iaijutsu 7", () => {
    const c = char();
    const focus: PoolAction = { kind: "skill", skill: "Iaijutsu", trait: "void", focus: true };
    expect(show(c, focus)).toBe("5g2");
    expect(show(c, focus, { assessmentWon: true })).toBe("6g3");
    const master = char({ skills: skills.map((s) => (s.name === "Iaijutsu" ? { ...s, rank: 7 } : s)) });
    // 9g2 + 2g2 = 11g4 → règle des dix dés : 10g4 (P8).
    expect(show(master, focus, { assessmentWon: true })).toBe("10g4");
    // Pas sur la Frappe.
    expect(show(c, { kind: "skill", skill: "Iaijutsu", trait: "reflexes", attack: true }, { assessmentWon: true })).toBe("6g3");
  });

  it("F7 : opposition avec augmentations ; F9 : tir sur une cible au corps à corps −10", () => {
    expect(opposedMargin(2)).toBe(10);
    expect(opposedVerdict(30, 20, 2)).toBe("win");
    expect(opposedVerdict(29, 20, 2)).toBe("lose");
    expect(opposedVerdict(20, 20, 0)).toBe("tie");
    expect(opposedVerdict(21, 20, 0)).toBe("win");
    const c = char();
    expect(computePool(c, attack(c, "Yumi"), { meleeTarget: true }).bonus).toBe(-10);
    expect(computePool(c, attack(c, "Katana"), { meleeTarget: true }).bonus).toBe(0);
  });

  it("F11 : rappels d'Estropié et d'À terre", () => {
    expect(woundEffectNote("Estropié")).toMatch(/cran de plus/);
    expect(woundEffectNote("À terre")).toMatch(/1 point de Vide/);
    expect(woundEffectNote("Blessé")).toBeUndefined();
  });
});
