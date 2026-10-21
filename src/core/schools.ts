/** Techniques d'école : moteur d'effets du catalogue bushi (HANDOFF annexe C.4). */
import { DEFAULT_MANEUVERS, type RingKey, type Stance } from "../rules/l5r4e";
import {
  BUGEI_SKILLS, SCHOOLS, WEAPON_CATALOG,
  type CatalogWeapon, type Effect, type On, type ReminderContext, type School, type SchoolRank, type Value, type When,
} from "../rules/ecoles";
import { findSkill, isRanged, normalize, rings, traitValue, type PoolAction, type WeaponLike } from "./engine";
import { WEAPON_KEYWORDS, type Character, type Maneuver, type TraitKey, type WeaponKeyword } from "./schema";

/** Situation du personnage au moment du jet. */
export interface SchoolContext {
  stance: Stance;
  mounted: boolean;
  /** Posture Centre au round précédent (Kakita R1). */
  centerLastRound: boolean;
}

/** Contexte de référence hors lanceur (fiche, statistiques) : posture Attaque, non monté. */
export const REFERENCE_CONTEXT: SchoolContext = { stance: "attack", mounted: false, centerLastRound: false };

export type ActiveEffect = Effect & {
  /** Clé stable : `<école>-<rang>-<index>`. */
  key: string;
  /** « Hiruma R1 ». */
  source: string;
  rank: number;
  technique: string;
  summary: string;
};

export type Verdict = "success" | "failure" | "baseSuccess";

/** Contexte partiel : les champs absents prennent la valeur de référence. */
export function schoolContext(ctx: Partial<SchoolContext> = {}): SchoolContext {
  return {
    stance: ctx.stance ?? REFERENCE_CONTEXT.stance,
    mounted: ctx.mounted ?? false,
    centerLastRound: ctx.centerLastRound ?? false,
  };
}

/** « Nouveau round » : retient si la posture était Centre. */
export function nextRoundContext(ctx: SchoolContext): SchoolContext {
  return { ...ctx, centerLastRound: ctx.stance === "center" };
}

export function findSchool(id: string | undefined): School | undefined {
  return id ? SCHOOLS.find((s) => s.id === id) : undefined;
}

export function schoolOf(c: Character): School | undefined {
  return findSchool(c.schoolId);
}

/** Rang d'école : `schoolRank`, ou le Rang d'Insight par défaut. */
export function schoolRankOf(c: Character): number {
  return c.schoolRank ?? c.insightRank;
}

/** Nom court d'une école (dernier mot) : « Kakita », « Daidoji ». */
export function shortSchoolName(s: School): string {
  return s.name.split(" ").pop() ?? s.name;
}

/** Écoles groupées par clan, dans l'ordre du catalogue. */
export function schoolsByClan(): { clan: string; schools: School[] }[] {
  const groups: { clan: string; schools: School[] }[] = [];
  for (const s of SCHOOLS) {
    const g = groups.find((x) => x.clan === s.clan);
    if (g) g.schools.push(s);
    else groups.push({ clan: s.clan, schools: [s] });
  }
  return groups;
}

/** École du catalogue dont le nom de famille apparaît dans le champ libre « École » (fiche sans école associée). */
export function suggestSchool(c: Character): School | undefined {
  if (c.schoolId || !c.school) return undefined;
  const words = new Set(normalize(c.school).split(/[^a-z0-9-]+/));
  return SCHOOLS.find((s) => words.has(normalize(shortSchoolName(s))));
}

export function activeEffects(c: Character): ActiveEffect[] {
  const s = schoolOf(c);
  if (!s) return [];
  const rank = schoolRankOf(c);
  return s.ranks.filter((r) => r.rank <= rank).flatMap((r) =>
    r.effects.map((e, i) => ({
      ...e, key: `${s.id}-${r.rank}-${i}`, source: `${shortSchoolName(s)} R${r.rank}`, rank: r.rank, technique: r.name, summary: r.summary,
    })),
  );
}

const has = (c: Character, kind: Effect["kind"]) => activeEffects(c).some((e) => e.kind === kind);

/** Rang d'Honneur : arrondi à l'inférieur (HANDOFF P9). */
export function honorRank(c: Character): number {
  return Math.floor(c.honor);
}

