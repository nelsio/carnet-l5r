import { FEET_TO_METERS } from "../rules/l5r4e";

/** Pourcentage de réussite, borné aux extrêmes. */
export function pct(p: number): string {
  if (p >= 0.995) return "≥99 %";
  if (p < 0.005) return "<1 %";
  return `${Math.round(p * 100)} %`;
}

/** Pieds → mètres, une décimale, séparateur de la locale. */
export function toMeters(feet: number, intl = "fr-FR"): string {
  return `${decimal(feet * FEET_TO_METERS, intl)} m`;
}

/** Valeur lisible dans l'aperçu d'un import. */
export function show(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v === "" ? "(vide)" : `« ${v} »`;
  if (Array.isArray(v)) return v.length ? v.map(show).join(", ") : "(aucune)";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Une décimale, séparateur de la locale (virgule en français) ; arrondi de `toFixed`. */
export function decimal(n: number, intl = "fr-FR"): string {
  return Number(n.toFixed(1)).toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
}

export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}
