/** Passerelle entre les actions de l'aide de jeu et le moteur de règles. */
import {
  assessmentTN, computePool, DEFAULT_MANEUVERS, findSkill, maneuverRaises, targetNumber, woundState,
  type ActionDef, type Character, type Maneuver, type Pool, type PoolAction, type Stance,
} from "@carnet/core";

export interface RollOptions {
  /** ND de base choisi dans l'échelle. */
  tn: number;
  /** ND d'armure de la cible (attaques). */
  targetTN: number;
  /** Rang adverse (Évaluation en duel). */
  opponentRank: number;
  raises: number;
  free: number;
  extraRolled: number;
  flat: number;
  voidPoint: boolean;
  voidSkill: boolean;
  emphasis: boolean;
}

export const DEFAULT_ROLL_OPTIONS: RollOptions = {
  tn: 15, targetTN: 20, opponentRank: 2, raises: 0, free: 0, extraRolled: 0, flat: 0,
  voidPoint: false, voidSkill: false, emphasis: false,
};

/** Une action donne-t-elle lieu à un jet ? */
export const isRollable = (a: ActionDef) => a.kind !== "info" && a.kind !== "move";

export function toPoolAction(a: ActionDef): PoolAction {
  switch (a.kind) {
    case "damage":
      return { kind: "damage", weapon: a.weapon ?? { name: a.label, skill: "", dr: a.dr ?? "0g0" } };
    case "initiative":
      return { kind: "initiative" };
    case "trait":
      return { kind: "trait", trait: a.trait ?? "stamina" };
    default:
      return { kind: "skill", skill: a.skill ?? "", trait: a.trait ?? "agility", attack: a.attack };
  }
}

/** Compétence non maîtrisée (rang 0) : la case « Vide-compétence » est proposée. */
export function isUnskilled(c: Character, a: ActionDef): boolean {
  return a.kind === "skill" && (findSkill(c, a.skill ?? "")?.rank ?? 0) < 1;
}

export function poolFor(c: Character, a: ActionDef, opts: Pick<RollOptions, "extraRolled" | "voidPoint" | "voidSkill">, stance: Stance): Pool {
  return computePool(c, toPoolAction(a), {
    stance,
    extraRolled: opts.extraRolled,
    voidPoint: opts.voidPoint,
    voidSkill: opts.voidSkill && isUnskilled(c, a),
  });
}

/** Manœuvres de la fiche, ou celles par défaut si la liste est vide. */
export function effectiveManeuvers(c: Character): readonly Maneuver[] {
  return c.maneuvers.length ? c.maneuvers : DEFAULT_MANEUVERS;
}

export function baseTN(a: ActionDef, opts: RollOptions): number | null | "opposed" {
  switch (a.tn) {
    case null: return null;
    case "opposed": return "opposed";
    case "target": return opts.targetTN;
    case "assessment": return assessmentTN(opts.opponentRank);
    default: return opts.tn;
  }
}

export function calledRaises(c: Character, a: ActionDef, opts: RollOptions, selection: Readonly<Record<string, number>>): number {
  return opts.raises + (a.attack ? maneuverRaises(selection, effectiveManeuvers(c)) : 0);
}

export function finalTN(c: Character, a: ActionDef, opts: RollOptions, selection: Readonly<Record<string, number>>): number | null | "opposed" {
  return targetNumber({
    base: baseTN(a, opts),
    calledRaises: calledRaises(c, a, opts, selection),
    woundPenalty: woundState(c).penalty ?? 0,
  });
}
