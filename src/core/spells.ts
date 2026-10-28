/** Magie (HANDOFF annexe F, v2.9.0) : Rouleaux & invocations. */
import { SPELL_TN } from "../rules/l5r4e";
import { normalize } from "./engine";
import { SPELL_ELEMENTS, type Character, type Spell, type SpellElement } from "./schema";
import { schoolOf } from "./schools";

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

/**
 * Shugenja (annexe F.4) : école de classe « Shugenja », ou au moins un sort.
 * En attendant le catalogue des écoles de shugenja (v2.10.0), « shugenja » dans le nom affiché de l'école suffit.
 */
export function isShugenja(c: Character): boolean {
  return (c.spells?.length ?? 0) > 0
    || schoolOf(c)?.class === "Shugenja"
    || normalize(c.school).includes("shugenja");
}

/** Sort vierge, avec un identifiant unique (fusion par `id`, §8). */
export function createSpell(name = "", element: SpellElement = "earth"): Spell {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name, element, mastery: 1, keywords: [], range: "", area: "", duration: "", raises: "", memorized: false, effect: "",
  };
}
