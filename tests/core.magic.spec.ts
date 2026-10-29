/**
 * Lot 13, v2.11.0 (HANDOFF annexe F.2, F.6) : jet de sort, situation « Magie », dégâts de sort.
 * Personnage : reference/perso-test-shugenja.json (Kuni rang 1, Terre 3, Air 2, Feu 2, Eau 2, Vide 2, Sortilèges 3).
 */
import { describe, expect, it } from "vitest";
import {
  buildActions, castTime, castTimeLabel, CharacterSchema, computePool, defaultSpellElement, spellCast, spellRestriction, spellTn,
  type Character, type PoolAction, type Spell,
} from "@carnet/core";
import perso from "../reference/perso-test-shugenja.json";

const kuni = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });
const spellOf = (c: Character, id: string): Spell => c.spells!.find((s) => s.id === id)!;
const pool = (c: Character, a: PoolAction) => computePool(c, a, {});
const dice = (c: Character, a: PoolAction) => { const p = pool(c, a); return `${p.rolled}g${p.kept}`; };
const cast = (c: Character, id: string, extra: Partial<Extract<PoolAction, { kind: "spell" }>> = {}): PoolAction =>
  ({ kind: "spell", spell: spellOf(c, id), ...extra });
const withSkill = (c: Character, name: string, rank: number): Character =>
  ({ ...c, skills: [...c.skills.filter((s) => s.name !== name), { name, rank, trait: "intelligence", emphases: [] }] });