export function resolveValue(v: Value | undefined, c: Character, input?: number): number {
  if (v === undefined) return 0;
  if (typeof v === "number") return v;
  const { ref } = v;
  let n: number;
  if (ref === "schoolRank") n = schoolRankOf(c);
  else if (ref === "honor") n = honorRank(c);
  else if (ref === "input") n = Math.trunc(input ?? 0);
  else if (ref.startsWith("ring:")) n = rings(c)[ref.slice(5) as RingKey];
  else if (ref.startsWith("trait:")) n = traitValue(c, ref.slice(6) as TraitKey);
  else n = findSkill(c, ref.slice(6))?.rank ?? 0;
  n *= v.mult ?? 1;
  if (v.div) n = Math.floor(n / v.div);
  n += v.add ?? 0;
  if (v.min !== undefined) n = Math.max(v.min, n);
  return n;
}

export function catalogWeapon(name: string): CatalogWeapon | undefined {
  const key = normalize(name);
  return WEAPON_CATALOG.find((w) => normalize(w.name) === key);
}

/** Mots-clés saisis en texte (« Samouraï, deux mains ») → mots-clés valides, sans doublon. */
export function parseWeaponKeywords(text: string): WeaponKeyword[] {
  const valid = new Set<string>(WEAPON_KEYWORDS);
  const out: WeaponKeyword[] = [];
  for (const raw of text.split(/[,;]/)) {
    const k = normalize(raw).replace(/\s+/g, "-");
    if (valid.has(k) && !out.includes(k as WeaponKeyword)) out.push(k as WeaponKeyword);
  }
  return out;
}

/** Mots-clés de l'arme (ceux du catalogue à défaut), plus ceux ajoutés par une technique (Moto R1). */
export function weaponKeywords(c: Character, w: WeaponLike): Set<WeaponKeyword> {
  const own = w.keywords?.length ? w.keywords : (catalogWeapon(w.name)?.keywords ?? []);
  const set = new Set<WeaponKeyword>(own);
  for (const e of activeEffects(c)) {
    if (e.kind === "keyword" && set.has(e.weaponKeyword)) set.add(e.adds);
  }
  return set;
}

let bugei: Set<string> | undefined;
export function isBugeiSkill(name: string): boolean {
  bugei ??= new Set(BUGEI_SKILLS.map(normalize));
  return bugei.has(normalize(name));
}

const actionWeapon = (a: PoolAction | undefined): WeaponLike | undefined =>
  a && (a.kind === "skill" || a.kind === "damage") ? a.weapon : undefined;
const actionUnarmed = (a: PoolAction | undefined) => !!a && (a.kind === "skill" || a.kind === "damage") && !!a.unarmed;

export function whenOk(w: When | undefined, c: Character, a: PoolAction | undefined, ctx: SchoolContext): boolean {
  if (!w) return true;
  if (w.stance && !w.stance.includes(ctx.stance)) return false;
  if (w.stanceNot?.includes(ctx.stance)) return false;
  if (w.mounted !== undefined && w.mounted !== ctx.mounted) return false;
  if (w.centerOrAfter && !(ctx.stance === "center" || ctx.centerLastRound)) return false;
  if (w.skillGroup === "bugei" && !(a?.kind === "skill" && isBugeiSkill(a.skill))) return false;
  if (w.weapon) {
    if (!a) return false;
    const weapon = actionWeapon(a);
    const unarmed = actionUnarmed(a);
    const W = w.weapon;
    if (W.unarmed && !unarmed) return false;
    if (W.keywordsAny && !(weapon && !unarmed && W.keywordsAny.some((k) => weaponKeywords(c, weapon).has(k)))) return false;
    if (W.melee && (!(weapon || unarmed) || (weapon && isRanged(weapon)))) return false;
    if (W.ranged && !(weapon && isRanged(weapon))) return false;
  }
  if (w.anyOf && !w.anyOf.some((x) => whenOk(x, c, a, ctx))) return false;
  return true;
}

export function onMatches(on: readonly On[] | undefined, a: PoolAction): boolean {
  if (!on) return true;
  return on.some((o) => {
    switch (o) {
      case "attack": return a.kind === "skill" && !!a.attack;
      case "damage": return a.kind === "damage";
      case "initiative": return a.kind === "initiative";
      case "focus": return a.kind === "skill" && !!a.focus;
      case "skill": return a.kind === "skill" && !a.attack;
      case "trait": return a.kind === "trait";
      case "bugei": return a.kind === "skill" && isBugeiSkill(a.skill);
      default: return a.kind === "skill" && normalize(a.skill) === normalize(o.slice(6));
    }
  });
}

/**
 * Effets qui concernent ce jet : bonus de jet, pénalité ignorée à cocher,
 * augmentations gratuites réservées à une manœuvre (attaques).
 */
