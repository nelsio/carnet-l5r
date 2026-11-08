## Annexe 59 — Lot 59 : guide en anglais, captures compactes en clair et en sombre (v2.32.4)

Un lot, une PR, une version (`handoff-guide-anglais.md`, avec le complément `handoff-captures-compactes.md`). Le complément devait entrer dans la PR du lot 58 ; il n'y était pas, et v2.32.3 était publiée : choix de Nelson (08/11/2026), tout passe dans ce lot (variante B). Ses rubriques 58.7 à 58.18 sont reprises ici en 59.5. Point ouvert 1 du handoff de localisation (« guide joueur anglais ») : traité par ce lot.

### 59.1 Constat

- Le guide n'existait qu'en français. En anglais, l'application y renvoyait avec des mentions « (FR) » / « (in French) » : pied de page `Guide (FR)`, Bibliothèque vide `Read the guide (in French)`, menu Ressources « User guide (FR) ».
- `README-en.md` renvoyait quatre fois vers `docs/GUIDE.md`, dont deux ancres françaises.
- `docs/GUIDE.md` § 12 était périmé depuis le lot 54 (« les écoles et les techniques restent en français »).
- Lanceur d'attaque en anglais : le champ « Augm. libres » s'appelait `Free Raises`, comme le champ des augmentations gratuites juste à côté.
- Captures du guide : PNG en 2× insérés en `![…](…)`, affichés à leur taille en pixels ; ≈ 10 600 px de hauteur cumulée, `docs/img/guide/` à 3,3 Mio, thème clair seul.

### 59.2 `docs/GUIDE-en.md`

- Copie de la référence du handoff : même plan, mêmes sections, mêmes blocs `<details>`, même style « rouleau » que `docs/GUIDE.md`.
- En tête : `**English** · [Français](GUIDE.md)`, puis `[← Back to the README](../README-en.md)`. Ancres anglaises (`#1-the-carnet-in-5-minutes` … `#12-language-portal-and-privacy`, `#install-on-your-phone-or-computer`).
- Images `img/guide/en/` et `img/guide/en/sombre/`, en `<picture>`, même largeur d'affichage qu'en français.

### 59.3 Liens de l'application selon la langue

- `src/rules/links.ts` : `CARNET_LINKS` gagne `guideEn` (`docs/GUIDE-en.md`) ; `carnetLinks(locale)` renvoie le guide dans la langue de l'interface, les autres adresses inchangées. Type littéral `"fr" | "en"` : `src/rules` ne dépend pas de `src/i18n`.
- `AppFooter`, `Library`, `ResourcesMenu` : `carnetLinks(useLocale().locale)`. `ContactDialog` (lien `bug`) : inchangé.
- Menu Ressources : le guide n'a plus de suffixe « (FR) » ; les liens du portail le gardent.
- `en.ts` : `footer.guide` « Guide », `library.readGuide` « Read the guide », `roller.raisesFree` « Extra Raises » (choix de Nelson, 59.9).
- Français : aucun changement visible, mêmes adresses qu'avant.

### 59.4 README et guide français

- `README-en.md` : les quatre liens vers `docs/GUIDE.md` mènent à `docs/GUIDE-en.md` (ancres `#install-on-your-phone-or-computer`, `#11-for-the-gm`), sans « (in French) ».
- `README.md` : « (aussi en [anglais](docs/GUIDE-en.md)) » après le lien du guide.
- `docs/GUIDE.md` : `**Français** · [English](GUIDE-en.md)` sous le titre ; § 12, le Carnet en anglais traduit écoles, techniques, maîtrises et modèles, le grimoire et le portail restent en français, marqués **(FR)** ; en anglais, le lien du guide mène au guide anglais. Légende du sceau 二 de `12-en-tete` : le bouton **Ressources**.

### 59.5 Captures du guide : compactes, en clair et en sombre, en deux langues

`scripts/guide-shots.mjs` :

