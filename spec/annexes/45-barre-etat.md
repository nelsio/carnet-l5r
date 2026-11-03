## Annexe 45 — Lot 45 : niveaux de blessure lisibles dans la barre d'état (v2.27.3)

Un seul lot, une PR, une version. Données, CSS, accessibilité, tests.

### Constat

Capture combat v2.27.1 à 1280 px : la piste de la barre d'état coupait trois niveaux, « Égrati… », « Grav. … », « Hors d… ». Cause : 8 colonnes `minmax(0,1fr)`, police à 10,5 px, `text-overflow: ellipsis` sur `.wl span`.

Le passage sur deux lignes est écarté : la barre est collante et prendrait de la hauteur sur mobile.

### 45.1 Abréviations

`src/rules/l5r4e.ts`, `WOUND_LEVELS`, champ `short` (6 caractères au plus) :

| Niveau | `short` |
|---|---|
| Égratigné | `Égrat.` |
| Gravement blessé | `Grav.` (remplace « Grav. blessé ») |
| Hors de combat | `HdC` |

Les autres niveaux n'ont pas de `short`. Il ne sert qu'à la piste `.wtrack` : le résumé (`ws.label`), le détail déplié (`.wdetail`), la tuile Blessures et l'Assistant gardent le libellé complet.

### 45.2 Accessibilité

`StatusBar.tsx` : dans chaque case `.wl`, l'abréviation est en `aria-hidden="true"`, suivie d'un `<span className="sr-only">` avec le libellé complet. Le `title` ne change pas (« Égratigné jusqu'à 14 blessures » pour Terre 2).

### 45.3 Largeur

Aucune troncature aux largeurs où la piste est visible. Entre 721 et 1179 px, la piste passe sur sa propre ligne, en pleine largeur, au-dessus des tuiles Blessures, Vide et des quatre tuiles compactes (`styles.css`, palier `min-width:721px and max-width:1179px`). Dès 1180 px, elle reprend sa place sur la ligne des tuiles. Sous 721 px, elle reste masquée au profit du détail ligne par ligne (annexe E.9 S3).

### 45.4 Tests

- Unitaire, `tests/core.rules.spec.ts` (« Blessures ») : `short` défini pour les trois niveaux et seulement eux, 6 caractères au plus.
- UI, `tests/ui/lot12.spec.tsx` (« Barre d'état ») : abréviations affichées, libellés complets en `.sr-only`, `title` inchangé, détail déplié avec « Gravement blessé ».
- E2E, `tests/e2e/status-bar.spec.ts`, Chromium et WebKit (nouveau projet `webkit` de `playwright.config.ts`, limité à ce fichier) : à 800, 1024, 1179, 1180 et 1280 px, `scrollWidth <= clientWidth` pour chaque abréviation ; à 700 px, piste masquée et détail sans troncature ; à 390 px, piste masquée.

### 45.5 Livré

- Abréviations, `sr-only`, palier CSS 721–1179 px.
- §6.2 (barre d'état) : règle des abréviations et du palier.
- Captures `docs/img/combat.png` et `docs/img/fiche.png` régénérées. `docs/GUIDE.md` ne nomme pas les niveaux de la piste : inchangé.

### 45.6 Écarts

- **Palier 721–1179 px (ajouté).** Le handoff prévoyait des retouches CSS minimes à 1024 px. Mesuré : la piste n'y disposait que de 323 px, cases de 28 px utiles, alors qu'« Indemne » demande 39 px, « Estropié » 38 et « À terre » 33. Le padding à 3 px et le `letter-spacing` font gagner 4 px au plus. Décision de Nelson (03/11/2026) : la piste prend sa propre ligne à ces largeurs. La barre collante y gagne une ligne (environ 40 px).
- **Piste dépliée en 4 colonnes sous 720 px (sans objet).** Depuis l'annexe E.9 S3, la piste est masquée sous 721 px et remplacée par le détail ligne par ligne ; la règle 4 colonnes de `styles.css` n'a plus d'effet. Le test E2E à 700 px vérifie donc le détail. Le cas M3 de §10.5 (« la piste (2 × 4) ») décrit l'ancien rendu et reste à reformuler.
- **Marge sous Linux (CI).** Dès 1180 px, les cases ont 41 px utiles : « Indemne » y tenait au pixel près sous macOS mais dépassait de 1 à 2 px sous Chromium Linux. Retouche prévue en 45.3 : padding horizontal de `.wl` à 3 px et `letter-spacing: -.01em`, police inchangée (10,5 px).
- **Hauteur à 390 px.** La piste y est masquée : les abréviations ne peuvent pas changer la hauteur. Le test vérifie que la piste reste masquée plutôt qu'une hauteur en pixels, qui varie selon le navigateur.
