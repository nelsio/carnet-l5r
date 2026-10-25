/**
 * Lot 12, v2.4.0 (HANDOFF annexe E.4, E.5, E.10) : maîtrises de compétence et catalogue d'armures.
 * Personnage : reference/perso-test-ecoles.json (sans école sauf mention), posture Attaque, terrain normal.
 */
import { describe, expect, it } from "vitest";
import {
  activeEffects, armorRollTn, armorTN, CharacterSchema, computePool, DEFAULT_MANEUVERS, describeEffect, maneuverFreeRaises,
  maneuverRaises, masteryEffects, meditationVoidPoints, mergeCharacter, movement, rollEffects, schoolContext,
  type Character, type PoolAction, type PoolMods, type Weapon,
} from "@carnet/core";
import { MASTERIES } from "../src/rules/ecoles";
import { ARMOR_CATALOG } from "../src/rules/l5r4e";
import perso from "../reference/perso-test-ecoles.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const withSkill = (c: Character, name: string, rank: number, trait: Character["skills"][number]["trait"] = "agility"): Character => {
  const skills = c.skills.filter((s) => s.name !== name);
  return { ...c, skills: [...skills, { name, rank, trait, emphases: [] }] };
};
const withWeapon = (c: Character, w: Weapon): Character => ({ ...c, weapons: [...c.weapons, w] });
const weaponOf = (c: Character, name: string) => c.weapons.find((w) => w.name === name)!;
const damage = (c: Character, name: string): PoolAction => ({ kind: "damage", weapon: weaponOf(c, name) });
const attack = (c: Character, name: string): PoolAction => ({ kind: "skill", skill: weaponOf(c, name).skill, trait: "agility", attack: true, weapon: weaponOf(c, name) });
const UNARMED: PoolAction = { kind: "damage", unarmed: true, weapon: { name: "Mains nues", skill: "Jiujutsu", dr: "0g1" } };
const show = (c: Character, a: PoolAction, mods: PoolMods = {}) => {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
};
/** Augmentations à payer pour une manœuvre, après les augmentations gratuites de l'attaque. */
const cost = (c: Character, a: PoolAction, maneuver: string) =>
  maneuverRaises({ [maneuver]: 1 }, DEFAULT_MANEUVERS, { character: c, free: maneuverFreeRaises(rollEffects(c, a, schoolContext())) });
const armored = (catalogId: string, patch: Partial<Character> = {}): Character => {
  const a = ARMOR_CATALOG.find((x) => x.id === catalogId)!;
  return char({ armor: { name: a.name, bonus: a.bonus, reduction: a.reduction, catalogId }, ...patch });
};

const NINJATO: Weapon = { name: "Ninja-to", skill: "Ninjutsu", dr: "2k2", keywords: ["ninja", "moyenne"] };
const NAGINATA: Weapon = { name: "Naginata", skill: "Armes d'hast", dr: "3k2", keywords: ["hast", "samourai", "grande", "deux-mains"] };
const BO: Weapon = { name: "Bo", skill: "Bâtons", dr: "1k2", keywords: ["grande", "deux-mains"] };
const JO: Weapon = { name: "Jo", skill: "Bâtons", dr: "1k1", keywords: ["petite"] };
const SAI: Weapon = { name: "Sai", skill: "Couteaux", dr: "0k1", keywords: ["petite"] };
const TANTO: Weapon = { name: "Tanto", skill: "Couteaux", dr: "1k1", keywords: ["petite"] };

