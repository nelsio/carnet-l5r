## Annexe 48 — Lot 48 : fiche découpée par bloc (v2.28.2)

Un seul lot, une PR, une version. Déplacement pur : aucun changement de comportement, de nom exporté ni de signature. Aucun test modifié.

### Constat

`src/ui/components/Sheet.tsx` faisait 904 lignes et contenait 25 composants : un par bloc de fiche, plus leurs aides. L'extraction des textes de la localisation (lots 50 et suivants) touchera chaque composant ; sur des fichiers découpés, les PR restent relisibles.

### 48.1 Arborescence

```
src/ui/components/sheet/
├─ index.tsx        # Sheet, Block : seul export utilisé hors du dossier, `Sheet`
├─ hooks.ts         # Setter, useSheet, poolOf, pool, chooseSchool
├─ shared.tsx       # Field, AddButton, RemoveButton, OptionalNumber
├─ constants.ts     # MOBILE_QUERY, RING_ORDER, CLAN_SUGGESTIONS
├─ Rings.tsx        # Rings
├─ Identity.tsx     # Identity, InsightMismatch, DeleteCharacter
├─ Armor.tsx        # Armor
├─ Skills.tsx       # Skills
├─ Weapons.tsx      # Weapons, CatalogGap
├─ Techniques.tsx   # Techniques, SchoolTechniques
├─ Spells.tsx       # Spells, GrimoireLink, SpellLink, GrimoireNote, SpellAffinity
├─ Notes.tsx        # LongText
├─ NewDay.tsx       # NewDay
└─ Vocabulary.tsx   # VocabularyBanner, VOCABULARY_KIND_LABELS
```

- `Sheet.tsx` est supprimé ; `App.tsx` importe `./components/sheet`.
- Plus grand fichier : `Spells.tsx`, 252 lignes (seuil : 300).
- Le découpage est fait par script, par plages de lignes : le corps des fonctions est copié tel quel, seuls les imports et les mots-clés `export` changent. Le script vérifie que chaque ligne du fichier d'origine est déplacée une fois et une seule.
- Dépendances : `index` → blocs → `shared`, `hooks`, `constants` ; `Techniques` → `Spells` (`SpellAffinity`). Aucun bloc n'importe `index`.

### 48.2 Preuve de neutralité

- Aucun fichier de `tests/` modifié (aucun n'importait `Sheet.tsx` directement).
- `npm test` : 922 tests dans 62 fichiers, verts ; `npm run test:e2e` : 173 tests, verts.
- `npm run test:coverage` : totaux identiques à `main` (99,28 % instructions, 96 % branches, 99,75 % fonctions, 100 % lignes).
- `dist/carnet-l5r.html` : 831 085 → 831 079 octets (−6).
- Lint et typecheck verts.

### 48.3 Dépendances circulaires

`npx madge` n'a pas pu être téléchargé dans l'environnement du lot. Équivalent : un script parcourt les imports relatifs de `src` (et l'alias `@carnet/core`) et cherche les cycles. Aucun cycle ne passe par `sheet/`. Il en signale quatre, déjà présents sur `main`, dans `src/core` (`engine` ↔ `modifiers`, `schools`, `spells` ; `engine` → `modifiers` → `rules/l5r4e` → `engine`) : hors périmètre.

### 48.4 Écarts

- **`hooks.ts` ajouté.** Le handoff plaçait `useSheet` dans `index.tsx` ; tous les blocs l'utilisent, et `index.tsx` importe les blocs : le garder là créait un cycle. `useSheet`, le type `Setter` et les aides de réserve `poolOf` et `pool` (partagées par Identité, Compétences et Armes) vont dans `hooks.ts`. Un fichier `.ts` sans JSX respecte aussi `react-refresh/only-export-components`.
- **`chooseSchool` dans `hooks.ts`.** Prévu dans `Identity.tsx`, il sert aussi à `SchoolTechniques` (suggestion « Associer »). Fonction et non composant : `hooks.ts` plutôt que `shared.tsx`.
- **`CatalogGap` dans `Weapons.tsx`.** Prévu dans `Skills.tsx`, il ne sert qu'au bloc Armes.
- **`SpellAffinity` exporté par `Spells.tsx`.** Il sert à `SchoolTechniques` ; il reste avec les sorts, comme prévu, et `Techniques.tsx` l'importe.
- **`isListedKeyword`** (non listé) reste local à `Spells.tsx`, seul utilisateur.
- **Commande de contrôle des cycles** : voir 48.3.
