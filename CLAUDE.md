# Carnet de Rokugan — consignes pour Claude Code

Compagnon de campagne pour joueurs de L5R 4e édition (fiche + aide aux jets), livré en un seul fichier HTML. Spécification : [`HANDOFF.md`](HANDOFF.md) (index), détail dans `spec/`.

## Commandes

Node 24 (`.nvmrc`).

```sh
npm run lint        # ESLint, puis scripts/check-spec.mjs (références à la spécification)
npm run typecheck   # tsc --noEmit
npm test            # Vitest (npm run test:coverage pour la couverture)
npm run test:e2e    # Playwright
npm run build       # dist/carnet-l5r.html
```

## Workflow

- Un lot = une branche `lot-NN-sujet` = une PR vers `main` = une version.
- À chaque lot :
  - `CHANGELOG.md` : section de la version, rubriques Ajouté / Modifié / Corrigé / Technique / Documentation, comme l'existant ;
  - `package.json` (et `package-lock.json`) : version ;
  - `HANDOFF.md` : ligne « État actuel » remplacée, annexe ajoutée à l'index ;
  - les § de `spec/` dont une règle change ;
  - nouvelle annexe `spec/annexes/<lot>-<sujet>.md` (livré / écarts), sous-sections `### <lot>.N` ;
  - `spec/11-lots.md` ;
  - si un écran change : `docs/GUIDE.md` **et** `docs/GUIDE-en.md`, et `npm run guide-shots` puis `-- en` si un écran capturé change (§9.3).

## Lire la spécification

1. `HANDOFF.md`, puis `spec/02-architecture.md` et `spec/10-tests.md`.
2. Uniquement les sections et annexes citées par le handoff du lot, ou dans les fichiers qu'il modifie.
3. Ne jamais charger tout `spec/`.

## Règles non négociables

- Moteur (`src/core`) et règles (`src/rules`) en TypeScript pur, sans DOM ni React (§2).
- Aucun `dangerouslySetInnerHTML` (§6.3).
- Couverture du moteur à 100 % des lignes (§10.1).
- Aucun texte reproduit des livres : résumés rédigés pour l'outil.
- Les annexes A à T sont figées ; une référence (« HANDOFF §… », « annexe … ») doit exister dans `spec/`, sinon le lint échoue.

## Langue

Code, commentaires, tests et documentation en français, comme l'existant.
