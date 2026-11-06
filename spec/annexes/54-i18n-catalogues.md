## Annexe 54 — Lot 54 : catalogues en anglais (v2.31.0)

Cinquième des six lots de la localisation (50 à 55). Un seul lot, une PR, une version. Après le lot 53, une page anglaise gardait en français les noms et résumés des écoles, des techniques et des maîtrises, les cases à cocher et rappels d'école, les événements de la table de bataille et les modèles de fiche (annexe 53.5). Le lot 54 les traduit.

### 54.1 Surcouches anglaises

- Les catalogues français ne bougent pas : effets, ids, noms (`ecoles-*.json`, `maitrises.json`, `table-bataille.json`). Les données de règles restent canoniques en français.
- Trois fichiers de textes anglais, clés par id, sans aucun effet :
  - `src/rules/en/ecoles.json` : les 40 écoles (nom, rangs : nom, résumé, textes des effets par index : `label`, `stackLabel`, `text`), cases, rappels et sorts de départ des shugenja ; noms des clans et des classes du catalogue (`Crabe`, `Clans mineurs`, `Moine`…) ; mots-clés de sort des écoles (`Artisanat` → `Craft`).
  - `src/rules/en/maitrises.json` : clé `"<compétence de maitrises.json>@<rang>"` (`"Kenjutsu@3"`, `"*@10"`), résumé et textes des effets.
  - `src/rules/en/bataille.json` : événements (`Duel`, `Heroic Opportunity`). Engagements et états d'armée sont déjà dans le dictionnaire (annexe 53.1).
- `src/i18n/catalog.ts` : `catalogText(fr, en, locale)` rend le texte anglais s'il existe et n'est pas vide, sinon le français (repli silencieux) ; `catalogFor(locale, rules)` et le hook `useCatalog()` lisent écoles, rangs, clans, classes, effets actifs, rappels chiffrés, cases et rappels de sort, sorts de départ, mots-clés de sort et événements de bataille.
- Les champs `note` et `_source` restent en français (documentation interne).

### 54.2 Moteur et interface

