import { DEFAULT_MANEUVERS, findSkill, normalize, type Character, type Maneuver } from "@carnet/core";
import { INTL, type Locale, type Messages } from "../i18n";
import { FEET_TO_METERS, SKILL_NAMES, SKILL_SUBTYPES, type SkillName } from "../rules/l5r4e";

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

const findName = (list: readonly SkillName[], name: string) => {
  const n = normalize(name);
  return list.find((s) => [s.fr, ...(s.legacy ?? []), s.en].some((x) => normalize(x) === n));
};

/**
 * Nom d'une compétence issue du catalogue (« Courtisan », « Connaissance : Histoire ») dans la langue :
 * « Courtier », « Lore: History » en anglais (annexe 53.3). Un nom inconnu est rendu tel quel.
 * Un nom issu de la fiche ne passe pas par ici : il s'affiche tel que saisi.
 */
export function skillLabel(name: string, locale: Locale): string {
  const whole = findName(SKILL_NAMES, name);
  if (whole) return whole[locale];
  const colon = name.indexOf(":");
  if (colon < 0) return name;
  const prefix = findName(SKILL_NAMES, name.slice(0, colon).trim());
  const sub = name.slice(colon + 1).trim();
  if (!prefix) return name;
  const subName = findName(SKILL_SUBTYPES, sub)?.[locale] ?? sub;
  return locale === "fr" ? `${prefix.fr} : ${subName}` : `${prefix.en}: ${subName}`;
}

/** Compétence d'une action : le nom de la fiche si le personnage l'a, sinon le nom du catalogue dans la langue. */
export function actionSkillLabel(c: Character, name: string, locale: Locale): string {
  return findSkill(c, name)?.name ?? skillLabel(name, locale);
}

/**
 * Nom et effet affichés d'une manœuvre : ceux du dictionnaire pour une manœuvre par défaut gardée telle quelle,
 * sinon ceux de la fiche (annexe 53.1).
 */
export function maneuverText(m: Pick<Maneuver, "id" | "name" | "effect">, rules: Messages["rules"]): { name: string; effect: string } {
  const book = DEFAULT_MANEUVERS.find((d) => d.id === m.id);
  const own = rules.maneuvers[m.id];
  if (!book || !own) return { name: m.name, effect: m.effect };
  return {
    name: normalize(book.name) === normalize(m.name) ? own.name : m.name,
    effect: normalize(book.effect) === normalize(m.effect) ? own.effect : m.effect,
  };
}
