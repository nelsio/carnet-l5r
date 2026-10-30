/**
 * Données de règles de L5R 4e édition (HANDOFF §4.7).
 * Corriger une règle = modifier une donnée ici, pas le moteur.
 * Points à vérifier dans le livre : voir HANDOFF §12 (P2, P5).
 */
import type { Maneuver, RollTrait, Spell, SpellElement, TraitKey } from "../core/schema";
import type { WeaponLike } from "../core/engine";
import battleTable from "./table-bataille.json";

export type RingKey = "earth" | "water" | "fire" | "air" | "void";
export type Stance = "attack" | "fullAttack" | "defense" | "fullDefense" | "center";

export const TRAIT_LABELS: Record<RollTrait, string> = {
  stamina: "Constitution",
  willpower: "Volonté",
  strength: "Force",
  perception: "Perception",
  agility: "Agilité",
  intelligence: "Intelligence",
  reflexes: "Réflexes",
  awareness: "Vigilance",
  void: "Vide",
};

/** Anneaux : chaque Anneau vaut le minimum de ses deux Traits ; le Vide est à part. */
export const RINGS: Record<Exclude<RingKey, "void">, { label: string; traits: [TraitKey, TraitKey] }> & {
  void: { label: string };
} = {
  earth: { label: "Terre", traits: ["stamina", "willpower"] },
  water: { label: "Eau", traits: ["strength", "perception"] },
  fire: { label: "Feu", traits: ["agility", "intelligence"] },
  air: { label: "Air", traits: ["reflexes", "awareness"] },
  void: { label: "Vide" },
};

/** Échelle des ND. */
export const TN_SCALE = [
  { tn: 5, label: "Trivial" },
  { tn: 10, label: "Facile" },
  { tn: 15, label: "Moyen" },
  { tn: 20, label: "Difficile" },
  { tn: 25, label: "Très difficile" },
  { tn: 30, label: "Ardu" },
  { tn: 40, label: "Héroïque" },
  { tn: 50, label: "Légendaire" },
] as const;

/** Augmentation du ND par augmentation annoncée. */
export const TN_PER_RAISE = 5;

/**
 * Points d'Insight (livre de base 4e, annexe K) :
 * Anneaux × 10 + rangs de compétence ; Rang 1 sous 150, puis un rang tous les 25 points, au plus 10.
 */
export const INSIGHT = { ringMultiplier: 10, firstThreshold: 150, step: 25, maxRank: 10 } as const;

/**
 * Niveaux de blessure : pénalité au ND, `null` = aucune action possible.
 * `short` : libellé abrégé pour la piste de la barre d'état.
 */
export const WOUND_LEVELS: readonly { label: string; short?: string; penalty: number | null }[] = [
  { label: "Indemne", penalty: 0 },
  { label: "Égratigné", penalty: 3 },
  { label: "Éraflé", penalty: 5 },
  { label: "Blessé", penalty: 10 },
  { label: "Gravement blessé", short: "Grav. blessé", penalty: 15 },
  { label: "Estropié", penalty: 20 },
  { label: "À terre", penalty: 40 },
  { label: "Hors de combat", penalty: null },
];
export const DEAD_LABEL = "Mort";
/** Seuils cumulés : Indemne jusqu'à Terre × 5, puis Terre × 2 de plus par niveau. */
export const WOUND_FIRST_MULTIPLIER = 5;
export const WOUND_NEXT_MULTIPLIER = 2;
/** Multiplicateur des niveaux après Indemne, réglage de préférence (p. 86, E-d) : × 2 par défaut, × 3 à × 5 en option. */
export const WOUND_MULTIPLIERS = [2, 3, 4, 5] as const;
/** Bouton du multiplicateur masqué pour le moment (annexe E.19 S6) : l'interface joue à × 2, la préférence reste. */
export const SHOW_WOUND_MULTIPLIER = false;
/** Multiplicateur utilisé par l'interface : la préférence si le bouton est affiché, sinon × 2. */
export function shownWoundMultiplier(n: number): number {
  return SHOW_WOUND_MULTIPLIER ? n : WOUND_NEXT_MULTIPLIER;
}
/** Nouvelle journée (p. 80, 86) : blessures soignées = 2 × Constitution + Rang d'Insight ; Vide plein. */
export const DAILY_HEALING = { perStamina: 2, perInsight: 1 } as const;

/** ND d'armure : 5 × Réflexes + 5 + bonus d'armure, puis posture et Vide. */
export const ARMOR_TN = {
  perReflexes: 5,
  base: 5,
  fullAttackModifier: -10,
  voidArmorBonus: 10,
  defenseSkill: "Défense",
} as const;

/** Étiquette d'effet d'une posture (sélecteur Posture, annexe I.3.4) : `up` pour un bonus. */
export interface StanceTag { label: string; up?: boolean }

