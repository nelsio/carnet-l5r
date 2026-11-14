## Annexe 61 — Lot 61 : Posture et Dépenser du Vide repliables (v2.33.0)

Un lot, une PR, une version (`handoff-lots-60-62.md`, demande du 12/11/2026, prototype `reference/prototype-panneaux-repliables.html`). L'annexe I.3.4, figée, reste la référence pour le menu des postures ; celle-ci la complète pour le repli des panneaux.

### 61.1 Constat

En escarmouche, les panneaux Posture (menu, description, Monté, Je garde un allié, bonus de ND à cocher) et Dépenser du Vide (message, menu, description, bouton) occupaient environ 420 px avant la première action ; environ 140 px une fois repliés.

### 61.2 Commande de repli

- Bouton rond `.fold` (chevron de `components/icons.tsx`) au bout de l'en-tête de chaque panneau, après les valeurs ; 22 px, 26 px sur mobile ; rempli à l'accent et chevron tourné de 180° quand le panneau est ouvert. CSS : bloc « v2.33.0 » de `styles.css`, repris du prototype.
- `aria-expanded`, `aria-controls` (`stance-options`, `void-options`) ; noms « Options de posture : Monté, Je garde un allié » et « Dépenses de Vide » (en : « Stance options: Mounted, Guarding an ally », « Void spending »).

### 61.3 Panneau Posture

- Toujours visible : en-tête (titre, étiquettes, ND d'armure, chevron), menu des postures, modificateurs de la posture choisie (`.posture-fx`, `data-testid="posture-fx"`, effets de technique réservés à la posture compris), puis les techniques d'école (`SchoolCombat`).
- Zone `#stance-options`, masquée par défaut : texte de la description (`#posture-desc`, sans étiquettes), Monté, Je garde un allié (et sa note), bonus de ND d'armure à cocher.
- Panneau réduit : Monté, « Garde un allié » et le nom de chaque bonus d'armure coché deviennent des étiquettes avant le ND d'armure (`data-testid="stance-active"`). « +10 Vide » reste dans les deux états.
- Le menu garde `aria-describedby="posture-desc"`, et ses options leurs étiquettes et descriptions.

### 61.4 Panneau Dépenser du Vide

- Replié par défaut : en-tête seul, points de Vide, dépenses actives en étiquettes, chevron.
- Replié et point déjà dépensé ce round : étiquette « dépensé ce round » (`--danger`, `data-testid="void-spent"`) à la place du message.
- Ouvert : contenu inchangé dans `#void-options`. `role="group"` et nom « Dépenser du Vide » restent sur le panneau. Vaut en Escarmouche, Duel iaijutsu et Bataille.

### 61.5 État et préférences

- `UiState.stanceOptions` et `UiState.voidPanel`, `false` au départ ; action `{ type: "panel"; panel: FoldPanel; open }`.
- Gardés d'une fiche à l'autre (`kept()`), mémorisés dans `Prefs.stanceOptions` et `Prefs.voidPanel` (absentes = repliés), lus et écrits par `useLibrary.ts`. « Nouveau round » et « Nouvelle journée » n'y touchent pas.

### 61.6 Tests

- Helpers : `openVoidPanel()` (appelé par `voidPanel()`, donc par `chooseVoid` et `spendVoid`) dans `tests/helpers/void.ts` ; `openStanceOptions()` dans `tests/helpers/stance.ts`. Passés : `app`, `combat`, `modifiers`, `roller`, `selectors` (modificateurs lus dans `posture-fx`) et M10 de `tests/e2e/mobile.spec.ts` (panneaux ouverts, cas le plus haut).
- UI (`tests/ui/fold-panels.spec.tsx`) : réducteur et préférences, P1 à P8 (P4 sur Hiruma R2 ; « Nouveau round » ne change rien ; Vide replié en duel).
- E2E (`tests/e2e/fold-panels.spec.ts`) : P9 à 360, 390 et 1280 px, P10 clavier, P11 hauteur repliée < 50 % de l'ouverte (modèle Bushi).
- Couleurs : P12, chevron fermé `--muted` sur `--bg` ≥ 3:1, deux thèmes.

### 61.7 Documentation

- `docs/GUIDE.md` et `docs/GUIDE-en.md` § 5 : points 3 et 4 de l'Escarmouche, phrase sur les « i ».
- `guide-shots.mjs`, `05-escarmouche` : clip jusqu'à `posture-fx`. Captures régénérées : `05-escarmouche`, `05-assistant` (fr, en, clair, sombre) ; `npm run screenshots` et `-- en` : `combat.png`.
- §6 (Assistant L5R, détails repliables) et §7 (Vide) mis à jour.

### 61.8 Écarts

- Les techniques d'école restent sous la zone repliable : ouvrir les options ne déplace pas le menu ni les modificateurs.
- `05-escarmouche` : le sceau 三 de l'Initiative est rogné en haut de la capture, comme avant ce lot (cadrage de l'annexe 59.5, inchangé).
