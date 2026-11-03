## Annexe P — Lot 38 : référencement (v2.25.2)

Source : `handoff-seo-carnet-l5r.md`, reçu le 01/11/2026. Objectif : rendre le Carnet indexable et partageable, sans changer son fonctionnement.

### P.1 Livré

- **`index.html`** : titre, description, adresse canonique, Open Graph, JSON-LD `WebApplication`, balise `google-site-verification` commentée (à décommenter par Nelson, puis pousser). Ces balises passent dans le fichier de release sans y déclencher de requête.
- **`scripts/pages-seo.mjs`**, lancé par `pages.yml` après `pages-pwa.mjs` : ajoute la présentation statique juste après `<div id="root"></div>`, et échoue si cette balise est absente.
- **`public-pages/sitemap.xml`** et **`public-pages/og-image.png`**, copiés par `pages-pwa.mjs`. `lastmod` se met à jour à la main.
- **`assets/og-image.svg`**, source de l'image ; `npm run og-image` la rend avec les polices du Carnet, PNG committé.
- **Tests** : `tests/og.spec.ts` (balises, JSON-LD, sitemap, image), `tests/seo.spec.ts` (présentation).

### P.2 Écarts avec le handoff

- **Présentation injectée au déploiement**, pas écrite dans `index.html` : le fichier de release et les E2E ne changent pas, comme pour les lots 34 et 35. Le texte reste du HTML statique, lisible avec `curl`. Il est placé après `#root`, pas dedans : React remplace le contenu de `#root`, le texte aurait disparu de la page rendue par Google.
- **Titre sans fiche ouverte** : `Header.tsx` remettait « Carnet de Rokugan » au chargement, ce qui aurait annulé le titre de `index.html`. Sans fiche, l'onglet prend maintenant le titre complet (`HOME_TITLE`). Seule retouche de l'application ; avec une fiche, le titre ne change pas (G.3).
- **`og-image.png` remplace `og.png`** (O.1) : une seule image, publiée à l'adresse demandée. `docs/img/og.png` et sa capture dans `scripts/screenshots.mjs` sont retirés. Le Social preview du dépôt, s'il a été téléversé, reste à refaire avec le nouveau fichier.
- **Site compagnon** : le handoff disait « créateur de personnage compatible ». Le mot est retiré tant que `FORGE_JSON_OK` vaut false. Le lien porte le nom `PORTAL_NAME`.
- **`og:description` et `meta description`** : celles du handoff remplacent celles d'O.1. La mention « tes fiches restent dans ton navigateur » reste dans la présentation.
- **« Aucun script de tracking »** : vaut pour ce lot, GoatCounter (P13) reste en place.
- **`manifest.webmanifest`** : vérifié, déjà cohérent, inchangé.

### P.3 Après déploiement (Nelson)

Critères à vérifier en ligne : `curl` sur « Cinq Anneaux », `sitemap.xml` et `og-image.png` en 200, JSON-LD sur validator.schema.org, aperçu Discord. Puis Search Console, Bing, sujets du dépôt et lien retour depuis le portail, comme listés dans le handoff.

---

