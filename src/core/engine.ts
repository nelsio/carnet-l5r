import {
  ARMOR_CATALOG, ARMOR_ROLL_TN, ARMOR_TN, CENTER_BONUS, DEAD_LABEL, DISARM_DAMAGE, DUEL_ASSESSMENT_WIN, FULL_DEFENSE_DIVISOR, HEAVY_ARMOR_TRAITS, MELEE_TARGET_PENALTY, MOVEMENT, POOL_BONUS, RANGED_PATTERN, RINGS, SKILL_ALIASES,
  TERRAINS, TN_PER_RAISE, WOUND_FIRST_MULTIPLIER, WOUND_LEVELS, WOUND_NEXT_MULTIPLIER,
  type CatalogArmor, type RingKey, type Stance, type Terrain,
} from "../rules/l5r4e";
import { describeModifier, woundPenaltyReduction } from "./modifiers";
import type { Character, Maneuver, Modifier, RollTrait, Skill, TraitKey, WeaponKeyword } from "./schema";
import {
  bowStrengthBonus, catalogWeapon, describeEffect, effectOn, guardRule, heavyArmorWaiver, maneuverCost, resolveValue, rollEffects, sameEmphasis, schoolArmorBonus, schoolContext, skillIs,
  terrainWaiver, voidMultiplier, voidPointBonus, voidSpendBonus, voidSpendOption, woundEffects, type ActiveEffect, type SchoolContext,
} from "./schools";

export type Rng = () => number;

export interface DiceCode { rolled: number; kept: number }
export interface TenDice extends DiceCode { bonus: number }

export interface Pool extends TenDice {
  explodes: boolean;
  /** Plus petite face qui explose (10 si absent ; 9 avec la maîtrise d'une compétence martiale). */
  explodeOn?: number;
  canRaise: boolean;
  notes: string[];
  /** Augmentations gratuites apportées par les bonus de jet et les techniques. */
  freeRaises?: number;
  /** Techniques d'école appliquées d'office, et proposées à cocher (annexe C). */
  applied?: ActiveEffect[];
  optional?: ActiveEffect[];
  /** Bonus fixe des techniques, compris dans `bonus` (ajouté après la règle des dix dés). */
  techFlat?: number;
  /** Modification du ND de ce jet par les techniques (Ide R1). */
  techTn?: number;
  /** Une technique lève la limite d'augmentations du Vide (Shosuro). */
  unlimitedRaises?: boolean;
  /** Modification du ND par l'arme : yumi monté, dai-kyu à pied (annexe E.2 C12). */
  weaponTn?: number;
  /** Le point de Vide (+1g1) n'est pas permis sur ce jet : dégâts d'une autre arme que le katana (C2). */
  voidBlocked?: boolean;
  /** Point de Vide permis aux dégâts grâce au katana (C2). */
  katanaVoid?: boolean;
  /** Modification du ND par l'armure portée : armure légère, armure lourde (annexe E.5). */
  armorTn?: number;
  /** Avertissements de l'arme (Force insuffisante pour le dai-kyu). */
  warnings?: string[];
}

/** Arme telle que lue par le moteur (`bowStrength` et `keywords` facultatifs). */
export interface WeaponLike { name: string; skill: string; dr: string; bowStrength?: number; keywords?: WeaponKeyword[] }

export type PoolAction =
  | { kind: "skill"; skill: string; trait: RollTrait; attack?: boolean; weapon?: WeaponLike; unarmed?: boolean; focus?: boolean }
  | { kind: "trait"; trait: RollTrait }
  | { kind: "damage"; weapon: WeaponLike; unarmed?: boolean }
  | { kind: "initiative" };

