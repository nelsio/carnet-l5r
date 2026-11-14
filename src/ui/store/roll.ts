import {
  activeEffects, DAMAGE_MANEUVER_ID, DISARM_MANEUVER_ID, feintBonus, fullDefenseBonus, spellSlotNeed, spendSpellSlots, voidSpendOption,
  type ActionDef, type Character, type SpellAction,
} from "@carnet/core";
import { FEINT_MANEUVER_ID } from "../../rules/l5r4e";
import { effectiveManeuvers, isUnskilled, toPoolAction } from "../rolls";
import { selectedAction } from "./selectors";
import { HISTORY_SIZE } from "./state";
import type { AppAction, AppState, RollRecord, UiState } from "./types";

/** Dépense un point de Vide ; une fiche en consultation ne dépense rien (HANDOFF §6.1). */
export function spendVoid(state: AppState): AppState {
  const c = state.character;
  if (!c || c.voidPoints < 1 || state.mode === "readonly") return state;
  return { ...state, character: { ...c, voidPoints: c.voidPoints - 1 }, ui: { ...state.ui, voidSpentThisRound: true } };
}

/** Dépenses d'un jet : points de Vide (jet, compétence, techniques, Anneau d'Agasha). */
export function spendRollCosts(state: AppState, c: Character, a: ActionDef): AppState {
  let next = state;
  const { opts } = state.ui;
  if (opts.voidPoint) next = spendVoid(next);
  // La dépense « compétence au rang 1 » ne vaut que pour une compétence non maîtrisée.
  if (opts.voidSkill && isUnskilled(c, a)) next = spendVoid(next);
  // Techniques payées en Vide : option Shiba R1, et effets cochés avec un coût en Vide.
  const spend = opts.voidSpend ? voidSpendOption(c, toPoolAction(a)) : undefined;
  if (spend && c.voidPoints >= spend.points) for (let i = 0; i < spend.points; i++) next = spendVoid(next);
  // Agasha : lancer avec un autre Anneau coûte 1 point de Vide (annexe F.4, G12).
  if (a.kind === "spell" && opts.spellRing) next = spendVoid(next);
  for (const e of activeEffects(c)) {
    if (!state.ui.techToggles[e.key] || !("void" in e) || !e.void) continue;
    for (let i = 0; i < e.void; i++) next = spendVoid(next);
  }
  return next;
}

/** Sort lancé (F.2) : ses emplacements sont dépensés, réussi ou raté ; rien en consultation. */
export function castSpell(state: AppState, c: Character, a: ActionDef, success: boolean | null): AppState {
  if (state.mode === "readonly" || !state.character) return state;
  const need = spellSlotNeed(c, toPoolAction(a, state.ui.opts) as SpellAction);
  const { character, taken } = spendSpellSlots(state.character, need.ring, need.count);
  return { ...state, character, ui: { ...state.ui, spellCast: { actionId: a.id, slots: taken, success } } };
}

/** Options remises à zéro après un jet : dépenses faites, bonus de Centre utilisé. */
export const afterRoll = (ui: UiState): Partial<UiState> => ({
  opts: { ...ui.opts, voidPoint: false, voidSkill: false, voidSpend: false, centerBonus: false, spellRing: null },
  centerBonusUsed: ui.centerBonusUsed || ui.opts.centerBonus,
});

/**
 * Bilan d'un jet : dépense de Vide, emplacements de sort, initiative, Défense totale, dégâts en attente, historique.
 * Total noté à la main (annexe 62.4) : même bilan ; noté de nouveau sur la même action, il corrige le précédent
 * (ligne d'historique remplacée, Vide d'Initiative gardé, rien dépensé de nouveau), jusqu'au « Nouveau round ».
 */
export function rolled(state: AppState, c: Character, action: Extract<AppAction, { type: "rolled" }>): AppState {
  const a = selectedAction(c, state.ui);
  if (!a) return state;
  const { opts } = state.ui;
  const { total } = action.result;
  const success = typeof action.tn === "number" && total >= action.tn;
  const correction = !!action.manual && !!state.ui.lastRoll?.correctable && state.ui.lastRoll.actionId === a.id;
  let next = correction ? state : spendRollCosts(state, c, a);
  if (a.kind === "spell") next = castSpell(next, c, a, typeof action.tn === "number" ? success : null);
  const ui = next.ui;
  const damageDice = a.attack && success ? (ui.maneuvers[DAMAGE_MANEUVER_ID] ?? 0) : 0;
  const disarm = a.attack && success && (ui.maneuvers[DISARM_MANEUVER_ID] ?? 0) > 0;
  const feint = a.attack && success && typeof action.tn === "number" && (ui.maneuvers[FEINT_MANEUVER_ID] ?? 0) > 0
    ? feintBonus(c, total, action.tn) : 0;
  const maneuvers = a.attack
    ? Object.entries(ui.maneuvers).filter(([, n]) => n > 0).flatMap(([id, n]) => {
        const m = effectiveManeuvers(c).find((x) => x.id === id);
        return m ? [{ maneuver: m, count: n }] : [];
      })
    : [];

  const record: RollRecord = {
    actionId: a.id, label: a.label, kind: a.kind, result: action.result, tn: action.tn,
    raises: action.raises, free: action.free ?? opts.free, maneuvers, damageDice, fullDefense: !!a.fullDefense, disarm,
    baseTn: action.baseTn, baseSuccess: action.baseSuccess,
    ...(action.manual ? { manual: true, correctable: true } : {}),
    ...(feint ? { feint } : {}),
    ...(opts.opponentTotal !== null && action.tn === "opposed" ? { opponent: opts.opponentTotal } : {}),
  };
  return {
    ...next,
    ui: {
      ...ui,
      ...afterRoll(ui),
      initiative: a.kind === "initiative" ? total : ui.initiative,
      // Une nouvelle Initiative ouvre une nouvelle escarmouche : le Vide d'Initiative retombe, sauf correction d'un total noté.
      voidInitiative: a.kind === "initiative" && !correction ? 0 : ui.voidInitiative,
      ...(a.fullDefense ? { stance: "fullDefense" as const, fullDefenseBonus: fullDefenseBonus(total) } : {}),
      pendingDamage: a.attack
        ? (disarm ? { parent: a.id, dice: 0, disarm }
          : damageDice || feint ? { parent: a.id, dice: damageDice, ...(feint ? { flat: feint } : {}) } : null)
        : ui.pendingDamage,
      lastRoll: record,
      history: [{ label: a.label, total, tn: action.tn, ...(action.manual ? { manual: true } : {}) }, ...(correction ? ui.history.slice(1) : ui.history)]
        .slice(0, HISTORY_SIZE),
    },
  };
}
