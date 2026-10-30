import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Copie figée des 6 fichiers du grimoire au 30/10/2026, descriptions remplacées par « … » (lot 30, GR1). */
export const GRIMOIRE_KEYS = ["universels", "air", "terre", "feu", "eau", "vide"] as const;

export function grimoireFixture(key: (typeof GRIMOIRE_KEYS)[number]): string {
  return readFileSync(resolve(__dirname, `../fixtures/grimoire/sorts-${key}.js`), "utf-8");
}

/** Fichier du grimoire minimal, de la même forme que les vrais. */
export function grimoireFile(entries: string, name = "SORTS_TEST"): string {
  return `const ${name} = [\n${entries}\n];\n\nif (typeof window !== "undefined") {\n  window.${name} = ${name};\n}\n`;
}

/** Réponse simulée : seuls `ok`, `status`, `headers` et `text()` sont lus par loadGrimoire. */
export function fakeResponse(text: string, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(), text: async () => text } as Response;
}

/** `fetch` simulé qui sert les fixtures par nom de fichier ; `override` remplace la réponse d'un fichier. */
export function fixtureFetch(override: Partial<Record<string, () => Promise<Response>>> = {}) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    const key = /sorts-([a-z]+)\.js$/.exec(url)?.[1] ?? "";
    const custom = override[key];
    if (custom) return custom();
    if (!(GRIMOIRE_KEYS as readonly string[]).includes(key)) return fakeResponse("", 404);
    return fakeResponse(grimoireFixture(key as (typeof GRIMOIRE_KEYS)[number]));
  };
}
