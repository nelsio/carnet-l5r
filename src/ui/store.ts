/**
 * État de l'application : la fiche ouverte et l'état de la session de jeu (HANDOFF §3.3).
 * Un seul reducer pur ; le hasard est tiré avant le dispatch (action `rolled`).
 */
import { createContext, useContext, type Dispatch } from "react";
import {
  activeEffects, buildActions, DAMAGE_MANEUVER_ID, DISARM_MANEUVER_ID, emphasisMatches, matchingEmphasis, meditate, newDay, voidSpendOption,
  feintBonus, focusOutcome, fullAttackAllowed, fullDefenseBonus, updateVocabulary, woundsFromDamage, type ActionDef, type ArmyStatus, type Character, type CombatSub,
  type Engagement, type RollResult, type Situation, type Stance,
} from "@carnet/core";
import { FEINT_MANEUVER_ID, WOUND_MULTIPLIERS, WOUND_NEXT_MULTIPLIER, type Terrain } from "../rules/l5r4e";
import type { LibraryEntry } from "../storage";
import { DEFAULT_ROLL_OPTIONS, effectiveManeuvers, isRollable, isUnskilled, SPELL_ROLL_RESET, toPoolAction, type RollOptions } from "./rolls";

export type Theme = "auto" | "light" | "dark";
export type View = "sheet" | "aid" | "stats";
export type AidSituation = Situation;
export type ListKey = "skills" | "weapons" | "techniques" | "maneuvers" | "modifiers" | "spells";
/** Blocs modifiables de la fiche (annexe E.9 S2). */
export type BlockId = "rings" | "identity" | "skills" | "weapons" | "armor" | "techniques" | "magic" | "modifiers" | "notes";
/** Bloc ouvert à la création d'une fiche : le nom en premier. */
export const NEW_CHARACTER_BLOCK: BlockId = "identity";
/** Panneaux de l'aide de jeu dotés d'un bouton « i » (HANDOFF §6.2). */
export type InfoPanel = "stance" | "void" | "move" | "reminders" | "battle";
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
  /** Désarmement réussi : les dégâts liés passent à 2g1 sans la Force. */
  disarm?: boolean;
  /** Dés de dégâts gagnés par « Augmentation des dégâts ». */
  damageDice: number;
  fullDefense: boolean;
  /** ND sans les augmentations annoncées (Akodo R5). */
  baseTn?: number;
  /** Échec rattrapé : ND de base atteint, réussite sans les augmentations (Akodo R5). */
  baseSuccess?: boolean;
  /** Bonus de Feinte pré-rempli sur les dégâts liés (E.3 F4). */
  feint?: number;
  /** Total adverse saisi (jet en opposition, F7). */
  opponent?: number;
}

export interface UiState {
  theme: Theme;
  /** Préférence : bouton « Lancer » et résultats affichés. */
  showDiceRoller: boolean;
  /** Préférence : niveaux de blessure après Indemne à Terre × 2 (défaut) à × 5 (annexe E.6). */
  woundMultiplier: number;
  /** Détails dépliés par le « i » de chaque panneau (non persisté). */
  info: Partial<Record<InfoPanel, boolean>>;
  /** Éditeur d'armure ouvert sous les tuiles de la barre d'état. */
  armorEdit: boolean;
  view: View;
  /** Blocs de la fiche ouverts en modification, chacun par son bouton « Edit » (annexe E.9 S2). */
  editing: ReadonlySet<BlockId>;
  /** Terrain de l'encart « Se déplacer en combat » (annexe E.2 C4). */
  terrain: Terrain;
  /** Bonus de Centre déjà pris ce round (un seul jet, E.3 F1). */
  centerBonusUsed: boolean;
  /** « Je garde un allié » (F5) : gardé jusqu'à ton tour suivant, « Nouveau round » ne le décoche pas. */
  guard: boolean;
  /** Points de Vide dépensés pour +10 à l'Initiative de l'escarmouche (F3). */
  voidInitiative: number;
  /** Duel : Évaluation gagnée de 10 ou plus (F10). */
  assessmentWon: boolean;
  /** Duel : écart de Concentration saisi (F10). */
  focusGap: number | null;
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
  /** Dégâts liés à l'attaque réussie : dés d'augmentation, ou Désarmement (2g1 sans la Force). */
  pendingDamage: { parent: string; dice: number; disarm?: boolean; flat?: number } | null;
  lastRoll: RollRecord | null;
  history: { label: string; total: number; tn: number | null | "opposed" }[];
  sheetOpen: boolean;
  woundsExpanded: boolean;
  /** Bonus de jet cochés ou décochés pour le jet en cours (remis à zéro au choix d'une action). */
  modifierToggles: Record<string, boolean>;
  /** Bonus de ND d'armure cochés ou décochés pour le combat en cours. */
  armorToggles: Record<string, boolean>;
  stats: { voidPoint: boolean; emphasis: boolean; penalty: boolean };
  /** Techniques d'école (annexe C.5) : combat monté. */
  mounted: boolean;
  /** Posture Centre au round précédent (mémorisée par « Nouveau round »). */
  centerLastRound: boolean;
  /** Techniques à cocher du lanceur, par clé d'effet (remises à zéro au choix d'une action). */
  techToggles: Record<string, boolean>;
  /** Valeurs saisies pour les techniques à champ. */
  techInputs: Record<string, number>;
  /** Cases de ND d'armure des techniques (décochées à chaque nouveau round). */
  schoolArmor: Record<string, boolean>;
  /** Compteurs des techniques cumulables (gardés jusqu'à la remise à zéro). */
  stacks: Record<string, number>;
  /**
   * Vocabulaire de l'édition française (annexe E.7) : bandeau masqué (« Plus tard »), et fiches d'avant et d'après
   * le renommage, qui reste annulable tant que la fiche n'a pas changé depuis.
   */
  vocabulary: { hidden: boolean; undo: { before: Character; after: Character } | null };
  /** Bataille de masse (annexe E.8). */
  battle: BattleState;
}

