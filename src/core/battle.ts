/** Bataille de masse (HANDOFF annexe E.8, v2.7.0) : commandement, jet de bataille, table de résultats. */
import {
  BATTLE_COLUMNS, BATTLE_COMMAND, BATTLE_ROLL, BATTLE_TABLE,
  type ArmyStatus, type BattleCell, type Engagement,
} from "../rules/l5r4e";
import { findSkill, rings, type Rng } from "./engine";
import type { Character } from "./schema";

/** État de l'armée d'après l'écart de Commandement (ton total − adverse) : 5 d'écart pour gagner ou perdre. */
export function armyStatus(gap: number): ArmyStatus {
  if (gap >= BATTLE_COMMAND.margin) return "winning";
  return gap <= -BATTLE_COMMAND.margin ? "losing" : "stalemate";
}

/** Ce qui s'ajoute au d10 du jet de bataille : Anneau d'Eau et rang de Bataille. */
export function battleRollBonus(c: Character): { water: number; skill: number } {
  return { water: rings(c).water, skill: findSkill(c, BATTLE_ROLL.skill)?.rank ?? 0 };
}

/** Jet de bataille : 1d10 (sans explosion, E-g) + Eau + Bataille. */
export function battleRollTotal(c: Character, die: number): number {
  const { water, skill } = battleRollBonus(c);
  return die + water + skill;
}

export interface BattleOutcome extends BattleCell {
  /** Ligne de la table retenue (total plafonné à la ligne 28-30). */
  row: { min: number; max: number };
  column: number;
  /** Décalage de colonne dû à l'état de l'armée (0 si elle gagne). */
  shift: number;
}

/** Case de la table : colonne = engagement + décalage de l'état ; ligne = total, entre la première et la dernière ligne. */
export function battleOutcome(total: number, engagement: Engagement, status: ArmyStatus): BattleOutcome {
  const shift = BATTLE_COLUMNS.statusOffset[status];
  const column = BATTLE_COLUMNS.engagement.indexOf(engagement) + shift;
  const row = BATTLE_TABLE.find((r) => total <= r.max) ?? BATTLE_TABLE[BATTLE_TABLE.length - 1];
  return { ...row.cells[column], row: { min: row.min, max: row.max }, column, shift };
}

/** Dés de bataille ou de blessures : d10 sans explosion, un par dé. */
export function rollBattleDice(n: number, rng: Rng): number[] {
  return Array.from({ length: Math.max(0, n) }, () => rng());
}
