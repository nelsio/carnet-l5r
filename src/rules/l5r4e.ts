/**
 * Données de règles de L5R 4e édition (HANDOFF §4.7).
 * Corriger une règle = modifier une donnée ici, pas le moteur.
 * Points à vérifier dans le livre : voir HANDOFF §12 (P2, P5).
 */
import type { Maneuver, RollTrait, TraitKey } from "../core/schema";
import type { WeaponLike } from "../core/engine";

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
  awareness: "Intuition",
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

/** Niveaux de blessure : pénalité au ND, `null` = aucune action possible. */
export const WOUND_LEVELS: readonly { label: string; penalty: number | null }[] = [
  { label: "Indemne", penalty: 0 },
  { label: "Égratigné", penalty: 3 },
  { label: "Éraflé", penalty: 5 },
  { label: "Blessé", penalty: 10 },
  { label: "Gravement blessé", penalty: 15 },
  { label: "Estropié", penalty: 20 },
  { label: "À terre", penalty: 40 },
  { label: "Hors de combat", penalty: null },
];
export const DEAD_LABEL = "Mort";
/** Seuils cumulés : Indemne jusqu'à Terre × 5, puis Terre × 2 de plus par niveau. */
export const WOUND_FIRST_MULTIPLIER = 5;
export const WOUND_NEXT_MULTIPLIER = 2;

/** ND d'armure : 5 × Réflexes + 5 + bonus d'armure, puis posture et Vide. */
export const ARMOR_TN = {
  perReflexes: 5,
  base: 5,
  fullAttackModifier: -10,
  voidArmorBonus: 10,
  defenseSkill: "Défense",
} as const;

export const STANCES: readonly { id: Stance; label: string; description: string }[] = [
  { id: "attack", label: "Attaque", description: "Posture normale." },
  { id: "fullAttack", label: "Attaque totale", description: "+2g1 à l'attaque, −10 au ND d'armure." },
  { id: "defense", label: "Défense", description: "Ajoute Air + Défense au ND d'armure." },
  { id: "fullDefense", label: "Défense totale", description: "Jet Défense (Réflexes), + moitié au ND d'armure." },
  { id: "center", label: "Centre", description: "Aucune action ; bonus au round suivant (voir livre)." },
];

/** Modificateurs de réserve. */
export const POOL_BONUS = {
  fullAttack: { rolled: 2, kept: 1 },
  voidPoint: { rolled: 1, kept: 1 },
} as const;

/** Déplacement en pieds, en multiples de l'Anneau d'Eau. */
export const MOVEMENT = { free: 5, simple: 10, max: 20 } as const;
export const FEET_TO_METERS = 0.3048;

/** Manœuvres par défaut (coût en augmentations). */
export const DEFAULT_MANEUVERS: readonly Maneuver[] = [
  { id: "dmg", name: "Augmentation des dégâts", cost: 1, stackable: true, effect: "+1g0 aux dégâts par augmentation (cumulable)." },
  { id: "called", name: "Coup ciblé", cost: 1, stackable: false, effect: "Viser une zone précise (main, jambe, tête…). Coût selon la zone, à fixer avec le MJ." },
  { id: "feint", name: "Feinte", cost: 2, stackable: false, effect: "Effet détaillé dans les manœuvres de base de ton livre." },
  { id: "knockdown", name: "Renversement", cost: 2, stackable: false, effect: "Jet de Force en opposition : la cible tombe à terre si tu l'emportes." },
  { id: "disarm", name: "Désarmement", cost: 3, stackable: false, effect: "Pas de dégâts. Jet de Force en opposition : la cible lâche son arme si tu l'emportes." },
  { id: "extra", name: "Attaque supplémentaire", cost: 5, stackable: false, effect: "Une attaque de plus ce round." },
];
/** Manœuvre dont chaque prise ajoute +1g0 au jet de dégâts suivant. */
export const DAMAGE_MANEUVER_ID = "dmg";

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

