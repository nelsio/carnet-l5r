/**
 * Catalogue des techniques d'école (HANDOFF annexes C.3 et D).
 * Les données vivent dans `ecoles-bushi.json` (copie de `reference/ecoles-bushi.json`) et
 * `ecoles-courtisans.json` (courtisans et Shosuro, lot 11) : effets chiffrés et résumés écrits pour l'outil,
 * aucun texte du livre.
 * Écart avec la référence : la manœuvre « knock » du prototype s'appelle ici « knockdown » (Yoritomo R4).
 */
import type { TraitKey, WeaponKeyword } from "../core/schema";
import bushi from "./ecoles-bushi.json";
import courtiers from "./ecoles-courtisans.json";
import type { RingKey, Stance } from "./l5r4e";

/**
 * Valeur fixe, ou calculée depuis la fiche : `ref` × `mult` ÷ `div` + `add`, plancher `min`, plafond `max`.
 * La division arrondit à l'inférieur, ou au plus proche avec `round: "nearest"` (Bayushi courtisan R1, annexe E-h).
 */
export type Value = number | {
  ref: "schoolRank" | "honor" | "input" | `ring:${RingKey}` | `trait:${TraitKey}` | `skill:${string}`;
  mult?: number; div?: number; round?: "nearest"; add?: number; min?: number; max?: number;
};

/** Conditions d'un effet : toutes celles présentes doivent être vraies. */
export interface When {
  stance?: Stance[];
  stanceNot?: Stance[];
  mounted?: boolean;
  /** Posture Centre, ou Centre au round précédent. */
  centerOrAfter?: boolean;
  skillGroup?: "bugei";
  weapon?: { keywordsAny?: WeaponKeyword[]; melee?: boolean; ranged?: boolean; unarmed?: boolean };
  /** Honneur non arrondi au moins égal (Doji R1). */
  honorMin?: number;
  /** Spécialisation choisie au lanceur parmi ces noms (alias FR/EN, annexe D-d). */
  emphasis?: string[];
  anyOf?: When[];
}

/**
 * Jets concernés par un effet. `social` : compétences sociales ; `lore` : Connaissance ;
 * `school` : compétences de l'école ; `skill:X` : la compétence X (et ses variantes « X : … »).
 */
export type On = "attack" | "damage" | "initiative" | "focus" | "skill" | "trait" | "bugei" | "social" | "lore" | "school" | `skill:${string}`;

export type EffectMode = "auto" | "optional";
export type ReminderContext = "combat" | "duel" | "damage" | "social";

export type Effect =
  | {
    kind: "roll"; on: On[]; rolled?: Value; kept?: Value; flat?: Value; freeRaises?: Value;
    /** Modification du ND de ce jet (Ide R1). */
    tn?: Value;
    /** Augmentations non limitées par l'Anneau de Vide (Shosuro). */
    unlimitedRaises?: boolean;
    when?: When; mode: EffectMode; void?: number; label?: string; input?: string;
  }
  | { kind: "armor"; value: Value; when?: When; mode: EffectMode; stack?: { max: Value; label: string }; label?: string }
  | { kind: "reduction"; value: Value; mode: "auto" }
  | { kind: "wounds"; perLevel?: Value; ignorePenalty?: Value | "all"; on?: On[]; when?: When; mode: EffectMode; void?: number; label?: string }
  | { kind: "maneuver"; cost?: { maneuver: string; value: number }; freeRaisesFor?: { maneuver: string; count: number }; when?: When; mode: EffectMode; label?: string }
  | { kind: "move"; value: Value; when?: When; mode: "auto" }
  | { kind: "targetTn"; value: Value; stack: { max: Value; label: string }; mode: "optional" }
  /**
   * Option de dépense de plusieurs points de Vide (Shiba R1 : +2g2 en tout). Avec `perPoint`, chaque point
   * vaut `rolled`g`kept` (ou le `voidBoost` du jet) ; avec `on`, l'option est limitée à ces jets (Shosuro Acteur R3).
   */
  | { kind: "void"; points: number; rolled: number; kept: number; label: string; perPoint?: boolean; on?: On[] }
  /** Un point de Vide dépensé sur ces jets donne `rolled`g`kept` au lieu de 1g1 (Asako R1, Shosuro Acteur R1). */
  | { kind: "voidBoost"; on: On[]; when?: When; rolled: number; kept: number }
  | { kind: "voidDouble" }
  | { kind: "keyword"; weaponKeyword: WeaponKeyword; adds: WeaponKeyword }
  | { kind: "simpleAttack"; when?: When }
  | { kind: "verdict"; rule: "baseTnSuccess"; when?: When }
  /** Rappel ; `{n}` dans le texte est remplacé par `value` calculée (« +10 au ND… »). */
  | { kind: "reminder"; context: ReminderContext; text?: string; value?: Value };

export interface SchoolRank { rank: 1 | 2 | 3 | 4 | 5; name: string; summary: string; effects: Effect[] }
export interface School {
  id: string; clan: string; name: string; class: string; ranks: SchoolRank[];
  /** Compétences d'école (On `school`). */
  skills?: string[];
  /** Mots qui désignent l'école dans le champ libre « École », en plus du nom de famille (suggestion, annexe D-h). */
  classWords?: string[];
}
/**
 * Arme du livre (p. 201-206, annexe E.2 C8). `special: "katanaVoid"` : un point de Vide possible aux dégâts ;
 * `tnMounted` / `tnOnFoot` : ND des tirs augmenté monté ou à pied ; `minStrength` : Force conseillée.
 */
export interface CatalogWeapon {
  name: string; keywords: WeaponKeyword[]; skill: string; dr: string; bowStrength?: number;
  special?: "katanaVoid"; tnMounted?: number; tnOnFoot?: number; minStrength?: number;
}

/** Écoles bushi (lot 10), puis courtisans et Shosuro (lot 11). */
export const SCHOOLS = [...bushi.schools, ...courtiers.schools] as unknown as readonly School[];
/** Catalogue d'armes : mots-clés, compétence et VD du livre (vérifiés, HANDOFF P10 et annexe E.2 C8). */
export const WEAPON_CATALOG = bushi.weaponCatalog as unknown as readonly CatalogWeapon[];
/** Compétences Bugei (Akodo R5, Utaku R5). */
export const BUGEI_SKILLS: readonly string[] = bushi.skillGroups.bugei;

/** Spécialisations équivalentes (édition française et anglaise), annexe D-d. */
export const EMPHASIS_ALIASES: readonly (readonly string[])[] = [
  ["Honnêteté", "Honesty"],
  ["Duperie", "Deceit"],
  ["Contrôle", "Control"],
  ["Manipulation"],
  ["Ragots", "Gossip"],
  ["Politesse", "Courtesy", "Courtoisie"],
  ["Rhétorique", "Rhetoric"],
];

export const WEAPON_KEYWORD_LABELS: Readonly<Record<WeaponKeyword, string>> = {
  samourai: "Samouraï", lourde: "Lourde", paysan: "Paysan", ninja: "Ninja", arc: "Arc", hast: "Hast", lance: "Lance",
  "deux-mains": "Deux mains", petite: "Petite", moyenne: "Moyenne", grande: "Grande", distance: "Distance", cimeterre: "Cimeterre",
};
