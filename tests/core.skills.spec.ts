/**
 * Noms de compétence en anglais (annexe 53.3) : table SKILL_NAMES, sous-types, fiche saisie en anglais.
 * Fiche : tests/fixtures/hiruma-en.json (bushi Hiruma rang 3, compétences en anglais).
 */
import { describe, expect, it } from "vitest";
import {
  buildActions, CharacterSchema, computePool, findSkill, isBugeiSkill, isSocialSkill, matchingEmphasis, migrate,
  parseWeaponKeywords, sameSkill, vocabularyChanges,
  type ActionDef, type Character, type CombatSub, type Situation, type Stance,
} from "@carnet/core";
import { BUGEI_SKILLS, EMPHASIS_ALIASES } from "../src/rules/ecoles";
import { FIXED_ACTIONS, SKILL_NAMES, SKILL_SUBTYPES, SOCIAL_SKILLS, VOCABULARY_UPDATES } from "../src/rules/l5r4e";
import { skillLabel } from "../src/ui/format";
import { isRollable, toPoolAction } from "../src/ui/rolls";
import hiruma from "./fixtures/hiruma-en.json";
import kakita from "./fixtures/kakita-v1.json";

const load = (json: unknown): Character => migrate(structuredClone(json));
const emphasisIn = (e: string, locale: "fr" | "en") => {
  const group = EMPHASIS_ALIASES.find((g) => g.some((x) => x === e));
  return group ? (locale === "fr" ? group[0] : group.at(-1)) ?? e : e;
};
/** Même fiche, compétences et spécialisations traduites (noms du catalogue). */
function translated(c: Character, locale: "fr" | "en"): Character {
  return {
    ...c,
    skills: c.skills.map((s) => ({ ...s, name: skillLabel(s.name, locale), emphases: s.emphases.map((e) => emphasisIn(e, locale)) })),
    weapons: c.weapons.map((w) => ({ ...w, skill: skillLabel(w.skill, locale) })),
  };
}

const PLACES: [Situation, CombatSub?][] = [["investigation"], ["court"], ["movement"], ["combat", "skirmish"], ["combat", "duel"], ["combat", "battle"]];
const STANCES: Stance[] = ["attack", "fullAttack", "defense"];

/** Toutes les réserves de l'Assistant : chaque action jouable, dans chaque situation et posture. */
function pools(c: Character) {
  return PLACES.flatMap(([situation, sub]) => buildActions(c, situation, sub).filter(isRollable).flatMap((a: ActionDef) =>
    STANCES.map((stance) => {
      const p = computePool(c, toPoolAction(a), { stance, voidPoint: true });
      return {
        action: a.id.replace(/-.*:.*/, ""), stance, rolled: p.rolled, kept: p.kept, bonus: p.bonus, explodeOn: p.explodeOn,
        freeRaises: p.freeRaises, armorTn: p.armorTn, applied: p.applied?.map((e) => e.key), optional: p.optional?.map((e) => e.key),
      };
    })));
}

describe("Fiche saisie en anglais (53.3, V1, V2)", () => {
  it("la fiche Hiruma est valide et reconnaît ses compétences sous leur nom anglais", () => {
    const c = CharacterSchema.parse(load(hiruma));
    expect(findSkill(c, "Discrétion")?.name).toBe("Stealth");
    expect(findSkill(c, "Défense")?.rank).toBe(2);
    expect(findSkill(c, "Connaissance : Outremonde")?.name).toBe("Lore: Shadowlands");
    expect(findSkill(c, "Représentation : Conteur")?.name).toBe("Perform: Storytelling");
  });

  it("V1 : mêmes réserves, techniques et maîtrises que la même fiche en français", () => {
    const en = load(hiruma);
    const fr = translated(en, "fr");
    expect(fr.skills.map((s) => s.name)).toContain("Discrétion");
    expect(fr.skills.map((s) => s.name)).toContain("Connaissance : Outremonde");
    const [a, b] = [pools(en), pools(fr)];
    expect(a.length).toBeGreaterThan(100);
    expect(a).toEqual(b);
    // Les techniques s'appliquent bien : Hiruma R1 en Attaque, malus d'armure légère en Discrétion.
    expect(a.some((p) => (p.applied?.length ?? 0) > 0)).toBe(true);
    expect(a.find((p) => p.action === "stealth")?.armorTn).toBe(5);
  });

  it("V2 : la fiche Kakita (française) donne les mêmes réserves traduite en anglais", () => {
    const fr = load(kakita);
    expect(pools(translated(fr, "en"))).toEqual(pools(fr));
  });

  it("spécialisation saisie en anglais choisie d'office (Notice pour Remarquer)", () => {
    const c = load(hiruma);
    expect(matchingEmphasis(c, "Investigation", "Remarquer")).toBe("Notice");
    expect(matchingEmphasis(c, "Méditation", "Récupération du Vide")).toBe("Void Recovery");
  });
});

