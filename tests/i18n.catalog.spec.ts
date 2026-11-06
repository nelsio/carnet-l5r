/**
 * Catalogues en anglais (annexe 54) : surcouches `src/rules/en/*.json` des écoles, maîtrises et table de bataille.
 * C1 couverture, C2 repli sur le français, C3 chiffres, C4 clés.
 */
import { describe, expect, it } from "vitest";
import { activeEffects, migrate, type ActiveEffect, type Character } from "@carnet/core";
import type { CoreText } from "../src/core/text";
import { formatCore } from "../src/i18n";
import { en } from "../src/i18n/en";
import { rulesEn } from "../src/i18n/rules-en";
import { rulesFr } from "../src/i18n/rules-fr";
import { CATALOG_EN, catalogFor, catalogText, type CatalogOverlay, type EffectWords } from "../src/i18n/catalog";
import { MASTERIES, SCHOOLS, type Effect } from "../src/rules/ecoles";
import { BATTLE_EVENT_LABELS } from "../src/rules/l5r4e";
import kakita from "../reference/exemple-personnage.json";

/** Textes affichés d'un effet du catalogue français. */
function effectTexts(e: Effect | { kind: string }): EffectWords {
  const out: EffectWords = {};
  if ("label" in e && typeof e.label === "string") out.label = e.label;
  if ("stack" in e && e.stack && typeof e.stack === "object" && "label" in e.stack) out.stackLabel = e.stack.label as string;
  if ("text" in e && typeof e.text === "string") out.text = e.text;
  return out;
}

/** Paires (lieu, français, anglais) de tout le catalogue ; anglais `undefined` s'il manque. */
function pairs(en: CatalogOverlay = CATALOG_EN): { where: string; fr: string; en: string | undefined }[] {
  const out: { where: string; fr: string; en: string | undefined }[] = [];
  for (const s of SCHOOLS) {
    const w = en.schools[s.id];
    out.push({ where: `${s.id} : nom`, fr: s.name, en: w?.name });
    for (const r of s.ranks) {
      const rw = w?.ranks?.[String(r.rank)];
      out.push({ where: `${s.id} R${r.rank} : nom`, fr: r.name, en: rw?.name });
      out.push({ where: `${s.id} R${r.rank} : résumé`, fr: r.summary, en: rw?.summary });
      r.effects.forEach((e, i) => {
        for (const [field, fr] of Object.entries(effectTexts(e))) {
          out.push({ where: `${s.id} R${r.rank} effet ${i} : ${field}`, fr, en: rw?.effects?.[String(i)]?.[field as keyof EffectWords] });
        }
      });
    }
    const sc = s.spellcasting;
    if (sc) {
      const sw = w?.spellcasting;
      for (const o of sc.options ?? []) out.push({ where: `${s.id} case ${o.id}`, fr: o.label, en: sw?.options?.[o.id] });
      (sc.reminders ?? []).forEach((r, i) => out.push({ where: `${s.id} rappel ${i}`, fr: r, en: sw?.reminders?.[i] }));
      out.push({ where: `${s.id} sorts de départ`, fr: sc.startingSpells, en: sw?.startingSpells });
      for (const k of sc.freeRaiseKeywords ?? []) out.push({ where: `mot-clé ${k}`, fr: k, en: en.spellKeywords[k] });
    }
    out.push({ where: `clan ${s.clan}`, fr: s.clan, en: en.clans[s.clan] });
    out.push({ where: `classe ${s.class}`, fr: s.class, en: en.classes[s.class] });
  }
  for (const m of MASTERIES) {
    const key = `${m.skill}@${m.rank}`;
    const mw = en.masteries[key];
    out.push({ where: `maîtrise ${key} : résumé`, fr: m.summary, en: mw?.summary });
    m.effects.forEach((e, i) => {
      for (const [field, fr] of Object.entries(effectTexts(e))) {
        out.push({ where: `maîtrise ${key} effet ${i} : ${field}`, fr, en: mw?.effects?.[String(i)]?.[field as keyof EffectWords] });
      }
    });
  }
  for (const [id, fr] of Object.entries(BATTLE_EVENT_LABELS)) out.push({ where: `événement ${id}`, fr, en: en.events[id] });
  return out;
}

