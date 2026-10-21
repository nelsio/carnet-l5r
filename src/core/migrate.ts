import { CharacterSchema, SCHEMA_VERSION, zodErrors, type Character, type FieldError } from "./schema";
import { catalogWeapon } from "./schools";

type Json = Record<string, unknown>;

export const NEWER_VERSION_MESSAGE = "Fichier créé par une version plus récente de l'outil";

export class CharacterFormatError extends Error {
  constructor(readonly errors: FieldError[]) {
    super(errors.map((e) => (e.path ? `${e.path} : ${e.message}` : e.message)).join("\n"));
    this.name = "CharacterFormatError";
  }
}

export function isObject(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Version du format d'un JSON : absente = v0 (prototype). */
export function schemaVersionOf(json: Json): number {
  return typeof json.schemaVersion === "number" ? json.schemaVersion : 0;
}

function rename(o: Json, from: string, to: string): void {
  if (from in o) {
    if (!(to in o)) o[to] = o[from];
    Reflect.deleteProperty(o, from);
  }
}

const toNumber = (v: unknown) => {
  if (typeof v !== "string") return v;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * v0 (prototype) → v1 (HANDOFF annexe A).
 * Ne transforme que les clés présentes : sert aussi aux fusions partielles.
 */
function v0ToV1(src: Json): Json {
  const o: Json = structuredClone(src);
  rename(o, "insight", "insightRank");
  rename(o, "void", "voidRing");
  for (const k of ["honor", "glory", "status"]) if (k in o) o[k] = toNumber(o[k]);
  if ("xpTotal" in o || "xpSpent" in o) {
    const xp: Json = isObject(o.xp) ? o.xp : {};
    if ("xpTotal" in o) xp.total = o.xpTotal;
    if ("xpSpent" in o) xp.spent = o.xpSpent;
    o.xp = xp;
    delete o.xpTotal;
    delete o.xpSpent;
  }
  if (Array.isArray(o.skills)) {
    o.skills = o.skills.map((s) => {
      if (!isObject(s) || !("emph" in s)) return s;
      const { emph, ...rest } = s;
      const emphases = typeof emph === "string" ? emph.split(/[,;]/).map((x) => x.trim()).filter(Boolean) : emph;
      return { ...rest, emphases };
    });
  }
  if (Array.isArray(o.weapons)) {
    o.weapons = o.weapons.map((w) => {
      if (!isObject(w)) return w;
      const out = { ...w };
      rename(out, "bow", "bowStrength");
      if (out.bowStrength === null || out.bowStrength === "") delete out.bowStrength;
      return out;
    });
  }
  if (Array.isArray(o.maneuvers)) {
    o.maneuvers = o.maneuvers.map((m) => {
      if (!isObject(m)) return m;
      const out = { ...m };
      const fromV0 = "k" in out;
      rename(out, "k", "id");
      rename(out, "n", "name");
      rename(out, "eff", "effect");
      rename(out, "rep", "stackable");
      // Le prototype omettait `rep` pour les manœuvres non cumulables.
      if (fromV0) out.stackable = Boolean(out.stackable);
      return out;
    });
  }
  return o;
}

/**
 * v1 → v2 (HANDOFF annexe C.2) : mots-clés des armes connues du catalogue.
 * `schoolId` et `schoolRank` prennent leur valeur par défaut à la validation ;
 * une arme inconnue reste sans `keywords` (liste vide par défaut, ou valeur conservée lors d'une fusion).
 */
function v1ToV2(src: Json): Json {
  const o: Json = structuredClone(src);
  if (Array.isArray(o.weapons)) {
    o.weapons = o.weapons.map((w) => {
      if (!isObject(w) || "keywords" in w || typeof w.name !== "string") return w;
      const known = catalogWeapon(w.name);
      return known ? { ...w, keywords: [...known.keywords] } : w;
    });
  }
  return o;
}

/** Migrations successives : MIGRATIONS[n] amène la version n à n + 1. */
const MIGRATIONS: Record<number, (o: Json) => Json> = {
  0: v0ToV1,
  1: v1ToV2,
};

/** Ramène un JSON (complet ou partiel) au format courant, sans le valider. */
export function upgrade(json: Json): Json {
  const version = schemaVersionOf(json);
  if (version > SCHEMA_VERSION) throw new CharacterFormatError([{ path: "schemaVersion", message: NEWER_VERSION_MESSAGE }]);
  let o = json;
  for (let v = version; v < SCHEMA_VERSION; v++) o = MIGRATIONS[v](o);
  return { ...o, schemaVersion: SCHEMA_VERSION };
}

/** Ramène toute version connue au format courant et valide la fiche complète. */
export function migrate(json: unknown): Character {
  if (!isObject(json)) throw new CharacterFormatError([{ path: "", message: "doit être un objet JSON" }]);
  const result = CharacterSchema.safeParse(upgrade(json));
  if (!result.success) throw new CharacterFormatError(zodErrors(result.error));
  return withV2Defaults(result.data);
}

/** Fiche complète : école et mots-clés explicites (`""`, `null`, `[]`). */
export function withV2Defaults(c: Character): Character {
  return {
    ...c,
    schoolId: c.schoolId ?? "",
    schoolRank: c.schoolRank ?? null,
    weapons: c.weapons.map((w) => ({ ...w, keywords: w.keywords ?? [] })),
  };
}
