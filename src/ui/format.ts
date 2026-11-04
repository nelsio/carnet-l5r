import { FEET_TO_METERS } from "../rules/l5r4e";

/** Pourcentage de réussite, borné aux extrêmes. */
export function pct(p: number): string {
  if (p >= 0.995) return "≥99 %";
  if (p < 0.005) return "<1 %";
  return `${Math.round(p * 100)} %`;
}

/** Pieds → mètres, une décimale, virgule française. */
export function toMeters(feet: number): string {
  return `${(feet * FEET_TO_METERS).toFixed(1).replace(".", ",")} m`;
}

/** Valeur lisible dans l'aperçu d'un import. */
export function show(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v === "" ? "(vide)" : `« ${v} »`;
  if (Array.isArray(v)) return v.length ? v.map(show).join(", ") : "(aucune)";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Réputation : une décimale, virgule française. */
export function decimal(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}
