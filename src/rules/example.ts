/**
 * Fiche d'exemple téléchargeable depuis la Bibliothèque : un modèle déjà rempli à copier ou modifier.
 * Base : reference/exemple-personnage.json, plus des bonus de jet pour montrer leur format.
 */
import type { Character } from "../core/schema";
import kakita from "../../reference/exemple-personnage.json";

export const EXAMPLE_FILE_NAME = "exemple-fiche-l5r.json";

export function exampleCharacter(): Character {
  return {
    ...(structuredClone(kakita) as Character),
    modifiers: [
      {
        id: "exemple-technique", name: "Exemple : technique d'école (à adapter)", source: "technique",
        appliesTo: "skill", skill: "Iaijutsu", rolled: 1, kept: 0, flat: 0, freeRaises: 0, tn: 0, mode: "always",
        note: "Remplace par l'effet réel de ta technique, tiré du livre.",
      },
      {
        id: "exemple-avantage", name: "Exemple : avantage situationnel (à adapter)", source: "advantage",
        appliesTo: "all", rolled: 1, kept: 1, flat: 0, freeRaises: 0, tn: 0, mode: "optional",
        note: "À cocher dans le lanceur quand la condition est remplie.",
      },
    ],
  };
}