describe("Jet de sort (F.2)", () => {
  it("G1 : Terre maîtrise 1 : 5g3 ND 10 ; Feu : 3g2 ; Air (déficience) : 2g2", () => {
    const c = kuni();
    expect(dice(c, cast(c, "jade-strike"))).toBe("5g3");
    expect(spellTn(spellOf(c, "jade-strike").mastery)).toBe(10);
    expect(dice(c, cast(c, "fire-1"))).toBe("3g2");
    expect(dice(c, cast(c, "air-1"))).toBe("2g2");
    expect(pool(c, cast(c, "jade-strike"))).toMatchObject({ explodes: true, explodeOn: 10, canRaise: true });
  });

  it("G2 : Kuni rang 1, sort d'Air : « Déficience : impossible au rang 1 »", () => {
    const c = kuni();
    expect(spellRestriction(c, spellOf(c, "air-1"))).toBe("Déficience : impossible au rang 1.");
    expect(spellRestriction(kuni({ schoolRank: 2 }), spellOf(c, "air-1"))).toBeNull();
  });

  it("G3 : sort de Terre maîtrise 2 au rang 1 : « Maîtrise 2 > rang 1 » ; au rang 2, permis", () => {
    const c = kuni();
    expect(spellRestriction(c, spellOf(c, "earth-2"))).toBe("Maîtrise 2 > rang 1.");
    expect(spellRestriction(kuni({ schoolRank: 2 }), spellOf(c, "earth-2"))).toBeNull();
    expect(spellRestriction(c, spellOf(c, "jade-strike"))).toBeNull();
  });

  it("G4 : sort Jade (Kuni) : 1 augmentation gratuite ; sort Bataille : aucune", () => {
    const c = kuni();
    expect(pool(c, cast(c, "jade-strike")).freeRaises).toBe(1);
    expect(spellCast(c, cast(c, "jade-strike") as never).freeRaises).toEqual(["mot-clé Jade"]);
    expect(pool(c, cast(c, "fire-1")).freeRaises).toBeUndefined();
  });

  it("G5 : Isawa, affinité Vide, Vide 2, rang 1 : sort de Vide 4g2, 1 augmentation gratuite", () => {
    const c = kuni({ schoolId: "isawa-shugenja", affinity: "void" });
    const voidSpell: Spell = { ...spellOf(c, "jade-strike"), id: "v", element: "void", keywords: [] };
    expect(dice(c, { kind: "spell", spell: voidSpell })).toBe("4g2");
    expect(pool(c, { kind: "spell", spell: voidSpell }).freeRaises).toBe(1);
    // Sans déficience : l'Air passe au rang 1.
    expect(dice(c, cast(c, "air-1"))).toBe("3g2");
  });

  it("G6 : maîtrise 3, 2 augmentations pour le temps : ND 20 (+10 au lanceur), 1 action complexe", () => {
    expect(spellTn(3)).toBe(20);
    expect(castTime(3, 2)).toBe(1);
    expect(castTime(3, 5)).toBe(1);
    expect(castTime(3)).toBe(3);
    expect([castTimeLabel(1), castTimeLabel(3)]).toEqual(["1 action complexe", "3 actions complexes"]);
  });

  it("G9 : sort universel lancé en Feu : 3g2 ; par défaut, l'élément à la plus grosse réserve (Terre, 5g3)", () => {
    const c = kuni();
    expect(dice(c, cast(c, "sentir", { element: "fire" }))).toBe("3g2");
    expect(defaultSpellElement(c, spellOf(c, "sentir"))).toBe("earth");
    expect(dice(c, cast(c, "sentir"))).toBe("5g3");
  });

  it("G10 : Sortilèges 5 : +1g0 aux jets de sort, effet de maîtrise ; rien au rang 4 ni sur les dégâts", () => {
    const c = withSkill(kuni(), "Sortilèges", 5);
    const p = pool(c, cast(c, "jade-strike"));
    expect(`${p.rolled}g${p.kept}`).toBe("6g3");
    expect(p.applied?.map((e) => e.mastery)).toContain("Sortilèges");
    expect(dice(withSkill(kuni(), "Sortilèges", 4), cast(c, "jade-strike"))).toBe("5g3");
    expect(dice(withSkill(kuni(), "Spellcraft", 5), cast(c, "jade-strike"))).toBe("6g3");
    expect(dice(c, { kind: "spellDamage", spell: spellOf(c, "fire-1") })).toBe("3g2");
  });

  it("G11 : Moshi, sort de Feu, case « Il fait jour » : rang de lancement +1", () => {
    const c = kuni({ schoolId: "moshi-shugenja" });
    expect(dice(c, cast(c, "fire-1"))).toBe("3g2");
    expect(dice(c, cast(c, "fire-1", { options: ["day"] }))).toBe("4g2");
    expect(spellCast(c, { spell: spellOf(c, "fire-1"), options: ["day"] }).affinity).toBe(true);
  });

  it("G12 : Agasha, sort de Feu lancé avec l'Anneau d'Eau : réserve sur l'Eau, rang du Feu (affinité)", () => {
    const c = kuni({ schoolId: "agasha-shugenja", traits: { ...kuni().traits, strength: 3, perception: 3 } });
    const swapped = spellCast(c, { spell: spellOf(c, "fire-1"), ring: "water" });
    expect(swapped).toMatchObject({ element: "fire", ring: "water", ringValue: 3, rank: 2, affinity: true });
    expect(dice(c, cast(c, "fire-1", { ring: "water" }))).toBe("5g3");
    expect(dice(c, cast(c, "fire-1"))).toBe("4g2");
  });

  it("G13 : dégâts d'un sort VD 3k2 : 3g2, sans Force, sans point de Vide ni augmentation ; cible souillée (Kuni, Chuda)", () => {
    const c = kuni({ traits: { ...kuni().traits, strength: 4 } });
    const dmg = (x: Character, options?: string[]): PoolAction => ({ kind: "spellDamage", spell: spellOf(x, "fire-1"), ...(options ? { options } : {}) });
    const p = computePool(c, dmg(c), { voidPoint: true, centerBonus: true });
    expect(`${p.rolled}g${p.kept}`).toBe("3g2");
    expect(p).toMatchObject({ voidBlocked: true, canRaise: false, bonus: 0 });
    expect(dice(c, dmg(c, ["tainted"]))).toBe("4g3");
    const chuda = kuni({ schoolId: "chuda-shugenja", schoolRank: 2 });
    expect(pool(chuda, dmg(chuda, ["tainted"])).bonus).toBe(2);
  });

  it("Kuni : case « Cible non humaine » : +1g0", () => {
    const c = kuni();
    expect(dice(c, cast(c, "jade-strike", { options: ["nonhuman"] }))).toBe("6g3");
  });
});

describe("Situation « Magie » (F.5)", () => {
  it("un lancer par sort, groupé par élément, ND et temps d'incantation ; dégâts rattachés si VD", () => {
    const actions = buildActions(kuni(), "magic");
    expect(actions.map((a) => a.id)).toEqual([
      "spell-sentir", "spell-air-1", "spell-jade-strike", "spelldmg-jade-strike", "spell-earth-2", "spell-fire-1", "spelldmg-fire-1", "concentrate",
    ]);
    expect(actions.map((a) => a.group)).toEqual(["Tous", "Air", "Terre", "Terre", "Terre", "Feu", "Feu", "Interruption"]);
    const earth2 = actions.find((a) => a.id === "spell-earth-2");
    expect(earth2).toMatchObject({ kind: "spell", tn: 15, label: "Lancer · Mur de terre", description: "ND 15 · 2 actions complexes · Défense · parchemin" });
    expect(actions.find((a) => a.id === "spelldmg-fire-1")).toMatchObject({
      kind: "spellDamage", parent: "spell-fire-1", tn: null, label: "Dégâts · Feux intérieurs", description: "VD 3g2, sans la Force ni point de Vide.",
    });
  });

  it("une fiche sans sort : seulement « Rester concentré » (v2.12.0)", () => {
    expect(buildActions(kuni({ spells: [] }), "magic").map((a) => a.id)).toEqual(["concentrate"]);
  });
});
