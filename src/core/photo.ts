import { RINGS, TRAIT_LABELS } from "../rules/l5r4e";
import { parseCharacterFile } from "./io";
import { MAX_CHARACTER_BYTES, ROLL_TRAITS, SPELL_ELEMENTS, TRAIT_KEYS, type characterShape, type FieldError } from "./schema";

/**
 * Import depuis une fiche papier (lot 42, annexe S) : le Carnet fournit un prompt,
 * l'IA du joueur lit ses photos, le joueur colle la réponse. Aucun appel réseau ici.
 */

type ShapeKey = keyof typeof characterShape;

/** Champs de la fiche demandés à l'IA. */
export const PHOTO_PROMPT_FIELDS = [
  "schemaVersion", "name", "clan", "family", "school", "schoolRank", "insightRank",
  "honor", "glory", "status", "xp", "traits", "voidRing", "voidPoints", "wounds",
  "armor", "skills", "weapons", "techniques", "spells", "advantages", "disadvantages", "notes",
] as const satisfies readonly ShapeKey[];

/**
 * Champs laissés aux valeurs par défaut de l'import. Un nouveau champ du schéma doit entrer
 * dans l'une des deux listes (test P1). Sous-champs : `objet.champ` ou `liste[].champ`.
 */
export const PHOTO_PROMPT_SKIPPED = [
  "schoolId", "insightBonus", "maneuvers", "modifiers", "affinity", "spellSlotsUsed",
  "armor.catalogId", "weapons[].keywords",
  "spells[].keywords", "spells[].range", "spells[].area", "spells[].duration",
  "spells[].raises", "spells[].damage", "spells[].memorized", "spells[].effect",
] as const;

/** Clé où l'IA liste les chemins des valeurs mal lues ; retirée avant l'import. */
export const PHOTO_REVIEW_KEY = "_aVerifier";
const MAX_REVIEW = 50;

const ringOf = (t: (typeof TRAIT_KEYS)[number]) =>
  Object.values(RINGS).find((r) => "traits" in r && r.traits.includes(t))?.label ?? "";

function traitLines(): string {
  const entries = TRAIT_KEYS.map((k, i) => `"${k}": 2${i < TRAIT_KEYS.length - 1 ? "," : ""}`);
  const width = Math.max(...entries.map((e) => e.length)) + 2;
  return TRAIT_KEYS.map((k, i) => {
    const extra = k === "awareness" ? " (Intuition sur certaines fiches)" : "";
    return `    ${entries[i].padEnd(width)}// ${TRAIT_LABELS[k]} (${ringOf(k)})${extra}`;
  }).join("\n");
}

const list = (values: readonly string[]) => `${values.slice(0, -1).join(", ")} ou ${values[values.length - 1]}`;

/** Prompt à copier dans l'IA du joueur, généré depuis le schéma de fiche. */
export function buildPhotoPrompt(): string {
  return `Tu es un assistant de saisie pour le Carnet de Rokugan (L5R 4e édition, version française).
Je joins une ou plusieurs photos de ma fiche de personnage papier. Transcris-la en un seul objet JSON, au format du Carnet de Rokugan ci-dessous.

RÈGLES
- Réponds uniquement avec le JSON, sans texte avant ni après, et sans les commentaires // du modèle.
- Recopie ce qui est écrit sur la fiche. N'invente rien, ne calcule rien.
- Si une valeur est illisible ou absente, mets ta meilleure estimation et ajoute son chemin dans "${PHOTO_REVIEW_KEY}" (ex. "traits.agility", "skills[3].rank").
- Les listes absentes de la fiche restent vides : [].

FORMAT
{
  "schemaVersion": 2,
  "name": "Nom du personnage",
  "clan": "", "family": "", "school": "Nom de l'école",
  "schoolRank": null,
  "insightRank": 1,                      // Rang d'Insight (entier 1 à 10)
  "honor": 0, "glory": 0, "status": 0,   // Honneur, Gloire, Statut : 0 à 10, une décimale au plus
  "xp": { "total": 0, "spent": 0 },      // XP total et XP dépensée
  "traits": {                            // entiers 1 à 10
${traitLines()}
  },
  "voidRing": 2,                         // Anneau de Vide (1 à 10)
  "voidPoints": 2,                       // points de Vide restants (au plus voidRing)
  "wounds": 0,                           // points de blessure subis
  "armor": { "name": "", "bonus": 0, "reduction": 0 },
  "skills": [ { "name": "Kenjutsu", "rank": 1, "trait": "agility", "emphases": ["Katana"] } ],
                                         // trait : ${list(ROLL_TRAITS)}
  "weapons": [ { "name": "Katana", "skill": "Kenjutsu", "dr": "3g2" } ],
                                         // dr : VD au format NgN (ex. 3g2) ; pour un arc, ajouter "bowStrength" (Force de l'arc)
  "techniques": [ { "name": "Nom", "text": "Texte de la technique" } ],
  "spells": [ { "id": "nom-du-sort", "name": "Nom du sort", "element": "fire", "mastery": 1 } ],
                                         // element : ${list(SPELL_ELEMENTS)} ; mastery : 1 à 6
  "advantages": "texte libre, un par ligne",
  "disadvantages": "texte libre, un par ligne",
  "notes": "",
  "${PHOTO_REVIEW_KEY}": []
}`;
}

