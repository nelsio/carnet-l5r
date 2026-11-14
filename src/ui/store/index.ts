/**
 * État de l'application : la fiche ouverte et l'état de la session de jeu (HANDOFF §3.3).
 * Un seul reducer pur ; le hasard est tiré avant le dispatch (action `rolled`).
 */
export type {
  AidSituation, AppAction, AppState, BattleState, BlockId, EntryMode, FoldPanel, InfoPanel, ListKey, RollRecord, Screen, Theme, UiState, View, VoidChoice,
} from "./types";
export { HISTORY_SIZE, initialBattle, initialState, initialUi, NEW_CHARACTER_BLOCK } from "./state";
export { setIn } from "./path";
export { currentActions, selectedAction } from "./selectors";
export { reducer } from "./reducer";
export { StoreContext, useCharacter, useStore, type FileLinkState, type GrimoireApi, type LibraryApi, type PendingImport, type Store } from "./context";
