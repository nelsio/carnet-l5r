/**
 * Lot 13, v2.10.0 (HANDOFF annexe F.4) : écoles de shugenja, affinité et déficience.
 * Personnage : reference/perso-test-shugenja.json (Kuni rang 1, Terre 3, Air 2, Feu 2, Eau 2, Vide 2).
 */
import { describe, expect, it } from "vitest";
import {
  affinityOf, castingRank, CharacterSchema, deficiencyOf, findSchool, isShugenja, mergeCharacter, schoolsByClan,
  shortSchoolName, spellcastingOf, suggestSchool, type Character,
} from "@carnet/core";
import { SCHOOLS } from "../src/rules/ecoles";
import perso from "../reference/perso-test-shugenja.json";

const kuni = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });
const isawa = (affinity?: Character["affinity"]) => kuni({ schoolId: "isawa-shugenja", ...(affinity ? { affinity } : {}) });

describe("Catalogue des écoles de shugenja (F.4)", () => {
  const shugenja = SCHOOLS.filter((s) => s.class === "Shugenja");

  it("14 écoles, rangs 1 à 5, technique au rang 1 et « nouveaux sorts » ensuite, règles de lancement", () => {
    expect(shugenja).toHaveLength(14);
    for (const s of shugenja) {
      expect(s.ranks.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
      expect(s.ranks.slice(1).map((r) => r.summary)).toEqual([2, 3, 4, 5].map((n) => `Rang ${n} : nouveaux sorts.`));
      expect(s.spellcasting?.startingSpells).toMatch(/^universels, /);
    }
  });

  it("affinité et déficience de chaque école (tableau F.4)", () => {
    const table = Object.fromEntries(shugenja.map((s) => [shortSchoolName(s), `${s.spellcasting?.affinity}/${s.spellcasting?.deficiency}`]));
    expect(table).toEqual({
      Kuni: "earth/air", Asahina: "air/fire", Tamori: "earth/air", Kitsu: "water/fire", Moshi: "air/earth",
      Isawa: "choice/null", Agasha: "fire/water", Soshi: "air/earth", Iuchi: "water/fire", Komori: "air/earth",
      Tonbo: "water/fire", Kitsune: "earth/air", Chuda: "earth/air", Seppun: "fire/water",
    });
  });

  it("groupe « Clans mineurs » (Chauve-souris, Libellule, Renard, Chuda) ; Seppun avec l'Impérial", () => {
    const groups = Object.fromEntries(schoolsByClan().map((g) => [g.clan, g.schools.map((s) => s.id)]));
    expect(groups["Clans mineurs"]).toEqual(["komori-shugenja", "tonbo-shugenja", "kitsune-shugenja", "chuda-shugenja"]);
    expect(groups["Impérial"]).toContain("seppun-shugenja");
    expect(groups["Phénix"]).toEqual(expect.arrayContaining(["shiba-bushi", "asako-maitre-du-savoir", "isawa-shugenja", "agasha-shugenja"]));
  });

  it("nom court sans la précision entre parenthèses ; suggestion d'après le nom affiché", () => {
    expect(shortSchoolName(findSchool("komori-shugenja")!)).toBe("Komori");
    expect(shortSchoolName(findSchool("chuda-shugenja")!)).toBe("Chuda");
    expect(suggestSchool(kuni({ schoolId: "", school: "Shugenja Kuni" }))?.id).toBe("kuni-shugenja");
    expect(suggestSchool(kuni({ schoolId: "", school: "École de shugenja Isawa" }))?.id).toBe("isawa-shugenja");
  });
});

describe("Affinité et déficience (F.2, F-e)", () => {
  it("G2 : Kuni rang 1, Air (déficience) : rang de lancement 0 ; Terre (affinité) 2 ; Feu 1", () => {
    const c = kuni();
    expect(spellcastingOf(c)?.page).toBe(109);
    expect([affinityOf(c), deficiencyOf(c)]).toEqual(["earth", "air"]);
    expect(castingRank(c, "air")).toEqual({ rank: 0, affinity: false, deficiency: true });
    expect(castingRank(c, "earth")).toEqual({ rank: 2, affinity: true, deficiency: false });
    expect(castingRank(c, "fire").rank).toBe(1);
    expect(castingRank(kuni({ schoolRank: 3 }), "air").rank).toBe(2);
  });

  it("G5 : Isawa, affinité Vide choisie, rang 1 : Vide au rang 2, aucune déficience ; sans choix, aucune affinité", () => {
    expect(castingRank(isawa("void"), "void")).toEqual({ rank: 2, affinity: true, deficiency: false });
    expect(deficiencyOf(isawa("void"))).toBeUndefined();
    expect(affinityOf(isawa())).toBeUndefined();
    expect(castingRank(isawa(), "earth").rank).toBe(1);
  });

  it("l'affinité de la fiche ne vaut que pour une école à affinité au choix", () => {
    expect(affinityOf(kuni({ affinity: "water" }))).toBe("earth");
    expect(affinityOf(kuni({ schoolId: "kakita-bushi", affinity: "water" }))).toBeUndefined();
    expect(isShugenja(kuni({ spells: [] }))).toBe(true);
  });

  it("champ affinity : un Anneau, fusionné comme un champ simple", () => {
    const r = mergeCharacter(isawa(), { affinity: "fire" });
    expect(r.ok && r.character.affinity).toBe("fire");
    const bad = mergeCharacter(isawa(), { affinity: "metal" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors[0]).toEqual({ path: "affinity", message: "doit être un Anneau" });
  });
});
