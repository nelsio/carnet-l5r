import {
  DUEL_ASSESSMENT, DUEL_WEAPON_PATTERN, FIXED_ACTIONS, TN_PER_RAISE,
  type ActionDef, type CombatSub, type FixedAction, type Situation,
} from "../rules/l5r4e";
import { attackTrait, isRanged, type WeaponLike } from "./engine";
import type { Character } from "./schema";
import { skillIs } from "./schools";
import { CONCENTRATE_ACTION, skirmishSpellActions, spellActions } from "./spells";
import { text } from "./text";

/** Titre des armes et actions fixes d'escarmouche, posé seulement après les sorts d'un shugenja (annexe J.8). */
const SKIRMISH_ATTACKS_GROUP = "attacks";

/** Action fixe du catalogue ; son titre et sa description sont dans le dictionnaire, par id (annexe 53.1). */
const withText = (a: FixedAction): ActionDef => ({
  ...a, label: text("action.label", { id: a.id }), description: text("action.description", { id: a.id }),
});

const fixed = (situation: Situation, sub?: CombatSub) =>
  FIXED_ACTIONS.filter((a) => a.situation === situation && a.sub === sub).map(withText);

/** Attaque puis dégâts d'une arme ; le jet de dégâts est rattaché à l'attaque par `parent`. */
export function weaponActions(w: WeaponLike, sub: CombatSub): ActionDef[] {
  const ranged = isRanged(w);
  const trait = attackTrait(w);
  const attackId = `atk-${sub}-${w.name}`;
  return [
    {
      id: attackId, situation: "combat", sub, kind: "skill", skill: w.skill, trait, tn: "target", attack: true,
      emphasisHint: w.name, weapon: w,
      label: text("action.attack", { weapon: w.name, ranged }),
      description: text("action.attackAbout", { skill: w.skill, trait }),
    },
    {
      id: `dmg-${sub}-${w.name}`, situation: "combat", sub, parent: attackId, kind: "damage", dr: w.dr, weapon: w, tn: null,
      label: text("action.damage", { name: w.name }),
      description: ranged
        ? text("action.bowDamageAbout", { bow: w.bowStrength ?? 0, dr: w.dr })
        : text("action.damageAbout", { dr: w.dr }),
    },
  ];
}

const skillsStarting = (c: Character, prefix: string) => c.skills.filter((s) => s.name.includes(":") && skillIs(s.name, prefix));
const detail = (name: string) => name.slice(name.indexOf(":") + 1).trim();

/** Une action « Se souvenir » par Connaissance de la fiche (« Connaissance : Histoire ») ; l'action générique sinon. */
function loreActions(c: Character): ActionDef[] {
  const found = FIXED_ACTIONS.find((a) => a.id === "lore");
  const generic = found && withText(found);
  const lores = skillsStarting(c, "Connaissance");
  if (!generic || !lores.length) return generic ? [generic] : [];
  return lores.map((s): ActionDef => ({
    ...generic, id: `lore-${s.name}`, skill: s.name, label: text("action.lore", { detail: detail(s.name) }),
    description: text("action.loreAbout", { skill: s.name }),
  }));
}

/** Une action par Représentation de la fiche (« Représentation : Conte »). */
function performActions(c: Character): ActionDef[] {
  return skillsStarting(c, "Représentation").map((s): ActionDef => ({
    id: `perform-${s.name}`, situation: "court", kind: "skill", skill: s.name, trait: "awareness", tn: 15,
    label: text("action.perform", { detail: detail(s.name) }),
    description: text("action.performAbout", { skill: s.name }),
  }));
}

/** Actions d'une situation, dans l'ordre d'affichage (HANDOFF §6.2). */
export function buildActions(c: Character, situation: Situation, sub?: CombatSub): ActionDef[] {
  if (situation === "investigation") return fixed(situation).flatMap((a) => (a.id === "lore" ? loreActions(c) : [a]));
  if (situation === "court") return [...fixed(situation), ...performActions(c)];
  if (situation === "magic") return [...spellActions(c), CONCENTRATE_ACTION];
  if (situation !== "combat") return fixed(situation);
  switch (sub ?? "skirmish") {
    case "skirmish": {
      // Initiative en tête, puis les sorts du shugenja (groupe « Sorts », annexe J.8), puis les armes
      // et les actions fixes (mains nues, lutte, Défense totale), sous le titre « Attaques » s'il y a des sorts.
      const actions = fixed("combat", "skirmish");
      const isInitiative = (a: ActionDef) => a.kind === "initiative";
      const spells = skirmishSpellActions(c);
      const attacks = [...c.weapons.flatMap((w) => weaponActions(w, "skirmish")), ...actions.filter((a) => !isInitiative(a))];
      return [
        ...actions.filter(isInitiative),
        ...spells,
        ...(spells.length ? attacks.map((a) => ({ ...a, group: SKIRMISH_ATTACKS_GROUP })) : attacks),
      ];
    }
    case "duel":
      return [
        ...fixed("combat", "duel"),
        ...c.weapons.filter((w) => DUEL_WEAPON_PATTERN.test(w.name)).map((w): ActionDef => ({
          id: `dmg-duel-${w.name}`, situation: "combat", sub: "duel", parent: "strike", kind: "damage", dr: w.dr, weapon: w, tn: null,
          label: text("action.damage", { name: w.name }), description: text("action.duelDamageAbout"),
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