/** Bataille de masse (annexe E.8) : un tour de bataille, effacé par « Nouveau round » sauf l'engagement et le commandement. */
export interface BattleState {
  /** Tu commandes : l'état de l'armée vient de l'écart de Commandement ; sinon, il se choisit. */
  commanding: boolean;
  /** Écart de Commandement (ton total − adverse), négatif si tu perds. */
  gap: number | null;
  status: ArmyStatus;
  engagement: Engagement;
  /** Avantage Tacticien : +5, −5, ou 0 sans l'avantage. */
  tactician: number;
  /** d10 tiré par l'outil (lanceur affiché). */
  die: number | null;
  /** Total du jet de bataille, 1d10 + Eau + Bataille, sans le Tacticien. */
  total: number | null;
  /** Dés de blessures tirés par l'outil. */
  woundDice: number[] | null;
  /** Blessures du tour déjà encaissées. */
  woundsTaken: boolean;
}

export const initialBattle: BattleState = {
  commanding: false, gap: null, status: "stalemate", engagement: "engaged", tactician: 0, die: null, total: null, woundDice: null, woundsTaken: false,
};

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
  showDiceRoller: false,
  woundMultiplier: WOUND_NEXT_MULTIPLIER,
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
  mounted: false,
  centerLastRound: false,
  techToggles: {},
  techInputs: {},
  schoolArmor: {},
  stacks: {},
  vocabulary: { hidden: false, undo: null },
  battle: initialBattle,
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
  | { type: "diceRoller"; show: boolean }
  | { type: "woundMultiplier"; value: number }
  /** Nouvelle journée (annexe E.6) : Vide plein, blessures soignées, initiative et compteurs à zéro. */
  | { type: "newDay" }
  /** Méditation réussie : points de Vide rendus. */
  | { type: "meditate" }
  | { type: "toggleInfo"; panel: InfoPanel }
  | { type: "toggleArmorEdit" }
  | { type: "view"; view: View }
  | { type: "toggleBlockEdit"; block: BlockId }
  | { type: "terrain"; terrain: Terrain }
  | { type: "guard"; on: boolean }
  | { type: "voidInitiative" }
  | { type: "takeDamage"; damage: number; voidSpent: boolean }
  | { type: "assessmentWon"; on: boolean }
  | { type: "focusGap"; gap: number | null }
  /** Bataille de masse (annexe E.8) : les dés sont tirés avant le dispatch. */
  | { type: "battle"; patch: Partial<BattleState> }
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
  | { type: "mounted"; on: boolean }
  | { type: "toggleTechnique"; key: string; on: boolean }
  | { type: "techniqueInput"; key: string; value: number }
  | { type: "toggleSchoolArmor"; key: string; on: boolean }
  | { type: "stack"; key: string; count: number }
  | { type: "resetStacks" }
  /** Vocabulaire (annexe E.7) : renommer, annuler le renommage, masquer le bandeau. */
  | { type: "vocabulary"; op: "update" | "undo" | "hide" }
  | { type: "rolled"; result: RollResult; tn: number | null | "opposed"; raises: number; free?: number; baseTn?: number; baseSuccess?: boolean };

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
  return buildActions(c, ui.situation, ui.situation === "combat" ? ui.sub : undefined);
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
    pendingDamage, sheetOpen: open || ui.sheetOpen,
  };
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
    case "diceRoller": return withUi({ showDiceRoller: action.show });
    case "woundMultiplier":
      return (WOUND_MULTIPLIERS as readonly number[]).includes(action.value) ? withUi({ woundMultiplier: action.value }) : state;
    case "toggleInfo": return withUi({ info: { ...ui.info, [action.panel]: !ui.info[action.panel] } });
    case "toggleArmorEdit": return withUi({ armorEdit: state.mode === "edit" && !ui.armorEdit });
    case "view":
      return action.view === "aid"
        ? { ...state, ui: selectFirst(c, { ...ui, view: "aid", editing: new Set() }) }
        : withUi({ view: action.view, sheetOpen: false });
    case "situation": return { ...state, ui: selectFirst(c, { ...ui, situation: action.situation }) };
    case "sub": return { ...state, ui: selectFirst(c, { ...ui, sub: action.sub }) };
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
      });
    default: return state;
  }
}

