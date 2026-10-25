/** Bloc « Armure » de la fiche (HANDOFF annexe E.18, v2.8.0) : ND détaillé, Réduction, règle spéciale. */
import { ARMOR_TN, type CatalogArmor } from "../rules/l5r4e";
import { catalogArmor, mountedArmorBonus } from "./engine";
import { modifiersOf } from "./modifiers";
import type { Character } from "./schema";
import { activeEffects, armorEffects, effectOn, resolveValue, schoolContext } from "./schools";

/** Terme d'une somme affichée : « + 3 Défense 5 », « Hida R2 2 ». */
export interface ArmorPart { value: number; source: string }

export interface ArmorSheet {
  /** Armure du livre (`catalogId`), absente pour une armure personnalisée. */
  catalog?: CatalogArmor;
  /** ND d'armure, posture de référence Attaque : 5 × Réflexes + 5 + armure, puis les bonus d'office. */
  tn: { reflexes: number; armor: number; auto: ArmorPart[]; total: number; mounted?: number };
  /** Réduction : armure, puis techniques. */
  reduction: { armor: number; parts: ArmorPart[]; total: number };
  /** Technique qui lève le malus d'armure lourde (Hida R1), quand l'armure portée en a un. */
  waiver?: { source: string; except: string[] };
  /** Bonus au ND d'armure à cocher en combat (panneau Posture). */
  optional: string[];
}

export function armorSheet(c: Character): ArmorSheet {
  const ctx = schoolContext({ stance: "attack" });
  const catalog = catalogArmor(c);
  const auto: ArmorPart[] = [
    ...armorEffects(c, ctx).flatMap((e) =>
      e.kind === "armor" && !e.stack && effectOn(e) ? [{ value: resolveValue(e.value, c), source: e.source }] : []),
    ...modifiersOf(c)
      .filter((m) => m.appliesTo === "armor" && m.mode === "always" && (!m.stance || m.stance === "attack"))
      .map((m) => ({ value: m.flat, source: m.name })),
  ].filter((p) => p.value !== 0);
  const total = ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus + auto.reduce((s, p) => s + p.value, 0);
  const mounted = mountedArmorBonus(c, true);

  const parts = activeEffects(c)
    .flatMap((e) => (e.kind === "reduction" ? [{ value: resolveValue(e.value, c), source: e.source }] : []))
    .filter((p) => p.value !== 0);

  const heavy = activeEffects(c).find((e) => e.kind === "heavyArmor");
  const waiver = catalog?.heavy && heavy?.kind === "heavyArmor" ? { source: heavy.source, except: heavy.except } : undefined;

  const optional = [
    ...activeEffects(c).flatMap((e) => {
      if (e.kind !== "armor" || effectOn(e)) return [];
      const value = `+${resolveValue(e.value, c)}${e.stack ? ` × ${e.stack.label ?? "compteur"}` : ""}`;
      return [`${e.label ?? e.technique} (${value}, ${e.source})`];
    }),
    ...modifiersOf(c)
      .filter((m) => m.appliesTo === "armor" && m.mode === "optional")
      .map((m) => `${m.name} (${m.flat >= 0 ? "+" : ""}${m.flat})`),
  ];

  return {
    ...(catalog ? { catalog } : {}),
    tn: { reflexes: c.traits.reflexes, armor: c.armor.bonus, auto, total, ...(mounted ? { mounted: total + mounted } : {}) },
    reduction: { armor: c.armor.reduction, parts, total: c.armor.reduction + parts.reduce((s, p) => s + p.value, 0) },
    ...(waiver ? { waiver } : {}),
    optional,
  };
}
