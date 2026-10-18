import { NEW_CHARACTER_NAME, STARTING_TRAIT, STARTING_XP } from "../rules/l5r4e";
import { SCHEMA_VERSION, TRAIT_KEYS, type Character } from "./schema";

/** Fiche vierge, valide pour le schéma. */
export function createCharacter(): Character {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: NEW_CHARACTER_NAME,
    clan: "", family: "", school: "",
    insightRank: 1,
    honor: 0, glory: 0, status: 0,
    xp: { total: STARTING_XP, spent: 0 },
    traits: Object.fromEntries(TRAIT_KEYS.map((k) => [k, STARTING_TRAIT])) as Character["traits"],
    voidRing: STARTING_TRAIT,
    voidPoints: STARTING_TRAIT,
    wounds: 0,
    armor: { name: "Aucune", bonus: 0, reduction: 0 },
    skills: [], weapons: [], techniques: [], maneuvers: [],
    advantages: "", disadvantages: "", notes: "",
  };
}
