## Annexe 51 — Lot 51 : localisation, seconde moitié des textes et contrôle bloquant (v2.28.5)

Deuxième des six lots de la localisation (50 à 55). Un seul lot, une PR, une version. Aucun changement à l'écran : l'interface reste en français, tous ses textes passent désormais par le dictionnaire (annexe 50).

### Constat

Au lot 50, quatorze fichiers de `src/ui` gardaient leurs textes en dur (104 occurrences rapportées par `check-i18n`, liste `PENDING`). Le lot 51 les migre et rend le contrôle bloquant sur tout `src/ui`.

### 51.1 Fichiers migrés

- Les quatorze fichiers de `PENDING` : `App.tsx`, `AppFooter.tsx`, `ArmorCatalog.tsx`, `FileActions.tsx`, `ForgePending.tsx`, `Grimoire.tsx`, `ImportDialog.tsx`, `ImportReview.tsx`, `Library.tsx`, `LinkBanner.tsx`, `Modifiers.tsx`, `PhotoImportDialog.tsx`, `ResourcesMenu.tsx`, `Stats.tsx`.
- Le reste de `src/ui`, relu à la main pour les textes que le contrôle ne voit pas (attributs, texte après une expression) : `RichSelect.tsx` (« Points de Vide » de l'option d'Anneau), `useLibrary.ts` (messages du fichier lié), `format.ts` (`show()`).
- Nouvelles clés du dictionnaire : `app`, `footer`, `file`, `library`, `import` (dont `import.photo` et `import.values`), `resources`, `stats`, `grimoire` ; `sheet.armor` (liste du livre) et `sheet.modifiers` (bloc Bonus de jet) complètent la fiche ; `common.colon` (« : » précédé d'une espace en français) sépare deux éléments quand l'un est un composant.
- Textes réutilisés plutôt que dupliqués : confirmation de suppression (`sheet.identity.deleteConfirm`), badge Consultation (`header.readonly`), Rang (`header.rank`), « Ajouter depuis le grimoire » (`sheet.spells.addFromGrimoire`), Min / Moy. / Max (`roller`).
- Listes à texte fixe (étapes des cartes de départ, mémo de règles du pied de page, conseils de la fiche papier, liens du menu Ressources) : tableaux ou objets du dictionnaire ; kanji, liens et ids restent dans les composants.
- Le nom de l'outil, « Carnet de Rokugan », reste la constante `APP_NAME`, exportée par `Header.tsx` et reprise par le pied de page.

### 51.2 Formats de la langue

- `Library.tsx` : date de mise à jour des fiches avec `Intl.DateTimeFormat(intl)` (était `fr-FR` en dur).
- `Grimoire.tsx` : date du grimoire avec `toLocaleDateString(intl)`.
- `Stats.tsx` : nombre de lancers simulés avec `toLocaleString(intl)`, tri des compétences avec `localeCompare(…, intl)`.
- `show()` (`format.ts`) reçoit les textes de l'aperçu d'import (`t.import.values`) : vide, aucune, guillemets.

| ID | Cas | Résultat |
|---|---|---|
| I1 | Suite existante | 937 tests Vitest et 173 tests Playwright inchangés, verts ; aucun texte attendu modifié |
| F1 | Bibliothèque en `fr` puis en `en` | Date au format `fr-FR`, puis `en-US` (`tests/ui/i18n.spec.tsx`) |
| F2 | `show()` | Valeurs écrites avec le dictionnaire fourni |

### 51.3 Contrôle bloquant

- `scripts/check-i18n.mjs` : `PENDING` vide. Tout texte JSX brut dans `src/ui/**/*.tsx` fait échouer `npm run lint` (code 1).
- Exception ajoutée : `modifiers`, nom du champ du JSON de fiche cité dans l'aide du bloc Bonus de jet (`<code>`). Les autres exceptions sont celles du lot 50 (`L5R`, `i`, kanji seuls).
- `tests/check-i18n.spec.ts` : le dépôt passe (I2, 0 texte brut, 0 fichier en attente) ; sur un dépôt temporaire, texte brut refusé avec fichier et ligne, exceptions, commentaires et comparaisons acceptés.

| ID | Cas | Résultat |
|---|---|---|
| I2 | `check-i18n` | 0 occurrence, 0 fichier en attente ; bloquant |
| I3 | Typage | Inchangé (`tests/i18n.spec.ts`) |

### 51.4 Preuve de neutralité

- Aucun test existant modifié ; 8 tests ajoutés : 945 tests Vitest, verts. 173 tests Playwright, verts.
- `npm run test:coverage` : 99,28 % instructions, 96,01 % branches, 99,75 % fonctions, 100 % lignes de `src/core`.
- `dist/carnet-l5r.html` : 844 403 → 850 603 octets (+6 200, les nouvelles clés).
- Lint (`eslint`, `check-spec`, `check-i18n`) et `tsc --noEmit` verts.

### 51.5 Écarts

- **Messages du fichier lié** (`useLibrary.ts`) : écrits dans la langue du moment où ils apparaissent et gardés dans l'état du fichier. Un changement de langue pendant qu'un bandeau d'erreur est affiché le laisse dans l'ancienne langue jusqu'à la prochaine action ; acceptable, le cas est rare et le message disparaît au clic suivant.
- **Restent hors dictionnaire**, comme prévu par le handoff : les libellés de `src/rules/*` (anneaux, éléments, traits, cibles et sources de bonus, `MODIFIER_NAME_PLACEHOLDERS`, noms d'armure) et les textes produits par `src/core` (`describeModifier`, `reviewLabel`, notes de réserve lues par `Roller.tsx`) au lot 53 ; les catalogues JSON et les modèles de fiche (`x.type`) au lot 54.
- **Notation des dés** (`3g2` en exemple de VD, `+1g1` du point de Vide dans les Statistiques, `poolLabel`) : passée telle quelle dans le dictionnaire ou laissée en place ; `formatPool(…, locale)` et la notation `XkY` arrivent au lot 52.
- **Pourcentages** (`pct()`, `≥99 %`) : inchangés. Le format `Intl` du français insère une espace fine insécable, qui aurait changé l'affichage ; le format par langue est laissé au lot 52.
- **Journaux de développement** (`console.error`, erreurs internes `throw new Error`) : non traduits, ils ne s'affichent pas dans l'interface.

### 51.6 CI allégée

Ajouté pendant la revue de la PR, à la demande de Nelson : le run « push » du lot est resté bloqué 29 minutes à l'installation de Playwright (`--with-deps`), alors que le run « pull_request » du même commit était passé en 5 min 46.

- `ci.yml` se déclenchait sur tout `push` **et** sur `pull_request` : deux runs identiques par push sur une branche de lot. Désormais : `pull_request`, plus `push` sur `main` et sur les tags `v*`.
- `timeout-minutes: 20` sur le job : un run bloqué échoue au lieu d'attendre la limite de 6 h de GitHub.
- La vérification exigée pour fusionner (`ci`) vient du run de la PR : inchangée.