/** État d'interface conservé d'une fiche à l'autre : préférences et détails dépliés. */
const kept = (ui: UiState): Pick<UiState, "theme" | "showDiceRoller" | "woundMultiplier" | "info"> =>
  ({ theme: ui.theme, showDiceRoller: ui.showDiceRoller, woundMultiplier: ui.woundMultiplier, info: ui.info });

/** Actions qui modifient la fiche : refusées en consultation. */
const EDITING = new Set<AppAction["type"]>(["set", "add", "remove", "wounds", "pip", "toggleBlockEdit", "replaceCharacter", "newDay", "meditate", "vocabulary"]);

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

/** Bilan d'un jet : dépense de Vide, initiative, Défense totale, dégâts en attente, historique. */
function rolled(state: AppState, c: Character, action: Extract<AppAction, { type: "rolled" }>): AppState {
  const a = selectedAction(c, state.ui);
  if (!a) return state;
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
  const ui = next.ui;
  const { total } = action.result;
  const success = typeof action.tn === "number" && total >= action.tn;
  const damageDice = a.attack && success ? (ui.maneuvers[DAMAGE_MANEUVER_ID] ?? 0) : 0;
  const disarm = a.attack && success && (ui.maneuvers[DISARM_MANEUVER_ID] ?? 0) > 0;
  const feint = a.attack && success && typeof action.tn === "number" && (ui.maneuvers[FEINT_MANEUVER_ID] ?? 0) > 0
    ? feintBonus(c, total, action.tn) : 0;
  const maneuvers = a.attack
    ? Object.entries(ui.maneuvers).filter(([, n]) => n > 0).map(([id, n]) => {
        const m = effectiveManeuvers(c).find((x) => x.id === id);
        const name = m?.name ?? id;
        return m?.stackable ? `${name} ×${n}` : name;
      })
    : [];

  const record: RollRecord = {
    actionId: a.id, label: a.label, kind: a.kind, result: action.result, tn: action.tn,
    raises: action.raises, free: action.free ?? opts.free, maneuvers, damageDice, fullDefense: !!a.fullDefense, disarm,
    baseTn: action.baseTn, baseSuccess: action.baseSuccess,
    ...(feint ? { feint } : {}),
    ...(opts.opponentTotal !== null && action.tn === "opposed" ? { opponent: opts.opponentTotal } : {}),
  };
  return {
    ...next,
    ui: {
      ...ui,
      opts: { ...ui.opts, voidPoint: false, voidSkill: false, voidSpend: false, centerBonus: false, spellRing: null },
      initiative: a.kind === "initiative" ? total : ui.initiative,
      // Une nouvelle Initiative ouvre une nouvelle escarmouche : le Vide d'Initiative retombe.
      voidInitiative: a.kind === "initiative" ? 0 : ui.voidInitiative,
      centerBonusUsed: ui.centerBonusUsed || opts.centerBonus,
      ...(a.fullDefense ? { stance: "fullDefense" as const, fullDefenseBonus: fullDefenseBonus(total) } : {}),
      pendingDamage: a.attack
        ? (disarm ? { parent: a.id, dice: 0, disarm }
          : damageDice || feint ? { parent: a.id, dice: damageDice, ...(feint ? { flat: feint } : {}) } : null)
        : ui.pendingDamage,
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
