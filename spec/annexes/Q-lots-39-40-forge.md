## Annexe Q — Lot 39 : Forge compatible (v2.26.0)

Source : `handoff-forge-compatible.md`, reçu le 02/11/2026. Décision de Nelson : l'export JSON de la Forge s'importe dans le Carnet, on retire les mentions « pas encore compatible ». Les champs encore absents de l'export relèvent du portail.

### Q.1 Livré

- **`FORGE_JSON_OK = true`** (`src/rules/portal.ts`). Effet déjà codé (L.12, état `true`) : carte Forge sans pointillés, pastille ni encadré, étapes Forger · Exporter · Importer, « Création guidée, puis export JSON à importer ici. », menu Ressources « Exporte un JSON compatible avec le Carnet ». Ordre inchangé : Fiche vierge d'abord (bouton principal), Forge ensuite.
- **Branches `false` conservées** (`ForgePending`, styles `.wait` et `.pend`, encadré 待) pour revenir en arrière en une ligne. Leur nettoyage fera l'objet d'un lot ultérieur si la Forge reste stable.
- **Guide** : phrases marquées `<!-- FORGE_JSON_OK -->` remplacées (« Elle exporte un JSON compatible avec le Carnet : importe-le ici avec **Importer un JSON**. », « puis importer son JSON »).
- **Présentation injectée** (`scripts/pages-seo.mjs`, P.2) : le lien vers Les chroniques de Rokugan reprend « créateur de personnage compatible ».
- **Tests** : `tests/core.portal.spec.ts` (constante à `true`) ; `tests/ui/portal.spec.tsx` et `tests/e2e/portal.spec.ts` sur l'état compatible (sans `.pend` ni encadré, étapes, description du menu, ligne Forge sans défilement horizontal à 390 px) ; `tests/ui/forge-ok.spec.tsx` renommé `tests/ui/forge-pending.spec.tsx`, constante simulée à `false`, pour garder les branches `false` testées ; `tests/seo.spec.ts` (mention compatible).
- **Exports réels de la Forge** (portail en ligne, 02/11/2026) : `tests/fixtures/forge-mirumoto.json` (bushi) et `tests/fixtures/forge-isawa.json` (shugenja). Importés sans erreur en nouvelle fiche et en fusion (`tests/core.io.spec.ts`), et dans le build depuis la Bibliothèque vide, la Bibliothèque avec fiches et en fusion sur une fiche ouverte (`tests/e2e/import-export.spec.ts`).

### Q.2 Écarts avec le handoff

- **`forge-ok.spec.tsx`** : ses attentes passent dans `portal.spec.tsx` ; le fichier devient le cas inverse (`forge-pending.spec.tsx`), qui reprend les attentes « lot 27 » retirées de `portal.spec.tsx`.
- **Critère « un JSON de la Forge s'importe »** : vérifié en automatique avec deux exports réels, ajoutés en fixtures, plutôt qu'à la main seulement.
- **Constat pour le portail** (hors lot, suivi `issues/issue-export-carnet-rokugan.md`) : dans ces exports, `schoolRank` vaut `null`, `techniques`, `maneuvers`, `modifiers`, `advantages` et `disadvantages` sont vides, `spellSlotsUsed` est absent (shugenja). `affinity` est présent et reconnu par le Carnet.

### Q bis Lot 40 : nom de l'appli installée (v2.26.1)

Retour de Nelson (02/11/2026) : installé sur mobile, le Carnet s'affichait « Carnet » sous l'icône. Nom voulu : « Carnet L5R » (10 caractères, tient sous une icône Android et iOS).

#### Q.3 Livré

- **`public-pages/manifest.webmanifest`** : `short_name` « Carnet L5R ». `name` reste « Carnet de Rokugan » (écran de lancement Android, liste des applis).
- **`scripts/pages-pwa.mjs`** : `<meta name="apple-mobile-web-app-title" content="Carnet L5R" />` avant le manifeste. iOS propose ce nom au lieu du titre de la page, long depuis le lot 38 (`HOME_TITLE`). Ajouté au déploiement seulement : le fichier de release ne change pas (W10).
- **Tests** : `tests/pwa.spec.ts` (W7 `short_name`, W6 balise avant `</head>`), `tests/e2e/pwa.spec.ts` (W10 : balise absente du build).

#### Q.4 Écarts et vérification manuelle

- **`docs/GUIDE.md`** : inchangé, la section d'installation ne cite pas le nom affiché.
- **Après déploiement (Nelson)** : sur Android et iOS, désinstaller puis réinstaller l'appli (le nom d'une appli déjà installée ne se met pas toujours à jour, surtout sur iOS) ; le nom sous l'icône doit être « Carnet L5R ».

