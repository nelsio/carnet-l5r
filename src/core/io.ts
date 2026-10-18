import { normalize } from "./engine";
import { CharacterFormatError, migrate } from "./migrate";
import { MAX_CHARACTER_BYTES, type Character, type FieldError } from "./schema";

/** `<nom-normalisé>-l5r.json` (HANDOFF §8). */
export function exportFileName(c: Pick<Character, "name">): string {
  const slug = normalize(c.name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "fiche"}-l5r.json`;
}

/** JSON indenté, `schemaVersion` inclus. */
export function serializeCharacter(c: Character): string {
  return `${JSON.stringify(c, null, 2)}\n`;
}

export type ParsedFile = { ok: true; json: unknown } | { ok: false; errors: FieldError[] };

/** Lecture d'un fichier importé : taille maximale, puis analyse JSON. */
export function parseCharacterFile(text: string, bytes = new TextEncoder().encode(text).length): ParsedFile {
  if (bytes > MAX_CHARACTER_BYTES) {
    return { ok: false, errors: [{ path: "", message: `Fichier trop volumineux (${Math.ceil(bytes / 1024)} Ko, maximum ${MAX_CHARACTER_BYTES / 1024} Ko)` }] };
  }
  try {
    return { ok: true, json: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, errors: [{ path: "", message: "Fichier illisible : ce n'est pas un JSON valide" }] };
  }
}

export type ImportResult = { ok: true; character: Character } | { ok: false; errors: FieldError[] };

/** Fiche complète (destinations « Nouvelle fiche » et « Consultation ») : migrée puis validée. */
export function importCharacter(json: unknown): ImportResult {
  try {
    return { ok: true, character: migrate(json) };
  } catch (e) {
    if (e instanceof CharacterFormatError) return { ok: false, errors: e.errors };
    throw e;
  }
}
