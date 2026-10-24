/**
 * Techniques d'école bushi (HANDOFF annexe C.6) : cas T1 à T24.
 * Personnage : reference/perso-test-ecoles.json ; `insightRank` = rang d'école du cas ; posture Attaque sauf mention.
 */
import { describe, expect, it } from "vitest";
import {
  activeEffects, armorTN, computePool, describeEffect, isSimpleAttack, maneuverFreeRaises, maneuverRaises, migrate, movementBonus,
  nextRoundContext, rollEffects, schoolContext, schoolReduction, suggestSchool, verdict, weaponKeywords, woundState,
  DEFAULT_MANEUVERS, REFERENCE_CONTEXT,
  type Character, type PoolAction, type PoolMods, type Stance, type WeaponLike,
} from "@carnet/core";
import perso from "../reference/perso-test-ecoles.json";
import kakitaV1 from "./fixtures/kakita-v1.json";

const char = (schoolId: string, rank: number, patch: Partial<Character> = {}): Character =>
  ({ ...(structuredClone(perso) as Character), schoolId, insightRank: rank, ...patch });

const weapon = (c: Character, name: string): WeaponLike => c.weapons.find((w) => w.name === name)!;
const attack = (c: Character, name: string): PoolAction => {
  const w = weapon(c, name);
  return { kind: "skill", skill: w.skill, trait: w.skill === "Kyujutsu" ? "reflexes" : "agility", attack: true, weapon: w };
};
const damage = (c: Character, name: string): PoolAction => ({ kind: "damage", weapon: weapon(c, name) });
const initiative: PoolAction = { kind: "initiative" };

/** Réserve au format « 4g3 +6 ». */
function show(c: Character, a: PoolAction, mods: PoolMods = {}): string {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
}

/** Clé de l'effet à cocher dont le libellé contient `label`. */
function optionKey(c: Character, a: PoolAction, label: string, stance: Stance = "attack"): string {
  const e = rollEffects(c, a, schoolContext({ stance })).find((x) => "label" in x && x.label?.includes(label));
  if (!e) throw new Error(`option introuvable : ${label}`);
  return e.key;
}