- `npm run guide-shots` : français ; `-- en` : anglais (`locale: "en-US"`, sortie `docs/img/guide/en/`). Les noms accessibles viennent d'une table `LABELS[lang]`.
- Deux thèmes par exécution (`colorScheme: "light"` / `"dark"`, thème de l'app sur « auto ») : `docs/img/guide/` et `sombre/`, mêmes noms, mêmes dimensions. `-- clair` ou `-- sombre` en limite un (sans écrire `sizes.json`). Le recadrage est calculé en clair et réutilisé en sombre ; le script échoue si les dimensions diffèrent.
- Chaque capture déclare `display` (px CSS) ; l'image fait exactement `2 × display` px de large, cadre compris. Le cadre est mis à l'échelle de la largeur finale (proportions d'une image de 1 730 px).
- Sceaux et traits agrandis pour qu'un sceau mesure au moins 18 px CSS une fois affiché (`k = max(1, 18 / (28 × échelle))`).
- Sombre : traits de pinceau `#efe3c8`, cadre « laque sumi » (fond `#1c1915`, grain clair à `.06`, filets `#c9b48a`, kanji `#e8dcc0`) ; sceaux vermillon inchangés.
- Recadrages : `05-escarmouche` de l'Initiative à la description de la Posture ; `06-lanceur` du titre à la ligne sous le résultat ; `07-magie-mobile` des emplacements à la carte des dégâts du sort ; `09-stats` du titre à la ligne Dégâts · Katana ; `12-en-tete` en-tête et premier groupe du menu (sceau 二 sur le bouton Ressources). Marge réglable par capture (`margin`, 24 px par défaut).
- `sizes.json` (dimensions d'affichage) écrit dans `docs/img/guide/` et `docs/img/guide/en/`.
- Guides : chaque image est un `<picture>` (source sombre, `<img … width>` clair par défaut).

Hauteurs affichées obtenues (px CSS) :

| Capture | `display` | Hauteur FR | Hauteur EN | Échelle |
|---|---|---|---|---|
| `01-accueil` | 640 | 357 | 357 | 0,43 |
| `01b-modeles` | 640 | 157 | 157 | 0,49 |
| `03-photo` | 480 | 431 | 446 | 0,61 |
| `04-barre-etat` | 720 | 148 | 148 | 0,55 |
| `04-edition` | 640 | 202 | 202 | 0,49 |
| `04-fiche-mobile` | 256 | 498 | 498 | 0,57 |
| `04-fiche` | 640 | 357 | 357 | 0,43 |
| `05-assistant` | 600 | 417 | 417 | 0,46 |
| `05-escarmouche` | 560 | 253 | 253 | 0,71 |
| `06-lanceur` | 304 | 495 | 495 | 0,61 |
| `07-magie-mobile` | 320 | 380 | 380 | 0,78 |
| `07-sorts` | 520 | 403 | 387 | 0,78 |
| `09-stats` | 720 | 179 | 179 | 0,57 |
| `10-fichier` | 640 | 140 | 130 | 0,51 |
| `12-en-tete` | 640 | 213 | 213 | 0,51 |

Total : 4 630 px en français (≈ 10 600 avant, − 56 %). Poids : `docs/img/guide/` 1,58 Mio, `sombre/` 1,65 Mio, `en/` 1,53 Mio, `en/sombre/` 1,60 Mio.

### 59.6 Contrôle des deux guides

`scripts/check-guides.mjs`, lancé par `npm run lint` après `check-spec` :

- parité : même nombre de sections `## ` numérotées, de blocs `<details>`, mêmes images dans le même ordre avec le même `width` ;
- tailles et thèmes : chaque image est un `<picture>` dont la source sombre existe et a les dimensions de l'image claire ; `width` = largeur du PNG / 2 ; aucune image Markdown `![…](img/guide/…)` ;
- résolution : dans les deux guides et les deux README, chaque lien relatif vise un fichier existant, chaque ancre existe (`<a id>` ou titre, slug GitHub) ;
- images : aucune capture orpheline dans les quatre dossiers.

Un lot qui touche un guide sans l'autre casse la parité dès qu'il ajoute une section, une image ou un bloc.

### 59.7 Tests

- UI (`tests/ui/carnet-links.spec.tsx`) : G1 (remplace V1), cinq adresses ; G2, `carnetLinks("fr")` et `carnetLinks("en")`. V2 à V4 (français) inchangés : G3.
- UI (`tests/ui/i18n-en.spec.tsx`) : G4 menu Ressources, G5 pied de page, G6 Bibliothèque vide, G7 bascule sans rechargement, G8 lanceur d'attaque, « Extra Raises » et « Free Raises » distincts. Le test « menu Ressources en anglais » ne voit plus « (FR) » après le guide.
- E2E (`tests/e2e/carnet-links.spec.ts`) : V7 rejoué en `en-US` à 390 px.
- Lint : `check-guides`, `check-spec`, `check-i18n` verts.

### 59.8 Documentation

- §9.3 : guide en deux langues ; chaque lot qui change un écran met à jour `docs/GUIDE.md` **et** `docs/GUIDE-en.md`, et relance `npm run guide-shots` et `npm run guide-shots -- en` si un écran capturé change.
- `CLAUDE.md`, `CONTRIBUTING.md`, §2 (scripts), `CHANGELOG.md` 2.32.4.

### 59.9 Écarts

- **Complément du lot 58 livré ici** (59.5) et non dans la PR du lot 58. Thème sombre : écart par rapport à l'annexe 57.6 (« thème clair pour toutes les captures du guide »), choix de Nelson du 07/11/2026.
- **« Project page » reste le dépôt** dans les deux langues (choix de Nelson, 08/11/2026) : pas de `codeEn` dans `CARNET_LINKS`, cinq adresses au lieu de six ; le guide anglais le dit (« the guide link leads to this English guide »).
- **« Extra Raises »** retenu pour « Augm. libres » (choix de Nelson, 08/11/2026).
- **Échelle sous 0,55** pour sept captures d'ordinateur (0,43 à 0,51) : les `display` du handoff (640 pour un écran de 1 280 px) donnent 0,5 avant cadre ; gardés tels quels, le texte reste lisible sur écran Retina. `06-lanceur` passe de 340 à 304 et `04-fiche-mobile` de 260 à 256 pour tenir sous le plafond de 500 px.
- **Cadre mis à l'échelle** de la largeur finale (et non plus de marges fixes de 230 px) : sans cela, les captures étroites (256 à 320 px) seraient tombées sous 0,4.
- **Mémento de combat** : dans l'Assistant en anglais, l'encadré du portail garde les titres français (« Mémento de combat », « Étiquette & coutumes », « Bushido & honneur ») ; le guide anglais reprend ces titres et `LABELS.en` vise `/^Mémento de combat/` (le handoff indiquait « Combat memento », titre du menu Ressources).
- `docs/img/guide/sizes.json` et `docs/img/guide/en/sizes.json` sont des données, pas des captures : `check-guides` les ignore.
- Relecture du guide anglais par un joueur qui a le livre anglais : à faire, avec celle des noms d'écoles (point ouvert 3 de la localisation).
