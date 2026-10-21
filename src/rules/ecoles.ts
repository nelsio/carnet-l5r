/**
 * Catalogue des techniques d'école bushi (HANDOFF annexe C.3).
 * Les données vivent dans `ecoles-bushi.json`, copie de `reference/ecoles-bushi.json` :
 * effets chiffrés et résumés écrits pour l'outil, aucun texte du livre.
 * Écart avec la référence : la manœuvre « knock » du prototype s'appelle ici « knockdown » (Yoritomo R4).
 */
import type { TraitKey, WeaponKeyword } from "../core/schema";
import data from "./ecoles-bushi.json";
import type { RingKey, Stance } from "./l5r4e";

/** Valeur fixe, ou calculée depuis la fiche : `ref` × `mult` ÷ `div` (arrondi inférieur) + `add`, plancher `min`. */
export type Value = number | {
  ref: "schoolRank" | "honor" | "input" | `ring:${RingKey}` | `trait:${TraitKey}` | `skill:${string}`;
  mult?: number; div?: number; add?: number; min?: number;
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
  anyOf?: When[];
}

/** Jets concernés par un effet. */
export type On = "attack" | "damage" | "initiative" | "focus" | "skill" | "trait" | "bugei" | `skill:${string}`;

export type EffectMode = "auto" | "optional";
export type ReminderContext = "combat" | "duel" | "damage";

export type Effect =
  | { kind: "roll"; on: On[]; rolled?: Value; kept?: Value; flat?: Value; freeRaises?: Value; when?: When; mode: EffectMode; void?: number; label?: string; input?: string }
  | { kind: "armor"; value: Value; when?: When; mode: EffectMode; stack?: { max: Value; label: string }; label?: string }
  | { kind: "reduction"; value: Value; mode: "auto" }
  | { kind: "wounds"; perLevel?: Value; ignorePenalty?: Value | "all"; on?: On[]; when?: When; mode: EffectMode; void?: number; label?: string }
  | { kind: "maneuver"; cost?: { maneuver: string; value: number }; freeRaisesFor?: { maneuver: string; count: number }; when?: When; mode: EffectMode; label?: string }
  | { kind: "move"; value: Value; when?: When; mode: "auto" }
  | { kind: "targetTn"; value: Value; stack: { max: Value; label: string }; mode: "optional" }
  | { kind: "void"; points: number; rolled: number; kept: number; label: string }
  | { kind: "voidDouble" }
  | { kind: "keyword"; weaponKeyword: WeaponKeyword; adds: WeaponKeyword }
  | { kind: "simpleAttack"; when?: When }
  | { kind: "verdict"; rule: "baseTnSuccess"; when?: When }
  | { kind: "reminder"; context: ReminderContext; text?: string };

export interface SchoolRank { rank: 1 | 2 | 3 | 4 | 5; name: string; summary: string; effects: Effect[] }
export interface School { id: string; clan: string; name: string; class: string; ranks: SchoolRank[] }
export interface CatalogWeapon { name: string; keywords: WeaponKeyword[]; skill: string; dr: string; bowStrength?: number }

export const SCHOOLS = data.schools as unknown as readonly School[];
/** Catalogue d'armes : mots-clés pré-remplis (valeurs de dégâts à vérifier, HANDOFF P10). */
export const WEAPON_CATALOG = data.weaponCatalog as unknown as readonly CatalogWeapon[];
/** Compétences Bugei (Akodo R5, Utaku R5). */
export const BUGEI_SKILLS: readonly string[] = data.skillGroups.bugei;

export const WEAPON_KEYWORD_LABELS: Readonly<Record<WeaponKeyword, string>> = {
  samourai: "Samouraï", lourde: "Lourde", paysan: "Paysan", ninja: "Ninja", arc: "Arc", hast: "Hast", lance: "Lance",
  "deux-mains": "Deux mains", petite: "Petite", moyenne: "Moyenne", grande: "Grande", distance: "Distance", cimeterre: "Cimeterre",
};
