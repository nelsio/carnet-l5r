/**
 * Adresses du dépôt du Carnet (annexe M.3) : guide, nouveautés, signalement, page du projet.
 * Comme pour le portail (portal.ts), ce sont de simples liens : le Carnet ne fait aucune requête vers GitHub.
 */
const REPO = "https://github.com/nelsio/carnet-l5r";

export const CARNET_LINKS = {
  guide:    `${REPO}/blob/main/docs/GUIDE.md`,
  guideEn:  `${REPO}/blob/main/docs/GUIDE-en.md`,
  releases: `${REPO}/releases`,
  bug:      `${REPO}/issues/new`,
  code:     REPO,
} as const;

/**
 * Liens du Carnet dans la langue de l'interface (annexe 59.3) : guide anglais si `en`.
 * La page du projet reste le dépôt dans les deux langues (choix de Nelson, 59.9).
 * Type littéral plutôt que `Locale` : `src/rules` ne dépend pas de `src/i18n`.
 */
export function carnetLinks(locale: "fr" | "en") {
  return {
    guide: locale === "en" ? CARNET_LINKS.guideEn : CARNET_LINKS.guide,
    releases: CARNET_LINKS.releases,
    bug: CARNET_LINKS.bug,
    code: CARNET_LINKS.code,
  };
}
