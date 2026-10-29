/**
 * Lot 12, v2.2.0 (HANDOFF annexe E.2, E.9, E.10) : correctifs de règles d'après le livre.
 * Personnage : reference/perso-test-ecoles.json (sans école sauf mention), posture Attaque, terrain normal.
 * L1 : depuis la v2.4.0, les maîtrises Kenjutsu 3 et 7 ajoutent +1g0 (catalogue de maîtrises, E.4).
 */
import { describe, expect, it } from "vitest";
import {
  armorTN, bowStrength, buildActions, catalogGap, computePool, DEFAULT_MANEUVERS, findSkill, fullDefenseBonus, maneuverRaises,
  migrate, movement, rollEffects, schoolContext, schoolReduction, targetNumber, woundPenaltyAt, woundState,
  type Character, type PoolAction, type PoolMods, type Weapon, type WeaponLike,
} from "@carnet/core";
import { exampleCharacter } from "../src/rules/example";
import { NAMED_MODIFIERS } from "../src/rules/l5r4e";
import perso from "../reference/perso-test-ecoles.json";
import courtiers from "../reference/perso-test-courtisans.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const withSkill = (c: Character, name: string, rank: number, trait: Character["skills"][number]["trait"] = "agility"): Character => {
  const skills = c.skills.filter((s) => s.name !== name);
  return { ...c, skills: [...skills, { name, rank, trait, emphases: [] }] };
};
const withWeapon = (c: Character, w: Weapon): Character => ({ ...c, weapons: [...c.weapons, w] });
const weapon = (c: Character, name: string): WeaponLike => c.weapons.find((w) => w.name === name)!;
const damage = (c: Character, name: string): PoolAction => ({ kind: "damage", weapon: weapon(c, name) });
const attack = (c: Character, name: string): PoolAction => {
  const w = weapon(c, name);
  return { kind: "skill", skill: w.skill, trait: w.skill === "Kyujutsu" ? "reflexes" : "agility", attack: true, weapon: w };
};
const show = (c: Character, a: PoolAction, mods: PoolMods = {}) => {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
};

const WAKIZASHI: Weapon = { name: "Wakizashi", skill: "Kenjutsu", dr: "2k2", keywords: ["samourai", "moyenne"] };
const DAIKYU: Weapon = { name: "Dai-kyu", skill: "Kyujutsu", dr: "2k2", bowStrength: 4, keywords: ["arc", "distance", "grande"] };
const earthStrength = NAMED_MODIFIERS.find((m) => m.id === "force-de-la-terre")!;
const lowPain = NAMED_MODIFIERS.find((m) => m.id === "seuil-de-douleur-bas")!;
const asModifier = (t: typeof earthStrength) => ({
  id: t.id, name: t.label, source: t.source, appliesTo: t.appliesTo, rolled: t.rolled, kept: t.kept, flat: t.flat,
  freeRaises: t.freeRaises, tn: t.tn, mode: t.mode, note: t.note ?? "",
});

