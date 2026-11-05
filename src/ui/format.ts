import { INTL, type Locale, type Messages } from "../i18n";
import { FEET_TO_METERS } from "../rules/l5r4e";

/** Pourcentage de réussite, borné aux extrêmes ; espace avant « % » en français seulement (annexe 52.3). */
export function pct(p: number, locale: Locale = "fr"): string {
  const unit = locale === "fr" ? " %" : "%";
  if (p >= 0.995) return `≥99${unit}`;
  if (p < 0.005) return `<1${unit}`;
  return `${Math.round(p * 100)}${unit}`;
}

/** Lettre des dés gardés : « 5g3 » en français, « 5k3 » en anglais (annexe 52.3). */
export const DICE_LETTER = { fr: "g", en: "k" } as const satisfies Record<Locale, string>;

/** Réserve dans la notation de la langue. Les saisies acceptent les deux notations (`parseDR`). */
export function formatPool(rolled: number, kept: number, locale: Locale = "fr"): string {
  return `${rolled}${DICE_LETTER[locale]}${kept}`;
}

/** Pieds → mètres, une décimale, séparateur de la locale. */
export function toMeters(feet: number, intl = "fr-FR"): string {
  return `${decimal(feet * FEET_TO_METERS, intl)} m`;
}

/** Distance dans l'unité de la langue : mètres en français (`3,0 m`), pieds en anglais (`10 ft`) (annexe 52.3). */
export function formatDistance(feet: number, locale: Locale = "fr"): string {
  return locale === "fr" ? toMeters(feet, INTL.fr) : `${feet} ft`;
}

/** Valeur lisible dans l'aperçu d'un import ; `values` : textes de la langue courante (`t.import.values`). */
export function show(v: unknown, values: Messages["import"]["values"]): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v === "" ? values.empty : values.quote(v);
  if (Array.isArray(v)) return v.length ? v.map((x) => show(x, values)).join(", ") : values.none;
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
