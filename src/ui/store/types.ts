import type { ActionDef, ArmyStatus, Character, CombatSub, CoreText, Engagement, Maneuver, RollResult, Situation, SpellSlotKey, Stance } from "@carnet/core";
import type { Terrain } from "../../rules/l5r4e";
import type { RollOptions } from "../rolls";

export type Theme = "auto" | "light" | "dark";
export type View = "sheet" | "aid" | "stats";
export type AidSituation = Situation;
export type ListKey = "skills" | "weapons" | "techniques" | "maneuvers" | "modifiers" | "spells";
/** Blocs modifiables de la fiche (annexe E.9 S2). */
export type BlockId = "rings" | "identity" | "skills" | "weapons" | "armor" | "techniques" | "magic" | "modifiers" | "notes";

/** Panneaux de l'Assistant L5R dotés d'un bouton « i » (HANDOFF §6.2). */
export type InfoPanel = "move" | "reminders" | "battle";
/** Option du panneau « Dépenser du Vide » (annexe J.6) ; Initiative et Échanger en escarmouche seulement. */
export type VoidChoice = "roll" | "armor" | "skill" | "ability" | "initiative" | "swap";

export type Path = readonly (string | number)[];

export interface RollRecord {
  actionId: string;
  label: CoreText;
  kind: ActionDef["kind"];
  result: RollResult;
  tn: number | null | "opposed";
  raises: number;
  free: number;
  /** Manœuvres annoncées, nommées à l'affichage (annexe 53.1). */
  maneuvers: { maneuver: Maneuver; count: number }[];
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
  /** Préférence : explications des actions masquées dans l'Assistant, sauf celle de l'action choisie (annexe 46.2). */
  compactActions: boolean;
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
  /** Option choisie dans le panneau Vide (non mémorisée) : la choisir ne dépense rien. */
  voidChoice: VoidChoice;
  /** Un point de Vide a déjà été dépensé ce round (avertissement). */
  voidSpentThisRound: boolean;
  initiative: number | null;
  selectedId: string | null;
  opts: RollOptions;
  maneuvers: Record<string, number>;
  /** Dégâts liés à l'attaque réussie : dés d'augmentation, ou Désarmement (2g1 sans la Force). */
  pendingDamage: { parent: string; dice: number; disarm?: boolean; flat?: number } | null;
  lastRoll: RollRecord | null;
  /** Dernier sort lancé (v2.12.0) : emplacements pris, pour « Annuler (interrompu) » ; `success` null : jet sans ND. */
  spellCast: { actionId: string; slots: SpellSlotKey[]; success: boolean | null } | null;
  history: { label: CoreText; total: number; tn: number | null | "opposed" }[];
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
  | { type: "compactActions"; value: boolean }
  /** Nouvelle journée (annexe E.6) : Vide plein, blessures soignées, initiative et compteurs à zéro. */
  | { type: "newDay" }
  /** Méditation réussie : points de Vide rendus. */
  | { type: "meditate" }
  /** Sort lancé aux vrais dés (v2.12.0) : Réussi ou Raté, l'emplacement est dépensé. */
  | { type: "castSpell"; success: boolean }
  /** Sort réussi puis interrompu : emplacements rendus. */
  | { type: "cancelCast" }
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
  | { type: "voidChoice"; choice: VoidChoice }
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
