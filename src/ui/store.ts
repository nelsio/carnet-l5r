/**
 * État de l'application : la fiche ouverte et l'état de la session de jeu (HANDOFF §3.3).
 * Un seul reducer pur ; le hasard est tiré avant le dispatch (action `rolled`).
 */
import { createContext, useContext, type Dispatch } from "react";
import {
  buildActions, DAMAGE_MANEUVER_ID, DEFAULT_MANEUVERS, emphasisMatches,
  type ActionDef, type Character, type CombatSub, type RollResult, type Situation, type Stance,
} from "@carnet/core";
import type { LibraryEntry } from "../storage";
import { DEFAULT_ROLL_OPTIONS, effectiveManeuvers, isRollable, isUnskilled, type RollOptions } from "./rolls";

export type Theme = "auto" | "light" | "dark";
export type View = "sheet" | "aid";
export type AidSituation = Situation | "stats";
export type ListKey = "skills" | "weapons" | "techniques" | "maneuvers" | "modifiers";
type Path = readonly (string | number)[];

export interface RollRecord {
  actionId: string;
  label: string;
  kind: ActionDef["kind"];
  result: RollResult;
  tn: number | null | "opposed";
  raises: number;
  free: number;
  maneuvers: string[];
  /** Dés de dégâts gagnés par « Augmentation des dégâts ». */
  damageDice: number;
  fullDefense: boolean;
}

export interface UiState {
  theme: Theme;
  view: View;
  edit: boolean;
  situation: AidSituation;
  sub: CombatSub;
  stance: Stance;
  /** Bonus de Défense totale (moitié du jet). */
  fullDefenseBonus: number;
  voidArmor: boolean;
  /** Un point de Vide a déjà été dépensé ce round (avertissement). */
  voidSpentThisRound: boolean;
  initiative: number | null;
  selectedId: string | null;
  opts: RollOptions;
  maneuvers: Record<string, number>;
  pendingDamage: { parent: string; dice: number } | null;
  lastRoll: RollRecord | null;
  history: { label: string; total: number; tn: number | null | "opposed" }[];
  sheetOpen: boolean;
  woundsExpanded: boolean;
  /** Bonus de jet cochés ou décochés pour le jet en cours (remis à zéro au choix d'une action). */
  modifierToggles: Record<string, boolean>;
  /** Bonus de ND d'armure cochés ou décochés pour le combat en cours. */
  armorToggles: Record<string, boolean>;
  stats: { voidPoint: boolean; emphasis: boolean; penalty: boolean };
}

export type Screen = "library" | "character";
export type EntryMode = "edit" | "readonly";

export interface AppState {
  screen: Screen;
  /** Fiche ouverte et son entrée de bibliothèque. */
  entryId: string | null;
  mode: EntryMode;
  character: Character | null;
  ui: UiState;
}

export const HISTORY_SIZE = 6;

export const initialUi: UiState = {
  theme: "auto",
  view: "sheet",
  edit: false,
  situation: "investigation",
  sub: "skirmish",
  stance: "attack",
  fullDefenseBonus: 0,
  voidArmor: false,
  voidSpentThisRound: false,
  initiative: null,
  selectedId: null,
  opts: DEFAULT_ROLL_OPTIONS,
  maneuvers: {},
  pendingDamage: null,
  lastRoll: null,
  history: [],
  sheetOpen: false,
  woundsExpanded: false,
  modifierToggles: {},
  armorToggles: {},
  stats: { voidPoint: false, emphasis: true, penalty: true },
};

export function initialState(): AppState {
  return { screen: "library", entryId: null, mode: "edit", character: null, ui: initialUi };
}

export type AppAction =
  | { type: "open"; id: string; character: Character; mode: EntryMode; edit?: boolean }
  | { type: "library" }
  /** Fusion d'un import appliquée (HANDOFF §8). */
  | { type: "replaceCharacter"; character: Character }
  | { type: "set"; path: Path; value: unknown }
  | { type: "add"; list: ListKey; item: unknown }
  | { type: "remove"; list: ListKey; index: number }
  | { type: "wounds"; value: number }
  | { type: "pip"; index: number }
  | { type: "theme"; theme: Theme }
  | { type: "view"; view: View }
  | { type: "toggleEdit" }
  | { type: "situation"; situation: AidSituation }
  | { type: "sub"; sub: CombatSub }
  | { type: "stance"; stance: Stance }
  | { type: "select"; id: string }
  | { type: "closeSheet" }
  | { type: "toggleWounds" }
  | { type: "option"; patch: Partial<RollOptions> }
  | { type: "maneuver"; id: string; count: number }
  | { type: "voidArmor" }
  | { type: "voidTechnique" }
  | { type: "newRound" }
  | { type: "statsOption"; patch: Partial<UiState["stats"]> }
  | { type: "toggleModifier"; id: string; on: boolean }
  | { type: "toggleArmorModifier"; id: string; on: boolean }
  | { type: "rolled"; result: RollResult; tn: number | null | "opposed"; raises: number; free?: number };