export interface PoolMods {
  stance?: Stance;
  /** Dés lancés en plus (ou en moins), dont les augmentations de dégâts. */
  extraRolled?: number;
  voidPoint?: boolean;
  /** Point de Vide dépensé pour jouer une compétence non maîtrisée au rang 1. */
  voidSkill?: boolean;
  /** Bonus de jet actifs (techniques, avantages, désavantages) : appliqués avant le point de Vide. */
  modifiers?: readonly Modifier[];
  /** Contexte des techniques d'école (la posture vient de `stance`, Attaque par défaut). */
  mounted?: boolean;
  centerLastRound?: boolean;
  /** Techniques à cocher retenues pour ce jet (clés d'effet). */
  selected?: ReadonlySet<string>;
  /** Valeurs saisies pour les techniques à champ (Moto R2), par clé d'effet. */
  inputs?: Readonly<Record<string, number>>;
  /** Option de l'école : plusieurs points de Vide dépensés d'un coup (Shiba R1). */
  voidSpend?: boolean;
  /** Spécialisation choisie au lanceur (conditions des techniques, annexe D-c). */
  emphasis?: string;
  /** Dégâts après un Désarmement réussi : 2g1 sans la Force ni dés en plus (annexe E.2 C6). */
  disarm?: boolean;
  /** Bonus de Centre du round précédent, sur un seul jet : +1g1 et + Anneau de Vide au total (E.3 F1). */
  centerBonus?: boolean;
  /** Évaluation du duel gagnée de 10 ou plus : bonus à la Concentration (F10). */
  assessmentWon?: boolean;
  /** Tir sur une cible engagée au corps à corps : −10 au total (F9). */
  meleeTarget?: boolean;
}

export interface CombatState {
  stance: Stance;
  /** Bonus de Défense totale, déjà réduit de moitié. */
  fullDefenseBonus?: number;
  voidArmor?: boolean;
  /** Bonus au ND d'armure des techniques et avantages actifs. */
  bonus?: number;
  mounted?: boolean;
  centerLastRound?: boolean;
  /** Cases de ND d'armure cochées (techniques d'école). */
  selected?: ReadonlySet<string>;
  /** Compteurs des techniques cumulables (Hiruma R2), par clé d'effet. */
  stacks?: Readonly<Record<string, number>>;
  /** Tu gardes un allié : ton ND d'armure baisse (sauf Daidoji R2), annexe E.3 F5. */
  guard?: boolean;
}

/** Minuscules, sans accents, espaces rognés et réduits. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function traitValue(c: Character, trait: RollTrait): number {
  return trait === "void" ? c.voidRing : c.traits[trait];
}

export function rings(c: Character): Record<RingKey, number> {
  const ring = (traits: [TraitKey, TraitKey]) => Math.min(c.traits[traits[0]], c.traits[traits[1]]);
  return {
    earth: ring(RINGS.earth.traits),
    water: ring(RINGS.water.traits),
    fire: ring(RINGS.fire.traits),
    air: ring(RINGS.air.traits),
    void: c.voidRing,
  };
}

const skillKey = (name: string): string => {
  const n = normalize(name);
  const group = SKILL_ALIASES.find((g) => g.some((x) => normalize(x) === n));
  return group ? normalize(group[0]) : n;
};

/** Deux noms de compétence équivalents (« Courtoisie » et « Courtisan », « Furtivité » et « Discrétion »). */
export function sameSkill(a: string, b: string): boolean {
  return skillKey(a) === skillKey(b);
}

/** Compétence de la fiche : nom exact, sinon un de ses alias. */
export function findSkill(c: Character, name: string): Skill | undefined {
  const key = normalize(name);
  return c.skills.find((s) => normalize(s.name) === key) ?? c.skills.find((s) => sameSkill(s.name, name));
}

export function parseDR(s: string): DiceCode {
  const m = /^\s*(\d+)\s*[kg]\s*(\d+)\s*$/i.exec(s);
  return m ? { rolled: Number(m[1]), kept: Number(m[2]) } : { rolled: 0, kept: 0 };
}

export function formatDice(rolled: number, kept: number): string {
  return `${rolled}g${kept}`;
}

export function isRanged(w: WeaponLike): boolean {
  return RANGED_PATTERN.test(`${w.skill} ${w.name}`) || !!w.keywords?.some((k) => k === "distance" || k === "arc");
}

/** Trait d'attaque d'une arme : Réflexes à distance, Agilité au contact. */
export function attackTrait(w: WeaponLike): TraitKey {
  return isRanged(w) ? "reflexes" : "agility";
}