describe("Maîtrises de compétence (annexe E.4)", () => {
  it("catalogue : chaque maîtrise vise une compétence, un rang de 1 à 10 et a un résumé", () => {
    for (const m of MASTERIES) {
      expect(m.skill).not.toBe("");
      expect(m.rank).toBeGreaterThanOrEqual(1);
      expect(m.rank).toBeLessThanOrEqual(10);
      expect(m.summary).not.toBe("");
    }
  });

  it("effets selon le rang de chaque compétence de la fiche, source « Kenjutsu 3 », sans école", () => {
    expect(masteryEffects(char())).toEqual([]);
    const c = withSkill(char(), "Kenjutsu", 7);
    expect(masteryEffects(c).map((e) => [e.source, e.mastery])).toEqual([["Kenjutsu 3", "Kenjutsu"], ["Kenjutsu 7", "Kenjutsu"]]);
    expect(activeEffects(c).every((e) => e.technique.startsWith("Maîtrise Kenjutsu"))).toBe(true);
  });

  it("toute compétence au rang 10 : 1 augmentation gratuite à ses jets, pas aux autres", () => {
    const c = withSkill(char(), "Iaijutsu", 10, "reflexes");
    const iai: PoolAction = { kind: "skill", skill: "Iaijutsu", trait: "reflexes" };
    expect(computePool(c, iai, {}).freeRaises).toBe(1);
    expect(computePool(c, attack(c, "Katana"), {}).freeRaises).toBeUndefined();
    expect(computePool(c, iai, {}).applied?.map((e) => `${describeEffect(e, c)} · ${e.source}`)).toEqual(["1 augm. gratuite · Iaijutsu 10"]);
  });

  it("L1 (rappel) : Kenjutsu 3 donne +1g0 aux dégâts des épées, pas à l'attaque ni aux autres armes", () => {
    const c = withSkill(char(), "Kenjutsu", 3);
    expect(show(c, damage(c, "Katana"))).toBe("6g2");
    expect(show(c, attack(c, "Katana"))).toBe("6g3");
    expect(show(c, damage(c, "Tetsubo"))).toBe("5g3");
    expect(computePool(c, damage(c, "Katana"), {}).applied?.[0]).toMatchObject({ source: "Kenjutsu 3", mastery: "Kenjutsu" });
  });

  it("L2 (rappel) : Armes lourdes 7 explose sur 9, sans dé de plus ; un Désarmement garde 2g1 sans maîtrise", () => {
    const c = withSkill(char(), "Armes lourdes", 7);
    expect(computePool(c, damage(c, "Tetsubo"), {})).toMatchObject({ rolled: 5, kept: 3, explodeOn: 9 });
    expect(computePool(c, damage(c, "Tetsubo"), {}).notes).toContain("Maîtrise Armes lourdes 7 : les dés explosent sur 9 et 10");
    const ken = withSkill(char(), "Kenjutsu", 7);
    expect(computePool(ken, damage(ken, "Katana"), { disarm: true })).toMatchObject({ rolled: 2, kept: 1, explodeOn: 10 });
  });

  it("L4 : dégâts à mains nues avec Jiujutsu 0 ; 3 ; 7 → 2g1 ; 3g1 ; 3g2", () => {
    expect(show(char(), UNARMED)).toBe("2g1");
    expect(show(withSkill(char(), "Jiujutsu", 3), UNARMED)).toBe("3g1");
    expect(show(withSkill(char(), "Jiujutsu", 7), UNARMED)).toBe("3g2");
    // Les mains nues ne profitent pas de Kenjutsu.
    expect(show(withSkill(char(), "Kenjutsu", 3), UNARMED)).toBe("2g1");
  });

  it("Ninjutsu 3 ; 7 : ninja-to 4g2 → 5g2 → 5g3", () => {
    const c = withWeapon(char(), NINJATO);
    expect(show(c, damage(c, "Ninja-to"))).toBe("4g2");
    expect(show(withSkill(c, "Ninjutsu", 3), damage(c, "Ninja-to"))).toBe("5g2");
    expect(show(withSkill(c, "Ninjutsu", 7), damage(c, "Ninja-to"))).toBe("5g3");
  });

  it("L9 : Défense 5 en posture Défense → ND 31 (20 + Air 3 + Défense 5 + 3) ; en Attaque, 20", () => {
    const c = withSkill(char(), "Défense", 5, "reflexes");
    expect(armorTN(c, { stance: "defense" })).toBe(31);
    expect(armorTN(c, { stance: "fullDefense", fullDefenseBonus: 8 })).toBe(31);
    expect(armorTN(c, { stance: "attack" })).toBe(20);
    expect(armorTN(withSkill(char(), "Défense", 4, "reflexes"), { stance: "defense" })).toBe(27);
  });

  it("Défense 3 et 7, Armes lourdes 3, Jiujutsu 5, Lances 3 : rappels de combat", () => {
    const c = [["Défense", 7], ["Armes lourdes", 3], ["Jiujutsu", 5], ["Lances", 3]].reduce(
      (x, [s, r]) => withSkill(x, s as string, r as number), char(),
    );
    expect(activeEffects(c).filter((e) => e.kind === "reminder").map((e) => e.source)).toEqual([
      "Défense 3", "Défense 7", "Armes lourdes 3", "Jiujutsu 5", "Lances 3",
    ]);
  });

  it("Armes lourdes 5 et Bâtons 5 : Renversement à 1 augmentation avec leur arme ; 2 avec le katana", () => {
    const heavy = withSkill(char(), "Armes lourdes", 5);
    expect(cost(heavy, attack(heavy, "Tetsubo"), "knockdown")).toBe(1);
    expect(cost(heavy, attack(heavy, "Katana"), "knockdown")).toBe(2);
    const staff = withSkill(withWeapon(char(), BO), "Bâtons", 5);
    expect(cost(staff, attack(staff, "Bo"), "knockdown")).toBe(1);
  });

  it("Bâtons 7 : +1g0 aux dégâts d'un bâton petit seulement", () => {
    const c = withSkill(withWeapon(withWeapon(char(), BO), JO), "Bâtons", 7);
    expect(show(c, damage(c, "Jo"))).toBe("4g1");
    expect(show(c, damage(c, "Bo"))).toBe("3g2");
  });

  it("Couteaux 5 : sai, Désarmement à 2 ; tanto, 3. Couteaux 7 : Attaque supplémentaire à 4 avec tout couteau", () => {
    const five = withSkill(withWeapon(withWeapon(char(), SAI), TANTO), "Couteaux", 5);
    expect(cost(five, attack(five, "Sai"), "disarm")).toBe(2);
    expect(cost(five, attack(five, "Tanto"), "disarm")).toBe(3);
    expect(cost(five, attack(five, "Tanto"), "extra")).toBe(5);
    const seven = withSkill(five, "Couteaux", 7);
    expect(cost(seven, attack(seven, "Tanto"), "extra")).toBe(4);
    expect(cost(seven, attack(seven, "Katana"), "extra")).toBe(5);
  });

  it("Iaijutsu 5 : 1 augmentation gratuite à la Concentration, pas à la Frappe", () => {
    const c = withSkill(char(), "Iaijutsu", 5, "reflexes");
    expect(computePool(c, { kind: "skill", skill: "Iaijutsu", trait: "void", focus: true }, {}).freeRaises).toBe(1);
    expect(computePool(c, { kind: "skill", skill: "Iaijutsu", trait: "reflexes", attack: true }, {}).freeRaises).toBeUndefined();
    expect(computePool(withSkill(char(), "Iaijutsu", 4), { kind: "skill", skill: "Iaijutsu", trait: "void", focus: true }, {}).freeRaises).toBeUndefined();
  });

  it("Armes d'hast 3 et 5 : cases (+5 à l'Initiative ; +1g0 aux dégâts contre plus grand)", () => {
    const c = withSkill(withWeapon(char(), NAGINATA), "Armes d'hast", 5);
    const init = computePool(c, { kind: "initiative" }, {});
    expect(init.optional?.map((e) => e.source)).toEqual(["Armes d'hast 3"]);
    expect(show(c, { kind: "initiative" })).toBe("4g3");
    expect(show(c, { kind: "initiative" }, { selected: new Set([init.optional![0]!.key]) })).toBe("4g3 +5");
    const dmg = computePool(c, damage(c, "Naginata"), {});
    expect(dmg.optional?.map((e) => e.source)).toEqual(["Armes d'hast 5"]);
    expect(show(c, damage(c, "Naginata"), { selected: new Set([dmg.optional![0]!.key]) })).toBe("6g2");
    expect(computePool(c, damage(c, "Katana"), {}).optional).toEqual([]);
  });

  it("Bataille 5 : + rang de Bataille à l'Initiative (4g3 +5 ; Bataille 6 : +6)", () => {
    expect(show(withSkill(char(), "Bataille", 5, "perception"), { kind: "initiative" })).toBe("4g3 +5");
    expect(show(withSkill(char(), "Bataille", 6, "perception"), { kind: "initiative" })).toBe("4g3 +6");
    expect(show(withSkill(char(), "Bataille", 4, "perception"), { kind: "initiative" })).toBe("4g3");
  });

  it("L8 et Athlétisme 3 ; 5 : terrain modéré puis difficile sans pénalité (Eau 3)", () => {
    const eau3 = char({ traits: { ...perso.traits, strength: 3, perception: 3 } });
    expect([movement(eau3), movement(eau3, "moderate"), movement(eau3, "difficult")].map((m) => m.simple)).toEqual([30, 20, 10]);
    const three = withSkill(eau3, "Athlétisme", 3, "strength");
    expect([movement(three, "moderate"), movement(three, "difficult")].map((m) => m.simple)).toEqual([30, 10]);
    const five = withSkill(eau3, "Athlétisme", 5, "strength");
    expect([movement(five, "moderate"), movement(five, "difficult")].map((m) => m.simple)).toEqual([30, 30]);
  });

  it("Méditation 3 ; 7 : 2 ; 3 points de Vide rendus (1 sans maîtrise), pour la v2.5", () => {
    expect(meditationVoidPoints(char())).toBe(1);
    expect(meditationVoidPoints(withSkill(char(), "Méditation", 3, "void"))).toBe(2);
    expect(meditationVoidPoints(withSkill(char(), "Méditation", 7, "void"))).toBe(3);
  });

  it("une maîtrise suit l'alias de compétence (« Discrétion » pour Furtivité) et le nom saisi", () => {
    const c = withSkill(char(), "Discrétion", 10);
    const stealth: PoolAction = { kind: "skill", skill: "Furtivité", trait: "agility" };
    expect(computePool(c, stealth, {}).freeRaises).toBe(1);
  });
});

