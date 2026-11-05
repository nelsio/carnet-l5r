import type { Path } from "./types";

/** Copie immuable avec une valeur remplacée au chemin donné. */
export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path as [string | number, ...(string | number)[]];
  const src = obj as Record<string | number, unknown>;
  const copy = (Array.isArray(obj) ? [...obj] : { ...src }) as Record<string | number, unknown>;
  copy[head] = setIn(src[head], rest, value);
  return copy as T;
}
