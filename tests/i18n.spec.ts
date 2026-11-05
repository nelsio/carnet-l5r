/** Localisation, infrastructure (annexe 50) : dictionnaire typé, langue détectée, messages de validation. */
import { afterEach, describe, expect, it } from "vitest";
import { migrate, setValidationMessages } from "@carnet/core";
import { detectLocale, INTL, type Messages } from "../src/i18n";
import { en } from "../src/i18n/en";
import { fr } from "../src/i18n/fr";
import kakita from "./fixtures/kakita-v1.json";

describe("Langue du premier lancement (50.1)", () => {
  it.each([
    ["en-US", "en"], ["en", "en"], ["EN-gb", "en"],
    ["fr-FR", "fr"], ["pt-PT", "fr"], ["", "fr"], [undefined, "fr"],
  ] as const)("%s → %s", (language, locale) => {
    expect(detectLocale(language)).toBe(locale);
  });

  it("locale Intl de chaque langue", () => {
    expect(INTL).toEqual({ fr: "fr-FR", en: "en-US" });
  });
});

describe("Dictionnaire typé (50.1, I3)", () => {
  it("l'anglais a la forme du français", () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) =>
      typeof v === "object" && v !== null ? keys(v).map((s) => `${k}.${s}`) : [k]);
    expect(keys(en)).toEqual(keys(fr));
  });

  it("une clé absente de l'anglais fait échouer tsc", () => {
    const { notEmpty, ...validation } = en.validation;
    expect(notEmpty).toBe("must not be empty");
    // @ts-expect-error clé manquante : `tsc --noEmit` échoue sans cette directive.
    const incomplete: Messages = { ...en, validation };
    // @ts-expect-error clé en trop : idem.
    const extra: Messages = { ...en, validation: { ...en.validation, inconnue: "?" } };
    expect([incomplete, extra]).toHaveLength(2);
  });
});

describe("Messages de validation dans la langue de l'interface (50.2)", () => {
  afterEach(() => setValidationMessages(fr.validation));
  const invalid = () => ({ ...structuredClone(kakita), traits: { ...kakita.traits, agility: 0 } });

  it("français par défaut, identiques aux messages d'avant le lot 50", () => {
    expect(() => migrate(invalid())).toThrow("traits.agility : doit être un entier entre 1 et 10");
  });

  it("suivent le dictionnaire courant, lus au moment de la validation", () => {
    setValidationMessages({ ...fr.validation, intBetween: (min, max) => `must be an integer from ${min} to ${max}` });
    expect(() => migrate(invalid())).toThrow("traits.agility : must be an integer from 1 to 10");
  });
});
