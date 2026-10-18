/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
import { normalize, type PoolAction } from "./engine";
import type { Character, Modifier } from "./schema";

export function modifiersOf(c: Character): Modifier[] {
  return c.modifiers ?? [];
}

/** Le bonus concerne-t-il ce jet ? (Les bonus de ND d'armure ne concernent aucun jet.) */
export function modifierApplies(m: Modifier, action: PoolAction): boolean {
  switch (m.appliesTo) {
    case "all": return action.kind === "skill" || action.kind === "trait";
    case "skill": return action.kind === "skill" && !!m.skill && normalize(m.skill) === normalize(action.skill);
    case "trait": return (action.kind === "skill" || action.kind === "trait") && action.trait === m.trait;
    case "attack": return action.kind === "skill" && !!action.attack;
    case "damage": return action.kind === "damage";
    case "initiative": return action.kind === "initiative";
    case "armor": return false;
  }
}

/** Bonus de la fiche qui concernent ce jet. */
export function applicableModifiers(c: Character, action: PoolAction): Modifier[] {
  return modifiersOf(c).filter((m) => modifierApplies(m, action));
}

/** Bonus appliqués d'office (fiche, statistiques, sélection par défaut du lanceur). */
export function defaultModifiers(c: Character, action: PoolAction): Modifier[] {
  return applicableModifiers(c, action).filter((m) => m.mode === "always");
}

/** Bonus au ND d'armure des bonus actifs. */
export function armorModifierBonus(active: readonly Modifier[]): number {
  return active.filter((m) => m.appliesTo === "armor").reduce((s, m) => s + m.flat, 0);
}

/** Résumé lisible d'un effet : « +1g0 », « +1g1, +5 », « 1 augm. gratuite ». */
export function describeModifier(m: Pick<Modifier, "appliesTo" | "rolled" | "kept" | "flat" | "freeRaises">): string {
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  if (m.appliesTo === "armor") return `${sign(m.flat)} au ND d'armure`;
  const parts: string[] = [];
  if (m.rolled || m.kept) parts.push(`${m.rolled >= 0 && m.kept >= 0 ? "+" : ""}${m.rolled}g${m.kept}`);
  if (m.flat) parts.push(`${sign(m.flat)} au total`);
  if (m.freeRaises) parts.push(`${m.freeRaises} augm. gratuite${m.freeRaises > 1 ? "s" : ""}`);
  return parts.join(", ") || "sans effet";
}