/** Clans : clés normalisées (sans accents ni casse) et couleurs d'accent. */
export interface ClanInfo { id: string; label: string; light: string; dark: string }
export const CLANS: readonly ClanInfo[] = [
  { id: "crabe", label: "Clan du Crabe", light: "#3d5a73", dark: "#8fb0cc" },
  { id: "grue", label: "Clan de la Grue", light: "#2f7fb5", dark: "#8cc4ea" },
  { id: "dragon", label: "Clan du Dragon", light: "#2f7a45", dark: "#7fcb93" },
  { id: "licorne", label: "Clan de la Licorne", light: "#6b3fa0", dark: "#bb9ae6" },
  { id: "lion", label: "Clan du Lion", light: "#a87b0c", dark: "#e6bf55" },
  { id: "mante", label: "Clan de la Mante", light: "#1f8073", dark: "#6fd0c1" },
  { id: "phenix", label: "Clan du Phénix", light: "#c25a14", dark: "#f0a066" },
  { id: "scorpion", label: "Clan du Scorpion", light: "#a82828", dark: "#f07a7a" },
  { id: "araignee", label: "Clan de l'Araignée", light: "#4a4a4a", dark: "#b5b5b5" },
  { id: "imperial", label: "Familles impériales", light: "#8a6d12", dark: "#dcc06a" },
];
export const UNKNOWN_CLAN = { light: "#7a6a3a", dark: "#cdb67a" } as const;
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

export type Situation = "investigation" | "movement" | "combat";
export type CombatSub = "skirmish" | "duel" | "battle";
export type ActionTN = number | "target" | "opposed" | "assessment" | null;
export type ActionKind = "skill" | "trait" | "damage" | "initiative" | "move" | "info";

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
  fullDefense?: boolean;
  /** Valeur de dégâts, pour les actions `damage`. */
  dr?: string;
  /** Arme utilisée, pour les attaques et dégâts générés depuis la fiche. */
  weapon?: WeaponLike;
  description: string;
}