export const STANCES: readonly { id: Stance; label: string; description: string; tags: readonly StanceTag[] }[] = [
  { id: "attack", label: "Attaque", description: "Posture normale.", tags: [{ label: "aucun modificateur" }] },
  {
    id: "fullAttack", label: "Assaut", description: "+2g1 à l'attaque, −10 au ND d'armure.",
    tags: [{ label: "+2g1 attaque", up: true }, { label: "ND armure −10" }],
  },
  { id: "defense", label: "Défense", description: "Ajoute Air + Défense au ND d'armure.", tags: [{ label: "ND armure +Défense +Air", up: true }] },
  {
    id: "fullDefense", label: "Défense totale", description: "Jet Défense (Réflexes), + moitié (arrondie au supérieur) au ND d'armure.",
    tags: [{ label: "ND armure +jet", up: true }, { label: "pas d'attaque" }],
  },
  {
    id: "center", label: "Centre", description: "Aucune action ; bonus au round suivant (voir livre).",
    tags: [{ label: "bonus au round suivant", up: true }, { label: "aucune action" }],
  },
];

/** Modificateurs de réserve. */
export const POOL_BONUS = {
  fullAttack: { rolled: 2, kept: 1 },
  voidPoint: { rolled: 1, kept: 1 },
} as const;

/*
 * Les maîtrises de compétence (explosion sur 9, force de l'arc, dés de dégâts…) vivent dans le catalogue
 * `maitrises.json` (annexe E.4).
 */

/**
 * Catalogue d'armures (annexe E.5). `bonusMounted` : bonus au ND à cheval ; `heavy` : malus d'armure lourde
 * (+5 au ND des jets d'Agilité et de Réflexes), toujours ou seulement à pied ; `tnSkills` : +5 au ND de ces compétences.
 */
export interface CatalogArmor {
  id: string; name: string; bonus: number; reduction: number;
  bonusMounted?: number; heavy?: "always" | "onFoot"; tnSkills?: string[];
  /** Effet en une ligne, affiché sous l'éditeur d'armure. */
  summary?: string;
}
export const ARMOR_CATALOG: readonly CatalogArmor[] = [
  { id: "none", name: "Aucune", bonus: 0, reduction: 0 },
  { id: "ashigaru", name: "Armure d'ashigaru", bonus: 3, reduction: 1 },
  {
    id: "light", name: "Armure légère", bonus: 5, reduction: 3, tnSkills: ["Athlétisme", "Discrétion"],
    summary: "+5 au ND des jets d'Athlétisme et de Discrétion.",
  },
  {
    id: "heavy", name: "Armure lourde", bonus: 10, reduction: 5, heavy: "always",
    summary: "+5 au ND des jets d'Agilité et de Réflexes.",
  },
  {
    id: "riding", name: "Armure de cavalerie", bonus: 4, bonusMounted: 12, reduction: 4, heavy: "onFoot",
    summary: "+12 au ND d'armure à cheval ; compte comme lourde : à pied, +5 au ND des jets d'Agilité et de Réflexes.",
  },
];
/** Malus des armures au ND des jets concernés, et traits touchés par l'armure lourde. */
export const ARMOR_ROLL_TN = 5;
export const HEAVY_ARMOR_TRAITS: readonly RollTrait[] = ["agility", "reflexes"];

/** Bonus de Défense totale : moitié du jet, arrondie au supérieur (p. 86). */
export const FULL_DEFENSE_DIVISOR = 2;

/** Déplacement en pieds, en multiples de l'Anneau d'Eau. */
export const MOVEMENT = { free: 5, simple: 10, max: 20 } as const;
export const FEET_TO_METERS = 0.3048;

/** Terrain (p. 87) : l'Anneau d'Eau compte un ou deux rangs de moins pour les distances, 1 au minimum. */
export type Terrain = "normal" | "moderate" | "difficult";
export const TERRAINS: readonly { id: Terrain; label: string; waterMalus: number }[] = [
  { id: "normal", label: "Normal", waterMalus: 0 },
  { id: "moderate", label: "Modéré", waterMalus: 1 },
  { id: "difficult", label: "Difficile", waterMalus: 2 },
];

/** Coup ciblé (p. 88) : coût selon la zone visée. */
export type CalledZone = "limb" | "extremity" | "head" | "precise";
export const CALLED_ZONES: readonly { id: CalledZone; label: string; cost: number }[] = [
  { id: "limb", label: "Membre", cost: 1 },
  { id: "extremity", label: "Main ou pied", cost: 2 },
  { id: "head", label: "Tête", cost: 3 },
  { id: "precise", label: "Œil ou doigt", cost: 4 },
];
/** Renversement d'un quadrupède (p. 89). */
export const KNOCKDOWN_QUADRUPED_COST = 4;
/** Dégâts après un Désarmement réussi (p. 88) : sans la Force ni augmentation de dégâts. */
export const DISARM_DAMAGE = "2g1";
/** Malus au ND des arcs selon la monture (p. 202). */
export const BOW_TN_PENALTY = 10;

