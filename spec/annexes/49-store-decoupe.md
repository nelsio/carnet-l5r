## Annexe 49 — Lot 49 : état de l'application découpé par domaine (v2.28.3)

Un seul lot, une PR, une version. Déplacement pur : aucun changement de comportement, de nom exporté ni de signature. Aucun test modifié.

### Constat

`src/ui/store.ts` faisait 681 lignes et mélangeait les types d'état, l'état initial, le reducer, la logique des jets et le contexte React. Comme pour la fiche (annexe 48), le découpage prépare la localisation (lots 50 et suivants).

### 49.1 Arborescence

```
src/ui/store/
├─ index.ts         # réexporte tout ce que store.ts exportait, et rien d'autre
├─ types.ts         # Theme, View, AidSituation, ListKey, BlockId, InfoPanel, VoidChoice, Path, RollRecord,
│                   #   UiState, BattleState, Screen, EntryMode, AppState, AppAction
├─ state.ts         # NEW_CHARACTER_BLOCK, initialBattle, HISTORY_SIZE, initialUi, initialState
├─ path.ts          # setIn
├─ selectors.ts     # currentActions, selectedAction
├─ ui-reducer.ts    # SKIRMISH_VOID, select, selectFirst, uiReducer
├─ roll.ts          # spendVoid, spendRollCosts, castSpell, afterRoll, rolled
├─ reducer.ts       # kept, EDITING, reducer (un seul switch)
└─ context.ts       # FileLinkState, LibraryApi, PendingImport, GrimoireApi, Store, StoreContext, useStore, useCharacter
```

- `store.ts` est supprimé. Aucun import ne change : `from "./store"`, `from "../store"` et `from "../../src/ui/store"` (tests) résolvent `store/index.ts`.
- Plus grand fichier : `types.ts`, 207 lignes (seuil : 300).
- Le découpage est fait par script, par plages de lignes, comme au lot 48 : corps copiés tels quels, seuls les imports et les mots-clés `export` changent ; le script vérifie que chaque ligne est déplacée une fois et une seule.
- Dépendances : `types` ← `state` ← `selectors` ← `ui-reducer`, `roll` ← `reducer`. `context.ts` ne dépend que de `types.ts` dans le dossier. `ui-reducer` et `roll` ne s'importent pas l'un l'autre.

### 49.2 Preuve de neutralité

- Aucun fichier de `tests/` modifié.
- `npm test` : 922 tests dans 62 fichiers, verts ; `npm run test:e2e` : 173 tests, verts.
- `npm run test:coverage` : totaux identiques à `main` (99,28 % instructions, 96 % branches, 99,75 % fonctions, 100 % lignes).
- `dist/carnet-l5r.html` : 831 079 → 831 083 octets (+4).
- Lint et typecheck verts.

### 49.3 Dépendances circulaires

Même script qu'au lot 48 (annexe 48.3), `madge` restant indisponible : aucun cycle ne passe par `store/`. Les quatre cycles de `src/core` déjà connus sont inchangés.

### 49.4 Écarts

- **En-tête du module dans `index.ts`.** Le commentaire de tête de `store.ts` (état de l'application, reducer pur, hasard tiré avant le dispatch) décrit l'ensemble : il ouvre `index.ts`.
- **`AidSituation` et `Path` dans `types.ts`.** Non listés par le handoff. `Path` devient exporté entre fichiers du dossier (`path.ts`, `AppAction`), pas par `index.ts`.
- **`SKIRMISH_VOID` dans `ui-reducer.ts`**, seul utilisateur, sans export.
- **`selectFirst` non exporté.** Seul `uiReducer` l'appelle ; `select` est exporté pour `reducer.ts` (action `select`). Les autres fonctions internes (`spendVoid`, `spendRollCosts`, `castSpell`, `afterRoll`, `rolled`) sont exportées par `roll.ts` pour `reducer.ts`, jamais par `index.ts`.
- **`HISTORY_SIZE` dans `state.ts`**, comme prévu ; `roll.ts` l'importe pour tronquer l'historique.