/** Copie immuable avec une valeur remplacée au chemin donné. */
export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path as [string | number, ...(string | number)[]];
  const src = obj as Record<string | number, unknown>;
  const copy = (Array.isArray(obj) ? [...obj] : { ...src }) as Record<string | number, unknown>;
  copy[head] = setIn(src[head], rest, value);
  return copy as T;
}

/** Actions de la situation courante de l'aide de jeu. */
export function currentActions(c: Character, ui: Pick<UiState, "situation" | "sub">): ActionDef[] {
  return ui.situation === "stats" ? [] : buildActions(c, ui.situation, ui.situation === "combat" ? ui.sub : undefined);
}

export function selectedAction(c: Character, ui: UiState): ActionDef | undefined {
  return currentActions(c, ui).find((a) => a.id === ui.selectedId);
}

/** Dépense un point de Vide ; une fiche en consultation ne dépense rien (HANDOFF §6.1). */
function spendVoid(state: AppState): AppState {
  const c = state.character;
  if (!c || c.voidPoints < 1 || state.mode === "readonly") return state;
  return { ...state, character: { ...c, voidPoints: c.voidPoints - 1 }, ui: { ...state.ui, voidSpentThisRound: true } };
}

/** Sélectionne une action et prépare le lanceur (ND, spécialisation, dégâts en attente). */
function select(c: Character, ui: UiState, a: ActionDef, open: boolean): UiState {
  const opts: RollOptions = {
    ...ui.opts,
    raises: 0, free: 0, flat: 0, extraRolled: 0,
    tn: typeof a.tn === "number" ? a.tn : ui.opts.tn,
    emphasis: a.kind === "skill" && emphasisMatches(c, a.skill ?? "", a.emphasisHint),
  };
  let pendingDamage = ui.pendingDamage;
  if (a.kind === "damage" && pendingDamage && pendingDamage.parent === a.parent) {
    opts.extraRolled = pendingDamage.dice;
    pendingDamage = null;
  }
  return { ...ui, selectedId: a.id, opts, maneuvers: {}, modifierToggles: {}, pendingDamage, sheetOpen: open || ui.sheetOpen };
}

/** Après un changement de situation : première action jouable sélectionnée, lanceur fermé. */
function selectFirst(c: Character | null, ui: UiState): UiState {
  const reset = { ...ui, selectedId: null, lastRoll: null, sheetOpen: false };
  if (!c) return reset;
  const first = currentActions(c, reset).find(isRollable);
  return first ? select(c, reset, first, false) : reset;
}

function uiReducer(state: AppState, action: AppAction): AppState {
  const { character: c, ui } = state;
  const withUi = (patch: Partial<UiState>): AppState => ({ ...state, ui: { ...ui, ...patch } });

  switch (action.type) {
    case "theme": return withUi({ theme: action.theme });
    case "view":
      return action.view === "aid"
        ? { ...state, ui: selectFirst(c, { ...ui, view: "aid", edit: false }) }
        : withUi({ view: "sheet", sheetOpen: false });
    case "situation": return { ...state, ui: selectFirst(c, { ...ui, situation: action.situation }) };
    case "sub": return { ...state, ui: selectFirst(c, { ...ui, sub: action.sub }) };
    case "stance":
      return withUi({ stance: action.stance, fullDefenseBonus: action.stance === "fullDefense" ? ui.fullDefenseBonus : 0 });
    case "closeSheet": return withUi({ sheetOpen: false });
    case "toggleWounds": return withUi({ woundsExpanded: !ui.woundsExpanded });
    case "option": return withUi({ opts: { ...ui.opts, ...action.patch } });
    case "maneuver": return withUi({ maneuvers: { ...ui.maneuvers, [action.id]: Math.max(0, action.count) } });
    case "statsOption": return withUi({ stats: { ...ui.stats, ...action.patch } });
    case "toggleModifier": return withUi({ modifierToggles: { ...ui.modifierToggles, [action.id]: action.on } });
    case "toggleArmorModifier": return withUi({ armorToggles: { ...ui.armorToggles, [action.id]: action.on } });
    case "newRound":
      return withUi({
        voidArmor: false, voidSpentThisRound: false, fullDefenseBonus: 0,
        stance: ui.stance === "fullDefense" ? "defense" : ui.stance,
      });
    default: return state;
  }
}

/** Actions qui modifient la fiche : refusées en consultation. */
const EDITING = new Set<AppAction["type"]>(["set", "add", "remove", "wounds", "pip", "toggleEdit", "replaceCharacter"]);

