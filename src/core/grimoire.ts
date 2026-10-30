/**
 * Sorts du grimoire du portail (lot 30, HANDOFF annexe N) : lecture des fichiers, validation, conversion, recherche.
 * Pur : ni DOM ni réseau. Les fichiers sont lus comme du texte, jamais exécutés (ni eval, ni new Function, ni <script>).
 */
import JSON5 from "json5";
import { z } from "zod";
import { formatDR, normalize } from "./engine";
import { SPELL_ELEMENTS, type Spell, type SpellElement } from "./schema";
import { createSpell } from "./spells";

/** Fichier du grimoire illisible : tableau introuvable, JSON5 invalide. */
export class GrimoireFormatError extends Error {
  constructor(message: string) {
    super(`Grimoire illisible : ${message}`);
    this.name = "GrimoireFormatError";
  }
}

/** Tableau de sorts d'un fichier du grimoire ; lève GrimoireFormatError si introuvable ou illisible. */
export function parseGrimoireFile(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("];");
  if (start < 0 || end < start) throw new GrimoireFormatError("tableau introuvable");
  let data: unknown;
  try {
    data = JSON5.parse(text.slice(start, end + 1));
  } catch (e) {
    throw new GrimoireFormatError(e instanceof Error ? e.message : "JSON5 invalide");
  }
  if (!Array.isArray(data)) throw new GrimoireFormatError("pas un tableau");
  return data;
}

/** Sort du grimoire prêt à copier dans le Carnet, avec ses infos d'affichage. */
export interface GrimoireSpell {
  /** Identifiant du grimoire. */
  gid: string;
  /** Nom français, sans le nom anglais entre parenthèses. */
  name: string;
  /** Nom anglais (affichage seulement), "" si absent. */
  nameAlt: string;
  element: SpellElement;
  /** 1 à 6 (les universels du grimoire valent 1). */
  mastery: number;
  keywords: string[];
  range: string;
  area: string;
  duration: string;
  /** Une augmentation par ligne. */
  raises: string;
  /** VD au format du Carnet (« 2g2 »). */
  damage?: string;
  damageNote?: string;
}

/** Élément du grimoire (sans accents, minuscules) → élément du Carnet ; réciproque de GRIMOIRE_ELEMENT. Jamais Mahō ni Kihō. */
const FROM_GRIMOIRE: Readonly<Record<string, SpellElement>> = {
  universel: "all", air: "air", terre: "earth", feu: "fire", eau: "water", vide: "void",
};

const DAMAGE = /^\s*\d+\s*[gk]\s*\d+\s*$/i;
const optText = z.string().optional().catch(undefined);

/** Entrée d'un fichier du grimoire ; les champs inconnus (dont `desc`) sont écartés. */
const GrimoireEntrySchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  element: z.string().transform((e) => FROM_GRIMOIRE[normalize(e)]).pipe(z.enum(SPELL_ELEMENTS)),
  mastery: z.union([z.number().int().min(1).max(6), z.string().refine((m) => normalize(m) === "universel").transform(() => 1)]),
  keywords: z.array(z.unknown()).optional().catch(undefined),
  range: optText, area: optText, duration: optText, raises: optText,
  damage: optText,
  damageNote: optText,
  isMaho: z.unknown().optional(),
}).refine((g) => g.isMaho !== true);

/** « Frappe de Jade (Jade Strike) » → [« Frappe de Jade », « Jade Strike »]. */
function splitName(name: string): [string, string] {
  const m = /^(.*\S)\s*\(([^()]*)\)\s*$/.exec(name.trim());
  return m ? [m[1] ?? "", (m[2] ?? "").trim()] : [name.trim(), ""];
}

/** Augmentations : une par ligne, coupées aux virgules hors parenthèses ; « Aucune » → vide. */
export function splitRaises(raises: string): string {
  const r = raises.trim();
  if (!r || /^aucune?\.?$/i.test(r)) return "";
  return r.split(/,\s*(?![^()]*\))/).map((s) => s.trim()).filter(Boolean).join("\n");
}