describe("Catalogue d'armures (annexe E.5)", () => {
  const athletics: PoolAction = { kind: "skill", skill: "Athlétisme", trait: "strength" };
  const stealth: PoolAction = { kind: "skill", skill: "Discrétion", trait: "agility" };
  const agility: PoolAction = { kind: "trait", trait: "agility" };

  it("catalogue : Aucune 0/0, ashigaru +3/1, légère +5/3, lourde +10/5, cavalerie +4 (+12 à cheval)/4", () => {
    expect(ARMOR_CATALOG.map((a) => [a.id, a.bonus, a.reduction, a.bonusMounted])).toEqual([
      ["none", 0, 0, undefined], ["ashigaru", 3, 1, undefined], ["light", 5, 3, undefined], ["heavy", 10, 5, undefined], ["riding", 4, 4, 12],
    ]);
  });

  it("sans armure du catalogue : aucun malus", () => {
    const c = char({ armor: { name: "Armure lourde", bonus: 10, reduction: 5 } });
    expect(computePool(c, attack(c, "Katana"), {}).armorTn).toBeUndefined();
  });

  it("légère : +5 au ND d'Athlétisme et de Discrétion, rien à l'attaque", () => {
    const c = armored("light");
    expect(computePool(c, athletics, {}).armorTn).toBe(5);
    expect(computePool(c, stealth, {}).armorTn).toBe(5);
    expect(computePool(c, { ...stealth, skill: "Furtivité" }, {}).armorTn).toBe(5);
    expect(computePool(c, attack(c, "Katana"), {}).armorTn).toBeUndefined();
    expect(armorTN(c, { stance: "attack" })).toBe(25);
  });

  it("lourde : +5 aux jets d'Agilité et de Réflexes (attaques comprises), pas à l'Initiative ni aux dégâts", () => {
    const c = armored("heavy");
    expect(computePool(c, attack(c, "Katana"), {}).armorTn).toBe(5);
    expect(computePool(c, agility, {}).armorTn).toBe(5);
    expect(computePool(c, { kind: "skill", skill: "Iaijutsu", trait: "reflexes" }, {}).armorTn).toBe(5);
    expect(computePool(c, { kind: "skill", skill: "Étiquette", trait: "awareness" }, {}).armorTn).toBeUndefined();
    expect(computePool(c, { kind: "initiative" }, {}).armorTn).toBeUndefined();
    expect(computePool(c, damage(c, "Katana"), {}).armorTn).toBeUndefined();
    expect(armorRollTn(c, agility).notes).toEqual(["Armure lourde : +5 au ND (Agilité, Réflexes)"]);
  });

  it("lourde et Hida R1 : malus ignoré, sauf en Discrétion", () => {
    const c = armored("heavy", { schoolId: "hida-bushi" });
    expect(computePool(c, attack(c, "Katana"), {}).armorTn).toBeUndefined();
    expect(armorRollTn(c, attack(c, "Katana")).notes).toEqual(["Armure lourde : malus ignoré (Hida R1)"]);
    expect(computePool(c, stealth, {}).armorTn).toBe(5);
  });

  it("cavalerie : ND d'armure 24 à pied, 32 à cheval ; malus de lourde à pied seulement", () => {
    const c = armored("riding");
    expect(armorTN(c, { stance: "attack" })).toBe(24);
    expect(armorTN(c, { stance: "attack", mounted: true })).toBe(32);
    expect(computePool(c, attack(c, "Katana"), {}).armorTn).toBe(5);
    expect(computePool(c, attack(c, "Katana"), { mounted: true }).armorTn).toBeUndefined();
    // Bonus modifié à la main : l'écart à cheval (+8) reste.
    expect(armorTN({ ...c, armor: { ...c.armor, bonus: 5 } }, { stance: "attack", mounted: true })).toBe(33);
  });

  it("format : `catalogId` facultatif conservé par le schéma et la fusion", () => {
    const c = armored("light");
    expect(CharacterSchema.parse(c).armor.catalogId).toBe("light");
    const r = mergeCharacter(char(), { armor: { name: "Armure lourde", bonus: 10, reduction: 5, catalogId: "heavy" } });
    expect(r.ok && r.character.armor).toEqual({ name: "Armure lourde", bonus: 10, reduction: 5, catalogId: "heavy" });
  });
});
