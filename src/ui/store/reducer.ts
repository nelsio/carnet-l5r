import { meditate, newDay, refundSpellSlots, updateVocabulary, woundsFromDamage } from "@carnet/core";
import { isRollable } from "../rolls";
import { setIn } from "./path";
import { afterRoll, castSpell, rolled, spendRollCosts, spendVoid } from "./roll";
import { currentActions, selectedAction } from "./selectors";
import { initialBattle, initialState, initialUi, NEW_CHARACTER_BLOCK } from "./state";
import type { AppAction, AppState, UiState } from "./types";
import { select, uiReducer } from "./ui-reducer";

/** État d'interface conservé d'une fiche à l'autre : préférences et détails dépliés. */
const kept = (ui: UiState): Pick<UiState, "theme" | "showDiceRoller" | "woundMultiplier" | "compactActions" | "info"> =>
  ({ theme: ui.theme, showDiceRoller: ui.showDiceRoller, woundMultiplier: ui.woundMultiplier, compactActions: ui.compactActions, info: ui.info });

/** Actions qui modifient la fiche : refusées en consultation. */
const EDITING = new Set<AppAction["type"]>(["set", "add", "remove", "wounds", "pip", "toggleBlockEdit", "replaceCharacter", "newDay", "meditate", "vocabulary", "castSpell", "cancelCast"]);

export function reducer(state: AppState, action: AppAction): AppState {
  const { character: c, ui } = state;

  if (action.type === "open") {
    return {
      screen: "character", entryId: action.id, mode: action.mode, character: action.character,
      ui: { ...initialUi, ...kept(ui), editing: new Set(action.edit && action.mode === "edit" ? [NEW_CHARACTER_BLOCK] : []) },
    };
  }
  if (action.type === "library") {
    return { ...initialState(), ui: { ...initialUi, ...kept(ui) } };
  }
  if (!c) return uiReducer(state, action);
  if (state.mode === "readonly" && EDITING.has(action.type)) return state;

  switch (action.type) {
    case "set":
      return { ...state, character: setIn(c, action.path, action.value) };
    case "replaceCharacter":
      return { ...state, character: action.character };
    case "add":
      return { ...state, character: { ...c, [action.list]: [...(c[action.list] ?? []), action.item] } };
    case "remove":
      return { ...state, character: { ...c, [action.list]: (c[action.list] ?? []).filter((_: unknown, i: number) => i !== action.index) } };
    case "wounds":
      return { ...state, character: { ...c, wounds: Math.max(0, Math.floor(action.value) || 0) } };
    case "pip":
      return { ...state, character: { ...c, voidPoints: c.voidPoints === action.index + 1 ? action.index : action.index + 1 } };
    case "newDay":
      // Une nouvelle journée clôt les escarmouches : initiative, Vide d'Initiative, effets du round et compteurs.
      return {
        ...state, character: newDay(c),
        ui: {
          ...ui, initiative: null, voidInitiative: 0, stacks: {}, voidArmor: false, voidSpentThisRound: false,
          fullDefenseBonus: 0, centerLastRound: false, centerBonusUsed: false, schoolArmor: {}, guard: false,
          focusGap: null, assessmentWon: false, pendingDamage: null, battle: initialBattle,
          stance: ui.stance === "fullDefense" ? "defense" : ui.stance,
        },
      };
    case "vocabulary": {
      const { undo } = ui.vocabulary;
      if (action.op === "update") {
        const after = updateVocabulary(c);
        return { ...state, character: after, ui: { ...ui, vocabulary: { hidden: false, undo: { before: c, after } } } };
      }
      if (action.op === "undo" && undo?.after === c) {
        return { ...state, character: undo.before, ui: { ...ui, vocabulary: { hidden: true, undo: null } } };
      }
      return { ...state, ui: { ...ui, vocabulary: { hidden: true, undo: null } } };
    }
    case "meditate":
      return { ...state, character: meditate(c) };
    case "castSpell": {
      const a = selectedAction(c, ui);
      if (!a || a.kind !== "spell") return state;
      const next = castSpell(spendRollCosts(state, c, a), c, a, action.success);
      return { ...next, ui: { ...next.ui, ...afterRoll(next.ui) } };
    }
    case "cancelCast":
      return ui.spellCast
        ? { ...state, character: refundSpellSlots(c, ui.spellCast.slots), ui: { ...ui, spellCast: null } }
        : state;
    case "toggleBlockEdit": {
      const editing = new Set(ui.editing);
      if (!editing.delete(action.block)) editing.add(action.block);
      return { ...state, ui: { ...ui, editing } };
    }
    case "select": {
      const a = currentActions(c, ui).find((x) => x.id === action.id);
      return a && isRollable(a) ? { ...state, ui: select(c, ui, a, true) } : state;
    }
    case "voidArmor":
      // En consultation, l'effet s'applique sans rien dépenser.
      if (state.mode === "readonly") return { ...state, ui: { ...ui, voidArmor: !ui.voidArmor } };
      if (ui.voidArmor) {
        // Annuler rend le point de Vide.
        return { ...state, character: { ...c, voidPoints: Math.min(c.voidRing, c.voidPoints + 1) }, ui: { ...ui, voidArmor: false, voidSpentThisRound: false } };
      }
      if (c.voidPoints < 1) return state;
      {
        const spent = spendVoid(state);
        return { ...spent, ui: { ...spent.ui, voidArmor: true } };
      }
    case "voidTechnique":
      return spendVoid(state);
    case "voidInitiative": {
      // +10 à l'Initiative jusqu'à la fin de l'escarmouche (F3) ; en consultation, sans rien dépenser.
      if (state.mode !== "readonly" && c.voidPoints < 1) return state;
      const spent = spendVoid(state);
      return { ...spent, ui: { ...spent.ui, voidInitiative: spent.ui.voidInitiative + 1 } };
    }
    case "takeDamage": {
      // Encaisser (F6) : blessures = dégâts − Réduction (− 10 avec le Vide), le point est dépensé.
      if (state.mode === "readonly") return state;
      const voidSpent = action.voidSpent && c.voidPoints >= 1;
      const added = woundsFromDamage(c, action.damage, voidSpent);
      const hurt = { ...state, character: { ...c, wounds: c.wounds + added } };
      return voidSpent ? spendVoid(hurt) : hurt;
    }
    case "rolled":
      return rolled(state, c, action);
    default:
      return uiReducer(state, action);
  }
}
