## Annexe 50 — Lot 50 : localisation, infrastructure et première moitié des textes (v2.28.4)

Premier des six lots de la localisation (50 à 55). Un seul lot, une PR, une version. Aucun changement à l'écran : l'interface reste en français, les textes passent par un dictionnaire.

### Constat

Tous les textes de l'interface étaient écrits en dur dans les composants (environ 800 à 900 chaînes dans `src/ui`). Pour ajouter l'anglais (lot 52), il faut d'abord les regrouper. Le lot 50 pose l'infrastructure et migre la moitié des composants ; le lot 51 migre le reste et rend le contrôle bloquant.

### 50.1 Dictionnaire et fournisseur

```
src/i18n/
├─ index.ts      # Locale, Messages, INTL, detectLocale(), I18nProvider, useT(), useLocale()
├─ fr.ts         # dictionnaire de référence, données pures (aucun import)
└─ en.ts         # provisoire : le dictionnaire français, traduit au lot 52
```

- **Pas de bibliothèque.** `fr` est un objet `as const` ; `Messages` en élargit les textes en `string` et garde les fonctions d'interpolation. `en: Messages` : une clé manquante ou en trop fait échouer `tsc` (test I3 dans `tests/i18n.spec.ts`, par `@ts-expect-error`).
- **Clés par composant ou vue** : `common`, `nav`, `header`, `sheet` (un sous-objet par bloc), `roller`, `aid` (dont `battle`, `void`, `move`), `statusBar`, `validation`.
- **Interpolation, pluriels, ordre des mots** : des fonctions (`slotsRemaining(left, max)`, `tnBreakdown({ … })`). Quand un mot doit rester en gras au milieu d'une phrase, la phrase est coupée autour de l'élément (`explodeBefore`, `explodeOn(nine)`, `explodeAfter(nine)`).
- `useT()` renvoie le dictionnaire courant ; `useLocale()` renvoie `{ locale, setLocale, intl }`, `intl` valant `fr-FR` ou `en-US`.
- Sans fournisseur (composant rendu seul dans un test), le contexte vaut le français : aucun test existant n'a besoin du fournisseur.
- `detectLocale(navigator.language)` : `en*` → `en`, sinon `fr`. Écrite et testée, **pas encore branchée** : `main.tsx` fixe `fr` jusqu'au lot 52, qui ajoute le sélecteur et la mémorisation.
- Formats : `decimal()` et `toMeters()` (`src/ui/format.ts`) prennent la locale `Intl` (séparateur décimal, arrondi de `toFixed` gardé) ; le tri des compétences de la fiche utilise `intl`. `THEME_LABELS` (`theme.ts`) passe dans `header.themes`. `CLAN_SUGGESTIONS` passe dans `sheet.identity.clanSuggestions`.
- Le nom de l'outil, « Carnet de Rokugan », reste une constante de `Header.tsx` : nom propre, identique dans toutes les langues.

### 50.2 Messages de validation

- Les messages d'erreur du schéma zod (`doit être un entier entre 1 et 10`…) sont dans `fr.validation`. `schema.ts` les désigne par clé (`m("notEmpty")`, `m("intBetween", 1, 10)`) et les lit **au moment de la validation**.
- `setValidationMessages()` (exporté par `@carnet/core`) change la langue des messages ; le fournisseur l'appelle à chaque changement de langue. Par défaut : `fr.validation`.
- Le moteur reste du TypeScript pur : il importe `src/i18n/fr.ts`, données sans React, et le type `Messages`.
- Messages d'import identiques en français (test « Migration : cas limites », `tests/core.engine.spec.ts`, inchangé).

### 50.3 Extraction et tests

