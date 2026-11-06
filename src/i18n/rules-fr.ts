/**
 * Vocabulaire de règles et textes du moteur en français (annexe 53.1, 53.2).
 * Les libellés français restent des données de `src/rules` (lus aussi par le moteur, le prompt photo et la spec
 * fournie) : ce fichier les reprend par référence, les phrases affichées sont donc celles d'avant le lot 53.
 */
import { formatDR } from "../core/dice";
import type { CoreMessages, EffectPart, ModifierEffect } from "../core/text";
import { WEAPON_KEYWORD_LABELS } from "../rules/ecoles";
import {
  ARMOR_CATALOG, ARMY_STATUSES, CALLED_ZONES, CLANS, COMBAT_SUBS, DEAD_LABEL, DEFAULT_MANEUVERS, ELEMENT_LABELS, ENGAGEMENTS,
  FIXED_ACTIONS, MODIFIER_NAME_PLACEHOLDERS, NEW_CHARACTER_NAME, MODIFIER_SOURCE_LABELS, MODIFIER_TARGET_LABELS, MODIFIER_TEMPLATES, RINGS,
  SITUATIONS, STANCES, TERRAINS, TN_SCALE, TRAIT_LABELS, WOUND_LEVELS,
} from "../rules/l5r4e";

const byId = <T extends { id: string }, V>(list: readonly T[], f: (x: T) => V): Record<string, V> =>
  Object.fromEntries(list.map((x) => [x.id, f(x)]));

export const rulesFr = {
  traits: TRAIT_LABELS,
  rings: { earth: RINGS.earth.label, water: RINGS.water.label, fire: RINGS.fire.label, air: RINGS.air.label, void: RINGS.void.label },
  elements: ELEMENT_LABELS,
  /** Échelle des ND, dans l'ordre de `TN_SCALE`. */
  tnScale: TN_SCALE.map((s) => s.label) as readonly string[],
  /** Niveaux de blessure, dans l'ordre de `WOUND_LEVELS` ; `woundsShort` : piste de la barre d'état (annexe 45.1). */
  wounds: WOUND_LEVELS.map((w) => w.label) as readonly string[],
  woundsShort: WOUND_LEVELS.map((w) => w.short ?? w.label) as readonly string[],
  dead: DEAD_LABEL as string,
  stances: byId(STANCES, (s) => ({ label: s.label, description: s.description, tags: s.tags.map((t) => t.label) as readonly string[] })),
  terrains: byId(TERRAINS, (t) => t.label),
  calledZones: byId(CALLED_ZONES, (z) => z.label),
  engagements: byId(ENGAGEMENTS, (e) => e.label),
  armyStatuses: byId(ARMY_STATUSES, (s) => ({ label: s.label, verdict: s.verdict })),
  situations: byId(SITUATIONS, (s) => s.label),
  combatSubs: byId(COMBAT_SUBS, (s) => s.label),
  /** Groupes titrés de la liste d'actions (`ActionDef.group`) ; un sort est groupé par élément. */
  groups: { rest: "Repos", spells: "Sorts", attacks: "Attaques", interrupt: "Interruption" } as Record<string, string>,
  actions: {
    ...byId(FIXED_ACTIONS, (a) => ({ label: a.label, description: a.description })),
    concentrate: { label: "Rester concentré (Volonté)", description: "" },
  } as Record<string, { label: string; description: string }>,
  maneuvers: byId(DEFAULT_MANEUVERS, (m) => ({ name: m.name, effect: m.effect })),
  modifierSources: MODIFIER_SOURCE_LABELS as Record<keyof typeof MODIFIER_SOURCE_LABELS, string>,
  modifierTargets: MODIFIER_TARGET_LABELS as Record<keyof typeof MODIFIER_TARGET_LABELS, string>,
  modifierPlaceholders: MODIFIER_NAME_PLACEHOLDERS,
  modifierTemplates: byId(MODIFIER_TEMPLATES, (t) => t.label),
  armors: byId(ARMOR_CATALOG, (a) => ({ name: a.name, summary: a.summary ?? "" })),
  weaponKeywords: WEAPON_KEYWORD_LABELS,
  /** Nom d'une fiche vierge (« Nouvelle fiche »). */
  newCharacter: NEW_CHARACTER_NAME as string,
  /** Noms des clans (`clanAccent`), par id. */
  clans: byId(CLANS, (c) => c.label),
  /** Badges des rangs d'école (`techniqueCategories`). */
  techniqueCategories: { auto: "auto", optional: "à cocher", reminder: "rappel", text: "texte" },
  /** Titre d'une maîtrise de compétence (annexe 54.2) : nom de la compétence de la fiche et rang. */
  masteryTitle: (skill: string, rank: number) => `Maîtrise ${skill} ${rank}`,
};

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const dice = (rolled: number, kept: number) => `${rolled}g${kept}`;
const raises = (n: number) => `${n} augm. gratuite${n > 1 ? "s" : ""}`;

