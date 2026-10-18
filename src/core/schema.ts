import { z } from "zod";

/** Version courante du format de fiche (HANDOFF §3.1, §9.2). */
export const SCHEMA_VERSION = 1;

/** Taille maximale d'une fiche sérialisée, en octets (HANDOFF §3.1). */
export const MAX_CHARACTER_BYTES = 256 * 1024;

export const TRAIT_KEYS = [
  "stamina", "willpower", "strength", "perception",
  "agility", "intelligence", "reflexes", "awareness",
] as const;

export const ROLL_TRAITS = [...TRAIT_KEYS, "void"] as const;

const int = (min: number, max: number) => {
  const msg = `doit être un entier entre ${min} et ${max}`;
  return z.number(msg).int(msg).min(min, msg).max(max, msg);
};

const positiveInt = () => {
  const msg = "doit être un entier positif ou nul";
  return z.number(msg).int(msg).min(0, msg);
};

/** Nombre entre 0 et 10 avec au plus une décimale (Honneur, Gloire, Statut). */
const reputation = () => {
  const msg = "doit être un nombre entre 0 et 10, avec au plus une décimale";
  return z.number(msg).min(0, msg).max(10, msg)
    .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9, msg);
};

const text = (max?: number) => {
  const s = z.string("doit être un texte");
  return max === undefined ? s : s.max(max, `doit faire au plus ${max} caractères`);
};

export const TraitKeySchema = z.enum(TRAIT_KEYS, "doit être un Trait valide");
export const RollTraitSchema = z.enum(ROLL_TRAITS, "doit être un Trait valide ou void");

export const TraitsSchema = z.object(
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, int(1, 10)])) as Record<(typeof TRAIT_KEYS)[number], ReturnType<typeof int>>,
  "doit être un objet",
);

export const XpSchema = z.object({ total: positiveInt(), spent: positiveInt() }, "doit être un objet");

export const ArmorSchema = z.object({
  name: text(80),
  bonus: positiveInt(),
  reduction: positiveInt().default(0),
}, "doit être un objet");

export const SkillSchema = z.object({
  name: text(80).min(1, "ne doit pas être vide"),
  rank: int(0, 10),
  trait: RollTraitSchema,
  emphases: z.array(text(80), "doit être une liste de textes").default([]),
}, "doit être un objet");

export const WeaponSchema = z.object({
  name: text(80).min(1, "ne doit pas être vide"),
  skill: text(80),
  dr: z.string("doit être un texte").regex(/^\s*\d+\s*[kg]\s*\d+\s*$/i, "doit être au format 3g2"),
  bowStrength: int(0, 10).optional(),
}, "doit être un objet");

export const TechniqueSchema = z.object({
  name: text(120).min(1, "ne doit pas être vide"),
  text: text(),
}, "doit être un objet");

export const ManeuverSchema = z.object({
  id: text(40).min(1, "ne doit pas être vide"),
  name: text(80).min(1, "ne doit pas être vide"),
  cost: int(0, 10),
  effect: text(),
  stackable: z.boolean("doit être vrai ou faux"),
}, "doit être un objet");

export const MODIFIER_SOURCES = ["technique", "advantage", "disadvantage", "other"] as const;
export const MODIFIER_TARGETS = ["all", "skill", "trait", "attack", "damage", "initiative", "armor"] as const;

/**
 * Bonus (ou malus) de jet venant d'une technique, d'un avantage ou d'un désavantage (HANDOFF annexe B).
 * `always` : appliqué d'office (décochable au moment du jet) ; `optional` : situationnel, à cocher.
 */
export const ModifierSchema = z.object({
  id: text(40).min(1, "ne doit pas être vide"),
  name: text(120).min(1, "ne doit pas être vide"),
  source: z.enum(MODIFIER_SOURCES, "doit être technique, advantage, disadvantage ou other"),
  appliesTo: z.enum(MODIFIER_TARGETS, "doit être all, skill, trait, attack, damage, initiative ou armor"),
  /** Compétence visée (appliesTo = skill). */
  skill: text(80).optional(),
  /** Trait visé (appliesTo = trait). */
  trait: RollTraitSchema.optional(),
  rolled: int(-10, 10).default(0),
  kept: int(-10, 10).default(0),
  /** Bonus fixe au total, ou au ND d'armure pour appliesTo = armor. */
  flat: int(-50, 50).default(0),
  freeRaises: int(0, 10).default(0),
  mode: z.enum(["always", "optional"], "doit être always ou optional").default("always"),
  note: text().default(""),
}, "doit être un objet");

/**
 * Champs de la fiche, validés un par un lors d'une fusion (HANDOFF §8).
 * Les textes libres et listes secondaires sont facultatifs dans un fichier importé.
 */
export const characterShape = {
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: text(80).min(1, "ne doit pas être vide"),
  clan: text(80).default(""),
  family: text(80).default(""),
  school: text(120).default(""),
  insightRank: int(1, 10),
  honor: reputation(),
  glory: reputation(),
  status: reputation(),
  xp: XpSchema,
  traits: TraitsSchema,
  voidRing: int(1, 10),
  voidPoints: int(0, 10),
  wounds: positiveInt(),
  armor: ArmorSchema,
  skills: z.array(SkillSchema, "doit être une liste"),
  weapons: z.array(WeaponSchema, "doit être une liste"),
  techniques: z.array(TechniqueSchema, "doit être une liste").default([]),
  maneuvers: z.array(ManeuverSchema, "doit être une liste").default([]),
  /** Facultatif : ajout compatible au format v1 (HANDOFF annexe B). */
  modifiers: z.array(ModifierSchema, "doit être une liste").optional(),
  advantages: text().default(""),
  disadvantages: text().default(""),
  notes: text().default(""),
};

export const CharacterSchema = z.object(characterShape).superRefine((c, ctx) => {
  if (c.voidPoints > c.voidRing) {
    ctx.addIssue({ code: "custom", path: ["voidPoints"], message: "ne peut pas dépasser l'Anneau de Vide" });
  }
});

export type TraitKey = z.infer<typeof TraitKeySchema>;
export type RollTrait = z.infer<typeof RollTraitSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Maneuver = z.infer<typeof ManeuverSchema>;
export type Modifier = z.infer<typeof ModifierSchema>;
export type ModifierTarget = (typeof MODIFIER_TARGETS)[number];
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
