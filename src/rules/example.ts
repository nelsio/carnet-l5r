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
import kakitaEn from "../../reference/exemple-personnage-en.json";
import tamoriEn from "../../reference/exemple-shugenja-en.json";
import dojiEn from "../../reference/exemple-courtisan-en.json";

export interface Example {
  id: "bushi" | "shugenja" | "courtisan";
  /** Type affiché sur la carte du modèle (annexe L.3). */
  type: string;
  /** Kanji de la pastille de la carte. */
  kanji: string;
  fileName: string;
  build(): Character;
}

export const EXAMPLES: readonly Example[] = [
  { id: "bushi", type: "Bushi", kanji: "刀", fileName: "exemple-bushi-l5r.json", build: () => migrate(kakita) },
  { id: "shugenja", type: "Shugenja", kanji: "火", fileName: "exemple-shugenja-l5r.json", build: () => migrate(tamori) },
  { id: "courtisan", type: "Courtisan", kanji: "扇", fileName: "exemple-courtisan-l5r.json", build: () => migrate(doji) },
];

/** Mêmes modèles saisis en anglais (annexe 54.3) : mêmes personnages, compétences et textes en anglais. */
export const EXAMPLES_EN: readonly Example[] = [
  { id: "bushi", type: "Bushi", kanji: "刀", fileName: "example-bushi-l5r.json", build: () => migrate(kakitaEn) },
  { id: "shugenja", type: "Shugenja", kanji: "火", fileName: "example-shugenja-l5r.json", build: () => migrate(tamoriEn) },
  { id: "courtisan", type: "Courtier", kanji: "扇", fileName: "example-courtier-l5r.json", build: () => migrate(dojiEn) },
];

/** Modèles proposés par la Bibliothèque dans la langue de l'interface. */
export const examplesFor = (locale: "fr" | "en"): readonly Example[] => (locale === "en" ? EXAMPLES_EN : EXAMPLES);
