import { z } from "zod";
import type { Messages } from "../i18n";
import { fr } from "../i18n/fr";

type ValidationMessages = Messages["validation"];
/** Messages d'erreur dans la langue de l'interface, lus au moment de la validation (annexe 50.2). */
let messages: ValidationMessages = fr.validation;

/** Change la langue des messages d'erreur ; appelé par le fournisseur de langue de l'interface. */
export function setValidationMessages(next: ValidationMessages): void {
  messages = next;
}

/** Message d'erreur zod : clé dans les messages courants, paramètres d'un message interpolé. */
const m = (key: keyof ValidationMessages, ...args: number[]) => ({
  error: () => {
    const msg = messages[key];
    return typeof msg === "function" ? (msg as (...a: number[]) => string)(...args) : msg;
  },
});

/** Version courante du format de fiche (HANDOFF §3.1, §9.2). */
export const SCHEMA_VERSION = 2;

/** Taille maximale d'une fiche sérialisée, en octets (HANDOFF §3.1). */
export const MAX_CHARACTER_BYTES = 256 * 1024;

export const TRAIT_KEYS = [
  "stamina", "willpower", "strength", "perception",
  "agility", "intelligence", "reflexes", "awareness",
] as const;

export const ROLL_TRAITS = [...TRAIT_KEYS, "void"] as const;

const int = (min: number, max: number) => {
  const msg = m("intBetween", min, max);
  return z.number(msg).int(msg).min(min, msg).max(max, msg);
};

const positiveInt = () => {
  const msg = m("positiveInt");
  return z.number(msg).int(msg).min(0, msg);
};

/** Nombre entre 0 et 10 avec au plus une décimale (Honneur, Gloire, Statut). */
const reputation = () => {
  const msg = m("reputation");
  return z.number(msg).min(0, msg).max(10, msg)
    .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9, msg);
};

const text = (max?: number) => {
  const s = z.string(m("text"));
  return max === undefined ? s : s.max(max, m("maxChars", max));
};

export const TraitKeySchema = z.enum(TRAIT_KEYS, m("trait"));
export const RollTraitSchema = z.enum(ROLL_TRAITS, m("rollTrait"));

export const TraitsSchema = z.object(
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, int(1, 10)])) as Record<(typeof TRAIT_KEYS)[number], ReturnType<typeof int>>,
  m("object"),
);

export const XpSchema = z.object({ total: positiveInt(), spent: positiveInt() }, m("object"));

export const ArmorSchema = z.object({
  name: text(80),
  bonus: positiveInt(),
  reduction: positiveInt().default(0),
  /** Armure du catalogue (annexe E.5) : ses effets s'appliquent ; facultatif, format v2 inchangé. */
  catalogId: text(40).optional(),
}, m("object"));

export const SkillSchema = z.object({
  name: text(80).min(1, m("notEmpty")),
  rank: int(0, 10),
  trait: RollTraitSchema,
  emphases: z.array(text(80), m("textList")).default([]),
}, m("object"));

/** Mots-clés d'arme (HANDOFF annexe C.2) : conditions des techniques d'école. */
export const WEAPON_KEYWORDS = [
  "samourai", "lourde", "paysan", "ninja", "arc", "hast", "lance",
  "deux-mains", "petite", "moyenne", "grande", "distance", "cimeterre",
] as const;

export const WeaponKeywordSchema = z.enum(WEAPON_KEYWORDS, m("weaponKeyword"));

export const WeaponSchema = z.object({
  name: text(80).min(1, m("notEmpty")),
  skill: text(80),
  dr: z.string(m("text")).regex(/^\s*\d+\s*[kg]\s*\d+\s*$/i, m("weaponDr")),
  bowStrength: int(0, 10).optional(),
  /** Facultatif dans le type (fiches v1) ; `migrate()` le remplit. */
  keywords: z.array(WeaponKeywordSchema, m("weaponKeywords")).optional(),
}, m("object"));

export const TechniqueSchema = z.object({
  name: text(120).min(1, m("notEmpty")),
  text: text(),
}, m("object"));

export const ManeuverSchema = z.object({
  id: text(40).min(1, m("notEmpty")),
  name: text(80).min(1, m("notEmpty")),
  cost: int(0, 10),
  effect: text(),
  stackable: z.boolean(m("boolean")),
}, m("object"));

/** Élément d'un sort (annexe F.3) ; « all » : sort universel, élément choisi au lancement. */
export const SPELL_ELEMENTS = ["air", "earth", "fire", "water", "void", "all"] as const;
/** Anneaux d'un shugenja (affinité, déficience), Vide compris. */
export const SPELL_RINGS = ["air", "earth", "fire", "water", "void"] as const;
/** Emplacements de sorts : un compteur par Anneau, plus les emplacements libres (F.2). */
export const SPELL_SLOT_KEYS = [...SPELL_RINGS, "free"] as const;

/** Sort du Rouleaux & invocations (annexe F.3) : champs libres, recopiés par le joueur. */
export const SpellSchema = z.object({
  id: text(40).min(1, m("notEmpty")),
  name: text(120).min(1, m("notEmpty")),
  element: z.enum(SPELL_ELEMENTS, m("spellElement")),
  mastery: int(1, 6),
  keywords: z.array(text(40), m("textList")).default([]),
  range: text(80).default(""),
  area: text(120).default(""),
  duration: text(80).default(""),
  /** Augmentations propres au sort, une par ligne. */
  raises: text(2000).default(""),
  /** VD facultative (« 2g2 ») : action « Dégâts » du sort (v2.11.0). */
  damage: z.string(m("text")).regex(/^\s*(\d+\s*[kg]\s*\d+)?\s*$/i, m("spellDamage")).optional(),
  memorized: z.boolean(m("boolean")).default(false),
  effect: text().default(""),
}, m("object"));

