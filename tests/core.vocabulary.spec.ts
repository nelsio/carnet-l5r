/**
 * Lot 12, v2.6.0 (HANDOFF annexe E.7, E.10) : vocabulaire de l'édition française.
 * Personnage : reference/perso-test-courtisans.json (Courtoisie, Étiquette (Politesse), Furtivité, Représentation : Conteur).
 */
import { describe, expect, it } from "vitest";
import {
  buildActions, computePool, findSkill, updateVocabulary, vocabularyChanges,
  type Character, type Modifier, type PoolAction, type RollTrait,
} from "@carnet/core";
import { SCHOOLS } from "../src/rules/ecoles";
import { TRAIT_LABELS } from "../src/rules/l5r4e";
import perso from "../reference/perso-test-courtisans.json";
import example from "../reference/exemple-personnage.json";

const char = (patch: Partial<Character> = {}): Character => ({ ...(structuredClone(perso) as Character), ...patch });
const skill = (name: string, trait: RollTrait): PoolAction => ({ kind: "skill", skill: name, trait });
const free = (c: Character, a: PoolAction) => computePool(c, a, {}).freeRaises ?? 0;
const names = (c: Character) => c.skills.map((s) => s.name);

describe("Libellés de l'édition française", () => {
  it("le trait awareness s'appelle Vigilance", () => {
    expect(TRAIT_LABELS.awareness).toBe("Vigilance");
  });

  it("les actions du catalogue emploient les nouveaux noms", () => {
    const c = char();
    const court = buildActions(c, "court");
    expect(court.find((a) => a.id === "persuade")?.skill).toBe("Courtisan");
    expect(court.find((a) => a.id === "resist")?.emphasisHint).toBe("Courtoisie");
    expect(buildActions(c, "movement").find((a) => a.id === "stealth")?.skill).toBe("Discrétion");
  });

  it("aucune technique d'école ne cite encore un ancien libellé", () => {
    const text = JSON.stringify(SCHOOLS);
    for (const old of ["Intuition", "Politesse", "Furtivité", "Conteur", "Éloquence"]) expect(text).not.toContain(old);
  });

  it("une fiche v2.5 répond aux nouveaux noms par les alias, sans renommage", () => {
    const c = char();
    expect(findSkill(c, "Courtisan")?.name).toBe("Courtoisie");
    expect(findSkill(c, "Discrétion")?.name).toBe("Furtivité");
    expect(findSkill(c, "Représentation : Conte")?.name).toBe("Représentation : Conteur");
  });
});

describe("Renommage proposé (vocabularyChanges, updateVocabulary)", () => {
  it("L23 : Courtoisie (compétence) → Courtisan, Étiquette (Politesse) → Étiquette (Courtoisie) ; Doji R1 avant et après", () => {
    const before = char({ schoolId: "doji-courtisan", insightRank: 1 });
    expect(vocabularyChanges(before)).toEqual(expect.arrayContaining([
      { path: "skills[0].name", kind: "skill", before: "Courtoisie", after: "Courtisan" },
      { path: "skills[1].emphases[0]", kind: "emphasis", before: "Politesse", after: "Courtoisie" },
    ]));
    const after = updateVocabulary(before);
    expect(after.skills[0]).toMatchObject({ name: "Courtisan", rank: 3, emphases: ["Manipulation"] });
    expect(after.skills[1]).toMatchObject({ name: "Étiquette", emphases: ["Courtoisie"] });
    for (const c of [before, after]) {
      expect(free(c, skill("Courtisan", "awareness"))).toBe(1);
      expect(free(c, skill("Étiquette", "awareness"))).toBe(1);
    }
  });

  it("Furtivité, Représentation : Conteur et Éloquence suivent ; les autres compétences ne bougent pas", () => {
    const c = char();
    c.skills.push({ name: "Représentation : Éloquence", rank: 1, trait: "awareness", emphases: [] });
    expect(names(updateVocabulary(c))).toEqual([
      "Courtisan", "Étiquette", "Sincérité", "Intimidation", "Connaissance : Histoire", "Investigation", "Commerce",
      "Comédie", "Couteaux", "Discrétion", "Représentation : Conte", "Représentation : Art oratoire",
    ]);
    expect(vocabularyChanges(c)).toHaveLength(5);
  });

  it("ne modifie jamais la fiche d'origine", () => {
    const c = char();
    const copy = structuredClone(c);
    updateVocabulary(c);
    expect(c).toEqual(copy);
  });

  it("la spécialisation « Courtoisie » d'Étiquette reste ; « Politesse » ne change que sous Étiquette", () => {
    const c = char({
      skills: [
        { name: "Étiquette", rank: 2, trait: "awareness", emphases: ["Courtoisie"] },
        { name: "Sincérité", rank: 1, trait: "awareness", emphases: ["Politesse"] },
      ],
    });
    expect(vocabularyChanges(c)).toEqual([]);
    expect(updateVocabulary(c)).toBe(c);
  });

  it("insensible aux accents et à la casse ; pas de doublon si la fiche a déjà le nouveau nom", () => {
    const c = char({
      skills: [
        { name: "furtivite", rank: 1, trait: "agility", emphases: [] },
        { name: "Courtoisie", rank: 1, trait: "awareness", emphases: [] },
        { name: "Courtisan", rank: 2, trait: "awareness", emphases: [] },
        { name: "Etiquette", rank: 1, trait: "awareness", emphases: ["politesse", "Courtoisie"] },
      ],
    });
    expect(vocabularyChanges(c)).toEqual([{ path: "skills[0].name", kind: "skill", before: "furtivite", after: "Discrétion" }]);
  });

  it("les bonus de jet qui visent un ancien nom de compétence sont renommés aussi", () => {
    const voix = { id: "voix", name: "Voix", source: "advantage", appliesTo: "skill", skill: "Représentation : Éloquence", rolled: 1, kept: 1, flat: 0, tn: 0, freeRaises: 0, mode: "always", note: "" } as Modifier;
    const c = char({ modifiers: [voix, { ...voix, id: "kenjutsu", skill: "Kenjutsu" }] });
    expect(vocabularyChanges(c)).toContainEqual({ path: "modifiers[0].skill", kind: "modifier", before: "Représentation : Éloquence", after: "Représentation : Art oratoire" });
    expect(updateVocabulary(c).modifiers?.map((m) => m.skill)).toEqual(["Représentation : Art oratoire", "Kenjutsu"]);
  });

  it("la fiche d'exemple emploie déjà le vocabulaire : rien à renommer", () => {
    expect(vocabularyChanges(example as Character)).toEqual([]);
  });

  it("non-régression : toutes les écoles donnent les mêmes réserves avant et après renommage", () => {
    for (const school of SCHOOLS) {
      for (let rank = 1; rank <= 5; rank++) {
        const before = char({ schoolId: school.id, insightRank: rank });
        const after = updateVocabulary(before);
        for (const s of before.skills) {
          const a = skill(s.name, s.trait);
          const renamed = { ...a, skill: after.skills[before.skills.indexOf(s)].name };
          expect(computePool(after, renamed, {}), `${school.id} R${rank} ${s.name}`).toEqual(computePool(before, a, {}));
        }
      }
    }
  });
});
