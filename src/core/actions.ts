import {
  DUEL_ASSESSMENT, DUEL_WEAPON_PATTERN, FIXED_ACTIONS, TN_PER_RAISE, TRAIT_LABELS,
  type ActionDef, type CombatSub, type Situation,
} from "../rules/l5r4e";
import { attackTrait, isRanged, type WeaponLike } from "./engine";
import type { Character } from "./schema";

const fixed = (situation: Situation, sub?: CombatSub) =>
  FIXED_ACTIONS.filter((a) => a.situation === situation && a.sub === sub);

/** Attaque puis dégâts d'une arme ; le jet de dégâts est rattaché à l'attaque par `parent`. */
export function weaponActions(w: WeaponLike, sub: CombatSub): ActionDef[] {
  const ranged = isRanged(w);
  const trait = attackTrait(w);
  const attackId = `atk-${sub}-${w.name}`;
  return [
    {
      id: attackId, situation: "combat", sub, kind: "skill", skill: w.skill, trait, tn: "target", attack: true,
      emphasisHint: w.name, weapon: w,
      label: `${ranged ? "Tir" : "Attaque"} · ${w.name}`,
      description: `${w.skill} (${TRAIT_LABELS[trait]}) contre le ND d'armure de la cible. Choisis tes manœuvres dans le lanceur.`,
    },
    {
      id: `dmg-${sub}-${w.name}`, situation: "combat", sub, parent: attackId, kind: "damage", dr: w.dr, weapon: w, tn: null,
      label: `Dégâts · ${w.name}`,
      description: ranged
        ? `Force de l'arc ${w.bowStrength ?? 0} + VD de la flèche ${w.dr}.`
        : `Force + VD ${w.dr}. Les augmentations de dégâts s'ajoutent en dés lancés.`,
    },
  ];
}

/** Actions d'une situation, dans l'ordre d'affichage (HANDOFF §6.2). */
export function buildActions(c: Character, situation: Situation, sub?: CombatSub): ActionDef[] {
  if (situation !== "combat") return fixed(situation);
  switch (sub ?? "skirmish") {
    case "skirmish": {
      // Initiative en tête, puis les armes, puis les actions fixes (mains nues, lutte, Défense totale).
      const actions = fixed("combat", "skirmish");
      const isInitiative = (a: ActionDef) => a.kind === "initiative";
      return [
        ...actions.filter(isInitiative),
        ...c.weapons.flatMap((w) => weaponActions(w, "skirmish")),
        ...actions.filter((a) => !isInitiative(a)),
      ];
    }
    case "duel":
      return [
        ...fixed("combat", "duel"),
        ...c.weapons.filter((w) => DUEL_WEAPON_PATTERN.test(w.name)).map((w): ActionDef => ({
          id: `dmg-duel-${w.name}`, situation: "combat", sub: "duel", parent: "strike", kind: "damage", dr: w.dr, weapon: w, tn: null,
          label: `Dégâts · ${w.name}`, description: "Les augmentations de la Frappe ajoutent +1g0 chacune.",
        })),
      ];
    case "battle":
      return [...fixed("combat", "battle"), ...c.weapons.flatMap((w) => weaponActions(w, "battle"))];
  }
}

/** ND d'Évaluation en duel : 10 + 5 × Rang adverse. */
export function assessmentTN(opponentRank: number): number {
  return DUEL_ASSESSMENT.base + TN_PER_RAISE * opponentRank;
}
