/**
 * Adresses du dépôt du Carnet (annexe M.3) : guide, nouveautés, signalement, page du projet.
 * Comme pour le portail (portal.ts), ce sont de simples liens : le Carnet ne fait aucune requête vers GitHub.
 */
const REPO = "https://github.com/nelsio/carnet-l5r";

export const CARNET_LINKS = {
  guide:    `${REPO}/blob/main/docs/GUIDE.md`,
  releases: `${REPO}/releases`,
  bug:      `${REPO}/issues/new`,
  code:     REPO,
} as const;
