import {
  ARMOR_TN, DEAD_LABEL, MASTERY, MOVEMENT, POOL_BONUS, RANGED_PATTERN, RINGS, TN_PER_RAISE,
  WOUND_FIRST_MULTIPLIER, WOUND_LEVELS, WOUND_NEXT_MULTIPLIER,
  type RingKey, type Stance,
} from "../rules/l5r4e";
import { describeModifier, woundPenaltyReduction } from "./modifiers";
import type { Character, Maneuver, Modifier, RollTrait, Skill, TraitKey } from "./schema";

export type Rng = () => number;

export interface DiceCode { rolled: number; kept: number }
export interface TenDice extends DiceCode { bonus: number }

export interface Pool extends TenDice {
  explodes: boolean;
  /** Plus petite face qui explose (10 si absent ; 9 avec la maîtrise d'une compétence martiale). */
  explodeOn?: number;
  canRaise: boolean;
  notes: string[];
  /** Augmentations gratuites apportées par les bonus de jet. */
  freeRaises?: number;
}

/** Arme telle que lue par le moteur (`bowStrength` facultatif). */
export interface WeaponLike { name: string; skill: string; dr: string; bowStrength?: number }

export type PoolAction =
  | { kind: "skill"; skill: string; trait: RollTrait; attack?: boolean }
  | { kind: "trait"; trait: RollTrait }
  | { kind: "damage"; weapon: WeaponLike }
  | { kind: "initiative" };

export interface PoolMods {
  stance?: Stance;
  /** Dés lancés en plus (ou en moins), dont les augmentations de dégâts. */
  extraRolled?: number;
  voidPoint?: boolean;
  /** Point de Vide dépensé pour jouer une compétence non maîtrisée au rang 1. */
  voidSkill?: boolean;
  /** Bonus de jet actifs (techniques, avantages, désavantages) : appliqués avant le point de Vide. */
  modifiers?: readonly Modifier[];
}

export interface CombatState {
  stance: Stance;
  /** Bonus de Défense totale, déjà réduit de moitié. */
  fullDefenseBonus?: number;
  voidArmor?: boolean;
  /** Bonus au ND d'armure des techniques et avantages actifs. */
  bonus?: number;
}

/** Minuscules, sans accents, espaces rognés et réduits. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function traitValue(c: Character, trait: RollTrait): number {
  return trait === "void" ? c.voidRing : c.traits[trait];
}

export function rings(c: Character): Record<RingKey, number> {
  const ring = (traits: [TraitKey, TraitKey]) => Math.min(c.traits[traits[0]], c.traits[traits[1]]);
  return {
    earth: ring(RINGS.earth.traits),
    water: ring(RINGS.water.traits),
    fire: ring(RINGS.fire.traits),
    air: ring(RINGS.air.traits),
    void: c.voidRing,
  };
}

export function findSkill(c: Character, name: string): Skill | undefined {
  const key = normalize(name);
  return c.skills.find((s) => normalize(s.name) === key);
}

export function parseDR(s: string): DiceCode {
  const m = /^\s*(\d+)\s*[kg]\s*(\d+)\s*$/i.exec(s);
  return m ? { rolled: Number(m[1]), kept: Number(m[2]) } : { rolled: 0, kept: 0 };
}

export function formatDice(rolled: number, kept: number): string {
  return `${rolled}g${kept}`;
}

export function isRanged(w: WeaponLike): boolean {
  return RANGED_PATTERN.test(`${w.skill} ${w.name}`);
}

/** Trait d'attaque d'une arme : Réflexes à distance, Agilité au contact. */
export function attackTrait(w: WeaponLike): TraitKey {
  return isRanged(w) ? "reflexes" : "agility";
}

/** Règle des dix dés (livre de base 4e, « Special Dice Rules »), HANDOFF §4.7. */
export function applyTenDiceRule(rolled: number, kept: number): TenDice {
  let extra = Math.max(0, rolled - 10);
  const r = Math.min(rolled, 10);
  let k = kept;
  let bonus = 0;
  // Deux dés lancés en trop valent un dé gardé.
  while (extra >= 2 && k < 10) {
    k++;
    extra -= 2;
  }
  // Gardés au complet : chaque lancé restant vaut +2 ; sinon le dé impair est perdu.
  if (k >= 10) bonus += 2 * extra;
  if (k > 10) {
    bonus += 2 * (k - 10);
    k = 10;
  }
  return { rolled: r, kept: Math.min(k, r), bonus };
}

