/**
 * Localisation de l'interface (annexe 50) : un dictionnaire TypeScript par langue, sans bibliothèque.
 * `fr.ts` fait référence ; `en.ts` doit avoir exactement la même forme (`Messages`), sinon `tsc` échoue.
 */
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setValidationMessages } from "../core/schema";
import { en } from "./en";
import { fr } from "./fr";

/** Forme du dictionnaire : textes élargis en `string`, fonctions d'interpolation gardées telles quelles. */
type Widen<T> = T extends (...a: infer A) => infer R ? (...a: A) => R
  : T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> };
export type Messages = Widen<typeof fr>;
export type Locale = "fr" | "en";

const DICTIONARIES: Record<Locale, Messages> = { fr, en };
/** Locale `Intl` de chaque langue : dates, nombres. */
export const INTL = { fr: "fr-FR", en: "en-US" } as const satisfies Record<Locale, string>;

/** Langue du premier lancement : `en*` → anglais, toute autre langue → français (annexe 50.1). */
export function detectLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

/** Langue choisie avec le bouton FR/EN, même modèle que `carnet-theme` (annexe 52.2). */
export const LOCALE_KEY = "carnet-lang";

/** Langue au lancement : le choix mémorisé, sinon celle du navigateur ; stockage illisible → langue détectée. */
export function initialLocale(language: string | undefined = globalThis.navigator?.language): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "fr" || saved === "en") return saved;
  } catch {
    // Stockage bloqué : la langue du navigateur suffit.
  }
  return detectLocale(language);
}

function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Stockage bloqué : le choix vaut pour la session.
  }
}

interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  intl: (typeof INTL)[Locale];
  t: Messages;
}

// Sans fournisseur (composants rendus seuls dans les tests) : français, langue figée.
const I18nContext = createContext<I18n>({ locale: "fr", setLocale: () => undefined, intl: INTL.fr, t: fr });

/**
 * Fournit la langue à l'interface ; garde dans la même langue les messages de validation du schéma,
 * `<html lang>` et la description de la page. Un changement de langue est mémorisé (annexe 52.2).
 */
export function I18nProvider({ locale: initial = "fr", children }: { locale?: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initial);
  const value = useMemo<I18n>(() => ({
    locale,
    setLocale: (next: Locale) => {
      saveLocale(next);
      setLocale(next);
    },
    intl: INTL[locale],
    t: DICTIONARIES[locale],
  }), [locale]);
  useEffect(() => {
    setValidationMessages(value.t.validation);
    document.documentElement.lang = value.locale;
    document.querySelector('meta[name="description"]')?.setAttribute("content", value.t.header.metaDescription);
  }, [value]);
  return createElement(I18nContext.Provider, { value }, children);
}

/** Dictionnaire de la langue courante. */
export const useT = (): Messages => useContext(I18nContext).t;

/** Langue courante, changement de langue et locale `Intl`. */
export function useLocale(): Pick<I18n, "locale" | "setLocale" | "intl"> {
  const { locale, setLocale, intl } = useContext(I18nContext);
  return { locale, setLocale, intl };
}
