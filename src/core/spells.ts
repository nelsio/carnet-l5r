/**
 * Magie (HANDOFF annexe F) : Rouleaux & invocations (v2.9.0), écoles de shugenja (v2.10.0),
 * jet de sort et situation « Magie » (v2.11.0).
 */
import type { SpellOption, Spellcasting } from "../rules/ecoles";
import { ELEMENT_LABELS, SPELL_CAST_TIME_MIN, SPELL_TN, type ActionDef } from "../rules/l5r4e";
import { normalize, parseDR, rings, type PoolAction } from "./engine";
import { SPELL_ELEMENTS, SPELL_RINGS, type Character, type Spell, type SpellElement, type SpellRing } from "./schema";
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

/** Cases de l'école pour le lanceur de sort (annexe F.4). */
export function spellOptions(c: Character): readonly SpellOption[] {
  return spellcastingOf(c)?.options ?? [];
}

/** Cases cochées parmi celles de l'école. */
const chosenOptions = (c: Character, ids?: readonly string[]) => spellOptions(c).filter((o) => ids?.includes(o.id));

/**
 * Rang de lancement dans un élément (F.2, F-e) : rang d'école, +1 pour l'affinité, −1 pour la déficience.
 * À 0, l'élément ne peut pas être lancé (Kuni rang 1 en Air). Une case cochée peut ajouter une affinité (Moshi le jour).
 */
export function castingRank(
  c: Character, ring: SpellRing, options?: readonly string[],
): { rank: number; affinity: boolean; deficiency: boolean } {
  const affinity = affinityOf(c) === ring || chosenOptions(c, options).some((o) => o.extraAffinity === ring);
  const deficiency = deficiencyOf(c) === ring;
  return { rank: schoolRankOf(c) + Number(affinity) - Number(deficiency), affinity, deficiency };
}

/** Élément de lancement par défaut : celui du sort ; pour un sort universel, l'élément à la plus grosse réserve. */
export function defaultSpellElement(c: Character, spell: Pick<Spell, "element">): SpellRing {
  if (spell.element !== "all") return spell.element;
  const r = rings(c);
  const dice = (x: SpellRing) => r[x] + castingRank(c, x).rank;
  return [...SPELL_RINGS].sort((a, b) => dice(b) - dice(a))[0] ?? "earth";
}

export type SpellAction = Extract<PoolAction, { kind: "spell" }>;
export type SpellDamageAction = Extract<PoolAction, { kind: "spellDamage" }>;

export interface SpellCast {
  /** Élément du sort (universel : élément choisi), qui décide de l'affinité et de la déficience. */
  element: SpellRing;
  /** Anneau du jet : l'élément, ou un autre Anneau (Agasha, 1 point de Vide). */
  ring: SpellRing;
  ringValue: number;
  rank: number;
  affinity: boolean;
  deficiency: boolean;
  /** Dés lancés en plus des cases de l'école (Kuni : cible non humaine). */
  rolled: number;
  /** Raisons des augmentations gratuites de l'école (« mot-clé Jade »), une par augmentation. */
  freeRaises: string[];
}

/** Jet de sort (F.2) : (Anneau + rang de lancement) g Anneau, cases et augmentations gratuites de l'école. */
export function spellCast(c: Character, a: Omit<SpellAction, "kind">): SpellCast {
  const element = a.spell.element === "all" ? (a.element ?? defaultSpellElement(c, a.spell)) : a.spell.element;
  const ring = a.ring ?? element;
  const { rank, affinity, deficiency } = castingRank(c, element, a.options);
  const sc = spellcastingOf(c);
  const options = chosenOptions(c, a.options);
  const keywords = a.spell.keywords.map(normalize);
  const freeRaises = [
    ...(sc?.freeRaiseKeywords ?? []).filter((k) => keywords.includes(normalize(k))).map((k) => `mot-clé ${k}`),
    ...(sc?.freeRaiseAffinity && affinityOf(c) === element ? ["élément d'affinité"] : []),
    ...options.flatMap((o) => Array.from({ length: o.freeRaises ?? 0 }, () => o.label)),
  ];
  return {
    element, ring, ringValue: rings(c)[ring], rank, affinity, deficiency,
    rolled: options.reduce((n, o) => n + (o.rolled ?? 0), 0), freeRaises,
  };
}

/** Dégâts d'un sort (VD) : sans la Force ni point de Vide, plus les cases de l'école (cible souillée). */
export function spellDamage(c: Character, a: Omit<SpellDamageAction, "kind">): { rolled: number; kept: number; flat: number } {
  const dr = parseDR(a.spell.damage ?? "");
  const options = chosenOptions(c, a.options);
  return {
    rolled: dr.rolled + options.reduce((n, o) => n + (o.damageRolled ?? 0), 0),
    kept: dr.kept + options.reduce((n, o) => n + (o.damageKept ?? 0), 0),
    flat: options.reduce((n, o) => n + (o.damageFlat === "schoolRank" ? schoolRankOf(c) : 0), 0),
  };
}

/** Sort que le rang ne permet pas (carte grisée, « Lancer quand même ») : rang de lancement 0, maîtrise > rang d'école. */
export function spellRestriction(c: Character, spell: Spell, element = defaultSpellElement(c, spell), options?: readonly string[]): string | null {
  const school = schoolRankOf(c);
  if (castingRank(c, element, options).rank <= 0) return `Déficience : impossible au rang ${school}.`;
  if (spell.mastery > school) return `Maîtrise ${spell.mastery} > rang ${school}.`;
  return null;
}

/** Temps d'incantation, en actions complexes : la maîtrise, moins les augmentations annoncées pour ça, au moins 1. */
export function castTime(mastery: number, raises = 0): number {
  return Math.max(SPELL_CAST_TIME_MIN, mastery - Math.max(0, raises));
}

/** « 2 actions complexes ». */
export const castTimeLabel = (n: number) => `${n} action${n > 1 ? "s" : ""} complexe${n > 1 ? "s" : ""}`;

/** Actions de la situation « Magie » : un lancer par sort, groupés par élément, et ses dégâts s'il a une VD. */
export function spellActions(c: Character): ActionDef[] {
  return sortSpells(c.spells ?? []).flatMap((spell): ActionDef[] => {
    const id = `spell-${spell.id}`;
    const tn = spellTn(spell.mastery);
    const group = ELEMENT_LABELS[spell.element];
    const cast: ActionDef = {
      id, situation: "magic", kind: "spell", spell, tn, group, label: `Lancer · ${spell.name}`,
      description: [`ND ${tn}`, castTimeLabel(castTime(spell.mastery)), spell.keywords.join(", "), spell.memorized ? "mémorisé" : "parchemin"]
        .filter(Boolean).join(" · "),
    };
    if (!spell.damage?.trim()) return [cast];
    return [cast, {
      id: `spelldmg-${spell.id}`, situation: "magic", parent: id, kind: "spellDamage", spell, tn: null, group,
      label: `Dégâts · ${spell.name}`, description: `VD ${spell.damage}, sans la Force ni point de Vide.`,
    }];
  });
}


/** Sort vierge, avec un identifiant unique (fusion par `id`, §8). */
export function createSpell(name = "", element: SpellElement = "earth"): Spell {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name, element, mastery: 1, keywords: [], range: "", area: "", duration: "", raises: "", memorized: false, effect: "",
  };
}
