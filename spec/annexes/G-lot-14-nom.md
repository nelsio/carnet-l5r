## Annexe G — Lot 14 : nom de l'outil dans l'en-tête (v2.13.0)

Statut : **maquette validée** (planches « avec personnage » et « sans personnage », clair, sombre et mobile). Une version, une PR. Ne touche que l'**identité de l'outil** : en-tête (`src/ui/components/Header.tsx`), titre d'onglet et favicon. Les données, les vues (Fiche / Aide de jeu / Statistiques) et le pied de page ne changent pas ; format de fiche inchangé.

Prototype de référence : `reference/prototype-title.html`. Il est interactif (thème, largeur, personnage, mode) et reprend le CSS de G.3. Les règles mobiles y sont en `@container` pour simuler la largeur ; dans l'appli, elles restent en `@media (max-width:720px)`.

### G.1 Problème
« Carnet de Rokugan » n'apparaissait qu'en pied de page et dans `<title>`. Le `<h1>Carnet de Rokugan</h1>` de l'en-tête n'était rendu que sans personnage : dès qu'une fiche est ouverte, le nom du samouraï le remplace.

### G.2 Décisions
| # | Sujet | Décision |
|---|---|---|
| G-a | Sceau 帳 (« carnet ») | Tampon carré vermillon à gauche du bloc `.who`, sur tous les écrans. Avec personnage, il ouvre la Bibliothèque. ~~Il remplace le bouton « Bibliothèque ».~~ **Corrigé en v2.13.1** : le bouton est gardé (G.6). |
| G-b | Surtitre | Avec personnage, la ligne du clan devient `CARNET DE ROKUGAN \| ● CLAN DU CRABE`. |
| G-c | Titre d'onglet | `Okado Hiruma · Carnet de Rokugan` avec personnage, `Carnet de Rokugan` sans ; favicon reprenant le sceau. |
| G-d | Couleur | Le sceau a une couleur **fixe**, indépendante du clan : c'est la marque de l'outil, pas celle du personnage. Le liseré sous l'en-tête suit toujours `--gold`. |

### G.3 Rendu
**Sceau**

| Propriété | Bureau | Mobile (≤ 720 px) |
|---|---|---|
| Taille | 64 × 64 px | 52 × 52 px |
| Coins | 8 px | 7 px |
| Kanji | 帳, `--f-display` 800, 38 px | 30 px |
| Double filet | `box-shadow: inset 0 0 0 3px var(--seal), inset 0 0 0 5px var(--seal-ink)` | idem |
| Inclinaison | `rotate: -3deg` | idem |
| Écart avec le nom | 16 px | 12 px |

- Rien sous le sceau, ni texte ni légende.
- **Avec personnage** : `<button>` qui appelle `library.showLibrary()`, `aria-label="Carnet de Rokugan — ouvrir la bibliothèque"`, `title="Carnet de Rokugan — Bibliothèque"`. Cliquable aussi en consultation.
- **Sans personnage** : `<span aria-hidden="true">` décoratif ; le `<h1>` porte déjà le nom de l'outil.

**Surtitre** (avec personnage seulement)
- `.brand` : `--muted`, 12 px, 700, majuscules, `letter-spacing: .16em` ; séparateur : filet vertical 1 × 12 px en `--line` ; `.mon` inchangé.
- Conteneur `.eyebrow` en `flex-wrap: wrap` : un nom de clan long passe à la ligne.
- Mobile : 10 px, `letter-spacing: .08em` (`.12em` pour `.brand`), pastille de 9 px, filet de 10 px.
- Sans clan reconnu : « CARNET DE ROKUGAN » seul, sans séparateur. Sans personnage : pas de surtitre, `<h1>Carnet de Rokugan</h1>` et « Compagnon de campagne · L5R 4e ».

**Boutons de droite**
- Bureau : Bibliothèque, Lanceur de dés, Thème, puis Fiche / Aide de jeu / Statistiques (Bibliothèque gardée en v2.13.1, G.6).
- Mobile : les boutons ronds de 40 px **passent sous le bloc sceau + nom, alignés à gauche** (`header.top` repasse en `wrap` / `flex-end`, `.top-right` sur toute la largeur). Les onglets restent dans la barre du bas. Remplace la règle « nom et icônes sur une seule ligne » du §7.

**Jetons** (dans les trois blocs de thème ; couleurs seulement en variables, comme le reste de `styles.css`)
```css
/* clair */  --seal:#a8382a; --seal-ink:#f7f3ea;
/* sombre */ --seal:#b5402f; --seal-ink:#f3ece0;
```

La règle globale `button{font:inherit}` (0,0,1) est plus faible que `.seal` (0,1,0) : la taille du kanji s'applique. Ne pas ajouter de règle plus spécifique sur les boutons de l'en-tête, sinon le kanji retombe à 15 px.

`FitName` mesure la largeur de son `<h1>` : le sceau réduit la place disponible, ce qui est voulu ; un nom long tient toujours sur deux lignes (H4).