- Migrés : `src/ui/components/sheet/*` (12 fichiers), `Roller.tsx`, `Aid.tsx`, `StatusBar.tsx`, `Header.tsx`. Textes JSX, `aria-label`, `title`, `placeholder`, libellés des options.
- Restent en dur, hors périmètre du lot : les libellés de `src/rules/*` (anneaux, traits, postures, ND, situations, éléments) et les textes produits par `src/core` (raisons de blocage, notes de réserve, effets de technique), au lot 53 ; les catalogues JSON, au lot 54. Les tests de `Roller.tsx` sur le début des notes du moteur (`startsWith("Maîtrise")`, `"Règle des dix dés"`) suivront le lot 53.
- `tests/helpers/render.tsx` : `renderApp(ui, { locale = "fr" })` enveloppe le fournisseur. Utilisé par `tests/ui/i18n.spec.tsx`.
- Playwright : `use.locale: "fr-FR"` dans `playwright.config.ts`, pour qu'un runner en anglais n'affiche pas l'application en anglais à partir du lot 52.

| ID | Cas | Résultat |
|---|---|---|
| I1 | Suite existante | 922 tests Vitest et 173 tests Playwright inchangés, verts ; aucun texte attendu modifié |
| I2 | `check-i18n` | Mode rapport : 104 textes bruts dans 14 fichiers non migrés, aucun dans les fichiers migrés |
| I3 | Typage | Clé retirée ou ajoutée dans un dictionnaire `Messages` : `tsc` échoue (`tests/i18n.spec.ts`) |

### 50.4 Contrôle `check-i18n`

`scripts/check-i18n.mjs`, lancé par `npm run lint` après `check-spec`.

- Cherche dans `src/ui/**/*.tsx`, commentaires retirés, le texte JSX brut contenant une lettre (`>texte<`).
- Ignorés : `=>`, `>=`, la comparaison `a > b` (espaces des deux côtés), les exceptions `L5R` et `i` (bouton d'information), les kanji seuls (sceau 帳, pied de page 規).
- Liste `PENDING` des fichiers non migrés : leurs occurrences sont **rapportées** (code 0). Erreur (code 1) : texte brut dans un fichier migré, fichier de `PENDING` sans texte brut ou absent. La liste ne peut donc que diminuer ; elle sera vide au lot 51, où le contrôle devient bloquant partout.
- Limite connue : le texte qui suit une expression (`{" "}Mémorisé`) ou ne commence pas par une lettre (`✓ Rempli…`) n'est pas détecté. Les fichiers migrés ont été relus à la main pour ces cas.

### 50.5 Preuve de neutralité

- Aucun test existant modifié ; 15 tests ajoutés (`tests/i18n.spec.ts`, `tests/ui/i18n.spec.tsx`) : 937 tests Vitest, verts.
- `npm run test:coverage` : totaux identiques à la v2.28.3 (99,28 % instructions, 96 % branches, 99,75 % fonctions, 100 % lignes de `src/core`).
- `dist/carnet-l5r.html` : 831 083 → 844 403 octets (+13 320, les clés du dictionnaire et les fonctions d'interpolation).
- Lint (`eslint`, `check-spec`, `check-i18n`) et `tsc --noEmit` verts.

### 50.6 Écarts

- **Langue fixée à `fr`.** Le handoff prévoit la détection au premier lancement. Branchée dès ce lot, elle aurait changé les formats (`en-US`) pour un navigateur anglais : `detectLocale()` est livrée et testée, le branchement attend le lot 52.
- **`en.ts` = `fr`.** Plutôt qu'une copie littérale à maintenir pendant deux lots, `en` reprend l'objet français ; le lot 52 le remplace par la traduction.
- **Messages de validation par clé.** Une fonction de lecture par message (`(v) => v.notEmpty`) aurait laissé des lignes non couvertes dans `schema.ts` (seuil de 100 %) : une seule fonction `m(clé, …paramètres)`.
- **Le moteur importe `src/i18n/fr.ts`.** Pour ses messages par défaut. Le fichier est de la donnée pure ; la règle « pas de React dans `src/core` » (§2) tient.
- **`fields.tsx` hors de `PENDING`.** Il n'a aucun texte JSX brut ; ses éventuels textes en attributs suivront au lot 51.
- **Guillemets français du renommage** (« … » et leurs espaces insécables) passés dans le dictionnaire (`sheet.vocabulary.quote`) : la typographie dépend de la langue.
