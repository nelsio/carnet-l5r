## Annexe 47 — Lot 47 : tests rangés par fonctionnalité (v2.28.1)

Un seul lot, une PR, une version. Aucun test ajouté, supprimé ni modifié dans ses vérifications : on déplace et on renomme. Aucun fichier de `src/` modifié.

### Constat

Sept fichiers de test étaient nommés d'après l'historique (lot ou version) et non d'après ce qu'ils testent. Pour retrouver les tests d'une fonctionnalité, il fallait connaître le lot qui l'avait livrée.

### 47.1 Répartition

Chaque `describe` part dans le fichier de sa fonctionnalité (existant ou nouveau). Les fichiers d'origine sont supprimés.

| Fichier d'origine | `describe` | Destination |
|---|---|---|
| `tests/core.lot12.spec.ts` | Correctifs de règles (E.2) | `tests/core.rules.spec.ts` |
| | Fiche d'exemple (E.9 S4) | `tests/core.example.spec.ts` (nouveau) |
| `tests/core.lot16.spec.ts` | formatDR (H.5) | `tests/core.actions.spec.ts` (nouveau) |
| | Descriptions d'actions (H.5) | `tests/core.actions.spec.ts` |
| | Données livrées (H.5) | `tests/core.data.spec.ts` (nouveau) |
| | Fiches anciennes (H.5) | `tests/core.io.spec.ts` |
| `tests/ui/lot12.spec.tsx` | Fiche : « Edit » par bloc (E.9 S2) | `tests/ui/sheet.spec.tsx` (nouveau) |
| | Fiche : armes du livre et bonus de jet (E.2 C8, E.9 S1) | `tests/ui/sheet.spec.tsx` |
| | Barre d'état : pénalités effectives et détail mobile (E.9 S3, S5), avec les tests du lot 45 | `tests/ui/status-bar.spec.tsx` (nouveau) |
| | Lanceur : correctifs de règles (E.2) | `tests/ui/roller.spec.tsx` (nouveau) |
| `tests/ui/lot16.spec.tsx` | Notation des dés (H.5) | `tests/ui/roller.spec.tsx` |
| | Suppression depuis le bloc Identité (H.7 X1) | `tests/ui/sheet.spec.tsx` |
| `tests/ui/lot20.spec.tsx` | Bloc Armes en Edit (J.1) | `tests/ui/sheet.spec.tsx` |
| | Identité et Techniques (J.2, J.3) | `tests/ui/sheet.spec.tsx` |
| | Shugenja en escarmouche (J.8) | `tests/ui/magic.spec.tsx` |
| `tests/ui/v280.spec.tsx` | Bloc Armure (E.18) | `tests/ui/sheet.spec.tsx` |
| | En-tête (E.19 S8, S9) | `tests/ui/header.spec.tsx` |
| | Tuile Blessures (E.19 S11, S14) | `tests/ui/status-bar.spec.tsx` |
| `tests/e2e/lot20.spec.ts` | Q19 (Min, Moy., Max…) | `tests/e2e/stats.spec.ts` (nouveau) |
| | Q4 (bloc Identité…) | `tests/e2e/sheet.spec.ts` (nouveau) |

`tests/ui/sheet.spec.tsx` fait 220 lignes : pas de découpage par bloc (seuil de 400 lignes).

### 47.2 Règles de déplacement

- Chaque `describe` emporte ses imports, ses helpers et ses fixtures.
- Titres : les préfixes historiques sont retirés, le titre commence par la fonctionnalité. Deux titres changent : « Lot 12, v2.2.0 : correctifs de règles (annexe E.2) » → « Moteur : correctifs de règles (annexe E.2) » ; « Lot 12, v2.2.0 : fiche d'exemple (annexe E.9 S4) » → « Fiche d'exemple (annexe E.9 S4) ».
- Commentaire d'en-tête des nouveaux fichiers : ce qu'ils testent, pas le lot d'origine.
- `git mv` vers un nouveau fichier pour chaque fichier d'origine (sauf `tests/ui/lot20.spec.tsx`, entièrement réparti dans des fichiers existants ou déjà renommés). Aucun fichier ne part entier : Git ne reconnaît le renommage que pour `e2e/lot20` → `e2e/stats` ; les autres apparaissent supprimés et ajoutés. Avec `-M30%`, Git rapproche aussi `core.lot16` → `core.actions`, `ui/lot12` → `ui/roller` et `ui/v280` → `ui/sheet`.

### 47.3 Convention

Écrite en §10.0 : un fichier par fonctionnalité, `tests/core.<domaine>.spec.ts`, `tests/ui/<fonctionnalité>.spec.tsx`, `tests/e2e/<fonctionnalité>.spec.ts` ; la traçabilité passe par le titre du `describe`.

### 47.4 Preuve de neutralité

- `npx vitest list --json` avant et après : 797 titres complets de part et d'autre (fichier exclu). Seuls les 17 tests des deux `describe` renommés en 47.2 changent de titre. `npm test` : 922 tests dans 62 fichiers, avant comme après.
- `npx playwright test --list` : 173 tests avant et après, titres identiques (19 fichiers avant, 20 après).
- `npm run test:coverage` : tableau de couverture identique, ligne à ligne (100 % des lignes).

### 47.5 Livré

- 8 nouveaux fichiers (`core.actions`, `core.data`, `core.example`, `ui/roller`, `ui/sheet`, `ui/status-bar`, `e2e/sheet`, `e2e/stats`), 7 fichiers d'origine supprimés.
- §10.0 (convention), §10.1 (correctifs E.2 à la suite de la spécification fournie).

### 47.6 Écarts

- **Helpers fusionnés.** Dans `ui/sheet`, `ui/status-bar` et `ui/roller`, les `describe` venus de plusieurs fichiers partagent un seul `renderApp`, au lieu d'en garder un par `describe`. Les variantes ne différaient que par l'ordre des paramètres, l'identifiant de stockage et la date. Trois appels changent dans `ui/sheet` (`renderApp(c, always(5), "readonly")` → `renderApp(c, "readonly")`, deux fois ; `const storage` → `const { storage }`), un dans `ui/magic` (`renderApp()` → `renderApp(structuredClone(kakita) as Character)`, le `renderApp` du fichier n'ayant pas de valeur par défaut). Aucune vérification ne change.
- **Titres sans préfixe gardés.** Les `describe` déjà sans préfixe historique (« formatDR (H.5) », « Bloc Armure (E.18) »…) gardent leur titre, pour que le diff des titres se limite aux deux renommages de 47.2.
- **Nombre de tests listés.** Le handoff citait 907 tests à la v2.27.1 ; `vitest list --json` en compte 797 (titres complets), `npm test` en exécute 922. Les deux comptes sont identiques avant et après.
- **Hors périmètre.** D'autres titres gardent une mention de lot ou de version dans des fichiers déjà nommés par fonctionnalité (« Lot 39 : export JSON de la Forge » dans `core.io`, « A2 : … (v2.25.0) » dans `e2e/mobile`) : le lot ne visait que les noms de fichier.