/** Nombres d'un texte : « 1g0 » et « 1k0 » pareils, « once » vaut 1, virgule décimale en point, mètres en pieds, renvois de la spec ôtés. */
function numbers(text: string): string[] {
  const t = text
    .replace(/annexe [A-Z0-9.]+/g, "")
    .replace(/\bonce\b/gi, "1")
    .replace(/(\d+)\s?m\b/g, (_, n: string) => String(Math.round(Number(n) / 0.3)))
    .replace(/(\d),(\d)/g, "$1.$2");
  return [...new Set(t.match(/\d+(?:\.\d+)?/g) ?? [])].sort();
}

describe("Catalogues en anglais (annexe 54)", () => {
  it("C1 : chaque école × rang, effet, maîtrise et événement de bataille a un texte anglais", () => {
    const missing = pairs().filter((p) => !p.en?.trim()).map((p) => p.where);
    expect(missing).toEqual([]);
    expect(SCHOOLS).toHaveLength(40);
  });

  it("C2 : une entrée anglaise absente ou vide laisse le texte français, sans erreur", () => {
    const hida = SCHOOLS.find((s) => s.id === "hida-bushi")!;
    const others = Object.fromEntries(Object.entries(CATALOG_EN.schools).filter(([id]) => id !== "hida-bushi"));
    const trimmed: CatalogOverlay = { ...CATALOG_EN, schools: { ...others, "kakita-bushi": { name: "" } }, events: {} };
    const cat = catalogFor("en", rulesEn, trimmed);
    expect(cat.schoolName(hida)).toBe("École de bushi Hida");
    expect(cat.rankSummary(hida, hida.ranks[0]!)).toBe(hida.ranks[0]!.summary);
    expect(cat.schoolName(SCHOOLS.find((s) => s.id === "kakita-bushi")!)).toBe("École de bushi Kakita");
    expect(cat.battleEvent("Duel", "duel")).toBe("Duel");
    const c = { ...migrate(kakita), schoolId: "hida-bushi", insightRank: 5 } as Character;
    const mountain = activeEffects(c).find((e) => "school" in e.origin && e.origin.rank === 5)!;
    expect(cat.effect(mountain)).toMatchObject({ technique: "La Montagne ne tombe pas", label: "Montagne ne tombe pas (agir comme Indemne)" });
    expect(catalogText("fr", undefined, "en")).toBe("fr");
    expect(catalogText("fr", "", "en")).toBe("fr");
    expect(catalogText("fr", "en", "fr")).toBe("fr");
  });

  it("C3 : chaque nombre d'un texte français se retrouve dans le texte anglais", () => {
    const gaps = pairs()
      .filter((p) => p.en)
      .map((p) => ({ where: p.where, missing: numbers(p.fr).filter((n) => !numbers(p.en!).includes(n)) }))
      .filter((g) => g.missing.length);
    expect(gaps).toEqual([]);
  });

  it("C4 : aucune clé anglaise sans entrée française", () => {
    const orphans: string[] = [];
    const known = new Set(pairs().map((p) => p.where));
    for (const [id, w] of Object.entries(CATALOG_EN.schools)) {
      if (!known.has(`${id} : nom`)) orphans.push(id);
      for (const [rank, rw] of Object.entries(w.ranks ?? {})) {
        if (!known.has(`${id} R${rank} : nom`)) orphans.push(`${id} R${rank}`);
        for (const [i, ew] of Object.entries(rw.effects ?? {})) {
          for (const field of Object.keys(ew)) if (!known.has(`${id} R${rank} effet ${i} : ${field}`)) orphans.push(`${id} R${rank} effet ${i} ${field}`);
        }
      }
      for (const o of Object.keys(w.spellcasting?.options ?? {})) if (!known.has(`${id} case ${o}`)) orphans.push(`${id} case ${o}`);
      (w.spellcasting?.reminders ?? []).forEach((_, i) => { if (!known.has(`${id} rappel ${i}`)) orphans.push(`${id} rappel ${i}`); });
      if (w.spellcasting?.startingSpells && !known.has(`${id} sorts de départ`)) orphans.push(`${id} sorts de départ`);
    }
    for (const [key, mw] of Object.entries(CATALOG_EN.masteries)) {
      if (!known.has(`maîtrise ${key} : résumé`)) orphans.push(key);
      for (const [i, ew] of Object.entries(mw.effects ?? {})) {
        for (const field of Object.keys(ew)) if (!known.has(`maîtrise ${key} effet ${i} : ${field}`)) orphans.push(`${key} effet ${i} ${field}`);
      }
    }
    for (const id of Object.keys(CATALOG_EN.events)) if (!known.has(`événement ${id}`)) orphans.push(id);
    for (const clan of Object.keys(CATALOG_EN.clans)) if (!known.has(`clan ${clan}`)) orphans.push(clan);
    for (const cl of Object.keys(CATALOG_EN.classes)) if (!known.has(`classe ${cl}`)) orphans.push(cl);
    for (const k of Object.keys(CATALOG_EN.spellKeywords)) if (!known.has(`mot-clé ${k}`)) orphans.push(k);
    expect(orphans).toEqual([]);
    // Une maîtrise par compétence et rang : la clé « compétence@rang » est unique.
    expect(new Set(MASTERIES.map((m) => `${m.skill}@${m.rank}`)).size).toBe(MASTERIES.length);
  });

  it("textes d'un effet actif : école, maîtrise, rappel chiffré, dans chaque langue", () => {
    const c: Character = { ...migrate(kakita), schoolId: "kitsuki-enqueteur", insightRank: 2 };
    c.skills = c.skills.map((s) => (s.name === "Kenjutsu" ? { ...s, rank: 3 } : s));
    const effects = activeEffects(c);
    const lie = effects.find((e) => "school" in e.origin && e.origin.rank === 2 && e.origin.index === 0)!;
    const mastery = effects.find((e): e is ActiveEffect => !!e.mastery)!;
    const en = catalogFor("en", rulesEn);
    const fr = catalogFor("fr", rulesFr);
    expect(en.effect(lie).technique).toBe("The Wisdom the Wind Brings");
    expect(en.reminder(lie, c)).toBe("+10 to the TN of anyone lying to you.");
    expect(fr.reminder(lie, c)).toBe("+10 au ND de qui te ment.");
    expect(en.effect(mastery)).toEqual({ technique: "Mastery Kenjutsu 3", summary: "+1k0 to sword damage." });
    expect(fr.effect(mastery)).toEqual({ technique: "Maîtrise Kenjutsu 3", summary: "+1g0 aux dégâts des épées." });
    // Sans texte de rappel : le résumé de la technique.
    const method = effects.find((e) => "school" in e.origin && e.origin.rank === 1 && e.kind === "roll")!;
    expect(en.reminder(method, c)).toBe("1 Free Raise on Investigation. + Perception to your Armor TN in a skirmish.");
  });

  it("clans, classes, sorts de départ, cases et mots-clés de sort", () => {
    const en = catalogFor("en", rulesEn);
    const kuni = SCHOOLS.find((s) => s.id === "kuni-shugenja")!;
    const togashi = SCHOOLS.find((s) => s.id === "togashi-moine")!;
    expect(en.clan("Clans mineurs")).toBe("Minor Clans");
    expect(en.schoolClass(togashi)).toBe("Monk");
    expect(en.startingSpells(kuni)).toBe("universal, 3 Earth, 2 Fire, 1 Water");
    expect(en.spellOption(kuni, kuni.spellcasting!.options![0]!)).toBe("Non-human target");
    expect(en.spellReminders(SCHOOLS.find((s) => s.id === "asahina-shugenja")!)).toEqual(["1 Void Point: enemy damage −0k1 within 20 feet, school rank in rounds."]);
    expect(en.spellKeyword("Artisanat")).toBe("Craft");
    expect(en.startingSpells(togashi)).toBe("");
    expect(en.spellReminders(togashi)).toEqual([]);
  });

  it("textes du moteur : mot-clé et case d'école d'un sort en anglais, le français à défaut", () => {
    const f = (t: CoreText) => formatCore(en, t);
    expect(f({ key: "spell.keyword", keyword: "Tonnerre" })).toBe("Thunder keyword");
    expect(f({ key: "spell.keyword", keyword: "Inconnu" })).toBe("Inconnu keyword");
    expect(f({ key: "spell.option", label: "Cible non humaine", school: "kuni-shugenja", id: "nonhuman" })).toBe("Non-human target");
    expect(f({ key: "spell.option", label: "Case maison", school: "", id: "x" })).toBe("Case maison");
  });
});
