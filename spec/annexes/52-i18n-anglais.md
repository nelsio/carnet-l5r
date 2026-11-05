## Annexe 52 — Lot 52 : interface en anglais (v2.29.0)

Troisième des six lots de la localisation (50 à 55). Un seul lot, une PR, une version. L'interface existe en anglais ; les règles (`src/rules`, textes du moteur) suivent au lot 53, les catalogues au lot 54.

### Constat

Depuis le lot 51, tous les textes de l'interface passent par le dictionnaire, mais `en.ts` reprenait l'objet français et `main.tsx` fixait la langue à `fr` (annexe 50.6). Le lot 52 traduit le dictionnaire, branche la détection et ajoute le bouton de langue.

### 52.1 Dictionnaire anglais

- `src/i18n/en.ts` : traduction complète de `fr.ts`, même forme (`Messages`). Terminologie imposée par le handoff : Sheet, L5R Assistant (Assistant sur mobile), Statistics, Roller, Pool, TN, Raise(s), Free Raise, Void Points, Library, Sheet template, New day, Spell slots, Compact view ; et DR pour VD, Armor TN, Reduction, Emphases, Insight Rank, School Rank.
- Les textes sont rédigés pour l'outil, à partir des textes français : aucun texte du livre anglais. Les renvois de page du livre français (« livre p. 87 ») deviennent « core book » : la pagination diffère.
- Les exemples de saisie qui doivent rester reconnus par le moteur restent en français (mots-clés d'arme `samourai, lourde…`, recherche du grimoire `armure, éteindre, jade`) : le moteur ne lit que le français jusqu'au lot 53.
- Nouvelles clés, présentes dans les deux langues : `header.metaDescription`, `header.language` (`code`, `label`), `resources.french` et `grimoire.frenchNotice` (vides en français).
- `fr.roller.explodeOn` est typé `string` : son type littéral (`"9 et 10" | "10"`) refusait toute autre traduction.

### 52.2 Langue au lancement et bouton FR/EN

- `initialLocale()` (`src/i18n/index.ts`) : `localStorage["carnet-lang"]` s'il vaut `fr` ou `en`, sinon `detectLocale(navigator.language)` (`en*` → anglais). Lecture protégée par `try/catch` : stockage illisible, langue détectée. `main.tsx` l'utilise à la place du `fr` fixe.
- Bouton dans l'en-tête, juste après Thème, même style que les autres (`theme-btn`, rond de 40 px sur mobile). Il affiche la langue courante (`FR` / `EN`, police à chasse fixe) à la place d'une icône ; nom accessible et infobulle « Langue : français » / « Language: English ». Un clic bascule.
- `setLocale` mémorise le choix (`try/catch` : sans stockage, le choix vaut pour la session). La langue détectée n'est pas mémorisée : tant que le joueur n'a rien choisi, le Carnet suit son navigateur.
- Au changement, le fournisseur met à jour `<html lang>` et `<meta name="description">` ; le titre de l'onglet suit déjà le dictionnaire (`Header.tsx`). Le nom de l'outil, « Carnet de Rokugan », ne change pas.

### 52.3 Notation, distances, pourcentages

- `formatPool(rolled, kept, locale)` et `DICE_LETTER` (`src/ui/format.ts`) : `5g3` en français, `5k3` en anglais. `poolLabel(pool, locale)` et les appels de `formatDR(dr, DICE_LETTER[locale])` de l'interface l'utilisent ; `formatDice` du moteur n'est plus appelé par l'interface.
- Saisie : `parseDR`, `formatDR` et le schéma acceptaient déjà `g` et `k` ; une VD saisie `3g2` s'affiche `3k2` en anglais. La fiche n'est pas modifiée.
- `formatDistance(feet, locale)` : `3,0 m` en français, `10 ft` en anglais. Dans le panneau Déplacement, le détail donne la conversion en mètres en français seulement : en anglais, les pieds sont déjà l'unité affichée.
- `pct(p, locale)` : `50 %` en français (inchangé), `50%` en anglais (reporté du lot 51, annexe 51.5).

### 52.4 Contenu en français

- Grimoire : en anglais, une ligne discrète en tête du panneau « Add from the grimoire » : « Spells come from the campaign portal and are in French. »
- Menu Ressources : en anglais, suffixe `(FR)` après le titre des liens du portail (accueil, page du clan, Forge, grimoire, mémento, bushido, étiquette) et du guide d'utilisation, aussi dans le nom accessible.
- Bibliothèque et pied de page : « Read the guide (in French) », « Discover the game on … (in French) », « Guide (FR) ».

### 52.5 Tests et captures

| ID | Cas | Résultat |
|---|---|---|
| E1 | Navigateur `en-US`, premier lancement | Interface en anglais, `<html lang="en">` (e2e et Vitest) |
| E2 | `pt-PT` | Français |
| E3 | Clic sur le bouton puis rechargement | Langue conservée (e2e) ; choix mémorisé prioritaire sur le navigateur (Vitest) |
| E4 | `localStorage` qui lève une erreur | Langue détectée ; en écriture, la langue change quand même |
| E5 | Fiche Kakita en anglais | Réserves `XkY` sur la fiche, initiative, Statistiques en `TN` |
| E6 | VD `3g2` | `DR 3k2` en anglais, `VD 3g2` en français |
| E7 | Mobile 360 px en anglais | Onglets Sheet · Assistant · Statistics sur une ligne ; bouton de langue sans chevauchement, aucun défilement horizontal |
| E8 | Grimoire en anglais | Bandeau « in French » ; absent en français |
| E9 | `check-i18n` | Aucune régression |

- `tests/ui/i18n-en.spec.tsx` (16 tests) et `tests/e2e/i18n-en.spec.ts` (4 tests, `locale: "en-US"`) : 961 tests Vitest et 177 tests Playwright, verts. Couverture inchangée (99,28 % instructions, 96,01 % branches, 100 % lignes de `src/core`). `dist/carnet-l5r.html` : 850 603 → 881 969 octets (+31 366, le dictionnaire anglais).
- Tests existants adaptés au nouveau bouton : nombre de boutons de l'en-tête (`header.spec.tsx`, 4 → 5), ordre Thème · Langue · Ressources (`portal.spec.tsx`), en-tête mobile à 5 boutons (`mobile.spec.ts`, H7). Tests qui supposaient `en = fr` : `tests/i18n.spec.ts` (I3) et la date de la Bibliothèque en `en` (`tests/ui/i18n.spec.tsx`) lisent désormais le dictionnaire de la langue.
- `scripts/screenshots.mjs` prend la langue en argument : `npm run screenshots` → `docs/img/` (français, régénérées : le bouton FR apparaît dans l'en-tête), `npm run screenshots -- en` → `docs/img/en/` (pour le README anglais, lot 55).

### 52.6 Écarts

- **Règles et moteur encore en français**, comme prévu par le handoff : anneaux, traits, situations, postures, niveaux de blessure, noms d'actions, descriptions et raisons de blocage, notes de réserve (`VD 2g2`, `Vide : +1g1`). Une page anglaise mélange donc les deux langues jusqu'au lot 53 ; les catalogues (écoles, maîtrises, modèles) jusqu'au lot 54.
- **Onglet de l'Assistant sur ordinateur** : « Assistant L5R » à l'écran (le suffixe « L5R » est un élément à part, masqué sur mobile), « L5R Assistant » pour les lecteurs d'écran. Remettre l'ordre anglais demanderait de déplacer le suffixe selon la langue ; laissé tel quel.
- **Bouton sans icône** : le handoff demandait le composant `HeaderButton` ; le code `FR` / `EN` tient lieu d'icône, sur bureau comme sur mobile, pour garder l'en-tête court. Même classe et même taille que les autres boutons.
- **Guide d'utilisation** : marqué `(FR)` comme les liens du portail, car il n'est pas traduit (point ouvert du handoff de localisation, §8).