export type PhotoReply =
  | { ok: true; json: Record<string, unknown>; review: string[] }
  | { ok: false; errors: FieldError[] };

const fail = (message: string): PhotoReply => ({ ok: false, errors: [{ path: "", message }] });
const NO_JSON = "La réponse ne contient pas de JSON. Recopie toute la réponse de l'IA, accolades comprises.";
const BROKEN = "Le JSON est incomplet ou abîmé (réponse coupée ?). Demande à l'IA : « Renvoie le JSON complet, sans texte autour. »";
const NOT_CHARACTER = "La réponse ne contient pas une fiche de personnage.";

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Valeur désignée par un chemin `traits.agility`, `skills[3].rank` ; `undefined` si absente. */
export function valueAtPath(json: unknown, path: string): unknown {
  if (!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*|\[\d+\])*$/.test(path)) return undefined;
  let cur: unknown = json;
  for (const key of path.match(/\w+/g) ?? []) {
    if (typeof cur !== "object" || cur === null || !Object.hasOwn(cur, key)) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/**
 * Réponse collée de l'IA : garde le texte du premier `{` au dernier `}` (phrases autour,
 * bloc ```json), l'analyse comme un fichier importé, puis sépare la liste `_aVerifier`.
 */
export function extractPhotoReply(text: string): PhotoReply {
  // Tableau à la racine (bloc ```json éventuel compris) : pas une fiche, même s'il contient des objets.
  const fence = /```[\w-]*[^\S\n]*\n?/.exec(text);
  if ((fence ? text.slice(fence.index + fence[0].length) : text).trimStart().startsWith("[")) return fail(NOT_CHARACTER);

  const start = text.indexOf("{");
  if (start < 0) return fail(NO_JSON);
  const end = text.lastIndexOf("}");
  if (end < start) return fail(BROKEN);
  const slice = text.slice(start, end + 1);
  const parsed = parseCharacterFile(slice);
  if (!parsed.ok) {
    return new TextEncoder().encode(slice).length > MAX_CHARACTER_BYTES ? parsed : fail(BROKEN);
  }
  if (!isObject(parsed.json)) return fail(NOT_CHARACTER);

  const { [PHOTO_REVIEW_KEY]: raw, ...json } = parsed.json;
  const paths = Array.isArray(raw) && raw.every((p) => typeof p === "string") ? raw : [];
  const review = [...new Set(paths)].filter((p) => valueAtPath(json, p) !== undefined).slice(0, MAX_REVIEW);
  return { ok: true, json, review };
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nom", clan: "Clan", family: "Famille", school: "École", schoolRank: "Rang d'école",
  insightRank: "Rang d'Insight", honor: "Honneur", glory: "Gloire", status: "Statut",
  "xp.total": "XP total", "xp.spent": "XP dépensée",
  voidRing: "Anneau de Vide", voidPoints: "Points de Vide", wounds: "Blessures",
  "armor.name": "Armure", "armor.bonus": "Bonus d'armure", "armor.reduction": "Réduction d'armure",
  advantages: "Avantages", disadvantages: "Désavantages", notes: "Notes",
};

/** Élément de liste : nom commun, puis libellé de chaque champ. */
const LIST_LABELS: Record<string, { noun: string; fields: Record<string, string> }> = {
  skills: { noun: "Compétence", fields: { name: "Nom", rank: "Rang", trait: "Trait", emphases: "Spécialisations" } },
  weapons: { noun: "Arme", fields: { name: "Nom", skill: "Compétence", dr: "VD", bowStrength: "Force" } },
  techniques: { noun: "Technique", fields: { name: "Nom", text: "Texte" } },
  spells: { noun: "Sort", fields: { id: "Identifiant", name: "Nom", element: "Élément", mastery: "Maîtrise" } },
};

/** « de » élidé devant une voyelle : « Rang d'Athlétisme ». */
const of = (name: string) => (/^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`);

/** Libellé lisible d'un chemin de l'encadré « À vérifier » ; chemin inconnu : rendu tel quel. */
export function reviewLabel(path: string, json: unknown): string {
  const trait = /^traits\.(\w+)$/.exec(path)?.[1];
  if (trait && Object.hasOwn(TRAIT_LABELS, trait)) return TRAIT_LABELS[trait as keyof typeof TRAIT_LABELS];
  if (Object.hasOwn(FIELD_LABELS, path)) return FIELD_LABELS[path];

  const m = /^(\w+)\[(\d+)\](?:\.(\w+))?$/.exec(path);
  const listLabel = m && Object.hasOwn(LIST_LABELS, m[1]) ? LIST_LABELS[m[1]] : undefined;
  if (!m || !listLabel) return path;
  const name = valueAtPath(json, `${m[1]}[${m[2]}].name`);
  if (typeof name !== "string" || !name.trim()) return path;
  if (!m[3]) return `${listLabel.noun} : ${name}`;
  const field = Object.hasOwn(listLabel.fields, m[3]) ? listLabel.fields[m[3]] : undefined;
  if (!field) return path;
  return m[3] === "name" ? `${listLabel.noun} : ${name}` : `${field} ${of(name)}`;
}