describe("Lot 12, v2.2.0 : correctifs de règles (annexe E.2)", () => {
  it("L1 : dégâts katana, Kenjutsu 2 → 5g2 sur 10 ; 3 → 6g2 sur 10 ; 7 → 6g2 sur 9 (C1, maîtrises E.4)", () => {
    const c = char();
    expect(show(c, damage(c, "Katana"))).toBe("5g2");
    expect(computePool(c, damage(c, "Katana"), {}).explodeOn).toBe(10);
    const three = withSkill(c, "Kenjutsu", 3);
    expect(computePool(three, damage(three, "Katana"), {})).toMatchObject({ rolled: 6, kept: 2, explodeOn: 10 });
    const master = withSkill(c, "Kenjutsu", 7);
    expect(computePool(master, damage(master, "Katana"), {})).toMatchObject({ rolled: 6, kept: 2, explodeOn: 9 });
    expect(computePool(withSkill(c, "Kenjutsu", 6), damage(c, "Katana"), {}).explodeOn).toBe(10);
  });

  it("L2 : dégâts tetsubo, Armes lourdes 6 → 5g3 sur 10 ; 7 → 5g3 sur 9", () => {
    const six = withSkill(char(), "Armes lourdes", 6, "agility");
    expect(computePool(six, damage(six, "Tetsubo"), {})).toMatchObject({ rolled: 5, kept: 3, explodeOn: 10 });
    const seven = withSkill(char(), "Armes lourdes", 7, "agility");
    expect(computePool(seven, damage(seven, "Tetsubo"), {})).toMatchObject({ rolled: 5, kept: 3, explodeOn: 9 });
  });

  it("L3 : Kyujutsu 7, Force 4 : tir yumi 10g3 ; dégâts 6g2 (force 3 + 1 = 4), explosion sur 10", () => {
    const c = withSkill(char({ traits: { ...perso.traits, strength: 4 } }), "Kyujutsu", 7, "reflexes");
    expect(show(c, attack(c, "Yumi"))).toBe("10g3");
    expect(computePool(c, damage(c, "Yumi"), {})).toMatchObject({ rolled: 6, kept: 2, explodeOn: 10 });
    expect(bowStrength(c, weapon(c, "Yumi"))).toBe(4);
  });

  it("L5 : un point de Vide aux dégâts : katana 6g3 ; wakizashi 4g2, Vide refusé (C2)", () => {
    const c = withWeapon(char(), WAKIZASHI);
    const katana = computePool(c, damage(c, "Katana"), { voidPoint: true });
    expect(katana).toMatchObject({ rolled: 6, kept: 3, katanaVoid: true });
    expect(katana.voidBlocked).toBeUndefined();
    const waki = computePool(c, damage(c, "Wakizashi"), { voidPoint: true });
    expect(waki).toMatchObject({ rolled: 4, kept: 2, voidBlocked: true });
    // Une technique à plusieurs points ne s'applique pas aux dégâts : un seul point, au katana.
    const shiba = { ...c, schoolId: "shiba-bushi" };
    expect(show(shiba, damage(shiba, "Katana"), { voidPoint: true, voidSpend: true })).toBe("6g3");
    // Le point de Vide reste permis sur l'attaque.
    expect(show(c, attack(c, "Wakizashi"), { voidPoint: true })).toBe("6g4");
  });

  it("L6 : Défense totale, jet 15 → ND 28 ; jet 14 → ND 27 (moitié arrondie au supérieur, C3)", () => {
    const c = char();
    expect(fullDefenseBonus(15)).toBe(8);
    expect(armorTN(c, { stance: "fullDefense", fullDefenseBonus: fullDefenseBonus(15) })).toBe(28);
    expect(armorTN(c, { stance: "fullDefense", fullDefenseBonus: fullDefenseBonus(14) })).toBe(27);
  });

  it("L8 : Eau 3, déplacement normal 15/30/60 ; modéré 10/20/40 ; difficile 5/10/20 (C4)", () => {
    const c = char({ traits: { ...perso.traits, strength: 3, perception: 3 } });
    expect(movement(c)).toEqual({ free: 15, simple: 30, max: 60 });
    expect(movement(c, "moderate")).toEqual({ free: 10, simple: 20, max: 40 });
    expect(movement(c, "difficult")).toEqual({ free: 5, simple: 10, max: 20 });
    // Anneau d'Eau 1 au minimum.
    expect(movement(char({ traits: { ...perso.traits, strength: 2, perception: 2 } }), "difficult")).toEqual({ free: 5, simple: 10, max: 20 });
  });

  it("L12 : Désarmement réussi, puis dégâts katana → 2g1 sans la Force ni augmentation (C6)", () => {
    const c = char();
    expect(show(c, damage(c, "Katana"), { disarm: true })).toBe("2g1");
    expect(show(c, damage(c, "Katana"), { disarm: true, extraRolled: 3 })).toBe("2g1");
    expect(computePool(c, damage(c, "Katana"), { disarm: true, voidPoint: true }).voidBlocked).toBe(true);
  });

  it("L13 : Coup ciblé « tête », ND de base 20 → ND final 35 (C5) ; Renversement d'un quadrupède : 4 (C7)", () => {
    const raises = maneuverRaises({ called: 1 }, DEFAULT_MANEUVERS, { costs: { called: 3 } });
    expect(targetNumber({ base: 20, calledRaises: raises, woundPenalty: 0 })).toBe(35);
    expect(maneuverRaises({ knockdown: 1 }, DEFAULT_MANEUVERS, { costs: { knockdown: 4 } })).toBe(4);
    // Tsuruchi R2 : l'augmentation gratuite réservée se déduit de la zone choisie.
    expect(maneuverRaises({ called: 1 }, DEFAULT_MANEUVERS, { costs: { called: 3 }, free: { called: 1 } })).toBe(2);
  });

  it("L20 : Bayushi courtisan R1, 7 ; 8 ; 16 points → 2 ; 3 ; 5 augmentations gratuites (arrondi au plus proche, C10)", () => {
    const c = { ...(structuredClone(courtiers) as Character), schoolId: "bayushi-courtisan", insightRank: 1 };
    const a: PoolAction = { kind: "skill", skill: "Courtoisie", trait: "awareness" };
    const key = rollEffects(c, a, schoolContext()).find((e) => "label" in e && e.label === "Faiblesses de la cible")!.key;
    const free = (n: number) => computePool(c, a, { selected: new Set([key]), inputs: { [key]: n } }).freeRaises ?? 0;
    expect([free(7), free(8), free(16)]).toEqual([2, 3, 5]);
  });

  it("L21 : détail des blessures, Terre 2, Force de la Terre → 0, 0, 2, 7, 12, 17, 37, ✕ (S5)", () => {
    const c = char({ modifiers: [asModifier(earthStrength)] });
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((i) => woundPenaltyAt(c, i))).toEqual([0, 0, 2, 7, 12, 17, 37, null]);
    // E27 : 11 blessures, la tuile reprend le même calcul.
    expect(woundState({ ...c, wounds: 11 })).toMatchObject({ label: "Égratigné", penalty: 0 });
  });

  it("Seuil de douleur bas : +5 à la pénalité de chaque niveau, Indemne reste à 0", () => {
    const c = char({ modifiers: [asModifier(lowPain)] });
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((i) => woundPenaltyAt(c, i))).toEqual([0, 8, 10, 15, 20, 25, 45, null]);
    expect(woundState({ ...c, wounds: 11 }).penalty).toBe(8);
  });

  it("L26 : Force 2, dégâts yumi 4g2 ; dai-kyu 4g2 et avertissement « Force 3 minimum » (C11, C12)", () => {
    const c = withWeapon(char(), DAIKYU);
    expect(show(c, damage(c, "Yumi"))).toBe("4g2");
    const daikyu = computePool(c, damage(c, "Dai-kyu"), {});
    expect(`${daikyu.rolled}g${daikyu.kept}`).toBe("4g2");
    expect(daikyu.warnings?.[0]).toMatch(/Force 3 minimum/);
    expect(computePool(c, damage(c, "Yumi"), {}).warnings).toBeUndefined();
    expect(computePool(c, damage(c, "Yumi"), {}).notes).toContain("Force 2 : l'arc de force 3 tire à 2");
  });

  it("L27 : tir yumi monté ND +10 ; dai-kyu à pied ND +10 ; dai-kyu monté ND +0 (C12)", () => {
    const c = withWeapon(char(), DAIKYU);
    expect(computePool(c, attack(c, "Yumi"), { mounted: true }).weaponTn).toBe(10);
    expect(computePool(c, attack(c, "Yumi"), {}).weaponTn).toBeUndefined();
    expect(computePool(c, attack(c, "Dai-kyu"), {}).weaponTn).toBe(10);
    expect(computePool(c, attack(c, "Dai-kyu"), { mounted: true }).weaponTn).toBeUndefined();
    // Les dégâts ne sont pas concernés.
    expect(computePool(c, damage(c, "Yumi"), { mounted: true }).weaponTn).toBeUndefined();
  });

  it("C8 : catalogue d'armes du livre ; une arme saisie différente est signalée, jamais modifiée", () => {
    expect(catalogGap({ name: "Wakizashi", skill: "Kenjutsu", dr: "2k2", keywords: ["samourai", "moyenne"] })).toBeUndefined();
    expect(catalogGap({ name: "Wakizashi", skill: "Kenjutsu", dr: "2g2", keywords: ["moyenne", "samourai"] })).toBeUndefined();
    expect(catalogGap({ name: "Wakizashi", skill: "Kenjutsu", dr: "2k2", keywords: ["samourai", "petite"] }))
      .toEqual({ dr: "2g2", keywords: ["samourai", "moyenne"] });
    expect(catalogGap({ name: "Cimeterre", skill: "Kenjutsu", dr: "3k2", keywords: ["cimeterre", "moyenne"] })?.dr).toBe("2g3");
    expect(catalogGap({ name: "Lame de mon père", skill: "Kenjutsu", dr: "3k2" })).toBeUndefined();
    // Une fiche v1 migrée reçoit les mots-clés du livre : l'arc n'est plus Samouraï.
    const v1 = migrate({ ...structuredClone(perso), schemaVersion: 1, weapons: [{ name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3 }] });
    expect(v1.weapons[0]?.keywords).toEqual(["arc", "distance", "grande"]);
  });

  it("C9 : la Bataille n'a plus de « Jet de bataille personnel » à ND fixe", () => {
    expect(buildActions(char(), "combat", "battle").map((a) => a.id)).not.toContain("battle");
  });
});

describe("Lot 12, v2.2.0 : fiche d'exemple (annexe E.9 S4)", () => {
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
    expect(buildActions(c, "court").some((a) => a.label === "Se produire · Art oratoire")).toBe(true);
  });
});