function modifier(m: ModifierEffect): string {
  if (m.appliesTo === "armor") return `${signed(m.flat)} au ND d'armure`;
  if (m.appliesTo === "wounds") return `${signed(-m.flat)} à la pénalité de blessure`;
  const parts: string[] = [];
  if (m.rolled || m.kept) parts.push(`${m.rolled >= 0 && m.kept >= 0 ? "+" : ""}${dice(m.rolled, m.kept)}`);
  if (m.flat) parts.push(`${signed(m.flat)} au total`);
  if (m.freeRaises) parts.push(raises(m.freeRaises));
  if (m.tn) parts.push(`${signed(m.tn)} au ND`);
  return parts.join(", ") || "sans effet";
}

function effectPart(p: EffectPart): string {
  switch (p.kind) {
    case "dice": return `${p.rolled >= 0 && p.kept >= 0 ? "+" : ""}${dice(p.rolled, p.kept)}`;
    case "flat": return signed(p.n);
    case "freeRaises": return raises(p.n);
    case "tn": return `ND ${signed(p.n)}`;
    case "unlimitedRaises": return "augmentations non limitées";
    case "explode": return `explose sur ${p.on}`;
    case "voidBoost": return `Vide : +${dice(p.rolled, p.kept)} par point`;
    case "armor": return `${signed(p.n)} au ND d'armure${p.perStack ? " par cran" : ""}`;
    case "targetTn": return `${signed(p.n)} au ND de la cible par cran`;
    case "ignoreWounds": return "pénalité de blessure ignorée";
    case "maneuverRaises": return `${raises(p.n)} pour ${rulesFr.maneuvers[p.maneuver]?.name ?? p.maneuver}`;
  }
}

const armorName = (id: string) => rulesFr.armors[id]?.name ?? id;
const castTime = (n: number) => `${n} action${n > 1 ? "s" : ""} complexe${n > 1 ? "s" : ""}`;

