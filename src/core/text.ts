/**
 * Textes produits par le moteur (annexe 53.2) : un code et ses paramètres, jamais une phrase.
 * L'interface les formate avec le dictionnaire de la langue (`core` dans `src/i18n`).
 * Les noms venus de la fiche ou des catalogues (arme, technique, compétence saisie) passent tels quels.
 */
import type { RollTrait } from "./schema";

/** Morceau de l'effet chiffré d'une technique (`describeEffect`). */
export type EffectPart =
  | { kind: "dice"; rolled: number; kept: number }
  | { kind: "flat"; n: number }
  | { kind: "freeRaises"; n: number }
  | { kind: "tn"; n: number }
  | { kind: "unlimitedRaises" }
  | { kind: "explode"; on: number }
  | { kind: "voidBoost"; rolled: number; kept: number }
  | { kind: "armor"; n: number; perStack: boolean }
  | { kind: "targetTn"; n: number }
  | { kind: "ignoreWounds" }
  | { kind: "maneuverRaises"; n: number; maneuver: string };

/** Effet d'un bonus de jet (`describeModifier`). */
export interface ModifierEffect {
  key: "modifier";
  appliesTo: string;
  rolled: number;
  kept: number;
  flat: number;
  freeRaises: number;
  tn: number;
}

export type CoreText =
  // Notes de réserve (`computePool`, `armorRollTn`, `bowStrength`)
  | { key: "pool.voidSkill" }
  | { key: "pool.unskilled" }
  | { key: "pool.fullAttack"; rolled: number; kept: number }
  | { key: "pool.disarm"; rolled: number; kept: number }
  | { key: "pool.extraRolled"; n: number }
  | { key: "pool.center"; rolled: number; kept: number; flat: number }
  | { key: "pool.assessment"; margin: number; rolled: number; kept: number }
  | { key: "pool.meleeTarget"; penalty: number }
  | { key: "pool.modifier"; name: string; effect: ModifierEffect }
  | { key: "pool.explode"; source: string; on: number }
  | { key: "pool.effect"; source: string; parts: EffectPart[] }
  | { key: "pool.voidPoint"; katana: boolean; rolled: number; kept: number }
  | { key: "pool.voidSpend"; points: number; source: string; rolled: number; kept: number }
  | { key: "pool.tenDice"; bonus: number }
  | { key: "pool.bowMastery"; source: string; value: number }
  | { key: "pool.bowCapped"; strength: number; bow: number }
  | { key: "pool.weaponTn"; weapon: string; tn: number; mounted: boolean }
  | { key: "pool.minStrength"; weapon: string; min: number; strength: number }
  | { key: "armor.skillTn"; armor: string; tn: number }
  | { key: "armor.waived"; armor: string; source: string }
  | { key: "armor.heavy"; armor: string; tn: number; onFoot: boolean }
  // Effets chiffrés
  | ModifierEffect
  | { key: "effect"; parts: EffectPart[] }
  // Raisons de blocage (posture, sort hors rang) et rappels de blessure
  | { key: "restrict.fullAttackSpell" }
  | { key: "restrict.fullDefenseSpell" }
  | { key: "restrict.center" }
  | { key: "restrict.defense" }
  | { key: "restrict.fullAttackRanged" }
  | { key: "spell.deficiency"; rank: number }
  | { key: "spell.mastery"; mastery: number; rank: number }
  | { key: "wound.crippled" }
  | { key: "wound.down" }
  // Augmentations gratuites d'un sort (`spellCast`) ; `label` : case de l'école, texte du catalogue
  | { key: "spell.keyword"; keyword: string }
  | { key: "spell.affinity" }
  | { key: "spell.option"; label: string }
  | { key: "spell.castTime"; n: number }
  // Actions de l'Assistant : titres et descriptions
  | { key: "action.label"; id: string }
  | { key: "action.description"; id: string }
  | { key: "action.attack"; weapon: string; ranged: boolean }
  | { key: "action.attackAbout"; skill: string; trait: RollTrait }
  | { key: "action.damage"; name: string }
  | { key: "action.damageAbout"; dr: string }
  | { key: "action.bowDamageAbout"; bow: number; dr: string }
  | { key: "action.duelDamageAbout" }
  | { key: "action.lore"; detail: string }
  | { key: "action.loreAbout"; skill: string }
  | { key: "action.perform"; detail: string }
  | { key: "action.performAbout"; skill: string }
  | { key: "action.cast"; spell: string }
  | { key: "action.castAbout"; tn: number; castTime: number; keywords: string; memorized: boolean }
  | { key: "action.spellDamageAbout"; dr: string }
  | { key: "action.concentrateAbout"; tn: number; base: number };

export type CoreKey = CoreText["key"];

/** Formats du dictionnaire : une fonction par code ; `f` formate un texte imbriqué. */
export type CoreMessages = {
  readonly [K in CoreKey]: (p: Extract<CoreText, { key: K }>, f: (t: CoreText) => string) => string;
};

/** Raccourci de construction : `text("pool.tenDice", { bonus: 2 })`. */
export function text<K extends CoreKey>(key: K, ...params: keyof Omit<Extract<CoreText, { key: K }>, "key"> extends never
  ? [] : [Omit<Extract<CoreText, { key: K }>, "key">]): Extract<CoreText, { key: K }> {
  return { key, ...params[0] } as Extract<CoreText, { key: K }>;
}
