/** Passerelle entre les actions de l'aide de jeu et le moteur de règles. */
import {
  applicableModifiers, armorModifierBonus, armorTN, assessmentTN, computePool, DEFAULT_MANEUVERS, findSkill, ignoresWoundPenalty,
  maneuverFreeRaises, maneuverRaises, modifiersOf, modifierTN, schoolContext, targetNumber, targetTnModifier, woundState,
  type ActionDef, type ActiveEffect, type Character, type Maneuver, type Modifier, type Pool, type PoolAction, type SchoolContext,
  type Stance,
} from "@carnet/core";
import { CALLED_ZONES, KNOCKDOWN_QUADRUPED_COST, type CalledZone } from "../rules/l5r4e";

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
  /** Option d'école : plusieurs points de Vide d'un coup (Shiba R1). */
  voidSpend: boolean;
  /** Relance des 1 de la spécialisation. */
  emphasis: boolean;
  /** Spécialisation choisie dans la liste du lanceur ("" : aucune ou non nommée), annexe D-c. */
  emphasisName: string;
  /** Zone du Coup ciblé (annexe E.2 C5). */
  calledZone: CalledZone;
  /** Renversement d'un quadrupède : 4 augmentations (C7). */
  quadruped: boolean;
  /** Dégâts qui suivent un Désarmement réussi : 2g1 sans la Force (C6). */
  disarm: boolean;
}

export const DEFAULT_ROLL_OPTIONS: RollOptions = {
  tn: 15, targetTN: 20, opponentRank: 2, raises: 0, free: 0, extraRolled: 0, flat: 0,
  voidPoint: false, voidSkill: false, voidSpend: false, emphasis: false, emphasisName: "",
  calledZone: "limb", quadruped: false, disarm: false,
};

/** Coût des manœuvres selon la variante choisie : zone du Coup ciblé, quadrupède renversé. */
export function maneuverCosts(opts: Pick<RollOptions, "calledZone" | "quadruped">): Record<string, number> {
  const costs: Record<string, number> = { called: CALLED_ZONES.find((z) => z.id === opts.calledZone)?.cost ?? 1 };
  if (opts.quadruped) costs.knockdown = KNOCKDOWN_QUADRUPED_COST;
  return costs;
}

/** Techniques d'école : situation de combat et cases cochées (annexe C.5). */
export interface SchoolInputs {
  mounted?: boolean;
  centerLastRound?: boolean;
  /** Techniques à cocher retenues pour ce jet. */
  selected?: ReadonlySet<string>;
  /** Valeurs saisies (Moto R2). */
  inputs?: Readonly<Record<string, number>>;
}

/** Une action donne-t-elle lieu à un jet ? */
export const isRollable = (a: ActionDef) => a.kind !== "info" && a.kind !== "move";

export function toPoolAction(a: ActionDef): PoolAction {
  switch (a.kind) {
    case "damage":
      return { kind: "damage", weapon: a.weapon ?? { name: a.label, skill: "", dr: a.dr ?? "0g0" }, unarmed: a.unarmed };
    case "initiative":
      return { kind: "initiative" };
    case "trait":
      return { kind: "trait", trait: a.trait ?? "stamina" };
    default:
      return {
        kind: "skill", skill: a.skill ?? "", trait: a.trait ?? "agility", attack: a.attack,
        weapon: a.weapon, unarmed: a.unarmed, focus: a.id === "focus",
      };
  }
}

/** Compétence non maîtrisée (rang 0) : la case « Vide-compétence » est proposée. */
export function isUnskilled(c: Character, a: ActionDef): boolean {
  return a.kind === "skill" && (findSkill(c, a.skill ?? "")?.rank ?? 0) < 1;
}

/** Coché pour ce jet ? À défaut de choix, les bonus « d'office » le sont, pas les situationnels. */
export const isActive = (m: Modifier, toggles: Readonly<Record<string, boolean>>) => toggles[m.id] ?? m.mode === "always";

/** Bonus de jet actifs pour cette action, dans cette posture (HANDOFF annexe B). */
export function activeModifiers(c: Character, a: ActionDef, toggles: Readonly<Record<string, boolean>> = {}, stance: Stance = "attack"): Modifier[] {
  return applicableModifiers(c, toPoolAction(a), stance).filter((m) => isActive(m, toggles));
}

/** Bonus au ND d'armure des techniques et avantages actifs, dans cette posture. */
export function armorBonus(c: Character, toggles: Readonly<Record<string, boolean>> = {}, stance: Stance = "attack"): number {
  return armorModifierBonus(modifiersOf(c).filter((m) => m.appliesTo === "armor" && isActive(m, toggles)), stance);
}