/** Règle des dix dés (livre de base 4e, « Special Dice Rules »), HANDOFF §4.7. */
export function applyTenDiceRule(rolled: number, kept: number): TenDice {
  let extra = Math.max(0, rolled - 10);
  const r = Math.min(rolled, 10);
  let k = kept;
  let bonus = 0;
  // Deux dés lancés en trop valent un dé gardé.
  while (extra >= 2 && k < 10) {
    k++;
    extra -= 2;
  }
  // Gardés au complet : chaque lancé restant vaut +2 ; sinon le dé impair est perdu.
  if (k >= 10) bonus += 2 * extra;
  if (k > 10) {
    bonus += 2 * (k - 10);
    k = 10;
  }
  return { rolled: r, kept: Math.min(k, r), bonus };
}

export function computePool(c: Character, action: PoolAction, mods: PoolMods): Pool {
  const notes: string[] = [];
  let rolled: number;
  let kept: number;
  let explodes = true;
  let explodeOn = 10;
  let canRaise = true;

  switch (action.kind) {
    case "skill": {
      const trait = traitValue(c, action.trait);
      const rank = findSkill(c, action.skill)?.rank ?? 0;
      if (rank >= 1) {
        rolled = trait + rank;
      } else if (mods.voidSkill) {
        rolled = trait + 1;
        notes.push("Vide : compétence jouée au rang 1");
      } else {
        rolled = trait;
        explodes = false;
        canRaise = false;
        notes.push("Sans compétence : pas d'explosion ni d'augmentation");
      }
      kept = trait;
      if (action.attack && mods.stance === "fullAttack") {
        rolled += POOL_BONUS.fullAttack.rolled;
        kept += POOL_BONUS.fullAttack.kept;
        notes.push("Assaut : +2g1");
      }
      break;
    }
    case "trait":
      rolled = kept = traitValue(c, action.trait);
      break;
    case "damage": {
      canRaise = false;
      if (mods.disarm) {
        // Désarmement réussi : 2g1, quelle que soit l'arme (C6).
        ({ rolled, kept } = parseDR(DISARM_DAMAGE));
        notes.push("Désarmement : 2g1 sans la Force ni augmentation de dégâts");
        break;
      }
      const dr = parseDR(action.weapon.dr);
      const strength = isRanged(action.weapon) ? bowStrength(c, action.weapon, notes) : c.traits.strength;
      rolled = strength + dr.rolled;
      kept = dr.kept;
      break;
    }
    case "initiative":
      rolled = c.insightRank + c.traits.reflexes;
      kept = c.traits.reflexes;
      canRaise = false;
      break;
  }

  const disarmed = action.kind === "damage" && !!mods.disarm;
  if (mods.extraRolled && !disarmed) {
    rolled = Math.max(0, rolled + mods.extraRolled);
    notes.push(`${mods.extraRolled > 0 ? "+" : ""}${mods.extraRolled} dé(s) lancé(s)`);
  }
  let flat = 0;
  let freeRaises = 0;
  if (mods.centerBonus && action.kind !== "damage") {
    rolled += CENTER_BONUS.rolled;
    kept += CENTER_BONUS.kept;
    flat += c.voidRing;
    notes.push(`Bonus de Centre : +${CENTER_BONUS.rolled}g${CENTER_BONUS.kept} +${c.voidRing}`);
  }
  if (mods.assessmentWon && action.kind === "skill" && action.focus) {
    const w = DUEL_ASSESSMENT_WIN;
    const master = (findSkill(c, w.masterySkill)?.rank ?? 0) >= w.masteryRank;
    const [r, k] = master ? [w.masteryRolled, w.masteryKept] : [w.rolled, w.kept];
    rolled += r;
    kept += k;
    notes.push(`Évaluation gagnée de ${w.margin} ou plus : +${r}g${k}`);
  }
  if (mods.meleeTarget && action.kind === "skill" && action.attack && action.weapon && isRanged(action.weapon)) {
    flat -= MELEE_TARGET_PENALTY;
    notes.push(`Cible au corps à corps : −${MELEE_TARGET_PENALTY}`);
  }
  for (const m of mods.modifiers ?? []) {
    rolled = Math.max(0, rolled + m.rolled);
    kept = Math.max(0, kept + m.kept);
    flat += m.flat;
    freeRaises += m.freeRaises;
    notes.push(`${m.name} : ${describeModifier(m)}`);
  }
  // Techniques d'école et maîtrises : effets d'office et effets cochés. Les dégâts d'un Désarmement n'en reçoivent aucun.
  const ctx = schoolContext({
    stance: mods.stance, mounted: mods.mounted, centerLastRound: mods.centerLastRound, emphasis: mods.emphasis,
  });
  const applied: ActiveEffect[] = [];
  const optional: ActiveEffect[] = [];
  let techFlat = 0;
  let techTn = 0;
  let unlimitedRaises = false;
  for (const e of disarmed ? [] : rollEffects(c, action, ctx)) {
    ("mode" in e && e.mode === "auto" ? applied : optional).push(e);
    if (e.kind !== "roll" || !effectOn(e, mods.selected)) continue;
    const input = mods.inputs?.[e.key];
    rolled = Math.max(0, rolled + resolveValue(e.rolled, c, input));
    kept = Math.max(0, kept + resolveValue(e.kept, c, input));
    techFlat += resolveValue(e.flat, c, input);
    freeRaises += resolveValue(e.freeRaises, c, input);
    techTn += resolveValue(e.tn, c, input);
    unlimitedRaises ||= !!e.unlimitedRaises;
    if (e.explodeOn && explodes) {
      // Maîtrise Kenjutsu ou Armes lourdes 7 (C1, E.4).
      explodeOn = Math.min(explodeOn, e.explodeOn);
      notes.push(`Maîtrise ${e.source} : les dés explosent sur ${e.explodeOn} et 10`);
    } else {
      notes.push(`${e.source} : ${describeEffect(e, c, input)}`);
    }
  }
  const vm = voidMultiplier(c);
  // Dégâts : pas de point de Vide, sauf au katana, et un seul (C2).
  const katana = action.kind === "damage" && !disarmed && isKatanaVoid(action.weapon);
  const voidBlocked = action.kind === "damage" && !katana;
  if (mods.voidPoint && !voidBlocked) {
    // Un point vaut 1g1, ou plus avec une technique (Asako R1, Shosuro Acteur R1).
    const per = voidPointBonus(c, action, ctx);
    rolled += per.rolled * POOL_BONUS.voidPoint.rolled * vm;
    kept += per.kept * POOL_BONUS.voidPoint.kept * vm;
    notes.push(`${katana ? "Vide (katana)" : "Point de Vide"} : +${per.rolled * vm}g${per.kept * vm}`);
  }
  const spend = mods.voidSpend && action.kind !== "damage" ? voidSpendOption(c, action) : undefined;
  if (spend) {
    const b = voidSpendBonus(c, spend, action, ctx);
    rolled += b.rolled * vm;
    kept += b.kept * vm;
    notes.push(`${spend.points} points de Vide (${spend.source}) : +${b.rolled * vm}g${b.kept * vm}`);
  }
  const ten = applyTenDiceRule(rolled, kept);
  if (ten.bonus) notes.push(`Règle des dix dés : +${ten.bonus}`);
  const pool: Pool = {
    ...ten, bonus: ten.bonus + flat + techFlat, explodes, explodeOn, canRaise, notes, applied, optional, techFlat,
  };
  if (freeRaises) pool.freeRaises = freeRaises;
  if (techTn) pool.techTn = techTn;
  if (unlimitedRaises) pool.unlimitedRaises = true;
  if (voidBlocked) pool.voidBlocked = true;
  if (katana) pool.katanaVoid = true;
  const w = action.kind === "skill" || action.kind === "damage" ? action.weapon : undefined;
  if (w) applyWeaponRules(c, w, action.kind === "skill" && !!action.attack, !!mods.mounted, pool);
  const armor = armorRollTn(c, action, !!mods.mounted);
  if (armor.tn) {
    pool.armorTn = armor.tn;
    pool.notes.push(...armor.notes);
  }
  return pool;
}