export function computePool(c: Character, action: PoolAction, mods: PoolMods): Pool {
  const notes: string[] = [];
  let rolled: number;
  let kept: number;
  let explodes = true;
  let explodeOn = 10;
  let canRaise = true;

  switch (action.kind) {
    case "skill": {
      const trait = traitValue(c, action.trait);
      const rank = findSkill(c, action.skill)?.rank ?? 0;
      if (rank >= 1) {
        rolled = trait + rank;
      } else if (mods.voidSkill) {
        rolled = trait + 1;
        notes.push("Vide : compétence jouée au rang 1");
      } else {
        rolled = trait;
        explodes = false;
        canRaise = false;
        notes.push("Sans compétence : pas d'explosion ni d'augmentation");
      }
      kept = trait;
      if (action.attack && mods.stance === "fullAttack") {
        rolled += POOL_BONUS.fullAttack.rolled;
        kept += POOL_BONUS.fullAttack.kept;
        notes.push("Assaut : +2g1");
      }
      break;
    }
    case "trait":
      rolled = kept = traitValue(c, action.trait);
      break;
    case "damage": {
      const dr = parseDR(action.weapon.dr);
      const strength = isRanged(action.weapon) ? (action.weapon.bowStrength ?? 0) : c.traits.strength;
      rolled = strength + dr.rolled;
      kept = dr.kept;
      canRaise = false;
      const mastery = findSkill(c, action.weapon.skill);
      if (mastery && mastery.rank >= MASTERY.damageExplodeOn9AtRank) {
        explodeOn = 9;
        notes.push(`Maîtrise ${mastery.name} ${mastery.rank} : les dés explosent sur 9 et 10`);
      }
      break;
    }
    case "initiative":
      rolled = c.insightRank + c.traits.reflexes;
      kept = c.traits.reflexes;
      canRaise = false;
      break;
  }

  if (mods.extraRolled) {
    rolled = Math.max(0, rolled + mods.extraRolled);
    notes.push(`${mods.extraRolled > 0 ? "+" : ""}${mods.extraRolled} dé(s) lancé(s)`);
  }
  let flat = 0;
  let freeRaises = 0;
  for (const m of mods.modifiers ?? []) {
    rolled = Math.max(0, rolled + m.rolled);
    kept = Math.max(0, kept + m.kept);
    flat += m.flat;
    freeRaises += m.freeRaises;
    notes.push(`${m.name} : ${describeModifier(m)}`);
  }
  if (mods.voidPoint) {
    rolled += POOL_BONUS.voidPoint.rolled;
    kept += POOL_BONUS.voidPoint.kept;
    notes.push("Point de Vide : +1g1");
  }
  const ten = applyTenDiceRule(rolled, kept);
  if (ten.bonus) notes.push(`Règle des dix dés : +${ten.bonus}`);
  const pool: Pool = { ...ten, bonus: ten.bonus + flat, explodes, explodeOn, canRaise, notes };
  if (freeRaises) pool.freeRaises = freeRaises;
  return pool;
}

export interface Die {
  faces: number[];
  total: number;
  rerolledOne: boolean;
  kept: boolean;
}

export interface RollResult {
  dice: Die[];
  total: number;
}

export interface RollOptions { emphasis: boolean; flatBonus?: number }

/** Un dé : spécialisation (un 1 relancé une fois), puis explosions (sur 10, ou dès `explodeOn`). */
export function rollDie(rng: Rng, explodes: boolean, emphasis: boolean, explodeOn = 10): Omit<Die, "kept"> {
  let v = rng();
  let rerolledOne = false;
  if (emphasis && v === 1) {
    v = rng();
    rerolledOne = true;
  }
  const faces = [v];
  while (explodes && v >= explodeOn) {
    v = rng();
    faces.push(v);
  }
  return { faces, total: faces.reduce((a, b) => a + b, 0), rerolledOne };
}