/* ---------- Combat complet (annexe E.3, v2.3.0) ---------- */

/** Round après le Centre (p. 86) : +1g1 et + Anneau de Vide au total d'un jet, +10 à l'Initiative du round. */
export const CENTER_BONUS = { rolled: 1, kept: 1, initiative: 10 } as const;
/** Assaut monté : interdit sauf Équitation à ce rang (p. 142). */
export const MOUNTED_ASSAULT_RIDING = { skill: "Équitation", rank: 3 } as const;
/** Vide en combat (p. 80) : +10 à l'Initiative de l'escarmouche, −10 blessures à l'encaissement. */
export const VOID_COMBAT = { initiative: 10, wounds: 10 } as const;
/** Feinte réussie (p. 88) : dégâts + moitié (arrondie à l'inférieur) de l'excédent, plafonnés à 5 × Rang d'Insight. */
export const FEINT = { divisor: 2, capPerInsight: 5 } as const;
export const FEINT_MANEUVER_ID = "feint";
/** Garde (p. 88-89) : ton ND d'armure −5, celui de l'allié gardé +10. */
export const GUARD = { selfPenalty: 5, allyBonus: 10 } as const;
/** Concentration en duel (p. 89) : 5 d'écart pour frapper en premier, puis 1 augmentation gratuite par tranche de 5. */
export const DUEL_FOCUS = { threshold: 5, per: 5 } as const;
/** Évaluation gagnée de 10 ou plus : +1g1 à la Concentration (+2g2 avec Iaijutsu 7, E.4). */
export const DUEL_ASSESSMENT_WIN = { margin: 10, rolled: 1, kept: 1, masterySkill: "Iaijutsu", masteryRank: 7, masteryRolled: 2, masteryKept: 2 } as const;
/** Méditation réussie (p. 139) : points de Vide rendus sans maîtrise (2 et 3 avec Méditation 3 et 7, E.4). */
export const MEDITATION_VOID_POINTS = 1;
/** Action « Méditer » de l'Enquête (E.6) : bouton « Réussi » au lanceur. */
export const MEDITATE_ACTION_ID = "meditate";
/** Tir sur une cible engagée au corps à corps (p. 84) : −10 au total. */
export const MELEE_TARGET_PENALTY = 10;
/** Niveaux de blessure à rappel (p. 84) : Estropié, À terre. */
export const WOUND_EFFECT_NOTES: Readonly<Record<string, string>> = {
  "Estropié": "Estropié : chaque déplacement coûte un cran de plus (action libre → simple, simple → complexe).",
  "À terre": "À terre : actions gratuites seulement, en dépensant 1 point de Vide pour chacune.",
};

/* ---------- Bataille de masse (annexe E.8, v2.7.0) ---------- */

export type Engagement = "reserves" | "disengaged" | "engaged" | "heavilyEngaged";
export type ArmyStatus = "winning" | "stalemate" | "losing";
export type BattleEvent = "duel" | "heroic";
/** Case de la table : dés de blessures, Gloire gagnée, événement éventuel. */
export interface BattleCell { wounds: number; glory: number; event: BattleEvent | null }

export const ENGAGEMENTS: readonly { id: Engagement; label: string }[] = [
  { id: "reserves", label: "Réserve" },
  { id: "disengaged", label: "Désengagé" },
  { id: "engaged", label: "Engagé" },
  { id: "heavilyEngaged", label: "Fortement engagé" },
];
export const ARMY_STATUSES: readonly { id: ArmyStatus; label: string; verdict: string }[] = [
  { id: "winning", label: "Gagne", verdict: "Ton armée gagne" },
  { id: "stalemate", label: "Égalité", verdict: "Égalité" },
  { id: "losing", label: "Perd", verdict: "Ton armée perd" },
];
/** Commandement (p. 238) : Bataille/Perception en opposition, 5 d'écart pour que ton armée l'emporte. */
export const BATTLE_COMMAND = { skill: "Bataille", margin: 5 } as const;
/** Jet de bataille (p. 240) : 1d10 sans explosion (E-g) + Anneau d'Eau + Bataille ; avantage Tacticien ±5. */
export const BATTLE_ROLL = { skill: "Bataille", tactician: 5 } as const;
/** Colonne de la table : indice d'engagement + décalage de l'état de l'armée (`table-bataille.json`). */
export const BATTLE_COLUMNS = {
  engagement: battleTable.engagement as readonly Engagement[],
  statusOffset: battleTable.statusOffset as Readonly<Record<ArmyStatus, number>>,
};
export const BATTLE_EVENT_LABELS = battleTable.events as Readonly<Record<BattleEvent, string>>;
/** Table de bataille de masse (p. 242 du PDF), lignes par total croissant ; au-delà de 30, la dernière ligne. */
export const BATTLE_TABLE: readonly { min: number; max: number; cells: readonly BattleCell[] }[] = battleTable.rows.map((r) => ({
  min: r.min, max: r.max,
  cells: r.cells.map(([wounds, glory, event]) => ({ wounds: Number(wounds), glory: Number(glory), event: (event ?? null) as BattleEvent | null })),
}));