/** Armure du catalogue portée (annexe E.5), d'après `armor.catalogId`. */
export function catalogArmor(c: Character): CatalogArmor | undefined {
  const id = c.armor.catalogId;
  return id ? ARMOR_CATALOG.find((a) => a.id === id) : undefined;
}

/**
 * Malus de l'armure au ND de ce jet (annexe E.5) : armure légère, +5 en Athlétisme et Discrétion ;
 * armure lourde (cavalerie à pied), +5 aux jets d'Agilité et de Réflexes, sauf technique qui le lève (Hida R1).
 */
export function armorRollTn(c: Character, action: PoolAction, mounted = false): { tn: number; notes: string[] } {
  const armor = catalogArmor(c);
  const out = { tn: 0, notes: [] as string[] };
  if (!armor || (action.kind !== "skill" && action.kind !== "trait")) return out;
  const skill = action.kind === "skill" ? action.skill : undefined;
  if (skill && armor.tnSkills?.some((s) => skillIs(skill, s))) {
    out.tn += ARMOR_ROLL_TN;
    out.notes.push(`${armor.name} : +${ARMOR_ROLL_TN} au ND`);
  }
  const heavy = armor.heavy === "always" || (armor.heavy === "onFoot" && !mounted);
  if (heavy && HEAVY_ARMOR_TRAITS.includes(action.trait)) {
    const waiver = heavyArmorWaiver(c, skill);
    if (waiver) {
      out.notes.push(`${armor.name} : malus ignoré (${waiver.source})`);
    } else {
      out.tn += ARMOR_ROLL_TN;
      out.notes.push(`${armor.name} : +${ARMOR_ROLL_TN} au ND (Agilité, Réflexes${armor.heavy === "onFoot" ? ", à pied" : ""})`);
    }
  }
  return out;
}