export const MODIFIER_SOURCES =["technique", "advantage", "disadvantage", "other"] as const;
export const MODIFIER_TARGETS = ["all", "skill", "trait", "social", "attack", "damage", "initiative", "armor", "wounds"] as const;
export const STANCE_IDS = ["attack", "fullAttack", "defense", "fullDefense", "center"] as const;

/**
 * Bonus (ou malus) de jet venant d'une technique, d'un avantage ou d'un désavantage (HANDOFF annexe B).
 * `always` : appliqué d'office (décochable au moment du jet) ; `optional` : situationnel, à cocher.
 */
export const ModifierSchema = z.object({
  id: text(40).min(1, m("notEmpty")),
  name: text(120).min(1, m("notEmpty")),
  source: z.enum(MODIFIER_SOURCES, m("modifierSource")),
  appliesTo: z.enum(MODIFIER_TARGETS, m("modifierTarget")),
  /** Compétence visée (appliesTo = skill). */
  skill: text(80).optional(),
  /** Trait visé (appliesTo = trait). */
  trait: RollTraitSchema.optional(),
  rolled: int(-10, 10).default(0),
  kept: int(-10, 10).default(0),
  /**
   * Bonus fixe au total ; au ND d'armure pour appliesTo = armor ;
   * réduction de la pénalité de blessure pour appliesTo = wounds.
   */
  flat: int(-50, 50).default(0),
  /** Modification du ND des jets concernés (ex. +5 = jets plus difficiles). */
  tn: int(-50, 50).default(0),
  /** Posture requise : le bonus ne s'applique que dans cette posture. */
  stance: z.enum(STANCE_IDS, m("stance")).optional(),
  freeRaises: int(0, 10).default(0),
  mode: z.enum(["always", "optional"], m("modifierMode")).default("always"),
  note: text().default(""),
}, m("object"));

/**
 * Champs de la fiche, validés un par un lors d'une fusion (HANDOFF §8).
 * Les textes libres et listes secondaires sont facultatifs dans un fichier importé.
 */
export const characterShape = {
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: text(80).min(1, m("notEmpty")),
  clan: text(80).default(""),
  family: text(80).default(""),
  school: text(120).default(""),
  /** École du catalogue (annexe C) ; "" = aucune. Facultatifs dans le type (fiches v1) : `migrate()` les remplit. */
  schoolId: text(60).optional(),
  /** Rang d'école ; null = Rang d'Insight. */
  schoolRank: int(1, 10).nullable().optional(),
  insightRank: int(1, 10),
  /** Facultatif : points d'Insight accordés hors calcul (avantage, technique, MJ), annexe K ; absent = 0. */
  insightBonus: int(-50, 200).optional(),
  honor: reputation(),
  glory: reputation(),
  status: reputation(),
  xp: XpSchema,
  traits: TraitsSchema,
  voidRing: int(1, 10),
  voidPoints: int(0, 10),
  wounds: positiveInt(),
  armor: ArmorSchema,
  skills: z.array(SkillSchema, m("list")),
  weapons: z.array(WeaponSchema, m("list")),
  techniques: z.array(TechniqueSchema, m("list")).default([]),
  maneuvers: z.array(ManeuverSchema, m("list")).default([]),
  /** Facultatif : ajout compatible au format v1 (HANDOFF annexe B). */
  modifiers: z.array(ModifierSchema, m("list")).optional(),
  /** Facultatif : Rouleaux & invocations (annexe F.3), format v2 inchangé. */
  spells: z.array(SpellSchema, m("list")).optional(),
  /** Facultatif : affinité choisie, pour une école à affinité au choix (Isawa, annexe F.3). */
  affinity: z.enum(SPELL_RINGS, m("ring")).optional(),
  /** Facultatif : emplacements de sorts dépensés aujourd'hui, par Anneau et « free » (annexe F.3, F-d). */
  spellSlotsUsed: z.partialRecord(
    z.enum(SPELL_SLOT_KEYS, m("slotKey")), positiveInt(), m("object"),
  ).optional(),
  advantages: text().default(""),
  disadvantages: text().default(""),
  notes: text().default(""),
};

export const CharacterSchema = z.object(characterShape).superRefine((c, ctx) => {
  if (c.voidPoints > c.voidRing) {
    ctx.addIssue({ code: "custom", path: ["voidPoints"], message: messages.voidPointsOverRing });
  }
});

export type TraitKey = z.infer<typeof TraitKeySchema>;
export type RollTrait = z.infer<typeof RollTraitSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type WeaponKeyword = z.infer<typeof WeaponKeywordSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Maneuver = z.infer<typeof ManeuverSchema>;
export type Modifier = z.infer<typeof ModifierSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type SpellElement = (typeof SPELL_ELEMENTS)[number];
export type SpellRing = (typeof SPELL_RINGS)[number];
export type SpellSlotKey = (typeof SPELL_SLOT_KEYS)[number];
export type ModifierTarget =(typeof MODIFIER_TARGETS)[number];
export type Character = z.infer<typeof CharacterSchema>;

export interface FieldError { path: string; message: string }

/** Chemin lisible : `traits.agility`, `skills[0].rank`. */
export function formatPath(segments: readonly PropertyKey[], prefix = ""): string {
  let out = prefix;
  for (const s of segments) {
    if (typeof s === "number") out += `[${s}]`;
    else out += out ? `.${String(s)}` : String(s);
  }
  return out;
}

export function zodErrors(error: z.ZodError, prefix = ""): FieldError[] {
  return error.issues.map((i) => ({ path: formatPath(i.path, prefix), message: i.message }));
}