export const coreFr: CoreMessages = {
  "pool.voidSkill": () => "Vide : compétence jouée au rang 1",
  "pool.unskilled": () => "Sans compétence : pas d'explosion ni d'augmentation",
  "pool.fullAttack": (p) => `Assaut : +${dice(p.rolled, p.kept)}`,
  "pool.disarm": (p) => `Désarmement : ${dice(p.rolled, p.kept)} sans la Force ni augmentation de dégâts`,
  "pool.extraRolled": (p) => `${p.n > 0 ? "+" : ""}${p.n} dé(s) lancé(s)`,
  "pool.center": (p) => `Bonus de Centre : +${dice(p.rolled, p.kept)} +${p.flat}`,
  "pool.assessment": (p) => `Évaluation gagnée de ${p.margin} ou plus : +${dice(p.rolled, p.kept)}`,
  "pool.meleeTarget": (p) => `Cible au corps à corps : −${p.penalty}`,
  "pool.modifier": (p, f) => `${p.name} : ${f(p.effect)}`,
  "pool.explode": (p) => `Maîtrise ${p.source} : les dés explosent sur ${p.on} et 10`,
  "pool.effect": (p) => `${p.source} : ${p.parts.map(effectPart).join(" ")}`,
  "pool.voidPoint": (p) => `${p.katana ? "Vide (katana)" : "Point de Vide"} : +${dice(p.rolled, p.kept)}`,
  "pool.voidSpend": (p) => `${p.points} points de Vide (${p.source}) : +${dice(p.rolled, p.kept)}`,
  "pool.tenDice": (p) => `Règle des dix dés : +${p.bonus}`,
  "pool.bowMastery": (p) => `Maîtrise ${p.source} : force de l'arc +${p.value}`,
  "pool.bowCapped": (p) => `Force ${p.strength} : l'arc de force ${p.bow} tire à ${p.strength}`,
  "pool.weaponTn": (p) => `${p.weapon} : +${p.tn} au ND des tirs ${p.mounted ? "montés" : "à pied"}`,
  "pool.minStrength": (p) => `${p.weapon} : Force ${p.min} minimum (tu as ${p.strength}).`,
  "armor.skillTn": (p) => `${armorName(p.armor)} : +${p.tn} au ND`,
  "armor.waived": (p) => `${armorName(p.armor)} : malus ignoré (${p.source})`,
  "armor.heavy": (p) => `${armorName(p.armor)} : +${p.tn} au ND (${rulesFr.traits.agility}, ${rulesFr.traits.reflexes}${p.onFoot ? ", à pied" : ""})`,
  modifier,
  effect: (p) => p.parts.map(effectPart).join(" "),
  "restrict.fullAttackSpell": () => "Assaut : attaques seulement, pas de sort.",
  "restrict.fullDefenseSpell": () => "Défense totale : actions gratuites seulement, pas de sort.",
  "restrict.center": () => "Posture Centre : aucune action ce round.",
  "restrict.defense": () => "Posture Défense : pas d'attaque ce round.",
  "restrict.fullAttackRanged": () => "Assaut : pas d'attaque à distance.",
  "spell.deficiency": (p) => `Déficience : impossible au rang ${p.rank}.`,
  "spell.mastery": (p) => `Maîtrise ${p.mastery} > rang ${p.rank}.`,
  "wound.crippled": () => "Estropié : chaque déplacement coûte un cran de plus (action libre → simple, simple → complexe).",
  "wound.down": () => "À terre : actions gratuites seulement, en dépensant 1 point de Vide pour chacune.",
  "spell.keyword": (p) => `mot-clé ${p.keyword}`,
  "spell.affinity": () => "élément d'affinité",
  "spell.option": (p) => p.label,
  "spell.castTime": (p) => castTime(p.n),
  "action.label": (p) => rulesFr.actions[p.id]?.label ?? p.id,
  "action.description": (p) => rulesFr.actions[p.id]?.description ?? "",
  "action.attack": (p) => `${p.ranged ? "Tir" : "Attaque"} · ${p.weapon}`,
  "action.attackAbout": (p) => `${p.skill} (${rulesFr.traits[p.trait]}) contre le ND d'armure de la cible. Choisis tes manœuvres dans le lanceur.`,
  "action.damage": (p) => `Dégâts · ${p.name}`,
  "action.damageAbout": (p) => `Force + VD ${formatDR(p.dr)}. Les augmentations de dégâts s'ajoutent en dés lancés.`,
  "action.bowDamageAbout": (p) => `Force de l'arc ${p.bow} + VD de la flèche ${formatDR(p.dr)}.`,
  "action.duelDamageAbout": () => "Les augmentations de la Frappe ajoutent +1g0 chacune.",
  "action.lore": (p) => `Se souvenir · ${p.detail}`,
  "action.loreAbout": (p) => `${p.skill} (${rulesFr.traits.intelligence}). Les augmentations donnent des détails de plus.`,
  "action.perform": (p) => `Se produire · ${p.detail}`,
  "action.performAbout": (p) => `${p.skill} (${rulesFr.traits.awareness}). ND selon le public ; chaque augmentation marque davantage les esprits.`,
  "action.cast": (p) => `Lancer · ${p.spell}`,
  "action.castAbout": (p) => [`ND ${p.tn}`, castTime(p.castTime), p.keywords, p.memorized ? "mémorisé" : "parchemin"].filter(Boolean).join(" · "),
  "action.spellDamageAbout": (p) => `VD ${formatDR(p.dr)}, sans la Force ni point de Vide.`,
  "action.concentrateAbout": (p) =>
    `Interrompu pendant l'incantation : Volonté, ND ${p.tn}, ou ${p.base} + dégâts subis. Raté : le sort est perdu, sans dépenser l'emplacement.`,
};