### G.4 Police et favicon
- **Kanji** : les polices embarquées sont des sous-ensembles latins ; 帳 s'afficherait en police de repli. Sous-ensemble kanji `src/ui/fonts/shippori-mincho-b1-800-kanji.woff2` (Shippori Mincho B1 800, avec les kanji des Anneaux 土水火風空 pour un usage ultérieur), déclaré avec `unicode-range: U+5E33, U+571F, U+6C34, U+706B, U+98A8, U+7A7A`. Commande dans `fonts/LICENSES.md`.
- **Favicon** : `src/ui/favicon.svg`, carré vermillon à coins arrondis, filet intérieur et 帳 **vectorisé en tracé** (contour du glyphe extrait avec fontTools, pas de `<text>`) ; `src/ui/apple-touch-icon.png` 180 × 180 rendu depuis le SVG.
- **Fichier unique** : le livrable est un seul HTML (§2) et Pages ne publie que lui (§9.1). Les deux icônes sont donc **inlinées en data URI** au build (plugin `carnet:inline-icons` de `vite.config.ts`) ; pas de dossier `public/`, pas de question de préfixe `base`.

### G.5 Tests
| ID | Cas | Attendu |
|---|---|---|
| H1 | Fiche ouverte, bureau, thèmes clair et sombre | Sceau 64 px à gauche du nom, couleur du thème et non du clan, surtitre `CARNET DE ROKUGAN \| ● CLAN DU …`, bouton Bibliothèque présent (v2.13.1) |
| H2 | Clic ou Entrée sur le sceau, ou clic sur le bouton Bibliothèque | La Bibliothèque s'ouvre ; focus visible sur le sceau |
| H3 | Aucun personnage | Sceau non focalisable (`span`, `aria-hidden`), `<h1>Carnet de Rokugan</h1>` et sous-titre ; pas de surtitre ; liseré à l'accent par défaut |
| H4 | Nom long, bureau et 390 px | `FitName` le tient sur 2 lignes au plus, sans chevaucher le sceau |
| H5 | « Clan de la Licorne » et nom long, 390 px | Le surtitre passe à la ligne, aucun débordement horizontal |
| H6 | Clan non reconnu ou vide | Surtitre réduit à « CARNET DE ROKUGAN », sans séparateur orphelin |
| H7 | Mobile ≤ 720 px | Sceau 52 px ; trois boutons ronds (Bibliothèque, Lanceur de dés, Thème) **sous** le nom, alignés à gauche ; barre d'onglets du bas inchangée (M11) |
| H8 | `document.title` | `Nom · Carnet de Rokugan` à l'ouverture d'une fiche, suit un renommage, `Carnet de Rokugan` après retour à la Bibliothèque |
| H9 | Glyphe 帳 | Rendu en Shippori Mincho B1 embarquée, sans police de repli |
| H10 | Couleurs | Aucune couleur littérale hors des jetons `--seal` / `--seal-ink` |
| H11 | Consultation | Sceau cliquable vers la Bibliothèque, badge « Consultation » inchangé |
| H12 | Favicon | Favicon et apple-touch-icon présentes dans le fichier unique (data URI) |

### G.6 Écarts de mise en œuvre (v2.13.0)
- **Corrections du handoff d'origine** : identifiants de tests T1 à T12 renommés **H1 à H12** (T1 à T42 existent déjà, §10) ; prototype dans `reference/` (pas `handoff/reference/`) ; les documents `HANDOFF-colors.md` et `handoff-ringstyle.md` cités n'existent pas dans le dépôt, la vérification « lint C8 » devient H10 (C8 est ici le catalogue d'armes, annexe E.2) ; favicon inlinée au lieu de `public/` (G.4).
- **CSS mobile** : les règles du sceau et du surtitre sont intégrées au bloc mobile existant, qui remplaçait `header.top{flex-wrap:nowrap;align-items:center}` ; pas de second bloc qui le surcharge.
- **Titre d'onglet** : `useEffect` dans `Header`, sur le nom sans espaces de bord ; un nom vide donne « Carnet de Rokugan ».
- **Bouton Bibliothèque gardé (v2.13.1)** : décision de Nelson après la v2.13.0. Sur mobile, le sceau seul ne se devinait pas comme bouton ; le bouton « Bibliothèque » (icône livres, rond de 40 px sur mobile) revient en tête des boutons de droite, partout, et le sceau reste un accès en plus. H1, H2, H7 et M11 adaptés.
- **Tests** : `tests/ui/header.spec.tsx` (H1, H2, H3, H6, H8, H11) ; Playwright `tests/e2e/header.spec.ts` (H1 clair et sombre, H2 au clavier, H3, H4 à 390 et 1200 px, H5, H9 par les polices réellement rendues, H12) ; M11 devient H7 (3 icônes sous le nom, à gauche, sceau 52 px). Les tests qui ouvraient la Bibliothèque par le bouton passent par le sceau. H10 : revue du diff (seules les lignes de jetons portent des couleurs).

---

