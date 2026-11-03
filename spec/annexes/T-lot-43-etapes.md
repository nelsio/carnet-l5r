## Annexe T — Lot 43 : étapes en liste, nouvel ordre des options (v2.27.1)

Source : `handoff-ordre-etapes.md`, reçu le 02/11/2026. Maquette `reference/prototype-start-horizontal.html`, disposition « Proposé : étapes en liste ». Constat : à 1024 px, une étape faisait environ 85 px de large, « Photographier » se coupait et les descriptions passaient sur 3 ou 4 lignes.

### T.1 Livré

- **`src/ui/styles.css`** : les trois règles mobiles des étapes (une colonne, `li` en `24px 1fr`, numéro sur deux lignes) rejoignent les règles de base du bloc « Bibliothèque vide » et quittent le `@media (max-width:720px)`. Espacement : `gap:6px`, `li` en `padding:8px 12px` et `row-gap:0`, numéro centré (`align-self:center`). Cartes (`auto-fit`, `minmax(260px,1fr)`), subgrid, état `.off` et cartes compactes inchangés.
- **`src/ui/components/Library.tsx`** : ordre DOM (= ordre visuel) **Depuis une fiche papier · Forger sur le portail · Fiche vierge**, dans la Bibliothèque vide et dans « Un nouveau personnage ? ». Boutons inchangés : « Nouvelle fiche vierge » / « Nouvelle fiche » restent en `btn accent`.
- **Tests** : `tests/e2e/portal.spec.ts` (O7 bureau et 390 px sur le nouvel ordre ; la n-ième étape de chaque carte au même niveau ; nouveau cas à 1024 et 1280 px : `li` empilés au même `x`, largeur ≥ 80 % de la liste, numéro à gauche de l'intitulé, intitulé sur une ligne, trois listes au même `y` ; describe renommé « ordre lot 43 », `accent` vérifié en `nth(2)`), `tests/ui/portal.spec.tsx` (O7, lot 39, O9), `tests/ui/forge-pending.spec.tsx`, `tests/ui/photo-import.spec.tsx` (carte photo en premier).
- **Docs** : guide § 3 (les trois façons dans le nouvel ordre), L.3, L.4, L.12, CHANGELOG 2.27.1.

### T.2 Écarts avec le handoff

- **Mobile** : l'espacement du handoff (`gap:6px`, `padding:8px 12px`, `row-gap:0`) est dans les règles de base, donc s'applique aussi à 720 px et moins : la liste des étapes y est un peu plus serrée qu'en v2.27.0 (6 px entre étapes au lieu de 10). Disposition et ordre de lecture identiques.
- **O7 bureau** : l'ancienne vérification « neuf cases au même niveau » n'a plus de sens avec des étapes empilées ; elle devient « la n-ième étape de chaque carte au même niveau », hauteurs égales conservées.
- **Captures** : `scripts/screenshots.mjs` ne montre pas la Bibliothèque vide ; rien à régénérer.
- **Maquette** versionnée dans `reference/` ; le handoff reste hors du dépôt.
