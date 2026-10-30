/**
 * Adresses du portail de la campagne (site statique du MJ, annexe L.1).
 * Un seul module pour toutes les adresses : un changement d'URL du portail ne touche que ce fichier.
 * Ce sont de simples liens : le Carnet ne fait aucune requête vers le portail.
 */
import { CLANS } from "./l5r4e";

export const PORTAL_BASE = "https://vincenzorpg.github.io/L5R/";

export const PORTAL = {
  home:      PORTAL_BASE + "index.html",
  forge:     PORTAL_BASE + "createcharacter.html",
  grimoire:  PORTAL_BASE + "grimoire.html",
  combat:    PORTAL_BASE + "aides/combat-memento.html",
  bushido:   PORTAL_BASE + "aides/bushido-honneur.html",
  etiquette: PORTAL_BASE + "aides/etiquette-coutumes.html",
} as const;

/** Kanji de l'Anneau du clan affiché sur le portail, pour le menu Ressources (annexe L.2). */
export const PORTAL_CLAN_KANJI: Readonly<Record<string, string>> = {
  crabe: "土", grue: "風", dragon: "龍", lion: "武", mante: "雷", phenix: "鳳", scorpion: "忍", licorne: "馬",
};

/** Page de clan du portail, ou null si le clan n'en a pas. */
export function clanUrl(clanId: string | null): string | null {
  const slug = CLANS.find((c) => c.id === clanId)?.portalSlug;
  return slug ? `${PORTAL_BASE}clans/${slug}.html` : null;
}

/** Lien vers un sort dans le grimoire : grimoire.html?q=<nom encodé>. */
export function spellUrl(name: string): string {
  const q = name.trim();
  return q ? `${PORTAL.grimoire}?q=${encodeURIComponent(q)}` : PORTAL.grimoire;
}
