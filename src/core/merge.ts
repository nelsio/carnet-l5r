import { z } from "zod";
import { DEFAULT_MANEUVERS } from "../rules/l5r4e";
import { normalize } from "./engine";
import { CharacterFormatError, isObject, upgrade, withV2Defaults } from "./migrate";
import {
  ArmorSchema, CharacterSchema, ManeuverSchema, ModifierSchema, SkillSchema, TechniqueSchema, TraitsSchema,
  WeaponSchema, XpSchema, characterShape, zodErrors,
  type Character, type FieldError,
} from "./schema";

export interface Change {
  path: string;
  before: unknown;
  after: unknown;
  kind: "update" | "add";
}

export type MergeResult =
  | { ok: true; character: Character; changes: Change[]; warnings: string[] }
  | { ok: false; errors: FieldError[] };

type Json = Record<string, unknown>;
type ObjectSchema = z.ZodObject<z.ZodRawShape>;

const OBJECT_FIELDS: Record<string, ObjectSchema> = { traits: TraitsSchema, xp: XpSchema, armor: ArmorSchema };

interface ListField {
  schema: ObjectSchema;
  /** Champs d'identité : jamais écrasés lors d'une mise à jour. */
  identity: string[];
}

const LIST_FIELDS: Record<string, ListField> = {
  skills: { schema: SkillSchema, identity: ["name"] },
  weapons: { schema: WeaponSchema, identity: ["name"] },
  techniques: { schema: TechniqueSchema, identity: ["name"] },
  maneuvers: { schema: ManeuverSchema, identity: ["id", "name"] },
  modifiers: { schema: ModifierSchema, identity: ["id", "name"] },
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sameName = (a: unknown, b: unknown) => typeof a === "string" && typeof b === "string" && normalize(a) === normalize(b);

/** Élément correspondant : par `id` s'il y en a un, sinon par nom normalisé. */
function findMatch(list: Json[], item: Json, field: ListField): Json | undefined {
  if (field.identity.includes("id") && typeof item.id === "string") {
    const byId = list.find((e) => e.id === item.id);
    if (byId) return byId;
  }
  return list.find((e) => sameName(e.name, item.name));
}

/**
 * Fusionne un JSON (complet ou partiel) dans une fiche (HANDOFF §8).
 * Ne modifie jamais `base`. Un seul champ invalide bloque toute la fusion.
 */
export function mergeCharacter(base: Character, patch: unknown): MergeResult {
  if (!isObject(patch)) return { ok: false, errors: [{ path: "", message: "doit être un objet JSON" }] };

  let src: Json;
  try {
    src = upgrade(patch);
  } catch (e) {
    if (e instanceof CharacterFormatError) return { ok: false, errors: e.errors };
    throw e;
  }
  delete src.schemaVersion;

  // Fiche d'une version antérieure (ex. spec v1) : ramenée au format courant avant la fusion.
  const out = upgrade(structuredClone(base) as unknown as Json);
  const changes: Change[] = [];
  const warnings: string[] = [];
  const errors: FieldError[] = [];

  const parse = (schema: z.core.$ZodType, value: unknown, path: string): { ok: true; value: unknown } | { ok: false } => {
    const r = z.safeParse(schema, value);
    if (r.success) return { ok: true, value: r.data };
    errors.push(...zodErrors(r.error, path));
    return { ok: false };
  };

  const set = (target: Json, key: string, value: unknown, path: string) => {
    if (same(target[key], value)) return;
    changes.push({ path, before: target[key], after: value, kind: "update" });
    target[key] = value;
  };

  const mergeObject = (key: string, value: unknown, schema: ObjectSchema) => {
    if (!isObject(value)) {
      errors.push({ path: key, message: "doit être un objet" });
      return;
    }
    const target = out[key] as Json;
    for (const [sub, v] of Object.entries(value)) {
      const path = `${key}.${sub}`;
      const fieldSchema = schema.shape[sub];
      if (!fieldSchema) warnings.push(path);
      else if (v !== null) {
        const r = parse(fieldSchema, v, path);
        if (r.ok) set(target, sub, r.value, path);
      }
    }
  };

  const mergeList = (key: string, value: unknown, field: ListField) => {
    if (!Array.isArray(value)) {
      errors.push({ path: key, message: "doit être une liste" });
      return;
    }
    if (value.length === 0) return;
    // Une liste de manœuvres vide vaut les manœuvres par défaut.
    if (key === "maneuvers" && (out.maneuvers as unknown[]).length === 0) out.maneuvers = structuredClone(DEFAULT_MANEUVERS);
    // Liste facultative (bonus de jet) absente de la fiche : elle est créée.
    out[key] ??= [];
    const list = out[key] as Json[];

    value.forEach((item, i) => {
      const itemPath = `${key}[${i}]`;
      if (!isObject(item)) {
        errors.push({ path: itemPath, message: "doit être un objet" });
        return;
      }
      const known: Json = {};
      for (const [f, v] of Object.entries(item)) {
        if (!(f in field.schema.shape)) warnings.push(`${itemPath}.${f}`);
        else if (v !== null) known[f] = v;
      }

      const match = findMatch(list, known, field);
      if (match) {
        const label = `${key}[${String(match.name)}]`;
        for (const [f, v] of Object.entries(known)) {
          if (field.identity.includes(f)) continue;
          const r = parse(field.schema.shape[f], v, `${itemPath}.${f}`);
          if (r.ok) set(match, f, r.value, `${label}.${f}`);
        }
        return;
      }

      const r = parse(field.schema, known, itemPath);
      if (r.ok) {
        list.push(r.value as Json);
        changes.push({ path: `${key}[${String((r.value as Json).name)}]`, before: null, after: r.value, kind: "add" });
      }
    });
  };

  for (const [key, value] of Object.entries(src)) {
    if (!(key in characterShape)) {
      warnings.push(key);
      continue;
    }
    if (value === null) continue;
    const objectSchema = OBJECT_FIELDS[key];
    const listField = LIST_FIELDS[key];
    if (objectSchema) mergeObject(key, value, objectSchema);
    else if (listField) mergeList(key, value, listField);
    else {
      const r = parse(characterShape[key as keyof typeof characterShape], value, key);
      if (r.ok) set(out, key, r.value, key);
    }
  }

  if (errors.length) return { ok: false, errors };

  // Contrôles croisés sur la fiche obtenue (ex. points de Vide <= Anneau de Vide).
  const final = CharacterSchema.safeParse(out);
  if (!final.success) return { ok: false, errors: zodErrors(final.error) };
  return { ok: true, character: withV2Defaults(final.data), changes, warnings };
}