/** Manœuvres par défaut (coût en augmentations). */
export const DEFAULT_MANEUVERS: readonly Maneuver[] = [
  { id: "dmg", name: "Augmentation des dégâts", cost: 1, stackable: true, effect: "+1g0 aux dégâts par augmentation (cumulable)." },
  { id: "called", name: "Coup ciblé", cost: 1, stackable: false, effect: "Viser une zone : membre 1, main ou pied 2, tête 3, œil ou doigt 4 augmentations (zone à choisir)." },
  { id: "feint", name: "Feinte", cost: 2, stackable: false, effect: "Dégâts + moitié de l'excédent sur le ND, plafonnés à 5 × Rang d'Insight." },
  { id: "knockdown", name: "Renversement", cost: 2, stackable: false, effect: "Jet de Force en opposition : la cible tombe à terre si tu l'emportes. Quadrupède : 4 augmentations." },
  { id: "disarm", name: "Désarmement", cost: 3, stackable: false, effect: "Dégâts 2g1 sans la Force. Jet de Force en opposition : la cible lâche son arme si tu l'emportes." },
  { id: "extra", name: "Attaque supplémentaire", cost: 5, stackable: false, effect: "Une attaque de plus ce round." },
];
/** Manœuvre dont chaque prise ajoute +1g0 au jet de dégâts suivant. */
export const DAMAGE_MANEUVER_ID = "dmg";
/** Désarmement : les dégâts liés passent à 2g1 sans la Force (annexe E.2 C6). */
export const DISARM_MANEUVER_ID = "disarm";

/** Fiche vierge (bouton « Nouvelle fiche »). */
export const NEW_CHARACTER_NAME = "Nouveau samouraï";
export const STARTING_XP = 40;
export const STARTING_TRAIT = 2;

/** Mots qui désignent une arme à distance (dans le nom ou la compétence). */
export const RANGED_PATTERN = /kyujutsu|arc|yumi/i;
/** Armes utilisables pour la Frappe d'un duel iaijutsu. */
export const DUEL_WEAPON_PATTERN = /katana|wakizashi|ken|sabre/i;
/** Évaluation en duel : 10 + 5 × Rang adverse. */
export const DUEL_ASSESSMENT = { base: 10, perRank: 5 } as const;

/** Clans : clés normalisées (sans accents ni casse) et couleurs d'accent ; `ink*` : même teinte pour le texte (annexe I.1.4). */
export interface ClanInfo { id: string; label: string; light: string; inkLight: string; dark: string; inkDark: string }
export const CLANS: readonly ClanInfo[] = [
  { id: "crabe", label: "Clan du Crabe", light: "#3d5a73", inkLight: "#374754", dark: "#8fb0cc", inkDark: "#a1bbd0" },
  { id: "grue", label: "Clan de la Grue", light: "#2f7fb5", inkLight: "#345f7d", dark: "#8cc4ea", inkDark: "#9fcbe8" },
  { id: "dragon", label: "Clan du Dragon", light: "#2f7a45", inkLight: "#335b37", dark: "#7fcb93", inkDark: "#96d1a2" },
  { id: "licorne", label: "Clan de la Licorne", light: "#6b3fa0", inkLight: "#533971", dark: "#bb9ae6", inkDark: "#c4a9e6" },
  { id: "lion", label: "Clan du Lion", light: "#a87b0c", inkLight: "#795c20", dark: "#e6bf55", inkDark: "#e6c776" },
  { id: "mante", label: "Clan de la Mante", light: "#1f8073", inkLight: "#2e5f54", dark: "#6fd0c1", inkDark: "#8bd5c7" },
  { id: "phenix", label: "Clan du Phénix", light: "#c25a14", inkLight: "#8a4921", dark: "#f0a066", inkDark: "#f0ae80" },
  { id: "scorpion", label: "Clan du Scorpion", light: "#a82828", inkLight: "#7b2d26", dark: "#f07a7a", inkDark: "#f1918e" },
  { id: "araignee", label: "Clan de l'Araignée", light: "#4a4a4a", inkLight: "#3e3d3a", dark: "#b5b5b5", inkDark: "#bfbebd" },
  { id: "imperial", label: "Familles impériales", light: "#8a6d12", inkLight: "#66531f", dark: "#dcc06a", inkDark: "#dec884" },
];
export const UNKNOWN_CLAN = { light: "#7a6a3a", inkLight: "#5c5131", dark: "#cdb67a", inkDark: "#d2bf8f" } as const;
/** Noms anglais et variantes, vers l'identifiant du clan. */
export const CLAN_ALIASES: Readonly<Record<string, string>> = {
  crab: "crabe",
  crane: "grue",
  unicorn: "licorne",
  mantis: "mante",
  phoenix: "phenix",
  spider: "araignee",
  imperiale: "imperial",
  empire: "imperial",
};

