## Annexe R — Lot 41 : note de règles dans le pied de page (v2.26.2)

Source : `handoff-pied-de-page.md`, reçu le 02/11/2026. Maquette `reference/prototype-pied-de-page.html`, option **A** retenue par Nelson (l'option B, encart dans l'Assistant, n'est pas faite). Constat : la note « Règles de référence » (4 lignes sur bureau, environ 8 à 390 px) et le pied de page faisaient deux bandeaux gris d'affilée en bas de chaque écran.

### R.1 Livré

- **`src/ui/App.tsx`** : le `<p className="note">` au-dessus d'`AppFooter` est supprimé.
- **`src/ui/components/AppFooter.tsx`** : pastille `button.rulesbtn` « 規 Règles L5R 4e » + chevron, entre le lien de version et l'état d'enregistrement, `aria-expanded` et `aria-controls="rules-memo"`. Panneau `#rules-memo`, dernier enfant du `<footer>`, rendu seulement s'il est ouvert : cinq repères (Système, Explosion, Augmentations, Blessures, Duel, bataille). État local, **replié par défaut**, non mémorisé.
- **`src/ui/styles.css`** : `.note` supprimé (bureau et mobile) ; `.rulesbtn`, `.rulespanel` (`flex-basis:100%`, `order:10` : sous toute la ligne, après les liens), `.memo` repris de la maquette avec les jetons existants. Mobile : libellé au-dessus de la valeur. La règle globale `prefers-reduced-motion` coupe déjà la rotation du chevron (`transition:none`).
- **Guide** (§ 3, paragraphe « Le Carnet ») et **CHANGELOG** (2.26.2, Modifié).
- **Tests** : `tests/ui/rules-memo.spec.tsx` (R1 à R4), `tests/e2e/carnet-links.spec.ts` (V6 étendu, R5 à 390 et 360 px, R6 clavier), `tests/colors.spec.ts` (V9).

| Cas | Vérifie |
|---|---|
| R1 | Plus de note de règles (`.note`, « Règles de référence ») sur la Bibliothèque, la Fiche, l'Assistant L5R et les Statistiques |
| R2 | Pastille « Règles L5R 4e » dans le pied, `aria-expanded="false"`, `aria-controls="rules-memo"`, panneau absent |
| R3 | Clic : panneau dans le pied avec les cinq libellés ; second clic : replié |
| R4 | Panneau ouvert : état d'enregistrement et trois liens toujours dans le pied |
| R5 | 390 et 360 px, panneau ouvert : pas de défilement horizontal, pastille ≥ 32 px, liens sous la pastille ; à 390 px, pastille sur la ligne de la version |
| R6 | Clavier : Tab depuis la version atteint la pastille, Entrée ouvre puis ferme, le focus reste sur le bouton |
| V9 | `accent-ink` sur `accent-pale` (pastille ouverte) ≥ 4,5:1, tous les clans, deux thèmes |

### R.2 Écarts avec le handoff

- **Maquette** : le handoff la cite sous `handoff/reference/` ; elle est versionnée dans `reference/`, avec les autres prototypes.
- **Tests UI** : nouveau fichier `tests/ui/rules-memo.spec.tsx` plutôt que le describe « V3 » de `carnet-links.spec.tsx`, laissé inchangé (R4 s'ajoute aux cas existants).
- **360 px** : nom, version et pastille ne tiennent pas sur une ligne ; la pastille passe sur sa propre ligne, entre le nom et les liens. Le critère « sur la ligne de la version » n'est donc vérifié qu'à 390 px (le handoff ne l'exige qu'à cette largeur).
- **R6** : la tabulation part du lien de version (focus posé dessus) plutôt que du haut de la page, pour vérifier l'ordre sans dépendre du nombre de contrôles de l'écran.
- **Captures du README** : inchangées, elles montrent le haut des écrans.

