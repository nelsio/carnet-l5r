## Annexe 53 — Lot 53 : règles en anglais, noms de compétence anglais, textes du moteur (v2.30.0)

Quatrième des six lots de la localisation (50 à 55). Un seul lot, une PR, une version. Après le lot 52, une page anglaise mélangeait les deux langues : anneaux, blessures, postures, actions et explications de l'Assistant restaient en français (annexe 52.6). Le lot 53 les traduit, et le moteur reconnaît une fiche saisie en anglais. Les catalogues (écoles, techniques, maîtrises, table de bataille, modèles de fiche) suivent au lot 54.

### Constat

- Les libellés de règles vivaient dans `src/rules/l5r4e.ts` (anneaux, traits, ND, blessures, postures, terrains, zones de coup ciblé, bataille, bonus de jet, armures, actions, manœuvres) et l'interface les lisait directement.
- Le moteur fabriquait environ 60 phrases affichées : notes de réserve, descriptions d'actions, raisons de blocage, rappels de blessure, résumés d'effets et de bonus, messages d'import.
- Les alias de compétences se limitaient à cinq groupes (`SKILL_ALIASES`) : une fiche saisie en anglais (`Stealth`, `Hunting`, `Lore: History`) ne recevait ni ses techniques d'école ni ses maîtrises.

### 53.1 Vocabulaire de règles dans le dictionnaire

- Nouveau sous-arbre `rules` du dictionnaire (`src/i18n/rules-fr.ts`, `src/i18n/rules-en.ts`) : traits, anneaux, éléments, échelle des ND, niveaux de blessure (et abrégés de la piste), Mort, postures (nom, description, étiquettes), terrains, zones du coup ciblé, engagements et états d'armée, situations et types de combat, groupes de la liste d'actions, actions fixes (titre et description, par id), manœuvres par défaut (nom et effet, par id), sources, cibles, noms à écrire et modèles de bonus, armures du livre (nom, effet), mots-clés d'arme, badges des rangs d'école, clans, nom d'une fiche vierge.
- **Les libellés français restent dans `src/rules`** : `rules-fr.ts` les reprend par référence. Raisons : la spécification fournie (`tests/core.rules.spec.ts`) attend `woundState(c).label === "Indemne"` et lit les abrégés de `WOUND_LEVELS` ; le prompt d'import photo (`photo.ts`) reste en français ; « corriger une règle = modifier une donnée » (§2) vaut toujours. Les phrases françaises affichées sont donc exactement celles de la v2.29.0, et seul `en` est une traduction.
- Les ids et constantes numériques ne bougent pas. L'interface ne lit plus aucun libellé de `src/rules` : `Aid`, `Roller`, `Modifiers`, `StatusBar`, `Stats`, `Grimoire`, `RichSelect`, `ArmorCatalog`, `Header`, `Library`, `ResourcesMenu` et les blocs de la fiche passent par `useT().rules`.
- Manœuvres : `maneuverText(m, rules)` (`src/ui/format.ts`) affiche le nom et l'effet du dictionnaire pour une manœuvre par défaut gardée telle quelle ; une manœuvre renommée ou personnalisée dans la fiche s'affiche telle que saisie.
- Données écrites dans la fiche dans la langue de l'interface : nom d'une fiche vierge (« New samurai »), nom de l'armure choisie dans la liste du livre. Ce sont des saisies du joueur ; la fiche n'est jamais traduite ensuite.
- `TechniqueCategory` devient un id (`auto`, `optional`, `reminder`, `text`) ; les classes CSS des badges ne changent pas.

### 53.2 Textes du moteur : codes et paramètres (option A)

