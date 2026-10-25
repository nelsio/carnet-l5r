/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
import { SOCIAL_SKILLS, type Stance } from "../rules/l5r4e";
import { normalize, type PoolAction } from "./engine";
import type { Character, Modifier } from "./schema";

export function modifiersOf(c: Character): Modifier[] {
  return c.modifiers ?? [];
}

/** Compétence sociale (Courtisan, Étiquette, Sincérité, Intimidation…), y compris Représentation : X. */
export function isSocialSkill(name: string): boolean {
  const n = normalize(name);
  return SOCIAL_SKILLS.some((s) => {
    const k = normalize(s);
    return n === k || n.startsWith(`${k} `) || n.startsWith(`${k}:`);
  });
}

/**
 * Le bonus concerne-t-il ce jet, dans cette posture ?
 * Les bonus de ND d'armure et de pénalité de blessure ne concernent aucun jet.
 */
export function modifierApplies(m: Modifier, action: PoolAction, stance: Stance = "attack"): boolean {
  if (m.stance && m.stance !== stance) return false;
  switch (m.appliesTo) {
    case "all": return action.kind === "skill" || action.kind === "trait";
    case "skill": return action.kind === "skill" && !!m.skill && normalize(m.skill) === normalize(action.skill);
    case "trait": return (action.kind === "skill" || action.kind === "trait") && action.trait === m.trait;
    case "social": return action.kind === "skill" && isSocialSkill(action.skill);
    case "attack": return action.kind === "skill" && !!action.attack;
    case "damage": return action.kind === "damage";
    case "initiative": return action.kind === "initiative";
    case "armor":
    case "wounds":
      return false;
  }
}

/** Bonus de la fiche qui concernent ce jet. */
export function applicableModifiers(c: Character, action: PoolAction, stance?: Stance): Modifier[] {
  return modifiersOf(c).filter((m) => modifierApplies(m, action, stance));
}

/** Bonus appliqués d'office (fiche, statistiques, sélection par défaut du lanceur). */
export function defaultModifiers(c: Character, action: PoolAction, stance?: Stance): Modifier[] {
  return applicableModifiers(c, action, stance).filter((m) => m.mode === "always");
}

/** Bonus au ND d'armure des bonus actifs (posture prise en compte). */
export function armorModifierBonus(active: readonly Modifier[], stance: Stance = "attack"): number {
  return active.filter((m) => m.appliesTo === "armor" && (!m.stance || m.stance === stance)).reduce((s, m) => s + m.flat, 0);
}

/** Modification du ND des jets par les bonus actifs. */
export function modifierTN(active: readonly Modifier[]): number {
  return active.reduce((s, m) => s + m.tn, 0);
}

/** Réduction de la pénalité de blessure (ex. Force de la Terre : 3). Toujours appliquée. */
export function woundPenaltyReduction(c: Character): number {
  return modifiersOf(c).filter((m) => m.appliesTo === "wounds").reduce((s, m) => s + m.flat, 0);
}

/** Résumé lisible d'un effet : « +1g0 », « +1g1, +5 au total », « +5 au ND ». */
export function describeModifier(m: Pick<Modifier, "appliesTo" | "rolled" | "kept" | "flat" | "freeRaises"> & { tn?: number }): string {
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  if (m.appliesTo === "armor") return `${sign(m.flat)} au ND d'armure`;
  if (m.appliesTo === "wounds") return `${sign(-m.flat)} à la pénalité de blessure`;
  const parts: string[] = [];
  if (m.rolled || m.kept) parts.push(`${m.rolled >= 0 && m.kept >= 0 ? "+" : ""}${m.rolled}g${m.kept}`);
  if (m.flat) parts.push(`${sign(m.flat)} au total`);
  if (m.freeRaises) parts.push(`${m.freeRaises} augm. gratuite${m.freeRaises > 1 ? "s" : ""}`);
  if (m.tn) parts.push(`${sign(m.tn)} au ND`);
  return parts.join(", ") || "sans effet";
}