/** Sort du grimoire validé et converti ; undefined si l'entrée est rejetée (annexe N.3). */
export function toGrimoireSpell(raw: unknown): GrimoireSpell | undefined {
  const r = GrimoireEntrySchema.safeParse(raw);
  if (!r.success) return undefined;
  const g = r.data;
  const [name, nameAlt] = splitName(g.name);
  const spell: GrimoireSpell = {
    gid: g.id,
    name: name.slice(0, 120),
    nameAlt,
    element: g.element,
    mastery: g.mastery,
    keywords: (g.keywords ?? []).filter((k): k is string => typeof k === "string" && k.trim().length > 0 && k.length <= 40).map((k) => k.trim()),
    range: (g.range ?? "").trim().slice(0, 80),
    area: (g.area ?? "").trim().slice(0, 120),
    duration: (g.duration ?? "").trim().slice(0, 80),
    raises: splitRaises(g.raises ?? "").slice(0, 2000),
  };
  if (g.damage && DAMAGE.test(g.damage)) spell.damage = formatDR(g.damage);
  if (g.damageNote?.trim() && g.damageNote.length <= 120) spell.damageNote = g.damageNote.trim();
  return spell;
}

/** Sorts valides d'un fichier du grimoire ; les entrées rejetées sont ignorées sans faire échouer le fichier. */
export function readGrimoireFile(text: string): GrimoireSpell[] {
  return parseGrimoireFile(text).map(toGrimoireSpell).filter((g): g is GrimoireSpell => g !== undefined);
}

/** Sort du grimoire tel qu'il est gardé en cache (revalidé au démarrage). */
export const GrimoireSpellSchema = z.object({
  gid: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  nameAlt: z.string().max(160),
  element: z.enum(SPELL_ELEMENTS),
  mastery: z.number().int().min(1).max(6),
  keywords: z.array(z.string().max(40)),
  range: z.string().max(80),
  area: z.string().max(120),
  duration: z.string().max(80),
  raises: z.string().max(2000),
  damage: z.string().regex(DAMAGE).optional(),
  damageNote: z.string().max(120).optional(),
});

/** Sort du Carnet rempli depuis le grimoire : effet vide (sauf « VD : … »), non mémorisé. */
export function toCarnetSpell(g: GrimoireSpell): Spell {
  return {
    ...createSpell(g.name, g.element),
    mastery: g.mastery,
    keywords: [...g.keywords],
    range: g.range, area: g.area, duration: g.duration, raises: g.raises,
    ...(g.damage ? { damage: g.damage } : {}),
    effect: !g.damage && g.damageNote ? `VD : ${g.damageNote}` : "",
  };
}

/** Ordre de lecture du grimoire : universels, puis Air, Terre, Feu, Eau, Vide. */
const ELEMENT_ORDER: readonly SpellElement[] = ["all", "air", "earth", "fire", "water", "void"];

/**
 * Sorts du grimoire filtrés par nom (français ou anglais, sans accents ni casse) et par élément.
 * Avec une requête : nom français qui commence par elle d'abord, puis maîtrise, puis nom.
 * Sans requête : universels, Air, Terre, Feu, Eau, Vide, puis maîtrise, puis nom.
 */
export function searchGrimoire(
  list: readonly GrimoireSpell[], query: string, element: SpellElement | "all-elements" = "all-elements", limit?: number,
): GrimoireSpell[] {
  const q = normalize(query);
  const byName = (a: GrimoireSpell, b: GrimoireSpell) => a.mastery - b.mastery || a.name.localeCompare(b.name, "fr");
  const found = list
    .filter((g) => element === "all-elements" || g.element === element)
    .filter((g) => !q || normalize(g.name).includes(q) || normalize(g.nameAlt).includes(q));
  const starts = (g: GrimoireSpell) => (normalize(g.name).startsWith(q) ? 0 : 1);
  found.sort(q
    ? (a, b) => starts(a) - starts(b) || byName(a, b)
    : (a, b) => ELEMENT_ORDER.indexOf(a.element) - ELEMENT_ORDER.indexOf(b.element) || byName(a, b));
  return limit === undefined ? found : found.slice(0, limit);
}

/** Le sort de la fiche est-il ce sort du grimoire ? (noms normalisés égaux : « déjà noté »). */
export function sameSpell(spell: Pick<Spell, "name">, g: Pick<GrimoireSpell, "name">): boolean {
  return normalize(spell.name) === normalize(g.name);
}
