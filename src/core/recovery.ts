/** Récupération (HANDOFF annexe E.6, v2.5.0) : nouvelle journée et méditation. */
import { DAILY_HEALING } from "../rules/l5r4e";
import type { Character } from "./schema";
import { meditationVoidPoints } from "./schools";

/** Blessures soignées par une nuit de repos : 2 × Constitution + Rang d'Insight (p. 86). */
export function dailyHealing(c: Character): number {
  return DAILY_HEALING.perStamina * c.traits.stamina + DAILY_HEALING.perInsight * c.insightRank;
}

/** « Nouvelle journée » : Vide plein (p. 80), blessures soignées, plancher 0, emplacements de sorts rechargés (F-d). */
export function newDay(c: Character): Character {
  return {
    ...c, voidPoints: c.voidRing, wounds: Math.max(0, c.wounds - dailyHealing(c)),
    ...(c.spellSlotsUsed ? { spellSlotsUsed: {} } : {}),
  };
}

/** Méditation réussie (p. 139) : 1 point de Vide, plus avec la maîtrise de Méditation, plafonné à l'Anneau de Vide. */
export function meditate(c: Character): Character {
  return { ...c, voidPoints: Math.min(c.voidRing, c.voidPoints + meditationVoidPoints(c)) };
}