/* ---------- Catalogue d'actions ---------- */

export type Situation = "investigation" | "court" | "movement" | "combat" | "magic";
export type CombatSub = "skirmish" | "duel" | "battle";
export type ActionTN = number | "target" | "opposed" | "assessment" | null;
export type ActionKind = "skill" | "trait" | "damage" | "initiative" | "move" | "info" | "spell" | "spellDamage";

/** Forme d'une action de l'aide de jeu (HANDOFF §4.7). */
export interface ActionDef {
  id: string;
  situation: Situation;
  sub?: CombatSub;
  parent?: string;
  label: string;
  kind: ActionKind;
  skill?: string;
  trait?: RollTrait;
  emphasisHint?: string;
  tn: ActionTN;
  attack?: boolean;
  /** Attaque ou dégâts à mains nues (techniques d'école, annexe C). */
  unarmed?: boolean;
  fullDefense?: boolean;
  /** Valeur de dégâts, pour les actions `damage`. */
  dr?: string;
  /** Arme utilisée, pour les attaques et dégâts générés depuis la fiche. */
  weapon?: WeaponLike;
  /** Sort du Rouleaux & invocations, pour les actions `spell` et `spellDamage` (annexe F.5). */
  spell?: Spell;
  /** Groupe de la situation, titré dans la liste d'actions (« Repos »). */
  group?: string;
  description: string;
}

export const SITUATIONS: readonly { id: Situation; label: string }[] = [
  { id: "investigation", label: "Enquête" },
  { id: "court", label: "Cour" },
  { id: "movement", label: "Déplacement" },
  { id: "combat", label: "Combat" },
  /** Shugenja seulement (annexe F.5). */
  { id: "magic", label: "Magie" },
];

export const COMBAT_SUBS: readonly { id: CombatSub; label: string }[] = [
  { id: "skirmish", label: "Escarmouche" },
  { id: "duel", label: "Duel iaijutsu" },
  { id: "battle", label: "Bataille" },
];

