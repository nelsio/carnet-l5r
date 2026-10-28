/** Magie (HANDOFF annexe F) : Rouleaux & invocations (v2.9.0), écoles de shugenja (v2.10.0). */
import type { Spellcasting } from "../rules/ecoles";
import { SPELL_TN } from "../rules/l5r4e";
import { SPELL_ELEMENTS, type Character, type Spell, type SpellElement, type SpellRing } from "./schema";
import { schoolOf, schoolRankOf } from "./schools";

/** ND d'un sort : 5 + 5 × maîtrise (« Maîtrise 2 · ND 15 »). */
export function spellTn(mastery: number): number {
  return SPELL_TN.base + SPELL_TN.perMastery * mastery;
}

/** Ordre de lecture : sorts universels, puis Air, Terre, Feu, Eau, Vide ; ensuite maîtrise, puis nom. */
const ELEMENT_ORDER: readonly SpellElement[] = ["all", ...SPELL_ELEMENTS.filter((e) => e !== "all")];

export function sortSpells(spells: readonly Spell[]): Spell[] {
  return [...spells].sort((a, b) =>
    ELEMENT_ORDER.indexOf(a.element) - ELEMENT_ORDER.indexOf(b.element)
    || a.mastery - b.mastery
    || a.name.localeCompare(b.name, "fr"));
}

/** Augmentations propres au sort : une par ligne (le point-virgule sépare aussi). */
export function spellRaises(spell: Pick<Spell, "raises">): string[] {
  return spell.raises.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
}

/** Shugenja (annexe F.4) : école de classe « Shugenja », ou au moins un sort. */
export function isShugenja(c: Character): boolean {
  return (c.spells?.length ?? 0) > 0 || schoolOf(c)?.class === "Shugenja";
}

/** Règles de lancement de l'école de shugenja de la fiche. */
export function spellcastingOf(c: Character): Spellcasting | undefined {
  return schoolOf(c)?.spellcasting;
}

/** Élément d'affinité : celui de l'école, ou celui choisi sur la fiche (Isawa) ; absent tant qu'il n'est pas choisi. */
export function affinityOf(c: Character): SpellRing | undefined {
  const sc = spellcastingOf(c);
  if (!sc) return undefined;
  return sc.affinity === "choice" ? c.affinity : sc.affinity;
}

export function deficiencyOf(c: Character): SpellRing | undefined {
  return spellcastingOf(c)?.deficiency ?? undefined;
}

/**
 * Rang de lancement dans un élément (F.2, F-e) : rang d'école, +1 pour l'affinité, −1 pour la déficience.
 * À 0, l'élément ne peut pas être lancé (Kuni rang 1 en Air).
 */
export function castingRank(c: Character, ring: SpellRing): { rank: number; affinity: boolean; deficiency: boolean } {
  const affinity = affinityOf(c) === ring;
  const deficiency = deficiencyOf(c) === ring;
  return { rank: schoolRankOf(c) + Number(affinity) - Number(deficiency), affinity, deficiency };
}

/** Sort vierge, avec un identifiant unique (fusion par `id`, §8). */
export function createSpell(name = "", element: SpellElement = "earth"): Spell {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name, element, mastery: 1, keywords: [], range: "", area: "", duration: "", raises: "", memorized: false, effect: "",
  };
}