/** La spécialisation ne s'applique qu'à une réserve qualifiée (compétence maîtrisée). */
function emphasisApplies(pool: Pool, emphasis: boolean): boolean {
  return emphasis && pool.canRaise;
}

export function rollDice(pool: Pool, opts: RollOptions, rng: Rng): RollResult {
  const emphasis = emphasisApplies(pool, opts.emphasis);
  const dice: Die[] = Array.from({ length: pool.rolled }, () => ({ ...rollDie(rng, pool.explodes, emphasis, pool.explodeOn), kept: false }));
  dice.sort((a, b) => b.total - a.total);
  let total = pool.bonus + (opts.flatBonus ?? 0);
  dice.forEach((d, i) => {
    if (i < pool.kept) {
      d.kept = true;
      total += d.total;
    }
  });
  return { dice, total };
}

export interface WoundState {
  level: number;
  label: string;
  penalty: number | null;
  thresholds: number[];
  status: "ok" | "out" | "dead";
}

export function woundThresholds(c: Character): number[] {
  const earth = rings(c).earth;
  let cap = 0;
  return WOUND_LEVELS.map((_, i) => (cap += earth * (i === 0 ? WOUND_FIRST_MULTIPLIER : WOUND_NEXT_MULTIPLIER)));
}

export function woundState(c: Character): WoundState {
  const thresholds = woundThresholds(c);
  const passed = thresholds.filter((t) => c.wounds > t).length;
  const last = WOUND_LEVELS.length - 1;
  if (passed > last) {
    return { level: last, label: DEAD_LABEL, penalty: null, thresholds, status: "dead" };
  }
  const { label, penalty } = WOUND_LEVELS[passed];
  if (penalty === null) return { level: passed, label, penalty, thresholds, status: "out" };
  // Force de la Terre et effets semblables : pénalité réduite, jamais négative.
  return { level: passed, label, penalty: Math.max(0, penalty - woundPenaltyReduction(c)), thresholds, status: "ok" };
}

export function armorTN(c: Character, state: CombatState): number {
  let tn = ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus;
  switch (state.stance) {
    case "fullAttack":
      tn += ARMOR_TN.fullAttackModifier;
      break;
    case "defense":
      tn += rings(c).air + (findSkill(c, ARMOR_TN.defenseSkill)?.rank ?? 0);
      break;
    case "fullDefense":
      tn += state.fullDefenseBonus ?? 0;
      break;
  }
  if (state.voidArmor) tn += ARMOR_TN.voidArmorBonus;
  return tn + (state.bonus ?? 0);
}

/** Somme des coûts : une manœuvre cumulable compte coût × nombre, une autre compte une fois. */
export function maneuverRaises(selection: Readonly<Record<string, number>>, maneuvers: readonly Maneuver[]): number {
  return maneuvers.reduce((sum, m) => {
    const n = selection[m.id] ?? 0;
    if (n <= 0) return sum;
    return sum + (m.stackable ? m.cost * n : m.cost);
  }, 0);
}

export function targetNumber(o: { base: number | null | "opposed"; calledRaises: number; woundPenalty: number; modifier?: number }): number | null | "opposed" {
  if (o.base === null || o.base === "opposed") return o.base;
  return o.base + TN_PER_RAISE * o.calledRaises + o.woundPenalty + (o.modifier ?? 0);
}

export function raiseCapExceeded(c: Character, called: number): boolean {
  return called > c.voidRing;
}

export function movement(c: Character): { free: number; simple: number; max: number } {
  const water = rings(c).water;
  return { free: water * MOVEMENT.free, simple: water * MOVEMENT.simple, max: water * MOVEMENT.max };
}

/** Une spécialisation de la compétence correspond-elle à l'indice de l'action ? */
export function emphasisMatches(c: Character, skillName: string, hint: string | undefined): boolean {
  if (!hint) return false;
  const h = normalize(hint);
  const skill = findSkill(c, skillName);
  return !!skill && skill.emphases.some((e) => {
    const n = normalize(e);
    return n !== "" && (h.includes(n) || n.includes(h));
  });
}