/** Actions fixes. Les attaques et dégâts d'armes sont générés depuis la fiche (core/actions). */
export const FIXED_ACTIONS: readonly ActionDef[] = [
  // Enquête
  { id: "notice", situation: "investigation", label: "Remarquer un détail", kind: "skill", skill: "Investigation", trait: "perception", emphasisHint: "Remarquer", tn: 15, description: "Indice discret, objet dissimulé à la vue, comportement suspect. ND 10 évident, 20 bien caché." },
  { id: "search", situation: "investigation", label: "Fouiller un lieu", kind: "skill", skill: "Investigation", trait: "perception", emphasisHint: "Fouille", tn: 15, description: "Fouille méthodique d'une pièce ou d'un corps. Prends du temps : le MJ peut accorder des augmentations gratuites." },
  { id: "interrogate", situation: "investigation", label: "Interroger un témoin", kind: "skill", skill: "Investigation", trait: "awareness", emphasisHint: "Interrogatoire", tn: 15, description: "Questionner pour obtenir des faits. Un témoin réticent oppose sa Volonté ou Étiquette." },
  { id: "lie", situation: "investigation", label: "Percer un mensonge", kind: "skill", skill: "Investigation", trait: "awareness", emphasisHint: "Interrogatoire", tn: "opposed", description: "Jet en opposition contre Sincérité (Vigilance) de l'interlocuteur." },
  { id: "court", situation: "investigation", label: "Obtenir des informations en cour", kind: "skill", skill: "Courtisan", trait: "awareness", tn: 15, description: "Conversation polie, rumeurs, faveurs. Chaque augmentation donne un détail de plus." },
  { id: "etiquette", situation: "investigation", label: "Garder contenance", kind: "skill", skill: "Étiquette", trait: "awareness", tn: 15, description: "Ne rien laisser paraître, éviter un faux pas qui coûte de l'Honneur." },
  { id: "lore", situation: "investigation", label: "Se souvenir (Connaissance)", kind: "skill", skill: "Connaissance", trait: "intelligence", tn: 15, description: "Nomme ta Connaissance précise dans la fiche (ex. « Connaissance : Héraldique »). Sinon, jet sans compétence." },
  // Enquête, groupe Repos (annexe E.6)
  { id: MEDITATE_ACTION_ID, situation: "investigation", group: "Repos", label: "Méditer (récupérer du Vide)", kind: "skill", skill: "Méditation", trait: "void", emphasisHint: "Récupération du Vide", tn: 20, description: "Une heure de méditation, une fois par jour. Réussite : tu récupères des points de Vide, sans dépasser ton Anneau de Vide." },
  // Cour (lot 11) : jets sociaux, le plus souvent en opposition. Les Représentations viennent de la fiche (core/actions).
  { id: "persuade", situation: "court", label: "Convaincre, manipuler", kind: "skill", skill: "Courtisan", trait: "awareness", emphasisHint: "Manipulation", tn: "opposed", description: "Courtisan (Vigilance) contre Étiquette (Vigilance ou Volonté) de l'interlocuteur." },
  { id: "resist", situation: "court", label: "Résister à une influence", kind: "skill", skill: "Étiquette", trait: "awareness", emphasisHint: "Courtoisie", tn: "opposed", description: "Étiquette (Vigilance ou Volonté) contre le Courtisan, l'Intimidation ou la Tentation adverse." },
  { id: "sincerity", situation: "court", label: "Être cru", kind: "skill", skill: "Sincérité", trait: "awareness", tn: "opposed", description: "Sincérité (Vigilance) contre Investigation (Vigilance). Choisis la spécialisation : Honnêteté pour la vérité, Duperie pour un mensonge." },
  { id: "intimidate", situation: "court", label: "Intimider", kind: "skill", skill: "Intimidation", trait: "willpower", emphasisHint: "Contrôle", tn: "opposed", description: "Intimidation (Volonté) contre Étiquette (Volonté). Peut coûter de l'Honneur." },
  { id: "tempt", situation: "court", label: "Tenter, séduire", kind: "skill", skill: "Tentation", trait: "awareness", tn: "opposed", description: "Tentation (Vigilance) contre Étiquette (Volonté). Compétence basse : peut coûter de l'Honneur." },
  { id: "act", situation: "court", label: "Jouer un rôle", kind: "skill", skill: "Comédie", trait: "awareness", tn: "opposed", description: "Comédie (Vigilance) contre Investigation (Perception) de qui t'observe." },
  { id: "trade", situation: "court", label: "Marchander, estimer", kind: "skill", skill: "Commerce", trait: "intelligence", emphasisHint: "Estimation", tn: 15, description: "Estimer la valeur d'un objet ou négocier un prix. Compétence marchande : peut coûter de l'Honneur en public." },
  // Déplacement
  { id: "move", situation: "movement", label: "Se déplacer en combat", kind: "move", tn: null, description: "Terrain modéré ou difficile : l'Anneau d'Eau compte 1 ou 2 rangs de moins." },
  { id: "athletics", situation: "movement", label: "Courir, grimper, sauter", kind: "skill", skill: "Athlétisme", trait: "strength", tn: 15, description: "Escalade d'un mur 15, falaise 25. Course prolongée : Constitution au lieu de Force." },
  { id: "ride", situation: "movement", label: "Chevaucher en terrain difficile", kind: "skill", skill: "Équitation", trait: "agility", tn: 15, description: "Poursuite, saut d'obstacle, combat monté. Garder le contrôle d'une monture effrayée : ND 20." },
  { id: "stealth", situation: "movement", label: "Se déplacer discrètement", kind: "skill", skill: "Discrétion", trait: "agility", tn: "opposed", description: "En opposition contre Investigation (Perception) des gardes." },
  { id: "track", situation: "movement", label: "Pister, s'orienter", kind: "skill", skill: "Chasse", trait: "perception", tn: 15, description: "Suivre une piste, trouver un abri ou de l'eau. Piste fraîche 10, sous la pluie 25." },
  { id: "march", situation: "movement", label: "Endurer une marche forcée", kind: "trait", trait: "stamina", tn: 15, description: "Jet de Trait pur : Constitution gardée Constitution. Échec : fatigue (+5 au ND des jets suivants)." },
  // Escarmouche
  { id: "initiative", situation: "combat", sub: "skirmish", label: "Initiative", kind: "initiative", tn: null, description: "Rang + Réflexes, gardé Réflexes. Ordre du round." },
  { id: "unarmed", situation: "combat", sub: "skirmish", label: "Attaque à mains nues", kind: "skill", skill: "Jiujutsu", trait: "agility", tn: "target", attack: true, unarmed: true, description: "Jiujutsu (Agilité) contre le ND d'armure. Dégâts : Force + 0g1." },
  { id: "unarmed-dmg", situation: "combat", sub: "skirmish", parent: "unarmed", label: "Dégâts · mains nues", kind: "damage", unarmed: true, dr: "0g1", weapon: { name: "Mains nues", skill: "Jiujutsu", dr: "0g1" }, tn: null, description: "Force + 0g1." },
  { id: "grapple", situation: "combat", sub: "skirmish", label: "Lutte (saisie)", kind: "skill", skill: "Jiujutsu", trait: "agility", tn: "target", attack: true, unarmed: true, description: "Attaque Jiujutsu ; si elle touche, jets de Force en opposition pour établir et tenir la prise." },
  { id: "full-defense", situation: "combat", sub: "skirmish", label: "Défense totale", kind: "skill", skill: "Défense", trait: "reflexes", tn: null, fullDefense: true, description: "Posture Défense totale : la moitié du résultat s'ajoute à ton ND d'armure ce round." },
  // Duel iaijutsu
  { id: "assess", situation: "combat", sub: "duel", label: "1 · Évaluation", kind: "skill", skill: "Iaijutsu", trait: "awareness", tn: "assessment", description: "ND 10 + 5 × Rang de l'adversaire. Réussite : tu apprends des informations sur lui (Rang, Anneaux…), chaque augmentation en plus." },
  { id: "focus", situation: "combat", sub: "duel", label: "2 · Concentration", kind: "skill", skill: "Iaijutsu", trait: "void", tn: "opposed", description: "Jets en opposition à chaque échange. Le vainqueur frappe en premier ; l'écart se convertit en augmentations gratuites pour la Frappe." },
  { id: "strike", situation: "combat", sub: "duel", label: "3 · Frappe", kind: "skill", skill: "Iaijutsu", trait: "reflexes", tn: "target", attack: true, description: "Iaijutsu (Réflexes) contre le ND d'armure. Ajoute tes augmentations gratuites de la Concentration." },
  // Bataille
  { id: "tactics", situation: "combat", sub: "battle", label: "Commander / lire le champ", kind: "skill", skill: "Bataille", trait: "perception", tn: "opposed", description: "Commandants : jets en opposition à chaque tour. Saisis l'écart dans le panneau Bataille de masse : 5 d'écart pour l'emporter, sinon égalité." },
];