- Option A, choisie par Nelson le 06/11/2026 : le moteur renvoie un `CoreText` (`src/core/text.ts`), un code et ses paramètres, jamais une phrase. Exemples : `{ key: "pool.tenDice", bonus: 12 }`, `{ key: "action.attack", weapon: "Katana", ranged: false }`, `{ key: "restrict.center" }`.
- Concernés : `Pool.notes` et `Pool.warnings`, `armorRollTn().notes`, `bowStrength`, `ActionDef.label` et `description`, `stanceRestriction`, `spellRestriction`, `woundEffectNote`, `castTimeLabel`, `SpellCast.freeRaises`, `describeModifier`, `describeEffect` (morceaux `EffectPart`). `ArmorSheet.optional` devient une liste d'objets, mise en forme par le bloc Armure. `ActionDef.group` devient un id (`rest`, `spells`, `attacks`, `interrupt`, ou l'élément d'un sort).
- Le dictionnaire a un format par code (`core`, type `CoreMessages` : une clé manquante casse `tsc`). `formatCore(dictionnaire, texte)` et le hook `useCoreText()` (`src/i18n/index.ts`) les formatent ; un texte peut en contenir un autre (bonus dans une note de réserve). La notation des dés suit la langue (`2g1`, `2k1`).
- Les noms venus de la fiche ou des catalogues (arme, technique, source d'un effet, compétence saisie) passent tels quels dans les paramètres.
- Messages d'import du moteur (`io.ts`, `merge.ts`, `migrate.ts`) : même mécanisme que les messages du schéma (annexe 50.2), quatre clés `validation` de plus (`jsonObject`, `tooLarge`, `notJson`, `newerVersion`). `NEWER_VERSION_MESSAGE` disparaît.
- Les messages de validation passent dans `src/i18n/validation-fr.ts`, sans dépendance : le dictionnaire lit maintenant `src/rules`, qui lit des types du schéma, et le schéma lisait le dictionnaire (cycle de types). `Widen` passe dans `src/i18n/types.ts`. `parseDR` et `formatDR` passent dans `src/core/dice.ts` (réexportés par `engine.ts`) pour être lus par les dictionnaires.

### 53.3 Noms de compétence anglais

- `SKILL_NAMES` (`src/rules/l5r4e.ts`) : les compétences du livre de base 4e, nom français (fait foi), nom anglais, anciens libellés français (`legacy`), mot-clé Social. `SKILL_SUBTYPES` : sous-types courants (Conte / Storytelling, Histoire / History, Outremonde / Shadowlands…). `SKILL_ALIASES` et `SOCIAL_SKILLS` en sont dérivés.
- `skillKey` (`engine.ts`) : une compétence à sous-type normalise le préfixe et le sous-type séparément (`Perform: Storytelling` = `Représentation : Conte` = `Représentation : Conteur`) ; un sous-type absent de la table est comparé tel quel. `sameSkill`, `findSkill` et `skillIs` gardent leur logique.
- Les compétences Bugei (`isBugeiSkill`) passent par `sameSkill` : `Hunting` et `Heavy Weapons` comptent pour Akodo R5 et Utaku R5.
- `VOCABULARY_UPDATES` ne contient que des anciens libellés français : une fiche avec `Stealth` ne se voit jamais proposer de renommage.
- Spécialisations : `EMPHASIS_ALIASES` reconnaît les indices des actions en anglais (`Notice`, `Search`, `Interrogation`, `Appraisal`, `Void Recovery`), choisis d'office au lanceur.
- Mots-clés d'arme : `parseWeaponKeywords` accepte les noms anglais (`Samurai, Heavy`, `two handed`) via `WEAPON_KEYWORD_ALIASES` (`src/rules/ecoles.ts`).
- Affichage : `skillLabel(nom, langue)` (`src/ui/format.ts`) donne le nom d'une compétence du catalogue dans la langue (« Courtier », « Lore: History ») ; `actionSkillLabel` préfère le nom de la fiche quand le personnage a la compétence. L'origine de la réserve au lanceur (« Courtier 2 + Awareness 3 ») et la dérogation d'armure lourde (« sauf Stealth ») l'utilisent.

### 53.4 Tests

| ID | Cas | Résultat |
|---|---|---|
| V1 | `tests/fixtures/hiruma-en.json` (Hiruma rang 3, compétences en anglais) et la même fiche traduite en français | Mêmes réserves, effets appliqués et proposés, ND d'armure de jet, sur toutes les actions de l'Assistant et trois postures (`tests/core.skills.spec.ts`) |
| V2 | `kakita-v1.json` et sa traduction anglaise | Mêmes réserves ; tests existants inchangés hors textes du moteur passés en codes |
| V3 | Fiche avec « Furtivité » | Renommage proposé vers « Discrétion » |
| V4 | Fiche avec « Stealth », fiche Hiruma | Aucun renommage |
| V5 | `Perform: Storytelling` et `Représentation : Conte` | `sameSkill` vrai ; sous-type inconnu comparé tel quel |
| V6 | Longueurs et couverture | Blessures, ND, étiquettes de posture de même longueur dans les deux langues ; l'anglais couvre chaque action, manœuvre, modèle, armure, posture, clan (`tests/i18n.spec.ts`) |
| V7 | Couverture de la table | Chaque compétence citée par `src/rules/*.json`, les Bugei et les actions fixes existe dans `SKILL_NAMES` (préfixe et sous-type pour « X : Y ») |
| V8 | Barre d'état en anglais | Piste à 800 et 1 280 px, détail à 360 px : Healthy… Out sans troncature ni défilement horizontal (`tests/e2e/i18n-en.spec.ts`) |
| V9 | Assistant en anglais, fiche Kakita, escarmouche | Situations, postures, titres et descriptions d'actions, origine de la réserve en anglais ; en français, phrases d'avant le lot 53 (`tests/ui/i18n-en.spec.tsx`) |

- Tests du moteur sur les codes : restrictions, notes de réserve, titres d'actions, raisons de sort hors rang, rappels de blessure. Les résumés composés (effets de technique, bonus de jet, descriptions de sort) sont vérifiés à travers le format français (`say()`, `tests/helpers/text.ts`) : mêmes attendus qu'avant le lot.
- Aucun test d'interface existant n'a changé : les phrases françaises sont identiques.
- 980 tests Vitest, 180 tests Playwright. Couverture : 99,28 % des instructions, 95,88 % des branches, 100 % des lignes de `src/core`. `dist/carnet-l5r.html` : 881 969 → 905 827 octets (+23 858, vocabulaire de règles anglais).
- Captures : `docs/img/en/` régénérées (Assistant et lanceur en anglais) ; `scripts/screenshots.mjs` clique la situation, l'action et le sort dans la langue de la capture. `docs/img/` inchangées : la seule différence était le jet de dés tiré au hasard.

### 53.5 Écarts

- **Libellés français gardés dans `src/rules`** au lieu d'être sortis vers le dictionnaire (53.1) : la spécification fournie et le prompt photo les lisent ; `rules-fr.ts` les reprend sans les recopier.
- **Noms français des compétences absentes des données** (Artisanat, Jeux, Dressage, Métier, Ingénierie, Navigation, Contrefaçon, Escamotage, Éventail de guerre, Armes paysannes…) : choisis pour l'outil, acceptés par Nelson le 06/11/2026 (P14). Le handoff associait « Artisanat » à `Craft` ; la 4e a deux compétences, Artisan (noble) et Craft (marchande) : la table les sépare, Artisanat / Artisan et Métier / Craft.
- **Restent en français jusqu'au lot 54** : noms et résumés des écoles, techniques et maîtrises, libellés des cases à cocher et rappels d'école, événements de la table de bataille, armes du catalogue, mots-clés de sort proposés et sorts universels (des saisies de la fiche), prompt d'import photo.
- **Onglet de l'Assistant sur ordinateur** : inchangé (annexe 52.6).

### 53.6 Correctif v2.30.1 : minimatch

- Alerte Dependabot n° 5 (GHSA-g3hv-75wg-m249, gravité moyenne) : `minimatch` de 7.0.0 à 11.0.0 exclu, déni de service par amplification de motifs. Version installée : 10.2.6, dépendance de développement d'ESLint (`eslint`, `@eslint/config-array`) et de `typescript-eslint`.
- Leurs dernières versions (ESLint 10.14, typescript-eslint 8.72) demandent encore `minimatch` ^10 : pas de correctif amont. `package.json` force `"overrides": { "minimatch": "^11.0.1" }` ; 11.0.5 installé, `npm audit` sans vulnérabilité.
- Lint, `tsc`, tests Vitest et build inchangés. `dist/carnet-l5r.html` n'est pas concerné : `minimatch` ne sert qu'aux outils.
- À retirer quand ESLint et typescript-eslint dépendront de `minimatch` 11.