/** Arme du catalogue portant ce nom (règles propres à l'arme). */
const bookWeapon = (w: WeaponLike) => catalogWeapon(w.name);

/** Katana : un point de Vide permis aux dégâts (p. 206). */
export function isKatanaVoid(w: WeaponLike): boolean {
  return bookWeapon(w)?.special === "katanaVoid";
}

/**
 * Force effective d'un arc (C11) : force de l'arc, +1 avec la maîtrise Kyujutsu 7, plafonnée par la Force du personnage
 * (le +1 s'ajoute avant le plafond, HANDOFF P16).
 */
export function bowStrength(c: Character, w: WeaponLike, notes: string[] = []): number {
  let s = w.bowStrength ?? 0;
  const bonus = bowStrengthBonus(c, w);
  if (bonus.value) {
    s += bonus.value;
    notes.push(`Maîtrise ${bonus.source} : force de l'arc +${bonus.value}`);
  }
  if (s > c.traits.strength) {
    notes.push(`Force ${c.traits.strength} : l'arc de force ${s} tire à ${c.traits.strength}`);
    s = c.traits.strength;
  }
  return s;
}

/** Règles d'arme du livre : ND des arcs selon la monture, Force minimale (C12). */
function applyWeaponRules(c: Character, w: WeaponLike, attack: boolean, mounted: boolean, pool: Pool): void {
  const book = bookWeapon(w);
  if (!book) return;
  if (attack) {
    const tn = mounted ? (book.tnMounted ?? 0) : (book.tnOnFoot ?? 0);
    if (tn) {
      pool.weaponTn = tn;
      pool.notes.push(`${book.name} : +${tn} au ND des tirs ${mounted ? "montés" : "à pied"}`);
    }
  }
  if (book.minStrength && c.traits.strength < book.minStrength) {
    (pool.warnings ??= []).push(`${book.name} : Force ${book.minStrength} minimum (tu as ${c.traits.strength}).`);
  }
}

export interface Die {
  faces: number[];
  total: number;
  rerolledOne: boolean;
  kept: boolean;
}

export interface RollResult {
  dice: Die[];
  total: number;
}

export interface RollOptions { emphasis: boolean; flatBonus?: number }