/**
 * Noms de compétence équivalents (édition française, ancien libellé, anglais), le premier faisant foi
 * pour le catalogue (vocabulaire de l'annexe E.7). L'ancien libellé reste reconnu : une fiche v2.5 marche sans renommage.
 */
export const SKILL_ALIASES: readonly (readonly string[])[] = [
  ["Courtisan", "Courtoisie", "Courtier"],
  ["Discrétion", "Furtivité", "Stealth"],
  ["Représentation : Conte", "Représentation : Conteur", "Perform: Storytelling"],
  ["Représentation : Art oratoire", "Représentation : Éloquence", "Perform: Oratory"],
  ["Sortilèges", "Spellcraft"],
];

/**
 * Renommages proposés à l'ouverture d'une fiche (annexe E.7) : ancien libellé → libellé de l'édition française.
 * La spécialisation Politesse ne change que sous Étiquette ; « Courtoisie » y reste une spécialisation.
 */
export const VOCABULARY_UPDATES = {
  skills: [
    ["Courtoisie", "Courtisan"],
    ["Furtivité", "Discrétion"],
    ["Représentation : Conteur", "Représentation : Conte"],
    ["Représentation : Éloquence", "Représentation : Art oratoire"],
  ],
  emphases: [{ skill: "Étiquette", from: "Politesse", to: "Courtoisie" }],
} as const;

/* ---------- Bonus de jet (HANDOFF annexe B) ---------- */

/**
 * Compétences sociales de la 4e (mot-clé « Social ») : noms français et anglais.
 * Représentation (Perform) couvre aussi ses spécialités, ex. « Représentation : Chant ».
 */
export const SOCIAL_SKILLS: readonly string[] = [
  "Comédie", "Acting",
  "Courtisan", "Courtoisie", "Courtier",
  "Étiquette",
  "Sincérité", "Sincerity",
  "Intimidation",
  "Tentation", "Temptation",
  "Représentation", "Perform",
];

export const MODIFIER_SOURCE_LABELS = {
  technique: "Technique",
  advantage: "Avantage",
  disadvantage: "Désavantage",
  other: "Autre",
} as const;

export const MODIFIER_TARGET_LABELS = {
  all: "Tous les jets de compétence et de trait",
  skill: "Une compétence",
  trait: "Un trait",
  social: "Les compétences sociales",
  attack: "Les attaques",
  damage: "Les dégâts",
  initiative: "L'initiative",
  armor: "Le ND d'armure",
  wounds: "La pénalité de blessure",
} as const;

/** Effet d'un bonus, sans son identité. */
export interface ModifierTemplate {
  id: string;
  label: string;
  source: "technique" | "advantage" | "disadvantage" | "other";
  appliesTo: keyof typeof MODIFIER_TARGET_LABELS;
  skill?: string;
  trait?: RollTrait;
  rolled: number;
  kept: number;
  flat: number;
  freeRaises: number;
  tn: number;
  stance?: Stance;
  mode: "always" | "optional";
  note?: string;
  /** Ce qu'il faut écrire dans le nom, laissé vide (« Nom de l'avantage »). */
  placeholder: string;
}

/** Nom à écrire selon la source du bonus : placeholder des modèles et de l'éditeur (annexe J.4). */
export const MODIFIER_NAME_PLACEHOLDERS: Record<ModifierTemplate["source"], string> = {
  advantage: "Nom de l'avantage",
  disadvantage: "Nom du désavantage",
  technique: "Nom de la technique",
  other: "Nom du bonus",
};

