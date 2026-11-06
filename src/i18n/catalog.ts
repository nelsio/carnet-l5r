/**
 * Catalogues dans la langue de l'interface (annexe 54) : écoles, techniques, maîtrises, table de bataille.
 * Les données de règles restent canoniques en français (`src/rules/*.json`) ; l'anglais est une surcouche
 * d'affichage (`src/rules/en/*.json`), clés par id. Un texte anglais absent ou vide laisse le texte français.
 */
import { useMemo } from "react";
import { reminderText, type ActiveEffect } from "../core/schools";
import type { Character } from "../core/schema";
import type { School, SchoolRank, SpellOption } from "../rules/ecoles";
import type { BattleEvent } from "../rules/l5r4e";
import battleEn from "../rules/en/bataille.json";
import schoolsEn from "../rules/en/ecoles.json";
import masteriesEn from "../rules/en/maitrises.json";
import { useLocale, useT, type Locale, type Messages } from ".";

/** Textes d'un effet, par index dans la liste du rang ou de la maîtrise. */
export interface EffectWords { label?: string; stackLabel?: string; text?: string }
export interface RankWords { name?: string; summary?: string; effects?: Record<string, EffectWords> }
export interface SchoolWords {
  name?: string;
  ranks?: Record<string, RankWords>;
  spellcasting?: { options?: Record<string, string>; reminders?: string[]; startingSpells?: string };
}
export interface MasteryWords { summary?: string; effects?: Record<string, EffectWords> }

/** Surcouche d'une langue : clans et classes par nom français, écoles par id, maîtrises par « compétence@rang ». */
export interface CatalogOverlay {
  clans: Record<string, string>;
  classes: Record<string, string>;
  spellKeywords: Record<string, string>;
  schools: Record<string, SchoolWords>;
  masteries: Record<string, MasteryWords>;
  events: Record<string, string>;
}

export const CATALOG_EN: CatalogOverlay = {
  clans: schoolsEn.clans,
  classes: schoolsEn.classes,
  spellKeywords: schoolsEn.spellKeywords,
  schools: schoolsEn.schools as Record<string, SchoolWords>,
  masteries: masteriesEn.masteries as Record<string, MasteryWords>,
  events: battleEn.events,
};

/** Texte de la surcouche s'il existe et n'est pas vide, sinon le texte français (repli silencieux). */
export function catalogText(fr: string, en: string | undefined, locale: Locale): string {
  return locale === "en" && en ? en : fr;
}

/** Textes d'un effet actif : technique (titre), résumé, case à cocher, compteur et rappel. */
export interface EffectText { technique: string; summary: string; label?: string; stackLabel?: string; text?: string }

/** Lecteur du catalogue dans une langue ; `rules` donne le titre d'une maîtrise, `overlay` sert aux tests. */
export function catalogFor(locale: Locale, rules: Pick<Messages["rules"], "masteryTitle">, overlay: CatalogOverlay = CATALOG_EN) {
  const pick = (fr: string, en: string | undefined) => catalogText(fr, en, locale);
  const schoolWords = (id: string): SchoolWords | undefined => overlay.schools[id];
  const rankWords = (id: string, rank: number): RankWords | undefined => schoolWords(id)?.ranks?.[String(rank)];
  const effectWords = (e: ActiveEffect): { words?: EffectWords; summary?: string; technique?: string } => {
    if ("school" in e.origin) {
      const r = rankWords(e.origin.school, e.origin.rank);
      return { words: r?.effects?.[String(e.origin.index)], summary: r?.summary, technique: r?.name };
    }
    const m = overlay.masteries[e.origin.mastery];
    return { words: m?.effects?.[String(e.origin.index)], summary: m?.summary };
  };

  return {
    locale,
    schoolName: (s: School) => pick(s.name, schoolWords(s.id)?.name),
    clan: (frClan: string) => pick(frClan, overlay.clans[frClan]),
    schoolClass: (s: School) => pick(s.class, overlay.classes[s.class]),
    rankName: (s: School, r: SchoolRank) => pick(r.name, rankWords(s.id, r.rank)?.name),
    rankSummary: (s: School, r: SchoolRank) => pick(r.summary, rankWords(s.id, r.rank)?.summary),
    effect(e: ActiveEffect): EffectText {
      const en = effectWords(e);
      const label = "label" in e ? e.label : undefined;
      const stackLabel = "stack" in e && e.stack ? e.stack.label : undefined;
      const text = e.kind === "reminder" ? e.text : undefined;
      const technique = e.mastery ? rules.masteryTitle(e.mastery, e.rank) : pick(e.technique, en.technique);
      return {
        technique,
        summary: pick(e.summary, en.summary),
        ...(label ? { label: pick(label, en.words?.label) } : {}),
        ...(stackLabel ? { stackLabel: pick(stackLabel, en.words?.stackLabel) } : {}),
        ...(text ? { text: pick(text, en.words?.text) } : {}),
      };
    },
    /** Texte d'un rappel (`reminderText`), `{n}` remplacé par sa valeur. */
    reminder(e: ActiveEffect, c: Character): string {
      const t = this.effect(e);
      return reminderText(e, c, { text: t.text, summary: t.summary });
    },
    spellOption: (s: School, o: SpellOption) => pick(o.label, schoolWords(s.id)?.spellcasting?.options?.[o.id]),
    spellReminders: (s: School) => (s.spellcasting?.reminders ?? []).map((r, i) => pick(r, schoolWords(s.id)?.spellcasting?.reminders?.[i])),
    startingSpells: (s: School) => pick(s.spellcasting?.startingSpells ?? "", schoolWords(s.id)?.spellcasting?.startingSpells),
    spellKeyword: (k: string) => pick(k, overlay.spellKeywords[k]),
    battleEvent: (fr: string, ev: BattleEvent) => pick(fr, overlay.events[ev]),
  };
}

export type Catalog = ReturnType<typeof catalogFor>;

/** Catalogue dans la langue courante. */
export function useCatalog(): Catalog {
  const { locale } = useLocale();
  const { rules } = useT();
  return useMemo(() => catalogFor(locale, rules), [locale, rules]);
}
