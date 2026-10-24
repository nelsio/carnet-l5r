/**
 * Fiche d'exemple téléchargeable depuis la Bibliothèque : un modèle déjà rempli à copier ou modifier.
 * Reprise telle quelle de reference/exemple-personnage.json (annexe E.9 S4) : Kakita Haruto, bushi Kakita de rang 1.
 */
import { migrate } from "../core/migrate";
import type { Character } from "../core/schema";
import kakita from "../../reference/exemple-personnage.json";

export const EXAMPLE_FILE_NAME = "exemple-fiche-l5r.json";

export function exampleCharacter(): Character {
  return migrate(kakita);
}