const T = { rolled: 0, kept: 0, flat: 0, freeRaises: 0, tn: 0, mode: "always" } as const;
const adv = { ...T, source: "advantage", placeholder: MODIFIER_NAME_PLACEHOLDERS.advantage } as const;
const dis = { ...T, source: "disadvantage", placeholder: MODIFIER_NAME_PLACEHOLDERS.disadvantage } as const;
const tech = { ...T, source: "technique", placeholder: MODIFIER_NAME_PLACEHOLDERS.technique } as const;

/**
 * Modèles de bonus (annexe J.4) : des formes d'effet regroupées par source, à ajuster (valeurs, cible), nom vide.
 * Aucun nom ni texte du livre : le joueur nomme son avantage, son désavantage ou sa technique.
 */
export const MODIFIER_TEMPLATES: readonly ModifierTemplate[] = [
  { ...T, id: "free", label: "Bonus libre", source: "other", appliesTo: "skill", placeholder: MODIFIER_NAME_PLACEHOLDERS.other },
  { ...adv, id: "adv-skill-dice", label: "Dés en plus sur une compétence", appliesTo: "skill", rolled: 1, kept: 1 },
  { ...adv, id: "adv-trait-dice", label: "Dés en plus sur un trait", appliesTo: "trait", rolled: 1 },
  { ...adv, id: "adv-skill-free-raise", label: "Augmentation gratuite sur une compétence", appliesTo: "skill", freeRaises: 1 },
  { ...adv, id: "adv-social-dice", label: "Bonus sur les jets sociaux", appliesTo: "social", rolled: 1 },
  { ...adv, id: "adv-wounds", label: "Pénalité de blessure réduite", appliesTo: "wounds", flat: 3 },
  { ...adv, id: "adv-armor", label: "Bonus au ND d'armure", appliesTo: "armor", flat: 5 },
  { ...adv, id: "adv-situational", label: "Bonus situationnel (à cocher au jet)", appliesTo: "all", rolled: 1, kept: 1, mode: "optional" },
  { ...dis, id: "dis-skill-dice", label: "Malus de dés sur une compétence", appliesTo: "skill", rolled: -1 },
  { ...dis, id: "dis-trait-dice", label: "Malus de dés sur un trait", appliesTo: "trait", rolled: -1 },
  { ...dis, id: "dis-social-tn", label: "ND augmenté sur les jets sociaux", appliesTo: "social", tn: 5 },
  { ...dis, id: "dis-skill-tn", label: "ND augmenté sur une compétence", appliesTo: "skill", tn: 5 },
  { ...dis, id: "dis-wounds", label: "Pénalité de blessure aggravée", appliesTo: "wounds", flat: -5 },
  { ...dis, id: "dis-situational", label: "Malus situationnel au total (à cocher)", appliesTo: "all", flat: -5, mode: "optional" },
  { ...tech, id: "tech-attack-dice", label: "Dés en plus aux attaques", appliesTo: "attack", rolled: 1 },
  { ...tech, id: "tech-damage-dice", label: "Dés en plus aux dégâts", appliesTo: "damage", rolled: 1 },
  { ...tech, id: "tech-initiative-dice", label: "Dés en plus à l'initiative", appliesTo: "initiative", rolled: 1 },
  { ...tech, id: "tech-stance", label: "Bonus en posture (au choix de la posture)", appliesTo: "attack", rolled: 1, stance: "attack" },
];

/** Magie (annexe F) : libellés des éléments d'un sort, « Tous » pour un sort universel. */
export const ELEMENT_LABELS: Record<SpellElement, string> = {
  air: "Air", earth: "Terre", fire: "Feu", water: "Eau", void: "Vide", all: "Tous",
};

/** Mots-clés de sort proposés à cocher (P20) ; le joueur peut en saisir d'autres. */
export const SPELL_KEYWORDS = ["Bataille", "Artisanat", "Défense", "Divination", "Illusion", "Jade", "Tonnerre", "Voyage", "Protection"] as const;

/** Sorts connus de tout shugenja (p. 166) : Sense, Commune, Summon ; noms français à confirmer (P20). */
export const UNIVERSAL_SPELLS = ["Sentir", "Communier", "Invoquer"] as const;

/** ND d'un sort : 5 + 5 × maîtrise (p. 165). */
export const SPELL_TN = { base: 5, perMastery: 5 } as const;

/** Temps d'incantation : une action complexe par niveau de maîtrise, une de moins par augmentation, au moins 1 (p. 165). */
export const SPELL_CAST_TIME_MIN = 1;

/** Interruption pendant l'incantation : Volonté, ND 10, ou 5 + dégâts subis (p. 166). */
export const SPELL_CONCENTRATION = { tn: 10, base: 5 } as const;
export const CONCENTRATE_ACTION_ID = "concentrate";