- `ActiveEffect.origin` (`src/core/schools.ts`) : rang d'école (`school`, `rank`, `index`) ou maîtrise (`mastery` : `"Kenjutsu@3"`, `index`). L'interface y retrouve les textes de la surcouche. Les champs `technique`, `summary`, `label` restent ceux du catalogue français (moteur et tests inchangés).
- `ArmorSheet.optional` porte l'effet d'origine d'une case de technique (`effect`), pour son libellé traduit.
- `reminderText(e, c, words?)` : texte et résumé fournis par l'interface dans sa langue, `{n}` toujours calculé par le moteur.
- Titre d'une maîtrise : `rules.masteryTitle(compétence, rang)` du dictionnaire (« Maîtrise Kenjutsu 3 », « Mastery Kenjutsu 3 ») ; la compétence est celle de la fiche, telle que saisie.
- Texte du moteur `spell.option` : id de l'école et de la case en plus du libellé ; le format anglais lit la surcouche. `spell.keyword` : nom anglais du mot-clé.
- Mots-clés de sort saisis en anglais (`Craft`, `defense`) : `SPELL_KEYWORD_ALIASES` (`src/rules/ecoles.ts`, dérivé de la surcouche) les ramène au nom français ; l'augmentation gratuite d'école s'applique (même principe que les mots-clés d'arme, annexe 53.3).
- Choix d'une école dans la fiche (`chooseSchool`) : le champ « École (nom affiché) » reçoit le nom dans la langue de l'interface. C'est une saisie du joueur, jamais traduite ensuite (même règle que le nom de l'armure, annexe 53.1).
- Passent par `useCatalog()` : bloc Techniques (école, clan, rangs, résumés, rappels chiffrés, suggestion d'école), sélecteur « Techniques d'école » (clans, noms, classes, premier rang), bloc Armure (cases à cocher), Sorts (sorts de départ), Assistant (étiquettes de posture, cases de ND d'armure, compteurs, rappels, événement de bataille), lanceur (cases de technique, titres, rappels de dégâts et sociaux, cases et rappels de l'école de sort). `BATTLE_EVENT_LABELS` n'est plus lu directement par l'interface.

### 54.3 Modèles de fiche anglais

- `reference/exemple-personnage-en.json`, `exemple-shugenja-en.json`, `exemple-courtisan-en.json` : Kakita Haruto, Tamori Ayane, Doji Sayuri, mêmes valeurs, compétences, spécialisations, armure, notes, bonus et sorts saisis en anglais.
- `EXAMPLES_EN` et `examplesFor(locale)` (`src/rules/example.ts`) : la Bibliothèque propose les modèles de la langue courante. Fichiers téléchargés : `example-bushi-l5r.json`, `example-shugenja-l5r.json`, `example-courtier-l5r.json` ; type affiché « Courtier ».
- `scripts/screenshots.mjs` lance le sort du modèle anglais (« Jade Strike ») pour les captures `docs/img/en/`.

### 54.4 Tests

| ID | Cas | Résultat |
|---|---|---|
| C1 | Couverture | Chaque école × rang, texte d'effet, case, rappel et sorts de départ de shugenja, maîtrise, événement, clan, classe et mot-clé de sort a un texte anglais ; 40 écoles (`tests/i18n.catalog.spec.ts`, liste des manquants) |
| C2 | Repli | Surcouche sans Hida, nom de Kakita vide, sans événements : textes français, sans erreur |
| C3 | Chiffres | Chaque nombre d'un texte français se retrouve dans le texte anglais (`1g0` = `1k0`, « once » = 1, `6,0` = `6.0`, `9 m` = `30 feet`, renvois « annexe » ôtés) |
| C4 | Clés | Aucune clé de `src/rules/en/*.json` sans entrée française ; une maîtrise par « compétence@rang » |
| C5 | Modèles | Les 3 modèles anglais passent `migrate()` et le schéma, mêmes effets actifs, ND d'armure et réserves (compétences, actions jouables de toutes les situations en Attaque et en Assaut) que les modèles français (`tests/core.example.spec.ts`) |
| C6 | Mobile | Sélecteur « School techniques » à 360 px : champ en 16 px, noms entiers (sur deux lignes au besoin), menu dans l'écran, pas de défilement horizontal (`tests/e2e/i18n-en.spec.ts`) |

- Interface (`tests/ui/i18n-en.spec.tsx`) : bloc Techniques Kitsuki en anglais et en français, compteur et case de ND d'armure Hiruma, événement de bataille, modèles et noms de fichiers de la Bibliothèque, nom d'école écrit dans la langue. Moteur : origine des effets, case d'armure, mot-clé de sort anglais (`tests/core.armor.spec.ts`, `tests/core.magic.spec.ts`).
- Seul attendu existant modifié : `armorSheet().optional` compare ses entrées sans l'effet d'origine, vérifié à part.
- 995 tests Vitest, 181 tests Playwright. Couverture : 99,35 % des instructions, 95,75 % des branches, 100 % des lignes de `src/core`. `dist/carnet-l5r.html` : 905 827 → 954 216 octets (+48 389, surcouches et modèles anglais).
- Captures : `docs/img/en/` régénérées (école, rappels et sort du modèle en anglais) ; `docs/img/` inchangées.

### 54.5 Écarts

- **Noms officiels anglais des écoles et des techniques** : écrits de mémoire de la 4e, à faire relire par un joueur qui a le livre anglais (point ouvert 3 du handoff de localisation). Les résumés sont des traductions des résumés français de l'outil.
- **Signature** : le handoff nommait `catalogText(entry, locale)` ; la fonction prend le texte français et le texte anglais (`catalogText(fr, en, locale)`), les lecteurs par entrée sont dans `catalogFor()`.
- **Hors périmètre, restent en français** : noms des armes du catalogue du livre (comparés au nom saisi dans la fiche), prompt d'import photo, grimoire du portail.
- **Mots-clés de sort et clans/classes** ajoutés à la surcouche, non prévus par le handoff : sans eux, une page anglaise affichait « Défense keyword » ou « Clans mineurs ».