describe("Techniques d'école : cas T1 à T24 (annexe C.6)", () => {
  it("T1 : Kakita 1, Initiative 4g3 +6", () => {
    expect(show(char("kakita-bushi", 1), initiative)).toBe("4g3 +6");
  });

  it("T2 : Kakita 1, attaque katana 5g3 en Attaque, 6g4 +1 en Centre", () => {
    const c = char("kakita-bushi", 1);
    expect(show(c, attack(c, "Katana"), { stance: "attack" })).toBe("5g3");
    expect(show(c, attack(c, "Katana"), { stance: "center" })).toBe("6g4 +1");
  });

  it("T3 : Kakita 1, « Nouveau round » en Centre puis Attaque : 6g4 +1 au round suivant", () => {
    const c = char("kakita-bushi", 1);
    const next = { ...nextRoundContext(schoolContext({ stance: "center" })), stance: "attack" as const };
    expect(next.centerLastRound).toBe(true);
    expect(show(c, attack(c, "Katana"), next)).toBe("6g4 +1");
    // Un round de plus hors Centre : le bonus tombe.
    expect(show(c, attack(c, "Katana"), nextRoundContext(next))).toBe("5g3");
  });

  it("T4 : Kakita 2, « Initiative plus basse » cochée : 7g3", () => {
    const c = char("kakita-bushi", 2);
    const a = attack(c, "Katana");
    const key = optionKey(c, a, "Initiative plus basse");
    expect(show(c, a)).toBe("5g3");
    expect(show(c, a, { selected: new Set([key]) })).toBe("7g3");
  });

  it("T5 : Hiruma 3, attaque katana 6g3 en Attaque, 7g4 en Assaut", () => {
    const c = char("hiruma-bushi", 3);
    expect(show(c, attack(c, "Katana"), { stance: "attack" })).toBe("6g3");
    expect(show(c, attack(c, "Katana"), { stance: "fullAttack" })).toBe("7g4");
  });

  it("T6 : Hiruma 3, ND d'armure 20 ; 2 touches 30 ; + Ailes du colibri 36", () => {
    const c = char("hiruma-bushi", 3);
    const [wolf, wings] = activeEffects(c).filter((e) => e.kind === "armor");
    expect(armorTN(c, { stance: "attack" })).toBe(20);
    expect(armorTN(c, { stance: "attack", stacks: { [wolf!.key]: 2 } })).toBe(30);
    expect(armorTN(c, { stance: "attack", stacks: { [wolf!.key]: 2 }, selected: new Set([wings!.key]) })).toBe(36);
    // Compteur plafonné au rang d'école ; Petite Leçon du loup seulement en posture Attaque.
    expect(armorTN(c, { stance: "attack", stacks: { [wolf!.key]: 9 } })).toBe(35);
    expect(armorTN(c, { stance: "fullAttack", stacks: { [wolf!.key]: 2 } })).toBe(10);
  });

  it("T7 : Hiruma 3, pas de badge Action simple (rang 4 non atteint)", () => {
    const c = char("hiruma-bushi", 3);
    expect(isSimpleAttack(c, attack(c, "Katana"), REFERENCE_CONTEXT)).toBe(false);
    const r4 = char("hiruma-bushi", 4);
    expect(isSimpleAttack(r4, attack(r4, "Katana"), REFERENCE_CONTEXT)).toBe(true);
    expect(isSimpleAttack(r4, attack(r4, "Tetsubo"), REFERENCE_CONTEXT)).toBe(false);
  });

  it("T8 : Hida 2, Réduction 2 ; dégâts tetsubo 6g3 ; dégâts katana 5g2", () => {
    const c = char("hida-bushi", 2);
    expect(schoolReduction(c)).toBe(2);
    expect(show(c, damage(c, "Tetsubo"))).toBe("6g3");
    expect(show(c, damage(c, "Katana"))).toBe("5g2");
  });

  it("T9 : Daidoji 1, seuils de blessure avec Honneur 6,5", () => {
    expect(woundState(char("daidoji-bushi", 1)).thresholds).toEqual([12, 18, 24, 30, 36, 42, 48, 54]);
  });

  it("T10 : Daidoji 1, Honneur 4,0 : minimum 1 blessure en plus par niveau", () => {
    expect(woundState(char("daidoji-bushi", 1, { honor: 4 })).thresholds).toEqual([11, 16, 21, 26, 31, 36, 41, 46]);
  });

  it("T11 : Matsu 4, dégâts katana 5g2 +6", () => {
    const c = char("matsu-berserker", 4);
    expect(show(c, damage(c, "Katana"))).toBe("5g2 +6");
  });

  it("T12 : Matsu 4, pénalité 0 à 11 blessures ; 14 à 27 ; 8 à 27 en Assaut", () => {
    const at = (wounds: number, stance?: Stance) => woundState(char("matsu-berserker", 4, { wounds }), { stance }).penalty;
    expect(at(11)).toBe(0);
    expect(at(27)).toBe(14);
    expect(at(27, "fullAttack")).toBe(8);
  });

  it("T13 : Matsu 4, +5 pieds de déplacement en Assaut", () => {
    const c = char("matsu-berserker", 4);
    expect(movementBonus(c, schoolContext({ stance: "fullAttack" }))).toBe(5);
    expect(movementBonus(c, REFERENCE_CONTEXT)).toBe(0);
  });

  it("T14 : Tsuruchi 2, Initiative 5g3 +3 ; tir yumi 6g3 ; dégâts yumi 6g2 (arc plafonné à Force 2) ; attaque katana 5g3", () => {
    const c = char("tsuruchi-archer", 2);
    expect(show(c, initiative)).toBe("5g3 +3");
    expect(show(c, attack(c, "Yumi"))).toBe("6g3");
    expect(show(c, damage(c, "Yumi"))).toBe("6g2");
    expect(show(c, attack(c, "Katana"))).toBe("5g3");
  });

  it("T15 : Tsuruchi 2, Coup ciblé annoncé au tir : coût 0 (1 augmentation gratuite)", () => {
    const c = char("tsuruchi-archer", 2);
    const effects = rollEffects(c, attack(c, "Yumi"), REFERENCE_CONTEXT);
    const free = { called: 1 };
    expect(effects.some((e) => e.kind === "maneuver")).toBe(true);
    expect(maneuverRaises({ called: 1 }, DEFAULT_MANEUVERS, { character: c, free })).toBe(0);
    expect(maneuverRaises({ called: 1, dmg: 2 }, DEFAULT_MANEUVERS, { character: c, free })).toBe(2);
    expect(rollEffects(c, attack(c, "Katana"), REFERENCE_CONTEXT).some((e) => e.kind === "maneuver")).toBe(false);
  });

  it("T16 : Bayushi 2, Initiative 6g4 ; Feinte à 1 augmentation", () => {
    const c = char("bayushi-bushi", 2);
    expect(show(c, initiative)).toBe("6g4");
    expect(maneuverRaises({ feint: 1 }, DEFAULT_MANEUVERS, { character: c })).toBe(1);
    expect(maneuverRaises({ feint: 1 }, DEFAULT_MANEUVERS)).toBe(2);
  });

  it("T17 : Moto 5, dégâts katana 5g3 en Assaut, 5g2 en Attaque, 6g3 monté en Attaque", () => {
    const c = char("moto-bushi", 5);
    expect(show(c, damage(c, "Katana"), { stance: "fullAttack" })).toBe("5g3");
    expect(show(c, damage(c, "Katana"), { stance: "attack" })).toBe("5g2");
    expect(show(c, damage(c, "Katana"), { stance: "attack", mounted: true })).toBe("6g3");
  });

  it("T18 : Togashi 2, mains nues : attaque 4g4, dégâts 3g2", () => {
    const c = char("togashi-moine", 2);
    const fist = { name: "Mains nues", skill: "Jiujutsu", dr: "0g1" };
    expect(show(c, { kind: "skill", skill: "Jiujutsu", trait: "agility", attack: true, unarmed: true })).toBe("4g4");
    expect(show(c, { kind: "damage", weapon: fist, unarmed: true })).toBe("3g2");
    expect(show(c, attack(c, "Katana"))).toBe("5g3");
  });

  it("T19 : Utaku 1, Équitation 4g3 +6", () => {
    expect(show(char("utaku-battle-maiden", 1), { kind: "skill", skill: "Équitation", trait: "agility" })).toBe("4g3 +6");
  });

  it("T20 : Shiba 5, attaque katana avec 1 point de Vide 7g5 ; ND d'armure avec Vide en armure 40", () => {
    const c = char("shiba-bushi", 5);
    expect(show(c, attack(c, "Katana"), { voidPoint: true })).toBe("7g5");
    expect(armorTN(c, { stance: "attack", voidArmor: true })).toBe(40);
    // Shiba R1 : 2 points pour +2g2, doublés au rang 5.
    expect(show(c, attack(c, "Katana"), { voidSpend: true })).toBe("9g7");
  });

  it("T21 : Akodo 5, ND 20 avec 2 augmentations (ND 30), total 27 : réussite sans les augmentations", () => {
    const c = char("akodo-bushi", 5);
    expect(verdict(c, attack(c, "Katana"), REFERENCE_CONTEXT, 27, 30, 20)).toBe("baseSuccess");
    expect(verdict(c, attack(c, "Katana"), REFERENCE_CONTEXT, 31, 30, 20)).toBe("success");
    expect(verdict(c, attack(c, "Katana"), REFERENCE_CONTEXT, 17, 30, 20)).toBe("failure");
  });

  it("T22 : Akodo 5, même cas sur un jet non Bugei : échec simple", () => {
    const c = char("akodo-bushi", 5);
    expect(verdict(c, { kind: "skill", skill: "Étiquette", trait: "awareness" }, REFERENCE_CONTEXT, 27, 30, 20)).toBe("failure");
    expect(verdict(char("akodo-bushi", 4), attack(c, "Katana"), REFERENCE_CONTEXT, 27, 30, 20)).toBe("failure");
  });

  it("T23 : sans école, toutes les réserves sont celles de la spec v1", () => {
    const c = char("", 2);
    expect(show(c, initiative)).toBe("5g3");
    expect(show(c, attack(c, "Katana"))).toBe("5g3");
    expect(show(c, attack(c, "Katana"), { stance: "fullAttack" })).toBe("7g4");
    expect(show(c, damage(c, "Katana"))).toBe("5g2");
    expect(show(c, damage(c, "Yumi"))).toBe("4g2");
    expect(armorTN(c, { stance: "attack", voidArmor: true })).toBe(30);
    expect(woundState(c).thresholds).toEqual([10, 14, 18, 22, 26, 30, 34, 38]);
    expect(activeEffects(c)).toEqual([]);
    // Identifiant inconnu : aucune école.
    expect(activeEffects(char("ecole-inconnue", 5))).toEqual([]);
  });

  it("T24 : migration d'une fiche v1 Kakita (exemple)", () => {
    const c = migrate(kakitaV1);
    expect(c).toMatchObject({ schemaVersion: 2, schoolId: "", schoolRank: null });
    expect(c.weapons.map((w) => [w.name, w.keywords])).toEqual([
      ["Katana", ["samourai", "moyenne"]],
      ["Wakizashi", ["samourai", "moyenne"]],
    ]);
    expect(suggestSchool(c)?.name).toBe("École de bushi Kakita");
  });
});