/** Un dé : spécialisation (un 1 relancé une fois), puis explosions (sur 10, ou dès `explodeOn`). */
export function rollDie(rng: Rng, explodes: boolean, emphasis: boolean, explodeOn = 10): Omit<Die, "kept"> {
  let v = rng();
  let rerolledOne = false;
  if (emphasis && v === 1) {
    v = rng();
    rerolledOne = true;
  }
  const faces = [v];
  while (explodes && v >= explodeOn) {
    v = rng();
    faces.push(v);
  }
  return { faces, total: faces.reduce((a, b) => a + b, 0), rerolledOne };
}

/** La spécialisation ne s'applique qu'à une réserve qualifiée (compétence maîtrisée). */
function emphasisApplies(pool: Pool, emphasis: boolean): boolean {
  return emphasis && pool.canRaise;
}

export function rollDice(pool: Pool, opts: RollOptions, rng: Rng): RollResult {
  const emphasis = emphasisApplies(pool, opts.emphasis);
  const dice: Die[] = Array.from({ length: pool.rolled }, () => ({ ...rollDie(rng, pool.explodes, emphasis, pool.explodeOn), kept: false }));
  dice.sort((a, b) => b.total - a.total);
  let total = pool.bonus + (opts.flatBonus ?? 0);
  dice.forEach((d, i) => {
    if (i < pool.kept) {
      d.kept = true;
      total += d.total;
    }
  });
  return { dice, total };
}

export interface WoundState {
  level: number;
  label: string;
  penalty: number | null;
  thresholds: number[];
  status: "ok" | "out" | "dead";
}

/**
 * Seuils des niveaux de blessure, avec les blessures en plus par niveau des techniques (Daidoji R1).
 * Après Indemne (Terre × 5), chaque niveau vaut Terre × le multiplicateur des préférences (× 2 par défaut, E.6).
 */
export function woundThresholds(c: Character, ctx: Partial<SchoolContext> = {}): number[] {
  const earth = rings(c).earth;
  const { perLevel } = woundEffects(c, schoolContext(ctx));
  const next = ctx.woundMultiplier ?? WOUND_NEXT_MULTIPLIER;
  let cap = 0;
  return WOUND_LEVELS.map((_, i) => (cap += earth * (i === 0 ? WOUND_FIRST_MULTIPLIER : next) + perLevel));
}

/** État de blessure ; la posture compte pour les pénalités ignorées (Matsu R4). Hors lanceur : posture Attaque. */
export function woundState(c: Character, ctx: Partial<SchoolContext> = {}): WoundState {
  const thresholds = woundThresholds(c, ctx);
  const passed = thresholds.filter((t) => c.wounds > t).length;
  const last = WOUND_LEVELS.length - 1;
  if (passed > last) {
    return { level: last, label: DEAD_LABEL, penalty: null, thresholds, status: "dead" };
  }
  const { label } = WOUND_LEVELS[passed];
  const penalty = woundPenaltyAt(c, passed, ctx);
  if (penalty === null) return { level: passed, label, penalty, thresholds, status: "out" };
  return { level: passed, label, penalty, thresholds, status: "ok" };
}

/**
 * Pénalité effective d'un niveau de blessure (annexe E.9 S5) : réduite par les effets (Force de la Terre, Matsu R4,
 * bonus `wounds`), augmentée par les malus (Seuil de douleur bas), plancher 0. Indemne reste à 0 ; `null` : hors de combat.
 */
export function woundPenaltyAt(c: Character, level: number, ctx: Partial<SchoolContext> = {}): number | null {
  const base = WOUND_LEVELS[level]?.penalty ?? null;
  if (base === null || base === 0) return base;
  const ignored = woundPenaltyReduction(c) + woundEffects(c, schoolContext(ctx)).ignore;
  return Math.max(0, base - ignored);
}

/** Bonus de Défense totale au ND d'armure : moitié du jet, arrondie au supérieur (C3). */
export function fullDefenseBonus(total: number): number {
  return Math.ceil(total / FULL_DEFENSE_DIVISOR);
}