export function rollEffects(c: Character, a: PoolAction, ctx: SchoolContext): ActiveEffect[] {
  return activeEffects(c).filter((e) => {
    if (e.kind === "roll") return onMatches(e.on, a) && whenOk(e.when, c, a, ctx);
    if (e.kind === "wounds" && e.mode === "optional") return onMatches(e.on, a) && whenOk(e.when, c, a, ctx);
    if (e.kind === "maneuver" && e.freeRaisesFor) return a.kind === "skill" && !!a.attack && whenOk(e.when, c, a, ctx);
    return false;
  });
}

/** Effet pris en compte : d'office, ou coché. */
export function effectOn(e: ActiveEffect, selected?: ReadonlySet<string>): boolean {
  return ("mode" in e && e.mode === "auto") || !!selected?.has(e.key);
}

/** Effets de ND d'armure valables dans ce contexte (auto, à cocher, compteurs). */
export function armorEffects(c: Character, ctx: SchoolContext): ActiveEffect[] {
  return activeEffects(c).filter((e) => e.kind === "armor" && whenOk(e.when, c, undefined, ctx));
}

export function schoolArmorBonus(
  c: Character, ctx: SchoolContext, selected?: ReadonlySet<string>, stacks?: Readonly<Record<string, number>>,
): number {
  return armorEffects(c, ctx).reduce((sum, e) => {
    if (e.kind !== "armor") return sum;
    const value = resolveValue(e.value, c);
    if (e.stack) return sum + stackCount(c, e, stacks) * value;
    return sum + (effectOn(e, selected) ? value : 0);
  }, 0);
}

/** Valeur d'un compteur, bornée par son plafond. */
export function stackCount(c: Character, e: ActiveEffect, stacks?: Readonly<Record<string, number>>): number {
  if (!("stack" in e) || !e.stack) return 0;
  return Math.max(0, Math.min(stacks?.[e.key] ?? 0, stackMax(c, e)));
}

export function stackMax(c: Character, e: ActiveEffect): number {
  return "stack" in e && e.stack ? resolveValue(e.stack.max, c) : 0;
}

/** Effets à compteur (Hiruma R2, Yoritomo R2). */
export function stackEffects(c: Character): ActiveEffect[] {
  return activeEffects(c).filter((e) => "stack" in e && !!e.stack);
}

export function schoolReduction(c: Character): number {
  return activeEffects(c).reduce((s, e) => s + (e.kind === "reduction" ? resolveValue(e.value, c) : 0), 0);
}

/** Blessures en plus par niveau, et pénalité ignorée (effets d'office). */
export function woundEffects(c: Character, ctx: SchoolContext): { perLevel: number; ignore: number } {
  let perLevel = 0;
  let ignore = 0;
  for (const e of activeEffects(c)) {
    if (e.kind !== "wounds" || e.mode !== "auto" || !whenOk(e.when, c, undefined, ctx)) continue;
    perLevel += resolveValue(e.perLevel, c);
    if (e.ignorePenalty !== undefined && e.ignorePenalty !== "all") ignore += resolveValue(e.ignorePenalty, c);
  }
  return { perLevel, ignore };
}

/** Une option « pénalité de blessure ignorée » est-elle cochée pour ce jet ? */
export function ignoresWoundPenalty(effects: readonly ActiveEffect[], selected?: ReadonlySet<string>): boolean {
  return effects.some((e) => e.kind === "wounds" && e.ignorePenalty === "all" && effectOn(e, selected));
}

/** Modification du ND d'armure des cibles pour tes attaques (Yoritomo R2). */
export function targetTnModifier(c: Character, stacks?: Readonly<Record<string, number>>): number {
  return activeEffects(c).reduce((s, e) => s + (e.kind === "targetTn" ? stackCount(c, e, stacks) * resolveValue(e.value, c) : 0), 0);
}

/** Chaque point de Vide compte double (Shiba R5). */
export function voidMultiplier(c: Character): number {
  return has(c, "voidDouble") ? 2 : 1;
}

/** Option de dépense de plusieurs points de Vide (Shiba R1). */
export function voidSpendOption(c: Character): (ActiveEffect & { kind: "void" }) | undefined {
  return activeEffects(c).find((e): e is ActiveEffect & { kind: "void" } => e.kind === "void");
}

/** Badge « Attaque : Action simple ». */
export function isSimpleAttack(c: Character, a: PoolAction, ctx: SchoolContext): boolean {
  return a.kind === "skill" && !!a.attack && activeEffects(c).some((e) => e.kind === "simpleAttack" && whenOk(e.when, c, a, ctx));
}

/** Coût d'une manœuvre, modifié par une technique (Bayushi R2 : Feinte à 1). */
export function maneuverCost(c: Character | undefined, m: Maneuver): number {
  const e = c && activeEffects(c).find((x) => x.kind === "maneuver" && x.cost?.maneuver === m.id);
  return e && e.kind === "maneuver" && e.cost ? e.cost.value : m.cost;
}