export const SITUATIONS: readonly { id: Situation; label: string }[] = [
  { id: "investigation", label: "Enquête" },
  { id: "movement", label: "Déplacement" },
  { id: "combat", label: "Combat" },
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
  { id: "lie", situation: "investigation", label: "Percer un mensonge", kind: "skill", skill: "Investigation", trait: "awareness", emphasisHint: "Interrogatoire", tn: "opposed", description: "Jet en opposition contre Sincérité (Intuition) de l'interlocuteur." },
  { id: "court", situation: "investigation", label: "Obtenir des informations en cour", kind: "skill", skill: "Courtoisie", trait: "awareness", tn: 15, description: "Conversation polie, rumeurs, faveurs. Chaque augmentation donne un détail de plus." },
  { id: "etiquette", situation: "investigation", label: "Garder contenance", kind: "skill", skill: "Étiquette", trait: "awareness", tn: 15, description: "Ne rien laisser paraître, éviter un faux pas qui coûte de l'Honneur." },
  { id: "lore", situation: "investigation", label: "Se souvenir (Connaissance)", kind: "skill", skill: "Connaissance", trait: "intelligence", tn: 15, description: "Nomme ta Connaissance précise dans la fiche (ex. « Connaissance : Héraldique »). Sinon, jet sans compétence." },
  // Déplacement
  { id: "move", situation: "movement", label: "Se déplacer en combat", kind: "move", tn: null, description: "Terrain difficile : distances divisées par deux." },
  { id: "athletics", situation: "movement", label: "Courir, grimper, sauter", kind: "skill", skill: "Athlétisme", trait: "strength", tn: 15, description: "Escalade d'un mur 15, falaise 25. Course prolongée : Constitution au lieu de Force." },
  { id: "ride", situation: "movement", label: "Chevaucher en terrain difficile", kind: "skill", skill: "Équitation", trait: "agility", tn: 15, description: "Poursuite, saut d'obstacle, combat monté. Garder le contrôle d'une monture effrayée : ND 20." },
  { id: "stealth", situation: "movement", label: "Se déplacer discrètement", kind: "skill", skill: "Furtivité", trait: "agility", tn: "opposed", description: "En opposition contre Investigation (Perception) des gardes." },
  { id: "track", situation: "movement", label: "Pister, s'orienter", kind: "skill", skill: "Chasse", trait: "perception", tn: 15, description: "Suivre une piste, trouver un abri ou de l'eau. Piste fraîche 10, sous la pluie 25." },
  { id: "march", situation: "movement", label: "Endurer une marche forcée", kind: "trait", trait: "stamina", tn: 15, description: "Jet de Trait pur : Constitution gardée Constitution. Échec : fatigue (+5 au ND des jets suivants)." },
  // Escarmouche
  { id: "initiative", situation: "combat", sub: "skirmish", label: "Initiative", kind: "initiative", tn: null, description: "Rang + Réflexes, gardé Réflexes. Ordre du round." },
  { id: "unarmed", situation: "combat", sub: "skirmish", label: "Attaque à mains nues", kind: "skill", skill: "Jiujutsu", trait: "agility", tn: "target", attack: true, description: "Jiujutsu (Agilité) contre le ND d'armure. Dégâts : Force + 0g1." },
  { id: "unarmed-dmg", situation: "combat", sub: "skirmish", parent: "unarmed", label: "Dégâts · mains nues", kind: "damage", dr: "0g1", weapon: { name: "Mains nues", skill: "Jiujutsu", dr: "0g1" }, tn: null, description: "Force + 0g1." },
  { id: "grapple", situation: "combat", sub: "skirmish", label: "Lutte (saisie)", kind: "skill", skill: "Jiujutsu", trait: "agility", tn: "target", attack: true, description: "Attaque Jiujutsu ; si elle touche, jets de Force en opposition pour établir et tenir la prise." },
  { id: "full-defense", situation: "combat", sub: "skirmish", label: "Défense totale", kind: "skill", skill: "Défense", trait: "reflexes", tn: null, fullDefense: true, description: "Posture Défense totale : la moitié du résultat s'ajoute à ton ND d'armure ce round." },
  // Duel iaijutsu
  { id: "assess", situation: "combat", sub: "duel", label: "1 · Évaluation", kind: "skill", skill: "Iaijutsu", trait: "awareness", tn: "assessment", description: "ND 10 + 5 × Rang de l'adversaire. Réussite : tu apprends des informations sur lui (Rang, Anneaux…), chaque augmentation en plus." },
  { id: "focus", situation: "combat", sub: "duel", label: "2 · Concentration", kind: "skill", skill: "Iaijutsu", trait: "void", tn: "opposed", description: "Jets en opposition à chaque échange. Le vainqueur frappe en premier ; l'écart se convertit en augmentations gratuites pour la Frappe." },
  { id: "strike", situation: "combat", sub: "duel", label: "3 · Frappe", kind: "skill", skill: "Iaijutsu", trait: "reflexes", tn: "target", attack: true, description: "Iaijutsu (Réflexes) contre le ND d'armure. Ajoute tes augmentations gratuites de la Concentration." },
  // Bataille
  { id: "tactics", situation: "combat", sub: "battle", label: "Commander / lire le champ", kind: "skill", skill: "Bataille", trait: "perception", tn: "opposed", description: "Commandants : jets en opposition chaque tour. Le vainqueur infléchit le cours de la bataille." },
  { id: "battle", situation: "combat", sub: "battle", label: "Jet de bataille personnel", kind: "skill", skill: "Bataille", trait: "perception", tn: 15, description: "Selon ton niveau d'engagement, le résultat détermine ta ligne sur la table de bataille de masse (gloire, blessures, opportunités)." },
  { id: "engagement", situation: "combat", sub: "battle", label: "Niveau d'engagement", kind: "info", tn: null, description: "Réserve → Désengagé → Engagé → Fortement engagé. Plus tu t'engages, plus tu gagnes de Gloire et d'opportunités, plus tu risques de blessures." },
];
