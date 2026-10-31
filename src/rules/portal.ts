/**
 * Adresses du portail de la campagne (site statique du MJ, annexe L.1).
 * Un seul module pour toutes les adresses : un changement d'URL du portail ne touche que ce fichier.
 * Ce sont de simples liens. Seule exception, déclenchée par le joueur : la lecture des sorts du grimoire
 * (GRIMOIRE_FILES, lot 30, annexe N.1).
 */
import type { SpellElement } from "../core/schema";
import { CLANS, type Situation } from "./l5r4e";

export const PORTAL_BASE = "https://vincenzorpg.github.io/L5R/";

export const PORTAL = {
  home:      PORTAL_BASE + "index.html",
  forge:     PORTAL_BASE + "createcharacter.html",
  grimoire:  PORTAL_BASE + "grimoire.html",
  combat:    PORTAL_BASE + "aides/combat-memento.html",
  bushido:   PORTAL_BASE + "aides/bushido-honneur.html",
  etiquette: PORTAL_BASE + "aides/etiquette-coutumes.html",
} as const;

/** Fichiers de sorts du grimoire lus par le Carnet (lot 30). Jamais Mahō ni Kihō. */
export const GRIMOIRE_FILES: readonly string[] = ["universels", "air", "terre", "feu", "eau", "vide"]
  .map((k) => `${PORTAL_BASE}data/sorts/sorts-${k}.js`);

/** Passer à true quand l'export JSON de la Forge s'importe sans erreur dans le Carnet. */
export const FORGE_JSON_OK = false;

/** Kanji de l'Anneau du clan affiché sur le portail, pour le menu Ressources (annexe L.2). */
export const PORTAL_CLAN_KANJI: Readonly<Record<string, string>> = {
  crabe: "土", grue: "風", dragon: "龍", lion: "武", mante: "雷", phenix: "鳳", scorpion: "忍", licorne: "馬",
};

/** Page de clan du portail, ou null si le clan n'en a pas. */
export function clanUrl(clanId: string | null): string | null {
  const slug = CLANS.find((c) => c.id === clanId)?.portalSlug;
  return slug ? `${PORTAL_BASE}clans/${slug}.html` : null;
}

/** Valeur du filtre « Élément / Voie » du grimoire pour un élément de sort du Carnet (lot 29). */
export const GRIMOIRE_ELEMENT: Readonly<Record<SpellElement, string>> = {
  air: "air", earth: "terre", fire: "feu", water: "eau", void: "vide", all: "universel",
};

/** Sort dans le grimoire : grimoire.html?q=<nom encodé>&el=<élément> ; nom vide → le grimoire seul. */
export function spellUrl(name: string, element?: SpellElement): string {
  const q = name.trim();
  if (!q) return PORTAL.grimoire;
  const el = element ? `&el=${GRIMOIRE_ELEMENT[element]}` : "";
  return `${PORTAL.grimoire}?q=${encodeURIComponent(q)}${el}`;
}

/** Lien de l'encadré de l'Assistant L5R (annexe L.8). */
export interface PortalLink { url: string; title: string; desc: string }

/** Liens vers le portail par situation de l'Assistant L5R ; une situation sans lien n'a pas d'encadré (annexe L.8). */
export const SITUATION_LINKS: Readonly<Record<Situation, readonly PortalLink[]>> = {
  investigation: [],
  court: [
    { url: PORTAL.etiquette, title: "Étiquette & coutumes", desc: "Castes, cadeaux, cérémonie du thé" },
    { url: PORTAL.bushido, title: "Bushido & honneur", desc: "Vertus, gains et pertes d'honneur" },
  ],
  movement: [],
  // Toutes les formes de combat : escarmouche, duel, bataille de masse.
  combat: [{ url: PORTAL.combat, title: "Mémento de combat", desc: "Round d'escarmouche, postures, duel Iaijutsu" }],
  magic: [],
};
