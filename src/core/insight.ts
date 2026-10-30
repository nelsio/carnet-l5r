/**
 * Points d'Insight calculés (annexe K) : Anneaux × 10 + rangs de compétence + bonus du MJ.
 * Le Rang d'Insight saisi (`insightRank`) fait foi pour tous les calculs ; celui-ci n'est qu'une suggestion.
 */
import { INSIGHT } from "../rules/l5r4e";
import { rings } from "./engine";
import type { Character } from "./schema";

export function insightPoints(c: Character): number {
  const ringSum = Object.values(rings(c)).reduce((s, r) => s + r, 0);
  const skillSum = c.skills.reduce((s, sk) => s + sk.rank, 0);
  return ringSum * INSIGHT.ringMultiplier + skillSum + (c.insightBonus ?? 0);
}

/** Rang 1 sous 150 points, puis un rang tous les 25 points, au plus 10. */
export function suggestedInsightRank(points: number): number {
  if (points < INSIGHT.firstThreshold) return 1;
  return Math.min(INSIGHT.maxRank, 2 + Math.floor((points - INSIGHT.firstThreshold) / INSIGHT.step));
}
