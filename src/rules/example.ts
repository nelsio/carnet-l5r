/**
 * Modèles de fiche téléchargeables depuis la Bibliothèque : des fiches déjà remplies à copier ou modifier.
 * Reprises telles quelles des JSON de reference/ (annexe E.9 S4, annexe J.5) : Kakita Haruto (bushi Kakita),
 * Tamori Ayane (shugenja Tamori) et Doji Sayuri (courtisane Doji), tous de rang 1.
 */
import { migrate } from "../core/migrate";
import type { Character } from "../core/schema";
import kakita from "../../reference/exemple-personnage.json";
import tamori from "../../reference/exemple-shugenja.json";
import doji from "../../reference/exemple-courtisan.json";

export interface Example {
  id: "bushi" | "shugenja" | "courtisan";
  label: string;
  fileName: string;
  build(): Character;
}

export const EXAMPLES: readonly Example[] = [
  { id: "bushi", label: "Exemple bushi", fileName: "exemple-bushi-l5r.json", build: () => migrate(kakita) },
  { id: "shugenja", label: "Exemple shugenja", fileName: "exemple-shugenja-l5r.json", build: () => migrate(tamori) },
  { id: "courtisan", label: "Exemple courtisan", fileName: "exemple-courtisan-l5r.json", build: () => migrate(doji) },
];
