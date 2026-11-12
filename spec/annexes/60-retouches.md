## Annexe 60 — Lot 60 : retouches de la Bibliothèque et du pied de page (v2.32.5)

Un lot, une PR, une version (`handoff-lots-60-62.md`, demande du 12/11/2026, prototype `reference/prototype-bibliotheque-pied.html`). L'annexe R (lot 41), figée, décrivait la pastille Règles L5R 4e ; celle-ci la remplace pour le pied de page.

### 60.1 Bibliothèque : boutons de création contrastés

- Constat : dans « Pas encore de personnage ? » (Bibliothèque vide) comme dans « Un nouveau personnage ? » (Bibliothèque avec des fiches), seul le bouton de la fiche vierge était plein (`btn accent`) ; **Depuis une photo…** et **Ouvrir la Forge** étaient des boutons secondaires.
- Les trois boutons des cartes de création sont en `btn accent`, sur les deux écrans : `PhotoImportButton` reçoit `className="btn accent"` dans `Library.tsx`, `ForgeLink` passe `btn accent` à `ExternalLink`. L'icône de lien externe suit `currentColor` (`--on-accent`).
- Ne changent pas : le bouton **Depuis une photo…** du bloc Fichier de la fiche (`btn` par défaut de `PhotoImportButton`), **Importer un JSON…**, les liens de modèles, **Utiliser** / **JSON** des cartes de modèles, **Ouvrir** / **Supprimer**.

### 60.2 Pied de page : pastille Règles L5R 4e retirée

- La pastille et son mémo ne servaient pas : retrait complet. Ordre du pied : nom, version, état d'enregistrement, puis Guide · Contact · Signaler un bug · Projet.
- `AppFooter.tsx` : plus de bouton `.rulesbtn`, de panneau `#rules-memo` ni d'état d'ouverture. Le chevron passe dans `src/ui/components/icons.tsx`, pour les panneaux repliables du lot 61.
- Dictionnaires : `footer.rules`, `footer.memo` et `footer.caution` supprimés (fr, en).
- `styles.css` : bloc « Pastille Règles L5R 4e » supprimé (`.rulesbtn*`, `.rulespanel`, `.memo*`, et ses règles mobiles). `.tag.memo` (étiquette « mémorisé » des sorts) reste ; la règle `.memo` du mémo lui retirait ses marges intérieures (`padding:0`), elle les retrouve.

### 60.3 Tests

- Supprimés : `tests/ui/rules-memo.spec.tsx` ; R5 et R6 et la vérification de la pastille dans V6 (`tests/e2e/carnet-links.spec.ts`) ; V9 (`tests/colors.spec.ts`).
- RT1 (`tests/ui/photo-import.spec.tsx`) : Bibliothèque avec une fiche, les trois boutons de création ont `accent` ; **Depuis une photo…** du bloc Fichier ne l'a pas. La Bibliothèque vide est vérifiée dans O7 (`tests/ui/portal.spec.tsx`) et dans les points d'entrée de l'import photo ; O9 et le cas « Forge compatible, ordre lot 43 » de `tests/e2e/portal.spec.ts` vérifient la Forge en accent.
- RT2 (`tests/e2e/carnet-links.spec.ts`) : à 360 et 1280 px, aucun bouton « Règles L5R 4e » ni mémo dans le pied ; seul bouton restant, Contact.

### 60.4 Documentation

- `docs/GUIDE.md` et `docs/GUIDE-en.md` § 12 : plus de mention de la pastille dans la phrase sur le pied de page.
- `npm run guide-shots` et `-- en` relancés : `01-accueil` (Bibliothèque vide) montre les trois boutons pleins, `07-sorts` l'étiquette « mémorisé » avec ses marges. Aucune capture ne montre le pied de page ; `npm run screenshots` (README) ne montre pas la Bibliothèque.