describe("Moteur d'effets : détails", () => {
  it("rang d'école : Insight par défaut, sinon `schoolRank`", () => {
    expect(activeEffects(char("hiruma-bushi", 2)).map((e) => e.source)).toEqual(["Hiruma R1", "Hiruma R2"]);
    expect(activeEffects(char("hiruma-bushi", 2, { schoolRank: 1 })).map((e) => e.source)).toEqual(["Hiruma R1"]);
  });

  it("étiquettes des effets appliqués : « +1g1 +1 · Kakita R1 » (le bonus fixe suit le rang d'école)", () => {
    const c = char("kakita-bushi", 1);
    const p = computePool(c, attack(c, "Katana"), { stance: "center" });
    expect(p.applied!.map((e) => `${describeEffect(e, c)} · ${e.source}`)).toEqual(["+1g1 +1 · Kakita R1"]);
    expect(p.techFlat).toBe(1);
    const r2 = char("kakita-bushi", 2);
    const p2 = computePool(r2, attack(r2, "Katana"), { stance: "center" });
    expect(p2.applied!.map((e) => `${describeEffect(e, r2)} · ${e.source}`)).toEqual(["+1g1 +2 · Kakita R1"]);
    expect(p2.optional!.map((e) => e.source)).toEqual(["Kakita R2"]);
  });

  it("Moto R1 : le cimeterre compte comme arme Samouraï", () => {
    const scimitar: WeaponLike = { name: "Cimeterre", skill: "Kenjutsu", dr: "3k2", keywords: ["cimeterre", "moyenne"] };
    expect(weaponKeywords(char("moto-bushi", 1), scimitar).has("samourai")).toBe(true);
    expect(weaponKeywords(char("", 1), scimitar).has("samourai")).toBe(false);
  });

  it("Moto R2 : valeur saisie (moitié de la pénalité adverse, arrondie en dessous)", () => {
    const c = char("moto-bushi", 2);
    const a = attack(c, "Katana");
    const key = optionKey(c, a, "Sourire de Shinsei");
    expect(show(c, a, { selected: new Set([key]), inputs: { [key]: 15 } })).toBe("5g3 +7");
  });

  it("Mirumoto R2 : la valeur saisie n'a pas de sens hors option ; rang de Kenjutsu au total d'Iaijutsu", () => {
    const c = char("mirumoto-bushi", 2);
    const a: PoolAction = { kind: "skill", skill: "Iaijutsu", trait: "reflexes" };
    expect(show(c, a, { selected: new Set([optionKey(c, a, "Centre")]) })).toBe("6g3 +2");
  });

  it("Tsuruchi R4 : option « pénalité de blessure ignorée » au tir", () => {
    const c = char("tsuruchi-archer", 4);
    const shot = rollEffects(c, attack(c, "Yumi"), REFERENCE_CONTEXT);
    expect(shot.some((e) => e.kind === "wounds" && e.ignorePenalty === "all")).toBe(true);
    expect(rollEffects(c, attack(c, "Katana"), REFERENCE_CONTEXT).some((e) => e.kind === "wounds")).toBe(false);
  });

  it("Utaku R5 : option sur les compétences Bugei, pas sur les autres", () => {
    const c = char("utaku-battle-maiden", 5);
    const otaku = (a: PoolAction) => rollEffects(c, a, REFERENCE_CONTEXT).some((e) => "label" in e && e.label?.startsWith("Bénédiction"));
    expect(otaku({ kind: "skill", skill: "Kenjutsu", trait: "agility" })).toBe(true);
    expect(otaku({ kind: "skill", skill: "Étiquette", trait: "awareness" })).toBe(false);
  });

  it("augmentations gratuites réservées : d'office (Tsuruchi R2) ou cochées (Yoritomo R4)", () => {
    const t = char("tsuruchi-archer", 2);
    expect(maneuverFreeRaises(rollEffects(t, attack(t, "Yumi"), REFERENCE_CONTEXT))).toEqual({ called: 1 });
    const y = char("yoritomo-bushi", 4);
    const effects = rollEffects(y, attack(y, "Katana"), REFERENCE_CONTEXT);
    const wave = effects.find((e) => e.kind === "maneuver")!;
    expect(maneuverFreeRaises(effects)).toEqual({});
    expect(maneuverFreeRaises(effects, new Set([wave.key]))).toEqual({ knockdown: 2 });
  });

  it("résumés des effets : ND d'armure, ND de la cible, blessures, manœuvres, autres", () => {
    const text = (id: string, rank: number, kind: string) => {
      const c = char(id, rank);
      return activeEffects(c).filter((e) => e.kind === kind).map((e) => describeEffect(e, c));
    };
    expect(text("hiruma-bushi", 3, "armor")).toEqual(["+5 au ND d'armure par cran", "+6 au ND d'armure"]);
    expect(text("yoritomo-bushi", 2, "targetTn")).toEqual(["-5 au ND de la cible par cran"]);
    expect(text("hida-bushi", 5, "wounds")).toEqual(["pénalité de blessure ignorée"]);
    expect(text("daidoji-bushi", 1, "wounds")).toEqual([""]);
    expect(text("tsuruchi-archer", 2, "maneuver")).toEqual(["1 augm. gratuite pour Coup ciblé"]);
    expect(text("yoritomo-bushi", 4, "maneuver")).toEqual(["2 augm. gratuites pour Renversement"]);
    expect(text("bayushi-bushi", 2, "maneuver")).toEqual([""]);
    expect(text("hida-bushi", 2, "reduction")).toEqual([""]);
    expect(text("akodo-bushi", 1, "roll")).toEqual(["1 augm. gratuite", "+1g0"]);
  });

  it("la réserve n'est jamais négative", () => {
    const c = char("", 1);
    expect(computePool(c, initiative, { extraRolled: -20 })).toMatchObject({ rolled: 0 });
  });
});