export function reducer(state: AppState, action: AppAction): AppState {
  const { character: c, ui } = state;

  if (action.type === "open") {
    return {
      screen: "character", entryId: action.id, mode: action.mode, character: action.character,
      ui: { ...initialUi, theme: ui.theme, edit: !!action.edit && action.mode === "edit" },
    };
  }
  if (action.type === "library") {
    return { ...initialState(), ui: { ...initialUi, theme: ui.theme } };
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
    case "toggleEdit": {
      // Passer en modification fait apparaître les manœuvres par défaut, pour pouvoir ajuster leurs coûts.
      const character = !ui.edit && c.maneuvers.length === 0 ? { ...c, maneuvers: DEFAULT_MANEUVERS.map((m) => ({ ...m })) } : c;
      return { ...state, character, ui: { ...ui, edit: !ui.edit } };
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
    case "rolled":
      return rolled(state, c, action);
    default:
      return uiReducer(state, action);
  }
}

/** Bilan d'un jet : dépense de Vide, initiative, Défense totale, dégâts en attente, historique. */
function rolled(state: AppState, c: Character, action: Extract<AppAction, { type: "rolled" }>): AppState {
  const a = selectedAction(c, state.ui);
  if (!a) return state;
  let next = state;
  const { opts } = state.ui;
  if (opts.voidPoint) next = spendVoid(next);
  // La dépense « compétence au rang 1 » ne vaut que pour une compétence non maîtrisée.
  if (opts.voidSkill && isUnskilled(c, a)) next = spendVoid(next);
  const ui = next.ui;
  const { total } = action.result;
  const success = typeof action.tn === "number" && total >= action.tn;
  const damageDice = a.attack && success ? (ui.maneuvers[DAMAGE_MANEUVER_ID] ?? 0) : 0;
  const maneuvers = a.attack
    ? Object.entries(ui.maneuvers).filter(([, n]) => n > 0).map(([id, n]) => {
        const m = effectiveManeuvers(c).find((x) => x.id === id);
        const name = m?.name ?? id;
        return m?.stackable ? `${name} ×${n}` : name;
      })
    : [];

  const record: RollRecord = {
    actionId: a.id, label: a.label, kind: a.kind, result: action.result, tn: action.tn,
    raises: action.raises, free: action.free ?? opts.free, maneuvers, damageDice, fullDefense: !!a.fullDefense,
  };
  return {
    ...next,
    ui: {
      ...ui,
      opts: { ...ui.opts, voidPoint: false, voidSkill: false },
      initiative: a.kind === "initiative" ? total : ui.initiative,
      ...(a.fullDefense ? { stance: "fullDefense" as const, fullDefenseBonus: Math.floor(total / 2) } : {}),
      pendingDamage: a.attack ? (damageDice ? { parent: a.id, dice: damageDice } : null) : ui.pendingDamage,
      lastRoll: record,
      history: [{ label: a.label, total, tn: action.tn }, ...ui.history].slice(0, HISTORY_SIZE),
    },
  };
}

/** État du fichier lié de la fiche ouverte (HANDOFF §5.2). */
export interface FileLinkState {
  /** none : pas de fichier lié ; permission : à reprendre par un clic ; conflict : modifié ailleurs. */
  state: "none" | "linked" | "permission" | "conflict" | "error";
  name: string | null;
  message?: string;
}

/** Opérations sur la bibliothèque locale, asynchrones (HANDOFF §5, §6.1). */
export interface LibraryApi {
  entries: LibraryEntry[];
  /** IndexedDB indisponible : rien ne survivra à la fermeture de l'onglet. */
  degraded: boolean;
  saveStatus: "idle" | "saved" | "error";
  create(): Promise<void>;
  open(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  showLibrary(): Promise<void>;
  /** Fiche en consultation → copie modifiable, ouverte aussitôt. */
  makeEditableCopy(): Promise<void>;
  /** Import « Nouvelle fiche » ou « Consultation » : nouvelle entrée, ouverte aussitôt. */
  importEntry(character: Character, mode: EntryMode): Promise<void>;
  /** Fichier lié : proposé seulement si le navigateur le permet (Chrome, Edge desktop). */
  file: FileLinkState & { supported: boolean };
  linkFile(): Promise<void>;
  /** Retire le lien sans toucher au fichier. */
  unlinkFile(): Promise<void>;
  /** Redemande la permission d'écriture (après un rechargement). */
  resumeFile(): Promise<void>;
  /** Conflit : « Charger la version du fichier ». */
  loadFileVersion(): Promise<void>;
  /** Conflit : « Écraser avec ma version ». */
  overwriteFile(): Promise<void>;
  /** Conflit : « Fusionner » (aperçu de fusion). */
  mergeFileVersion(): Promise<void>;
}

/** Import en cours : fichier choisi ou déposé, en attente d'une destination. */
export interface PendingImport {
  fileName: string;
  text: string;
  /** Fusion seulement (conflit avec le fichier lié). */
  mergeOnly?: boolean;
  /** Appelé après « Appliquer ». */
  onApplied?: () => void;
}

export interface Store {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  /** Tirage d'un d10 (1..10), injectable pour les tests. */
  rng: () => number;
  library: LibraryApi;
  /** Ouvre la fenêtre d'import pour un fichier choisi ou déposé. */
  startImport(file: File): void;
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore hors de StoreContext");
  return store;
}

/** La fiche ouverte (les composants qui l'utilisent ne sont rendus que s'il y en a une). */
export function useCharacter(): Character {
  const { state } = useStore();
  if (!state.character) throw new Error("Aucune fiche ouverte");
  return state.character;
}
