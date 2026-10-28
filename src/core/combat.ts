/** Combat complet (HANDOFF annexe E.3, v2.3.0) : Centre, restrictions de posture, Feinte, encaissement, duel. */
import {
  CENTER_BONUS, FEINT, MOUNTED_ASSAULT_RIDING, TN_PER_RAISE, VOID_COMBAT, WOUND_EFFECT_NOTES,
  type CombatSub, type Stance,
} from "../rules/l5r4e";
import { findSkill, isRanged, type PoolAction } from "./engine";
import type { Character } from "./schema";
import { duelFocusRule, schoolReduction, voidMultiplier } from "./schools";

/** Situation de combat qui limite les actions : posture, monture, type de combat. */
export interface StanceSituation {
  stance: Stance;
  mounted?: boolean;
  sub?: CombatSub;
}

/** Posture prise en compte aux jets : le duel iaijutsu se joue en Centre implicite (F10). */
export function rollStance(s: StanceSituation): Stance {
  return s.sub === "duel" ? "center" : s.stance;
}

/**
 * Raison pour laquelle la posture empêche cette action (F2), ou `null`. Ce n'est jamais un blocage dur :
 * l'interface garde « Lancer quand même ».
 */
export function stanceRestriction(a: PoolAction, s: StanceSituation): string | null {
  if (s.sub === "duel") return null;
  const attack = a.kind === "skill" && !!a.attack;
  // Sorts en escarmouche (annexe F.5, v2.12.0) : ni en Assaut ni en Défense totale ; Centre comme toute action.
  if (a.kind === "spell" && s.stance === "fullAttack") return "Assaut : attaques seulement, pas de sort.";
  if (a.kind === "spell" && s.stance === "fullDefense") return "Défense totale : actions gratuites seulement, pas de sort.";
  switch (s.stance) {
    case "center":
      return a.kind === "initiative" ? null : "Posture Centre : aucune action ce round.";
    case "defense":
    case "fullDefense":
      return attack ? "Posture Défense : pas d'attaque ce round." : null;
    case "fullAttack":
      return attack && a.kind === "skill" && a.weapon && isRanged(a.weapon) ? "Assaut : pas d'attaque à distance." : null;
    default:
      return null;
  }
}

/** Assaut monté : seulement avec Équitation 3 (F2, p. 142). */
export function fullAttackAllowed(c: Character, mounted: boolean): boolean {
  return !mounted || (findSkill(c, MOUNTED_ASSAULT_RIDING.skill)?.rank ?? 0) >= MOUNTED_ASSAULT_RIDING.rank;
}

/** Score d'Initiative affiché : jet, +10 au round après le Centre (F1), +10 par point de Vide de l'escarmouche (F3). */
export function initiativeScore(c: Character, rolled: number, o: { centerLastRound?: boolean; voidPoints?: number }): number {
  return rolled + (o.centerLastRound ? CENTER_BONUS.initiative : 0) + (o.voidPoints ?? 0) * VOID_COMBAT.initiative * voidMultiplier(c);
}

/** Bonus de Feinte aux dégâts (F4) : moitié de l'excédent sur le ND final, arrondie à l'inférieur, plafonnée à 5 × Insight. */
export function feintBonus(c: Character, total: number, tn: number): number {
  const excess = Math.max(0, total - tn);
  return Math.min(Math.floor(excess / FEINT.divisor), FEINT.capPerInsight * c.insightRank);
}

/** Réduction totale : armure et techniques (Hida R2). */
export function totalReduction(c: Character): number {
  return c.armor.reduction + schoolReduction(c);
}

/** Blessures encaissées (F6) : dégâts − Réduction − 10 avec le point de Vide, jamais négatif. */
export function woundsFromDamage(c: Character, damage: number, voidSpent = false): number {
  const reduced = damage - totalReduction(c) - (voidSpent ? VOID_COMBAT.wounds * voidMultiplier(c) : 0);
  return Math.max(0, Math.floor(reduced));
}

export interface FocusOutcome {
  first: boolean;
  /** Augmentations gratuites pour la Frappe. */
  freeRaises: number;
  threshold: number;
  per: number;
}

/**
 * Concentration en duel (F10) : avec un écart d'au moins 5 (3 avec Kakita R3), tu frappes en premier,
 * avec une augmentation gratuite par tranche de 5 (de 3) au-delà ; sinon, frappe simultanée.
 */
export function focusOutcome(c: Character, gap: number): FocusOutcome {
  const { threshold, per } = duelFocusRule(c);
  if (gap < threshold) return { first: false, freeRaises: 0, threshold, per };
  return { first: true, freeRaises: Math.floor((gap - threshold) / per), threshold, per };
}

/** Jet en opposition avec N augmentations (F7) : écart minimal à obtenir sur l'adversaire. */
export function opposedMargin(raises: number): number {
  return TN_PER_RAISE * raises;
}

export type OpposedVerdict = "win" | "tie" | "lose";

/** Verdict d'un jet en opposition : il faut battre le total adverse d'au moins 5 × N (égalité sans augmentation). */
export function opposedVerdict(total: number, opponent: number, raises: number): OpposedVerdict {
  const margin = total - opponent - opposedMargin(raises);
  if (margin > 0 || (margin === 0 && raises > 0)) return "win";
  return margin === 0 ? "tie" : "lose";
}

/** Rappel des effets d'un niveau de blessure (F11), s'il y en a un. */
export function woundEffectNote(label: string): string | undefined {
  return WOUND_EFFECT_NOTES[label];
}
