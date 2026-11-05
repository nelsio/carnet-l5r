import { WOUND_NEXT_MULTIPLIER } from "../../rules/l5r4e";
import { DEFAULT_ROLL_OPTIONS } from "../rolls";
import type { AppState, BattleState, BlockId, Theme, UiState } from "./types";

/** Bloc ouvert à la création d'une fiche : le nom en premier. */
export const NEW_CHARACTER_BLOCK: BlockId = "identity";

export const initialBattle: BattleState = {
  commanding: false, gap: null, status: "stalemate", engagement: "engaged", tactician: 0, die: null, total: null, woundDice: null, woundsTaken: false,
};

export const HISTORY_SIZE = 6;

export const initialUi: UiState = {
  theme: "auto",
  showDiceRoller: true,
  woundMultiplier: WOUND_NEXT_MULTIPLIER,
  compactActions: false,
  info: {},
  armorEdit: false,
  view: "sheet",
  editing: new Set(),
  terrain: "normal",
  centerBonusUsed: false,
  guard: false,
  voidInitiative: 0,
  assessmentWon: false,
  focusGap: null,
  situation: "investigation",
  sub: "skirmish",
  stance: "attack",
  fullDefenseBonus: 0,
  voidArmor: false,
  voidChoice: "roll",
  voidSpentThisRound: false,
  initiative: null,
  selectedId: null,
  opts: DEFAULT_ROLL_OPTIONS,
  maneuvers: {},
  pendingDamage: null,
  lastRoll: null,
  spellCast: null,
  history: [],
  sheetOpen: false,
  woundsExpanded: false,
  modifierToggles: {},
  armorToggles: {},
  stats: { voidPoint: false, emphasis: true, penalty: true },
  mounted: false,
  centerLastRound: false,
  techToggles: {},
  techInputs: {},
  schoolArmor: {},
  stacks: {},
  vocabulary: { hidden: false, undo: null },
  battle: initialBattle,
};

/** `theme` : thème mis en cache, appliqué dès le premier rendu en attendant les préférences (annexe I.1.8). */
export function initialState(theme: Theme = "auto"): AppState {
  return { screen: "library", entryId: null, mode: "edit", character: null, ui: { ...initialUi, theme } };
}