/** Augmentations gratuites réservées à chaque manœuvre pour ce jet, par identifiant. */
export function maneuverFreeRaises(effects: readonly ActiveEffect[], selected?: ReadonlySet<string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of effects) {
    if (e.kind === "maneuver" && e.freeRaisesFor && effectOn(e, selected)) {
      out[e.freeRaisesFor.maneuver] = (out[e.freeRaisesFor.maneuver] ?? 0) + e.freeRaisesFor.count;
    }
  }
  return out;
}

/** Pieds de déplacement en plus par tour (Matsu R1 en Assaut), sans dépasser le maximum. */
export function movementBonus(c: Character, ctx: SchoolContext): number {
  return activeEffects(c).reduce((s, e) => s + (e.kind === "move" && whenOk(e.when, c, undefined, ctx) ? resolveValue(e.value, c) : 0), 0);
}

/**
 * Résultat d'un jet. Akodo R5 : sur un jet de compétence Bugei raté, un total qui atteint le ND
 * sans les augmentations annoncées réussit quand même, sans leurs effets.
 */
export function verdict(
  c: Character, a: PoolAction, ctx: SchoolContext, total: number, tn: number, baseTn: number,
): Verdict {
  if (total >= tn) return "success";
  const akodo = activeEffects(c).some((e) => e.kind === "verdict" && e.rule === "baseTnSuccess" && whenOk(e.when, c, a, ctx));
  return akodo && total >= baseTn ? "baseSuccess" : "failure";
}

/** Techniques à rappeler dans ce contexte (panneau « Rappels d'école », jets de dégâts). */
export function schoolReminders(c: Character, contexts: readonly ReminderContext[]): ActiveEffect[] {
  return activeEffects(c).filter((e) => e.kind === "reminder" && contexts.includes(e.context));
}

/** L'école a-t-elle des effets qui dépendent d'une monture ? */
export function hasMountedEffects(c: Character): boolean {
  const mentions = (w?: When): boolean => !!w && (w.mounted !== undefined || !!w.anyOf?.some(mentions));
  return activeEffects(c).some((e) => "when" in e && mentions(e.when));
}

export type TechniqueCategory = "auto" | "à cocher" | "rappel" | "texte";

/** Badges d'un rang : effets d'office, à cocher, rappels, ou purement descriptif. */
export function techniqueCategories(r: SchoolRank): TechniqueCategory[] {
  const cats = new Set<TechniqueCategory>();
  for (const e of r.effects) {
    if (e.kind === "reminder") cats.add("rappel");
    else if (("mode" in e && e.mode === "optional") || ("stack" in e && e.stack)) cats.add("à cocher");
    else cats.add("auto");
  }
  if (!cats.size) cats.add("texte");
  return [...cats];
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Effet chiffré d'une technique : « +1g1 +1 », « +5 au ND d'armure », « 1 augm. gratuite pour Coup ciblé ». */
export function describeEffect(e: ActiveEffect, c: Character, input?: number): string {
  const parts: string[] = [];
  switch (e.kind) {
    case "roll": {
      const r = resolveValue(e.rolled, c, input);
      const k = resolveValue(e.kept, c, input);
      const f = resolveValue(e.flat, c, input);
      const fr = resolveValue(e.freeRaises, c, input);
      if (r || k) parts.push(`${r >= 0 && k >= 0 ? "+" : ""}${r}g${k}`);
      if (f || (e.flat !== undefined && e.input)) parts.push(signed(f));
      if (fr) parts.push(`${fr} augm. gratuite${fr > 1 ? "s" : ""}`);
      break;
    }
    case "armor":
      parts.push(`${signed(resolveValue(e.value, c))} au ND d'armure${e.stack ? " par cran" : ""}`);
      break;
    case "targetTn":
      parts.push(`${signed(resolveValue(e.value, c))} au ND de la cible par cran`);
      break;
    case "wounds":
      if (e.ignorePenalty === "all") parts.push("pénalité de blessure ignorée");
      break;
    case "maneuver":
      if (e.freeRaisesFor) {
        const m = DEFAULT_MANEUVERS.find((x) => x.id === e.freeRaisesFor?.maneuver);
        const n = e.freeRaisesFor.count;
        parts.push(`${n} augm. gratuite${n > 1 ? "s" : ""} pour ${m?.name ?? e.freeRaisesFor.maneuver}`);
      }
      break;
    default:
      break;
  }
  return parts.join(" ");
}
