## Annexe 55 — Lot 55 : README anglais (v2.31.1)

Dernier des six lots de la localisation (50 à 55). Un seul lot, une PR, une version de documentation : aucun fichier de `src/` ne change. Après le lot 54, l'application s'affichait en anglais mais la page d'accueil du dépôt restait en français.

### 55.1 Deux README

- `README.md` : **anglais**, page d'accueil GitHub du dépôt. Même structure que la version française : présentation, « What the Carnet does », captures, « Getting started », « Privacy », « Learn more », « Development ».
- `README-fr.md` : **français**, l'ancien `README.md` (renommé avec `git mv`, historique conservé), complété d'une puce « En français ou en anglais » dans « Ce que fait le Carnet ».
- Sous les badges, une ligne relie les deux : `**English** · [Français](README-fr.md)` et `[English](README.md) · **Français**`.
- Captures : `docs/img/en/*.png` dans `README.md` (régénérées au lot 54, à jour), `docs/img/*.png` dans `README-fr.md` ; légendes traduites.
- Libellés de l'interface cités tels que le dictionnaire anglais les affiche (`New blank sheet`, `File` → `Export the sheet`, `Link to a file…`, `Read-only (GM)`).
- Les liens vers des documents restés en français portent la mention « (in French) » : guide joueur, Forge du portail, CHANGELOG, spécification, `CONTRIBUTING.md`, code de conduite, `SECURITY.md`.
- Ligne de marque : « L5R is a trademark of its publisher; unofficial, free fan tool », lien vers `docs/CREDITS.md`. Badges : `Latest release`, `MIT License`.
- Règle en vigueur au §9.3 : toute modification de la vitrine se fait dans les deux README.

### 55.2 Liens

- Documents français vers `README-fr.md` : `CONTRIBUTING.md` (`#confidentialité`, `#développement`, procédure « Publier une version »), « Retour au README » de `docs/GUIDE.md` et `docs/CREDITS.md`.
- Vérifications R1 à R3 du handoff : tous les liens relatifs, ancres et images des deux README, de `CONTRIBUTING.md`, `docs/GUIDE.md` et `docs/CREDITS.md` résolus par un script ponctuel (hors dépôt) ; `#privacy` dans `README.md`, `#confidentialité` dans `README-fr.md`.
- `spec/02-architecture.md` : arborescence mise à jour.

### 55.3 Écarts

- `CHANGELOG.md` : les liens de fin de journal de la v2.31.0 manquaient (oubli du lot 54) ; ajoutés avec ceux de la v2.31.1.
- Hors périmètre, inchangés : guide joueur (`docs/GUIDE.md`, point ouvert pour une version anglaise), `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` et code de conduite en français, description du manifeste en français.