export function armorTN(c: Character, state: CombatState): number {
  let tn = ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus + mountedArmorBonus(c, !!state.mounted);
  switch (state.stance) {
    case "fullAttack":
      tn += ARMOR_TN.fullAttackModifier;
      break;
    case "defense":
      tn += rings(c).air + (findSkill(c, ARMOR_TN.defenseSkill)?.rank ?? 0);
      break;
    case "fullDefense":
      tn += state.fullDefenseBonus ?? 0;
      break;
  }
  if (state.voidArmor) tn += ARMOR_TN.voidArmorBonus * voidMultiplier(c);
  if (state.guard) tn -= guardRule(c).selfPenalty;
  const ctx =schoolContext({ stance: state.stance, mounted: state.mounted, centerLastRound: state.centerLastRound });
  return tn + (state.bonus ?? 0) + schoolArmorBonus(c, ctx, state.selected, state.stacks);
}

/** Bonus d'armure en plus à cheval : armure de cavalerie, +12 au lieu de +4 (annexe E.5). */
export function mountedArmorBonus(c: Character, mounted: boolean): number {
  const armor = catalogArmor(c);
  return mounted && armor?.bonusMounted !== undefined ? armor.bonusMounted - armor.bonus : 0;
}

/**
 * Somme des coûts : une manœuvre cumulable compte coût × nombre, une autre compte une fois.
 * Avec une fiche, le coût suit les techniques (Bayushi R2) ; `costs` impose le coût d'une variante choisie au lanceur
 * (zone du Coup ciblé, Renversement d'un quadrupède) ; `free` déduit les augmentations gratuites
 * réservées à une manœuvre (Tsuruchi R2), sans descendre sous 0.
 */
export function maneuverRaises(
  selection: Readonly<Record<string, number>>,
  maneuvers: readonly Maneuver[],
  opts: { character?: Character; free?: Readonly<Record<string, number>>; costs?: Readonly<Record<string, number>> } = {},
): number {
  return maneuvers.reduce((sum, m) => {
    const n = selection[m.id] ?? 0;
    if (n <= 0) return sum;
    const cost = opts.costs?.[m.id] ?? maneuverCost(opts.character, m);
    return sum + Math.max(0, (m.stackable ? cost * n : cost) - (opts.free?.[m.id] ?? 0));
  }, 0);
}

export function targetNumber(o: { base: number | null | "opposed"; calledRaises: number; woundPenalty: number; modifier?: number }): number | null | "opposed" {
  if (o.base === null || o.base === "opposed") return o.base;
  return o.base + TN_PER_RAISE * o.calledRaises + o.woundPenalty + (o.modifier ?? 0);
}

export function raiseCapExceeded(c: Character, called: number): boolean {
  return called > c.voidRing;
}

/**
 * Anneau d'Eau compté pour les distances : 1 ou 2 rangs de moins en terrain modéré ou difficile, 1 au minimum (C4) ;
 * sans pénalité avec la maîtrise d'Athlétisme (3 : modéré, 5 : difficile).
 */
export function movementWater(c: Character, terrain: Terrain = "normal"): number {
  const malus = terrainWaiver(c, terrain) ? 0 : (TERRAINS.find((t) => t.id === terrain)?.waterMalus ?? 0);
  return Math.max(1, rings(c).water - malus);
}

export function movement(c: Character, terrain: Terrain = "normal"): { free: number; simple: number; max: number } {
  const water = movementWater(c, terrain);
  return { free: water * MOVEMENT.free, simple: water * MOVEMENT.simple, max: water * MOVEMENT.max };
}

/** Spécialisation de la compétence qui correspond à l'indice de l'action (choisie d'office au lanceur). */
export function matchingEmphasis(c: Character, skillName: string, hint: string | undefined): string | undefined {
  if (!hint) return undefined;
  const h = normalize(hint);
  return findSkill(c, skillName)?.emphases.find((e) => {
    const n = normalize(e);
    return n !== "" && (h.includes(n) || n.includes(h) || sameEmphasis(e, hint));
  });
}

/** Une spécialisation de la compétence correspond-elle à l'indice de l'action ? */
export function emphasisMatches(c: Character, skillName: string, hint: string | undefined): boolean {
  return matchingEmphasis(c, skillName, hint) !== undefined;
}