/** Cases cochées (`Record` d'interface) → ensemble de clés. */
export const selectedKeys = (toggles: Readonly<Record<string, boolean>>): Set<string> =>
  new Set(Object.entries(toggles).filter(([, on]) => on).map(([k]) => k));

/** État de combat de l'interface, tel que le lit le moteur. */
export interface CombatUi {
  stance: Stance;
  fullDefenseBonus: number;
  voidArmor: boolean;
  armorToggles: Record<string, boolean>;
  mounted: boolean;
  centerLastRound: boolean;
  schoolArmor: Record<string, boolean>;
  stacks: Record<string, number>;
}

export function contextOf(ui: Pick<CombatUi, "stance" | "mounted" | "centerLastRound">): SchoolContext {
  return schoolContext({ stance: ui.stance, mounted: ui.mounted, centerLastRound: ui.centerLastRound });
}

/** ND d'armure du personnage : posture, Vide, bonus de jet et techniques d'école. */
export function currentArmorTN(c: Character, ui: CombatUi): number {
  return armorTN(c, {
    stance: ui.stance, fullDefenseBonus: ui.fullDefenseBonus, voidArmor: ui.voidArmor,
    bonus: armorBonus(c, ui.armorToggles, ui.stance),
    mounted: ui.mounted, centerLastRound: ui.centerLastRound, selected: selectedKeys(ui.schoolArmor), stacks: ui.stacks,
  });
}

export function poolFor(
  c: Character,
  a: ActionDef,
  opts: Pick<RollOptions, "extraRolled" | "voidPoint" | "voidSkill"> & { voidSpend?: boolean; emphasisName?: string; disarm?: boolean },
  stance: Stance,
  modifiers: readonly Modifier[] = activeModifiers(c, a, {}, stance),
  school: SchoolInputs = {},
): Pool {
  return computePool(c, toPoolAction(a), {
    stance,
    extraRolled: opts.extraRolled,
    voidPoint: opts.voidPoint,
    voidSkill: opts.voidSkill && isUnskilled(c, a),
    voidSpend: opts.voidSpend,
    emphasis: opts.emphasisName || undefined,
    disarm: a.kind === "damage" && !!opts.disarm,
    modifiers,
    ...school,
  });
}

/** Réserve affichée : « 4g3 +6 ». */
export function poolLabel(p: Pool): string {
  return `${p.rolled}g${p.kept}${p.bonus ? ` ${p.bonus > 0 ? "+" : ""}${p.bonus}` : ""}`;
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

/** Augmentations annoncées : libres + manœuvres (coûts des techniques, augmentations gratuites réservées déduites). */
export function calledRaises(
  c: Character, a: ActionDef, opts: RollOptions, selection: Readonly<Record<string, number>>,
  effects: readonly ActiveEffect[] = [], selected?: ReadonlySet<string>,
): number {
  if (!a.attack) return opts.raises;
  return opts.raises + maneuverRaises(selection, effectiveManeuvers(c), {
    character: c, free: maneuverFreeRaises(effects, selected), costs: maneuverCosts(opts),
  });
}

/** Contexte du ND final : techniques cochées, compteurs et posture. */
export interface TnContext {
  effects?: readonly ActiveEffect[];
  selected?: ReadonlySet<string>;
  stacks?: Readonly<Record<string, number>>;
  ctx?: SchoolContext;
  /** Modification du ND par les techniques appliquées (`Pool.techTn`, Ide R1). */
  techTn?: number;
  /** Modification du ND par l'arme (`Pool.weaponTn` : yumi monté, dai-kyu à pied). */
  weaponTn?: number;
}

/** ND de la cible : ND d'armure saisi, modifié par les techniques (Yoritomo R2) pour les attaques. */
export function targetBaseTN(c: Character, a: ActionDef, opts: RollOptions, stacks?: Readonly<Record<string, number>>): number | null | "opposed" {
  const b = baseTN(a, opts);
  return typeof b === "number" && a.tn === "target" && a.attack ? b + targetTnModifier(c, stacks) : b;
}

/** Pénalité de blessure de ce jet (0 si une technique cochée l'ignore). */
export function rollWoundPenalty(c: Character, t: TnContext = {}): number {
  return ignoresWoundPenalty(t.effects ?? [], t.selected) ? 0 : (woundState(c, t.ctx).penalty ?? 0);
}

export function finalTN(
  c: Character, a: ActionDef, opts: RollOptions, selection: Readonly<Record<string, number>>, active: readonly Modifier[] = [],
  t: TnContext = {},
): number | null | "opposed" {
  return targetNumber({
    base: targetBaseTN(c, a, opts, t.stacks),
    calledRaises: calledRaises(c, a, opts, selection, t.effects, t.selected),
    woundPenalty: rollWoundPenalty(c, t),
    modifier: modifierTN(active) + (t.techTn ?? 0) + (t.weaponTn ?? 0),
  });
}
