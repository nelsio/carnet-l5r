/**
 * Lot 13, v2.12.0 (HANDOFF annexe F.2, F.5, F.6) : emplacements de sorts, sorts en escarmouche, Rester concentré.
 * Personnage : reference/perso-test-shugenja.json (Kuni rang 1, Terre 3, Air 2, Feu 2, Eau 2, Vide 2).
 */
import { describe, expect, it } from "vitest";
import {
  buildActions, CharacterSchema, computePool, concentrationTn, mergeCharacter, newDay, refundSpellSlots, setSpellSlotsUsed,
  slotFor, spellSlotNeed, spellSlots, spendSpellSlots, stanceRestriction,
  type Character, type PoolAction, type Spell,
} from "@carnet/core";
import perso from "../reference/perso-test-shugenja.json";

const kuni = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });
const spellOf = (c: Character, id: string): Spell => c.spells!.find((s) => s.id === id)!;
const left = (c: Character) => Object.fromEntries(Object.entries(spellSlots(c)).map(([k, s]) => [k, `${s.left}/${s.max}`]));

describe("Emplacements de sorts (F.2)", () => {
  it("par jour : l'Anneau dans chaque élément, Vide compris, plus des libres égaux au Vide", () => {
    expect(left(kuni())).toEqual({ air: "2/2", earth: "3/3", fire: "2/2", water: "2/2", void: "2/2", free: "2/2" });
  });

  it("G7 : Terre 3, Vide 2 : 4 sorts de Terre → Terre 0/3, libres 1/2 ; le 6e « aucun emplacement »", () => {
    let c = kuni();
    const taken: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = spendSpellSlots(c, "earth");
      c = r.character;
      taken.push(...r.taken);
    }
    expect(taken).toEqual(["earth", "earth", "earth", "free"]);
    expect(left(c)).toMatchObject({ earth: "0/3", free: "1/2" });
    c = spendSpellSlots(c, "earth").character;
    expect(slotFor(c, "earth")).toBeNull();
    expect(spendSpellSlots(c, "earth")).toEqual({ character: c, taken: [] });
    // Les autres éléments gardent leurs emplacements.
    expect(slotFor(c, "fire")).toBe("fire");
  });

  it("G8 (moteur) : un sort réussi puis interrompu rend ses emplacements", () => {
    const { character, taken } = spendSpellSlots(kuni({ spellSlotsUsed: { earth: 3 } }), "earth");
    expect(taken).toEqual(["free"]);
    expect(left(refundSpellSlots(character, taken))).toMatchObject({ earth: "0/3", free: "2/2" });
  });

  it("emplacement de l'Anneau du jet (Agasha) ; Soshi « sans signe visible » : un emplacement de plus", () => {
    const agasha = kuni({ schoolId: "agasha-shugenja" });
    expect(spellSlotNeed(agasha, { spell: spellOf(agasha, "fire-1"), ring: "water" })).toEqual({ ring: "water", count: 1 });
    expect(spellSlotNeed(agasha, { spell: spellOf(agasha, "sentir"), element: "fire" })).toEqual({ ring: "fire", count: 1 });
    const soshi = kuni({ schoolId: "soshi-shugenja" });
    expect(spellSlotNeed(soshi, { spell: spellOf(soshi, "air-1"), options: ["silent"] })).toEqual({ ring: "air", count: 2 });
    expect(spendSpellSlots(soshi, "air", 3).taken).toEqual(["air", "air", "free"]);
  });

  it("éditeur : dépensés entre 0 et le maximum", () => {
    expect(setSpellSlotsUsed(kuni(), "earth", 5).spellSlotsUsed).toEqual({ earth: 3 });
    expect(setSpellSlotsUsed(kuni({ spellSlotsUsed: { free: 1 } }), "free", -1).spellSlotsUsed).toEqual({ free: 0 });
  });

  it("G14 : Nouvelle journée : emplacements pleins ; une fiche sans le champ n'en reçoit pas", () => {
    expect(left(newDay(kuni({ spellSlotsUsed: { earth: 3, free: 2 } })))).toMatchObject({ earth: "3/3", free: "2/2" });
    const without = kuni();
    delete without.spellSlotsUsed;
    expect("spellSlotsUsed" in newDay(without)).toBe(false);
  });

  it("format : champ facultatif, clés d'Anneau et « free », entiers positifs ; fusion comme un champ simple", () => {
    const r = mergeCharacter(kuni(), { spellSlotsUsed: { earth: 2, free: 1 } });
    expect(r.ok && r.character.spellSlotsUsed).toEqual({ earth: 2, free: 1 });
    expect(mergeCharacter(kuni(), { spellSlotsUsed: { metal: 1 } }).ok).toBe(false);
    expect(mergeCharacter(kuni(), { spellSlotsUsed: { earth: -1 } }).ok).toBe(false);
  });
});

describe("Sorts en escarmouche (F.5, v2.12.0)", () => {
  const c = kuni();
  const cast: PoolAction = { kind: "spell", spell: spellOf(c, "jade-strike") };

  it("groupe « Sorts » après les attaques, ids préfixés sk-, dégâts rattachés", () => {
    const actions = buildActions(c, "combat", "skirmish");
    const spells = actions.filter((a) => a.group === "Sorts");
    expect(spells.map((a) => a.id)).toEqual([
      "sk-spell-sentir", "sk-spell-air-1", "sk-spell-jade-strike", "sk-spelldmg-jade-strike", "sk-spell-earth-2", "sk-spell-fire-1", "sk-spelldmg-fire-1",
    ]);
    expect(spells.find((a) => a.id === "sk-spelldmg-fire-1")?.parent).toBe("sk-spell-fire-1");
    expect(actions.indexOf(spells[0]!)).toBeGreaterThan(actions.findIndex((a) => a.attack));
    expect(buildActions(c, "combat", "duel").some((a) => a.kind === "spell")).toBe(false);
  });

  it("G16 : Assaut « attaques seulement » ; Défense totale « actions gratuites seulement » ; Défense et Attaque permises ; Centre", () => {
    expect(stanceRestriction(cast, { stance: "fullAttack" })).toBe("Assaut : attaques seulement, pas de sort.");
    expect(stanceRestriction(cast, { stance: "fullDefense" })).toBe("Défense totale : actions gratuites seulement, pas de sort.");
    expect(stanceRestriction(cast, { stance: "defense" })).toBeNull();
    expect(stanceRestriction(cast, { stance: "attack" })).toBeNull();
    expect(stanceRestriction(cast, { stance: "center" })).toBe("Posture Centre : aucune action ce round.");
  });

  it("G17 : round après le Centre, sort de Terre maîtrise 1 avec le bonus de Centre : 6g4 + 2 (Vide 2)", () => {
    const p = computePool(c, cast, { centerBonus: true });
    expect([`${p.rolled}g${p.kept}`, p.bonus]).toEqual(["6g4", 2]);
  });
});

describe("Rester concentré (F.2)", () => {
  it("Volonté, ND 10, ou 5 + dégâts subis ; dans la situation Magie, groupe « Interruption »", () => {
    expect([concentrationTn(null), concentrationTn(0), concentrationTn(7)]).toEqual([10, 10, 12]);
    const a = buildActions(kuni(), "magic").find((x) => x.id === "concentrate");
    expect(a).toMatchObject({ kind: "trait", trait: "willpower", tn: 10, group: "Interruption", label: "Rester concentré (Volonté)" });
  });
});
