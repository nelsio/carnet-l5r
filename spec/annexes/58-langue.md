## Annexe 58 — Lot 58 : bascule de langue à part (v2.32.3)

Un lot, une PR, une version (`handoff-guide-visuel-langue.md`, variante A validée le 06/11/2026). L'annexe 52.2, figée, reste la référence pour le choix de la langue ; celle-ci la remplace pour l'emplacement et la forme du bouton.

### 58.1 Constat

Le bouton `FR` de l'en-tête, entre Thème et Ressources, ressemblait à une action quelconque, sans icône ni libellé. Il affichait la langue courante : on ne savait pas s'il fallait cliquer sur « FR » pour avoir du français. Sur mobile, c'était un cinquième bouton rond, identique aux autres.

### 58.2 Bascule FR | EN

- Les deux langues sont visibles, l'active est surlignée (`aria-pressed`, fond d'accent pâle, bordure d'accent).
- `role="group"`, nom « Langue » / « Language » ; chaque bouton s'annonce dans sa propre langue : « Français », « English », avec l'attribut `lang`.
- Un clic sur la langue active ne fait rien : pas de nouvel enregistrement dans `localStorage`.
- Un seul nœud : dernier enfant de `.top-right`, après les onglets. Liste des langues : `LOCALES` exportée par `src/i18n`.
- **Bureau** : sortie du flux (`position:absolute`), coin haut droit de `header.top`, sur la ligne du surtitre, précédée d'une icône globe ; même place avec ou sans fiche.
- **Mobile (≤ 720 px)** : dans le flux, au bout de la rangée de boutons ronds, calée à droite (`margin-left:auto`), 40 px de haut, sans globe.
- Dictionnaire : `header.language` devient `{ group, names: { fr, en } }` ; `code` et `label` disparaissent.

### 58.3 Tests

- UI (`tests/ui/i18n-en.spec.tsx`) : L1 groupe « Langue », deux boutons, « Français » pressé ; L2 « English » → interface anglaise, groupe « Language », « English » pressé ; L3 clic sur la langue active, aucun enregistrement ; L4 attributs `lang` ; plus de bouton de langue parmi les `.theme-btn`.
- E2E (`tests/e2e/langue.spec.ts`) : L5 bureau 1280 px, sans fiche et avec le nom long des tests d'en-tête, bascule dans le quart haut droit, aucune boîte de l'en-tête chevauchée ; L6 mobile 360 et 390 px, même ligne que les boutons ronds, calée à droite, 40 px, pas de défilement horizontal ; L7 clavier, Tab de Ressources à FR puis EN, Entrée bascule, focus gardé.
- Couleurs (`tests/colors.spec.ts`) : L8 encre sur accent pâle et texte secondaire sur surface ≥ 4,5:1, tous clans, deux thèmes.
- Tests mis à jour : `tests/ui/header.spec.tsx` et `tests/e2e/mobile.spec.ts` (H7) comptent 4 boutons d'action ; `tests/ui/portal.spec.tsx` (Ressources juste après Thème) ; `tests/e2e/i18n-en.spec.ts` (E1, E3, E7).

### 58.4 Documentation et captures

- `docs/GUIDE.md` § 12 et légendes de `04-fiche-mobile` (sceau 四 sur la bascule) et `12-en-tete`.
- `npm run guide-shots` relancé : captures du guide où paraît l'en-tête ; `npm run screenshots` et `-- en` : `fiche.png` et `mobile.png`. `combat.png` non recommitée : seuls les dés différaient (jets aléatoires dans `screenshots.mjs`).
- §6.2, §7 et M11 du §10 mis à jour.

### 58.5 Écarts

- **Nom long sur bureau** : la bascule recouvrait le nom de 2 lignes (L5). Comme prévu au handoff, le bloc sceau + nom réserve 112 px à droite (`.who{padding-right:112px}`, remis à 0 sur mobile).
- `scripts/guide-shots.mjs` : sceau de la bascule sur `12-en-tete` et `04-fiche-mobile` (quatrième sceau).
