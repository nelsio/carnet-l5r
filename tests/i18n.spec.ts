/** Localisation, infrastructure (annexe 50) : dictionnaire typé, langue détectée, messages de validation. */
import { afterEach, describe, expect, it } from "vitest";
import { mergeCharacter, migrate, parseCharacterFile, setValidationMessages } from "@carnet/core";
import { detectLocale, formatCore, INTL, type Messages } from "../src/i18n";
import { ARMOR_CATALOG, CLANS, DEFAULT_MANEUVERS, FIXED_ACTIONS, MODIFIER_TEMPLATES, STANCES, TN_SCALE, TRAIT_LABELS, WOUND_LEVELS } from "../src/rules/l5r4e";
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

describe("Vocabulaire de règles et textes du moteur (annexe 53.1, 53.2)", () => {
  it("V6 : niveaux de blessure, échelle des ND et postures de même longueur dans les deux langues", () => {
    for (const d of [fr, en]) {
      expect(d.rules.wounds).toHaveLength(WOUND_LEVELS.length);
      expect(d.rules.woundsShort).toHaveLength(WOUND_LEVELS.length);
      expect(d.rules.tnScale).toHaveLength(TN_SCALE.length);
      for (const s of STANCES) expect(d.rules.stances[s.id]?.tags).toHaveLength(s.tags.length);
    }
  });

  it("le français reprend les libellés de src/rules : rien ne change à l'écran", () => {
    expect(fr.rules.wounds).toEqual(WOUND_LEVELS.map((w) => w.label));
    expect(fr.rules.traits).toBe(TRAIT_LABELS);
    expect(fr.rules.actions.notice).toEqual({ label: FIXED_ACTIONS[0]?.label, description: FIXED_ACTIONS[0]?.description });
  });

  it("l'anglais couvre chaque action, manœuvre, modèle de bonus, armure, posture et clan", () => {
    const ids = (list: readonly { id: string }[]) => list.map((x) => x.id).sort();
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(en.rules.actions)).toEqual([...ids(FIXED_ACTIONS), "concentrate"].sort());
    expect(keys(en.rules.maneuvers)).toEqual(ids(DEFAULT_MANEUVERS));
    expect(keys(en.rules.modifierTemplates)).toEqual(ids(MODIFIER_TEMPLATES));
    expect(keys(en.rules.armors)).toEqual(ids(ARMOR_CATALOG));
    expect(keys(en.rules.stances)).toEqual(ids(STANCES));
    expect(keys(en.rules.clans)).toEqual(ids(CLANS));
    for (const a of Object.values(en.rules.actions)) expect(a.label).not.toBe("");
  });

  it("textes du moteur : XgY en français, XkY en anglais ; noms de la fiche tels quels", () => {
    const note = { key: "pool.voidPoint", katana: false, rolled: 1, kept: 1 } as const;
    expect([formatCore(fr, note), formatCore(en, note)]).toEqual(["Point de Vide : +1g1", "Void Point: +1k1"]);
    const attack = { key: "action.attackAbout", skill: "Kenjutsu", trait: "agility" } as const;
    expect(formatCore(en, attack)).toBe("Kenjutsu (Agility) against the target's Armor TN. Choose your maneuvers in the roller.");
    const modifier = { key: "pool.modifier", name: "Avantage", effect: { key: "modifier", appliesTo: "all", rolled: 1, kept: 0, flat: 0, freeRaises: 2, tn: 0 } } as const;
    expect(formatCore(en, modifier)).toBe("Avantage: +1k0, 2 Free Raises");
    expect(formatCore(en, { key: "effect", parts: [{ kind: "maneuverRaises", n: 1, maneuver: "called" }] })).toBe("1 Free Raise for Called Shot");
    expect(formatCore(en, { key: "armor.heavy", armor: "riding", tn: 5, onFoot: true })).toBe("Riding Armor: +5 TN (Agility, Reflexes, on foot)");
    expect(formatCore(en, { key: "action.label", id: "inconnue" })).toBe("inconnue");
  });

  it("messages d'import dans la langue de l'interface", () => {
    setValidationMessages(en.validation);
    expect(parseCharacterFile("{ pas du json")).toEqual({ ok: false, errors: [{ path: "", message: "Unreadable file: not valid JSON" }] });
    expect(mergeCharacter(migrate(structuredClone(kakita)), [1])).toEqual({ ok: false, errors: [{ path: "", message: "must be a JSON object" }] });
    setValidationMessages(fr.validation);
  });
});