describe("Table des compétences (53.3)", () => {
  it("V5 : Perform: Storytelling = Représentation : Conte = Représentation : Conteur", () => {
    expect(sameSkill("Perform: Storytelling", "Représentation : Conte")).toBe(true);
    expect(sameSkill("perform : storytelling", "Représentation : Conteur")).toBe(true);
    expect(sameSkill("Lore: History", "Connaissance : Histoire")).toBe(true);
    // Sous-type absent de la table : comparé tel quel, préfixe traduit.
    expect(sameSkill("Perform: Kabuki", "Représentation : Kabuki")).toBe(true);
    expect(sameSkill("Perform: Song", "Représentation : Conte")).toBe(false);
    expect(sameSkill("Stealth", "Discrétion")).toBe(true);
    expect(sameSkill("Furtivité", "Stealth")).toBe(true);
    expect(sameSkill("Stealth", "Athlétisme")).toBe(false);
  });

  it("V3, V4 : renommage proposé pour un ancien libellé français, jamais pour un nom anglais", () => {
    const c = load(kakita);
    const furtif = { ...c, skills: [{ name: "Furtivité", rank: 1, trait: "agility" as const, emphases: [] }] };
    expect(vocabularyChanges(furtif)).toEqual([{ path: "skills[0].name", kind: "skill", before: "Furtivité", after: "Discrétion" }]);
    const stealth = { ...c, skills: [{ name: "Stealth", rank: 1, trait: "agility" as const, emphases: [] }] };
    expect(vocabularyChanges(stealth)).toEqual([]);
    expect(vocabularyChanges(load(hiruma))).toEqual([]);
    // Les renommages ne partent que d'anciens libellés français.
    const legacy = [...SKILL_NAMES, ...SKILL_SUBTYPES].flatMap((s) => s.legacy ?? []);
    for (const [from] of VOCABULARY_UPDATES.skills) expect(legacy.some((l) => from.endsWith(l))).toBe(true);
  });

  it("compétences sociales et Bugei dérivées de la table, noms anglais compris", () => {
    expect(SOCIAL_SKILLS).toEqual(expect.arrayContaining(["Courtisan", "Courtoisie", "Courtier", "Acting", "Perform", "Temptation"]));
    for (const name of ["Courtier", "Etiquette", "Sincerity", "Perform: Song", "Représentation : Chant"]) expect(isSocialSkill(name)).toBe(true);
    expect(isSocialSkill("Stealth")).toBe(false);
    for (const name of ["Hunting", "Horsemanship", "Heavy Weapons", "Chasse"]) expect(isBugeiSkill(name)).toBe(true);
    expect(isBugeiSkill("Courtier")).toBe(false);
  });

  it("mots-clés d'arme saisis en anglais", () => {
    expect(parseWeaponKeywords("Samurai, Heavy; two handed, bow")).toEqual(["samourai", "lourde", "deux-mains", "arc"]);
    expect(parseWeaponKeywords("samourai, lourde")).toEqual(["samourai", "lourde"]);
  });

  it("aucun nom ne désigne deux compétences", () => {
    for (const list of [SKILL_NAMES, SKILL_SUBTYPES]) {
      const owner = new Map<string, string>();
      for (const s of list) {
        for (const name of new Set([s.fr, ...(s.legacy ?? []), s.en].map((x) => x.toLowerCase()))) {
          expect(owner.get(name) ?? s.fr).toBe(s.fr);
          owner.set(name, s.fr);
        }
      }
    }
  });
});

/** Compétences citées par les données de règles : `skill`, `skills`, `except`, `tnSkills`, `on: skill:X`, Bugei. */
async function citedSkills(): Promise<string[]> {
  const files = import.meta.glob("../src/rules/*.json", { eager: true, import: "default" });
  const names = new Set<string>();
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (k === "skill" && typeof v === "string") names.add(v);
      if ((k === "skills" || k === "except" || k === "tnSkills") && Array.isArray(v)) v.forEach((x) => typeof x === "string" && names.add(x));
      if (k === "on" && Array.isArray(v)) v.forEach((x) => typeof x === "string" && x.startsWith("skill:") && names.add(x.slice(6)));
      walk(v);
    }
  };
  Object.values(files).forEach(walk);
  BUGEI_SKILLS.forEach((s) => names.add(s));
  FIXED_ACTIONS.forEach((a) => a.skill && names.add(a.skill));
  names.delete("*");
  return [...names];
}

describe("Couverture de la table (V7)", () => {
  it("chaque compétence citée par les règles existe dans SKILL_NAMES (préfixe et sous-type pour « X : Y »)", async () => {
    const known = (name: string, list: typeof SKILL_NAMES) => list.some((s) => s.fr === name);
    const missing = (await citedSkills()).filter((name) => {
      const [prefix, sub] = name.split(":").map((x) => x.trim());
      return sub === undefined ? !known(name, SKILL_NAMES) : !(known(prefix ?? "", SKILL_NAMES) && known(sub, SKILL_SUBTYPES));
    });
    expect(missing).toEqual([]);
  });

  it("les catalogues reconnaissent les noms anglais (techniques et maîtrises sur une fiche anglaise)", () => {
    const c = load(hiruma);
    const stealth = computePool(c, { kind: "skill", skill: "Stealth", trait: "agility" }, {});
    expect(stealth.armorTn).toBe(5);
    expect(computePool(c, { kind: "skill", skill: "Kenjutsu", trait: "agility", attack: true }, { stance: "attack" }).applied?.length)
      .toBeGreaterThan(0);
  });
});
