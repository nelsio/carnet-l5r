## 2. Architecture

### Principes
1. **Le moteur de règles est du TypeScript pur** (sans DOM ni React), testé à 100 %. Toute la logique L5R y vit.
2. **Les règles sont des données** (`src/rules/l5r4e.ts`). Corriger une règle = modifier une donnée, pas du code.
3. **Le stockage passe par une interface** (`LibraryStore`, §5), indépendante de l'interface utilisateur.
4. **Un seul schéma Zod** valide la fiche partout : chargement, import, liaison de fichier.
5. **Un seul livrable** : `dist/carnet-l5r.html`.
6. **Les textes de l'interface sont dans un dictionnaire** (`src/i18n`), un par langue, le français faisant référence (annexe 50) ; l'anglais est complet depuis le lot 52 (annexe 52). Les composants n'écrivent aucun texte en dur ; `check-i18n` le vérifie et bloque le lint depuis le lot 51 (annexe 51.3). Le vocabulaire de règles (`rules`) et les textes du moteur (`core`) y sont aussi depuis le lot 53 : le moteur renvoie des codes et paramètres (`CoreText`), jamais une phrase ; les libellés français restent des données de `src/rules`, que le dictionnaire français reprend (annexe 53). Les catalogues (écoles, techniques, maîtrises, table de bataille) restent en français ; l'anglais est une surcouche d'affichage `src/rules/en/*.json`, clés par id, lue par `useCatalog()` avec repli sur le français (annexe 54).

### Structure du dépôt (un seul package, pas de monorepo)
```
carnet-l5r/
├─ src/
│  ├─ core/       # schéma Zod, types, moteur de règles, fusion, migrations (aucune dépendance au DOM)
│  ├─ rules/      # l5r4e.ts : manœuvres, postures, ND, blessures, clans, catalogue d'actions
│  │              # ecoles.ts + ecoles-bushi.json (annexe C) + ecoles-courtisans.json (annexe D) : techniques d'école ; maitrises.json (annexe E.4) : maîtrises de compétence
│  │              # en/ : textes anglais des écoles, maîtrises et table de bataille, sans effet (annexe 54) ; example.ts : modèles de fiche fr et en
│  ├─ storage/    # LibraryStore : IndexedDB, fichiers, fichier lié
│  ├─ i18n/       # dictionnaires fr.ts (référence) et en.ts (annexe 52) ; rules-fr.ts, rules-en.ts : règles et textes du moteur (annexe 53) ;
│  │              # validation-fr.ts : messages du schéma, sans dépendance ; catalog.ts : catalogues dans la langue, useCatalog() (annexe 54) ; fournisseur, useT(), useLocale(), useCoreText(), initialLocale() (annexe 50)
│  ├─ ui/         # composants React, thème CSS, hooks
│  │  ├─ components/sheet/  # fiche : index.tsx (Sheet, Block), un fichier par bloc, shared.tsx, hooks.ts, constants.ts (annexe 48)
│  │  └─ store/             # état : index.ts (exports publics), types, state, reducer, ui-reducer, roll, selectors, path, context (annexe 49)
│  └─ main.tsx
├─ tests/
│  ├─ core.rules.spec.ts      # fourni : spécification exécutable du moteur
│  ├─ core.*.spec.ts          # bonus de jet (B1 à B11), écoles bushi (T1 à T24), courtisans (T25 à T42), import, moteur
│  ├─ helpers/                # dont render.tsx : renderApp() dans le fournisseur de langue (annexe 50.3)
│  ├─ storage/                # Vitest + fake-indexeddb
│  ├─ ui/                     # Vitest + Testing Library
│  └─ e2e/                    # Playwright
├─ reference/     # prototype.html, exemple-personnage.json, ecoles-bushi.json, perso-test-*.json (ne pas modifier) ; exemple-*-en.json : modèles anglais (annexe 54.3)
├─ public/fonts/  # polices embarquées dans le build
├─ public-pages/  # manifeste, service worker et icônes, ajoutés à l'adresse GitHub Pages seulement (annexe O.3)
├─ .github/workflows/  # ci.yml, pages.yml, release.yml
├─ docs/          # GUIDE.md (guide joueur, §9.3), CREDITS.md (licences et crédits), img/ (captures du README ; guide/ : captures annotées du guide)
├─ scripts/       # check-spec.mjs et check-i18n.mjs (npm run lint, annexes 44.4, 50.4 et 51.3) ; screenshots.mjs : captures du README, `-- en` pour docs/img/en/ (npm run screenshots, hors CI, annexe 52.5) ; guide-shots.mjs : captures annotées de docs/img/guide/ (npm run guide-shots, hors CI, annexe 57.6) ; pages-pwa.mjs (pages.yml) ; pwa-icons.mjs (npm run pwa-icons, hors CI)
├─ README.md      # vitrine en français : présentation, captures, démarrage (§9.3) ; README-en.md en anglais
└─ HANDOFF.md
```
Dans les tests fournis, `@carnet/core` est un alias de `src/core` (à déclarer dans `vite.config.ts` et `tsconfig.json`).

### Choix techniques
| Brique | Choix | Raison |
|---|---|---|
| Langage | TypeScript strict | Moteur typé, refactorisation sûre |
| Interface | React 18 + Vite | Composants maintenables. Pas de librairie UI : CSS porté du prototype |
| Fichier unique | `vite-plugin-singlefile` | Un seul HTML qui marche en `file://` |
| État | `useReducer` + contexte | Une fiche à la fois, besoin modeste |
| Validation | Zod | Messages par champ pour l'aperçu d'import |
| Stockage | IndexedDB via `idb` (petit wrapper) | Fiable, plus spacieux que `localStorage` |
| Tests | Vitest, Testing Library, Playwright | |
| CI/CD | GitHub Actions + GitHub Pages | Gratuit, rien à héberger |

---

