## Annexe 57 — Lot 57 : README français par défaut, guide plus digeste (v2.32.2)

Un lot, une PR, une version de documentation : aucun fichier de `src/` ne change. Le public du Carnet est d'abord francophone : la page d'accueil du dépôt redevient française. Le guide joueur, long et rangé par écran, devient un parcours par tâche.

### 57.1 README français par défaut

- `README.md` : **français** (l'ancien `README-fr.md`, renommé avec `git mv`), page d'accueil GitHub du dépôt.
- `README-en.md` : **anglais** (l'ancien `README.md`, renommé avec `git mv`).
- Ligne sous les badges : `[English](README-en.md) · **Français**` et `**English** · [Français](README.md)`.
- Liens des documents français (`CONTRIBUTING.md`, `docs/GUIDE.md`, `docs/CREDITS.md`) : `README-fr.md` → `README.md`.
- Puce « Guide d'utilisation » / « User guide » de « En savoir plus » : décrit la nouvelle forme du guide.
- §9.3 et arborescence du §2 mis à jour.

### 57.2 Guide plus digeste

- En tête, **« Le Carnet en 5 minutes »** : six étapes, de l'ouverture à l'export, chacune renvoyant à sa section.
- Sommaire regroupé en trois parties : Démarrer, Jouer, Garder et partager.
- Douze sections par tâche. Chacune commence par l'essentiel ; le détail des règles (armure, Insight, postures, grimoire, écoles, maîtrises, bonus de jet, fichier lié, liens du portail…) est replié dans des blocs `<details>` « En détail », rendus par GitHub.
- Tableaux pour les choix : façons d'ouvrir le Carnet, points de départ d'une fiche, tuiles de la barre d'état, situations de l'Assistant, besoins de sauvegarde.
- La magie, dispersée entre la fiche, l'Assistant et le lanceur, est regroupée dans **§ 7 Shugenja : sorts et magie** : noter ses sorts, emplacements du jour, lancer un sort.
- Langue, portail des Chroniques de Rokugan et confidentialité sont réunis en fin de guide (§ 12) ; la mention du bouton **Contact** du pied de page (lot 56) y est ajoutée.
- Aucune information retirée : environ 2 700 mots visibles sans rien déplier, contre 4 400 auparavant.
- Ancres conservées pour les liens existants : `#installer-sur-ton-téléphone-ou-ton-ordinateur` et `#11-pour-le-mj`. Le chemin `docs/GUIDE.md`, cité par l'application (`src/rules/links.ts`), ne change pas.

### 57.3 Vérifications

- Tous les liens relatifs et ancres des deux README, de `docs/GUIDE.md`, `docs/CREDITS.md` et `CONTRIBUTING.md` résolus par un script ponctuel (hors dépôt), comme en 55.2.

### 57.4 Écarts

- Le guide reste en français seulement (point ouvert depuis l'annexe 55.3).
- Pas de nouvelle capture : aucun écran ne change.
