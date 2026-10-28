/**
 * Lot 13, v2.9.0 (HANDOFF annexe F.3, F.6) : Rouleaux & invocations.
 * Personnage : reference/perso-test-shugenja.json (Kuni, 5 sorts de test).
 */
import { describe, expect, it } from "vitest";
import {
  CharacterSchema, createSpell, isShugenja, mergeCharacter, sortSpells, spellRaises, spellTn, SpellSchema,
  type Character,
} from "@carnet/core";
import perso from "../reference/perso-test-shugenja.json";
import kakita from "./fixtures/kakita-v1.json";

const shugenja = (): Character => CharacterSchema.parse(structuredClone(perso));

describe("Format : champ spells facultatif (F.3)", () => {
  it("la fiche de test se lit telle quelle ; un sort minimal reçoit ses valeurs par défaut", () => {
    const c = shugenja();
    expect(c.spells).toHaveLength(5);
    expect(c.spells?.[1]).toMatchObject({ id: "jade-strike", element: "earth", mastery: 1, damage: "2k2", memorized: true });
    expect(SpellSchema.parse({ id: "a", name: "Sort", element: "fire", mastery: 2 }))
      .toEqual({ id: "a", name: "Sort", element: "fire", mastery: 2, keywords: [], range: "", area: "", duration: "", raises: "", memorized: false, effect: "" });
  });

  it("refuse un élément inconnu, une maîtrise hors de 1 à 6, une VD mal formée ; accepte une VD vide", () => {
    const base = { id: "a", name: "Sort", element: "earth", mastery: 1 };
    expect(SpellSchema.safeParse({ ...base, element: "metal" }).success).toBe(false);
    expect(SpellSchema.safeParse({ ...base, mastery: 0 }).success).toBe(false);
    expect(SpellSchema.safeParse({ ...base, mastery: 7 }).success).toBe(false);
    expect(SpellSchema.safeParse({ ...base, damage: "2k" }).success).toBe(false);
    expect(SpellSchema.safeParse({ ...base, damage: "" }).success).toBe(true);
  });
});

describe("G15 : fusion par id puis par nom (§8)", () => {
  it("fiche avec 2 sorts dont 1 modifié : le Rouleaux & invocations est fusionné par id", () => {
    const base = shugenja();
    const r = mergeCharacter(base, {
      spells: [
        { id: "jade-strike", name: "Frappe de jade (v2)", mastery: 2, raises: "Portée (+10 pieds)" },
        { id: "water-1", name: "Voie vers l'intérieur", element: "water", mastery: 1, memorized: true },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const spells = r.character.spells ?? [];
    expect(spells).toHaveLength(6);
    // Le nom fait partie de l'identité : jamais écrasé lors d'une mise à jour.
    expect(spells.find((s) => s.id === "jade-strike")).toMatchObject({ name: "Frappe de jade", mastery: 2, raises: "Portée (+10 pieds)", damage: "2k2" });
    expect(spells.find((s) => s.id === "water-1")).toMatchObject({ element: "water", keywords: [], effect: "" });
    expect(r.changes.map((x) => x.path)).toEqual([
      "spells[Frappe de jade].mastery", "spells[Frappe de jade].raises", "spells[Voie vers l'intérieur]",
    ]);
  });

  it("sans id, le sort est retrouvé par nom ; une fiche sans sorts reçoit la liste", () => {
    const r = mergeCharacter(shugenja(), { spells: [{ name: "mur de terre", memorized: true }] });
    expect(r.ok && r.character.spells?.find((s) => s.id === "earth-2")?.memorized).toBe(true);

    const bushi = mergeCharacter((structuredClone(kakita) as Character), { spells: [createSpell("Sentir", "all")] });
    expect(bushi.ok && bushi.character.spells?.map((s) => s.name)).toEqual(["Sentir"]);
  });

  it("un sort invalide bloque la fusion, avec son chemin", () => {
    const r = mergeCharacter(shugenja(), { spells: [{ id: "x", name: "X", element: "earth", mastery: 9 }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.path).toBe("spells[0].mastery");
  });
});

describe("Lecture du Rouleaux & invocations (F.5)", () => {
  it("ND = 5 + 5 × maîtrise", () => {
    expect([1, 2, 3, 6].map(spellTn)).toEqual([10, 15, 20, 35]);
  });

  it("tri : universels, puis Air, Terre, Feu, Eau, Vide ; ensuite maîtrise et nom", () => {
    expect(sortSpells(shugenja().spells ?? []).map((s) => s.id)).toEqual(["sentir", "air-1", "jade-strike", "earth-2", "fire-1"]);
  });

  it("augmentations : une par ligne, lignes vides ignorées", () => {
    expect(spellRaises({ raises: "Portée (+10 pieds)\n\n Cibles (+1) \n" })).toEqual(["Portée (+10 pieds)", "Cibles (+1)"]);
    expect(spellRaises({ raises: "" })).toEqual([]);
  });

  it("shugenja : école de classe Shugenja, ou au moins un sort (F.4)", () => {
    const bushi = (structuredClone(kakita) as Character);
    expect(isShugenja(shugenja())).toBe(true);
    expect(isShugenja({ ...shugenja(), spells: [] })).toBe(true);
    expect(isShugenja(bushi)).toBe(false);
    // Le nom affiché ne suffit plus depuis le catalogue (v2.10.0).
    expect(isShugenja({ ...bushi, school: "École de Shugenja Isawa" })).toBe(false);
    expect(isShugenja({ ...shugenja(), spells: [], schoolId: "" })).toBe(false);
  });

  it("sort vierge : identifiants distincts, maîtrise 1, parchemin", () => {
    const [a, b] = [createSpell(), createSpell("Sentir", "all")];
    expect(a.id).not.toBe(b.id);
    expect(SpellSchema.parse({ ...b })).toEqual(b);
    expect(b).toMatchObject({ name: "Sentir", element: "all", mastery: 1, memorized: false });
  });
});
