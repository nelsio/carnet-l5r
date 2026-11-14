import { emphasisMatches, focusOutcome, fullAttackAllowed, matchingEmphasis, type ActionDef, type Character } from "@carnet/core";
import { WOUND_MULTIPLIERS } from "../../rules/l5r4e";
import { isRollable, SPELL_ROLL_RESET, type RollOptions } from "../rolls";
import { currentActions } from "./selectors";
import type { AppAction, AppState, UiState, VoidChoice } from "./types";

const SKIRMISH_VOID: ReadonlySet<VoidChoice> = new Set(["initiative", "swap"]);

/** Sélectionne une action et prépare le lanceur (ND, spécialisation, dégâts en attente). */
export function select(c: Character, ui: UiState, a: ActionDef, open: boolean): UiState {
  const opts: RollOptions = {
    ...ui.opts,
    raises: 0, free: 0, flat: 0, extraRolled: 0, calledZone: "limb", quadruped: false, disarm: false,
    centerBonus: false, meleeTarget: false, freeToTn: false, opponentTotal: null, ...SPELL_ROLL_RESET,
    tn: typeof a.tn === "number" ? a.tn : ui.opts.tn,
    emphasis: a.kind === "skill" && emphasisMatches(c, a.skill ?? "", a.emphasisHint),
    emphasisName: (a.kind === "skill" && matchingEmphasis(c, a.skill ?? "", a.emphasisHint)) || "",
  };
  let pendingDamage = ui.pendingDamage;
  if (a.kind === "damage" && pendingDamage && pendingDamage.parent === a.parent) {
    // Désarmement : 2g1 sans la Force ni augmentation de dégâts (C6).
    if (pendingDamage.disarm) opts.disarm = true;
    else opts.extraRolled = pendingDamage.dice;
    // Feinte : bonus fixe pré-rempli (F4).
    if (pendingDamage.flat) opts.flat = pendingDamage.flat;
    pendingDamage = null;
  }
  // Duel : les augmentations gratuites de la Concentration passent sur la Frappe (F10).
  if (a.id === "strike" && ui.focusGap !== null) opts.free = focusOutcome(c, ui.focusGap).freeRaises;
  return {
    ...ui, selectedId: a.id, opts: { ...opts, voidSpend: false }, maneuvers: {}, modifierToggles: {}, techToggles: {}, techInputs: {},
    pendingDamage, sheetOpen: open || ui.sheetOpen, spellCast: null,
  };
}

/** Après un changement de situation : première action jouable sélectionnée, lanceur fermé. */
function selectFirst(c: Character | null, ui: UiState): UiState {
  const reset = { ...ui, selectedId: null, lastRoll: null, sheetOpen: false };
  if (!c) return reset;
  const first = currentActions(c, reset).find(isRollable);
  return first ? select(c, reset, first, false) : reset;
}

export function uiReducer(state: AppState, action: AppAction): AppState {
  const { character: c, ui } = state;
  const withUi = (patch: Partial<UiState>): AppState => ({ ...state, ui: { ...ui, ...patch } });

  switch (action.type) {
    case "theme": return withUi({ theme: action.theme });
    case "diceRoller": return withUi({ showDiceRoller: action.show });
    case "woundMultiplier":
      return (WOUND_MULTIPLIERS as readonly number[]).includes(action.value) ? withUi({ woundMultiplier: action.value }) : state;
    case "compactActions": return withUi({ compactActions: action.value });
    case "panel": return withUi({ [action.panel]: action.open });
    case "toggleInfo": return withUi({ info: { ...ui.info, [action.panel]: !ui.info[action.panel] } });
    case "toggleArmorEdit": return withUi({ armorEdit: state.mode === "edit" && !ui.armorEdit });
    case "view":
      return action.view === "aid"
        ? { ...state, ui: selectFirst(c, { ...ui, view: "aid", editing: new Set() }) }
        : withUi({ view: action.view, sheetOpen: false });
    case "situation": return { ...state, ui: selectFirst(c, { ...ui, situation: action.situation }) };
    case "sub": {
      // Hors escarmouche, Initiative et Échanger n'existent plus : retour à « Au jet ».
      const voidChoice = action.sub !== "skirmish" && SKIRMISH_VOID.has(ui.voidChoice) ? "roll" : ui.voidChoice;
      return { ...state, ui: selectFirst(c, { ...ui, sub: action.sub, voidChoice }) };
    }
    case "voidChoice": return withUi({ voidChoice: action.choice });
    case "stance":
      // La Garde est impossible en Assaut (F5).
      return withUi({
        stance: action.stance, fullDefenseBonus: action.stance === "fullDefense" ? ui.fullDefenseBonus : 0,
        guard: action.stance === "fullAttack" ? false : ui.guard,
      });
    case "closeSheet": return withUi({ sheetOpen: false });
    case "toggleWounds": return withUi({ woundsExpanded: !ui.woundsExpanded });
    case "option": return withUi({ opts: { ...ui.opts, ...action.patch } });
    case "maneuver": return withUi({ maneuvers: { ...ui.maneuvers, [action.id]: Math.max(0, action.count) } });
    case "statsOption": return withUi({ stats: { ...ui.stats, ...action.patch } });
    case "toggleModifier": return withUi({ modifierToggles: { ...ui.modifierToggles, [action.id]: action.on } });
    case "toggleArmorModifier": return withUi({ armorToggles: { ...ui.armorToggles, [action.id]: action.on } });
    case "mounted":
      // Assaut monté sans Équitation 3 : retour en Attaque (F2).
      return withUi({
        mounted: action.on,
        stance: ui.stance === "fullAttack" && c && !fullAttackAllowed(c, action.on) ? "attack" : ui.stance,
      });
    case "guard": return withUi({ guard: action.on && ui.stance !== "fullAttack" });
    case "assessmentWon": return withUi({ assessmentWon: action.on });
    case "focusGap": return withUi({ focusGap: action.gap });
    case "battle": return withUi({ battle: { ...ui.battle, ...action.patch } });
    case "terrain": return withUi({ terrain: action.terrain });
    case "toggleTechnique": return withUi({ techToggles: { ...ui.techToggles, [action.key]: action.on } });
    case "techniqueInput": return withUi({ techInputs: { ...ui.techInputs, [action.key]: action.value } });
    case "toggleSchoolArmor": return withUi({ schoolArmor: { ...ui.schoolArmor, [action.key]: action.on } });
    case "stack": return withUi({ stacks: { ...ui.stacks, [action.key]: Math.max(0, action.count) } });
    case "resetStacks": return withUi({ stacks: {} });
    case "newRound":
      // Centre mémorisé pour le round suivant (Kakita R1) ; les cases d'armure se décochent, les compteurs restent.
      return withUi({
        voidArmor: false, voidSpentThisRound: false, fullDefenseBonus: 0,
        centerLastRound: ui.stance === "center", centerBonusUsed: false, schoolArmor: {},
        stance: ui.stance === "fullDefense" ? "defense" : ui.stance,
        // Bataille : nouveau tour, nouveaux jets ; l'engagement, le commandement et le Tacticien restent.
        battle: { ...ui.battle, gap: null, die: null, total: null, woundDice: null, woundsTaken: false },
        // Un total noté au round précédent ne se corrige plus : le suivant est un nouveau jet (annexe 62.4).
        lastRoll: ui.lastRoll?.correctable ? { ...ui.lastRoll, correctable: false } : ui.lastRoll,
      });
    default: return state;
  }
}
