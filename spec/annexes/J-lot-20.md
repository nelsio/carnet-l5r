## Annexe J — Lot 20 : correctifs et retouches (v2.17.0)

Statut : **à livrer**. Retours de jeu de Nelson du 30/10/2026, audit fait sur `main` au commit `783c009` (v2.16.0). Les numéros de ligne cités peuvent avoir bougé : se fier aux extraits.

La **localisation** prévue ici (ex-annexe J, français + anglais) est **reportée** : retirée du plan, notée au §11 point 22. `formatDR(s, letter)` garde son second paramètre, sans autre usage pour l'instant.

Une PR, CI verte, captures « avant » et « après » (bureau 1280 px et 390 px, clair et sombre) des vues touchées, tag `v2.17.0` après merge. Version **mineure** : nouveaux modèles de fiche et nouveau comportement par défaut du lanceur. **Pas de changement de format de fiche** (`schemaVersion` reste 2).

| # | Retour | Zone |
|---|---|---|
| J.1 | Panneau Armes en mobile : champs tronqués, difficile de tout effacer | `Sheet.tsx` `Weapons`, `styles.css` |
| J.2 | Police du bloc Identité & réputation incohérente | `Sheet.tsx` `Identity`, `styles.css` |
| J.3 | Bouton d'ajout de technique qui mentionne les sorts | `Sheet.tsx` `Techniques` |
| J.4 | Bonus de jet : plus de catalogue, un modèle structuré ; saisie à la main ou par JSON | `Modifiers.tsx`, `l5r4e.ts`, annexe B |
| J.5 | Modèles JSON de shugenja et de courtisan | `reference/`, `src/rules/example.ts`, `Library.tsx` |
| J.6 | Panneau « Dépenser du Vide » comme le panneau Posture | `Aid.tsx` `VoidPanel` |
| J.7 | Lanceur de dés affiché par défaut | `store.ts`, `useLibrary.ts`, prefs |
| J.8 | Shugenja en escarmouche : sorts avant les attaques | `core/actions.ts` |
| J.9 | Lanceur : retirer le champ « Dés lancés ± » (Bonus fixe gardé, champs d'augmentations inchangés) | `Roller.tsx` |
| J.10 | Lanceur : Min et Moy. pas centrés en hauteur à côté de Max | `styles.css` `.statline` |

### J.1 Panneau Armes sur mobile

**Constat.** En Edit, `Weapons` est un tableau de 6 colonnes dans `.tbl` (défilement horizontal) avec des largeurs fixes (`td` de 80 et 70 px, mots-clés `minWidth: 140`). À 390 px, les champs Nom, Compétence et VD n'affichent que quelques caractères : on ne voit pas ce qu'on tape et on vise mal le texte à effacer.

**Correctif.** Même présentation que les sorts en Edit (`.spelledit`) **à toutes les largeurs**, plus de tableau en Edit :
- une **carte par arme** (`.weaponedit`, mêmes règles que `.spelledit`) : ligne 1 **Nom** (pleine largeur) + bouton Retirer ; puis grille `form-grid` : **Compétence**, **VD**, **Force de l'arc** ; puis **Mots-clés** (pleine largeur) ;
- chaque champ avec un `label` visible (`Field`), les `aria-label` actuels deviennent inutiles ;
- mobile ≤ 720 px : grille sur 2 colonnes (Compétence pleine largeur, VD + Force de l'arc côte à côte), champs à **16 px** (pas de zoom iOS) et 40 px de haut ;
- les champs texte gardent `type="text"` ; ajouter `enterkeyhint="next"` et `autocapitalize="off"` sur VD ;
- « Force de l'arc » n'apparaît que pour une arme à distance (`isRanged(w)` ou mot-clé `arc`) ; sinon la cellule disparaît ;
- `CatalogGap` (mise à jour proposée depuis le livre) reste sous la carte concernée.

Le mode lecture (tableau Arme / Attaque / Dégâts) ne change pas.

**Effacement.** Vérifier sur téléphone que chaque champ se vide entièrement (sélection + suppression) et que la valeur vide est acceptée pendant la saisie : `TextListField` (mots-clés) et `OptionalNumber` (Force de l'arc) le permettent déjà ; le VD vide doit rester saisissable (validation au moment du jet, pas à la frappe).

### J.2 Police du bloc Identité & réputation

**Constat (à confirmer par capture).** Le bloc mélange plusieurs polices sans règle visible :
- en lecture, `.kv b` affiche Honneur, Gloire, Statut, XP **et** l'Initiative en JetBrains Mono 18 px, alors que les réserves ailleurs (Compétences, Armes) sont en `.pool` (mono gras, couleur `--accent-ink`) et les valeurs simples en mono 15 px (`.cstats`, tableaux) ;
- en Edit, le placeholder du Rang d'école (« n (Rang d'Insight) ») hérite de `input.in[type=number]` et s'affiche en mono, au milieu de champs texte en police du corps.

**Règle à appliquer** (la même que le reste de l'outil) : **chiffres en mono, textes en police du corps, réserves en `.pool`**.
- `.kv b` : mono, **même corps que les valeurs des autres blocs** (aligner sur `.cstats b` ou la valeur la plus proche dans la fiche, à choisir sur capture) ;
- Initiative : classe `pool` (couleur d'accent, comme les colonnes « Jet » des tableaux) ;
- `input.in[type=number]::placeholder { font-family: var(--f-body) }` (vaut pour tous les champs numériques facultatifs) ;
- nom du bloc : identique aux autres titres (`h2`, `--f-display`).

**Avant de coder**, l'agent compare le bloc Identité aux blocs Compétences, Armes et Armure sur les captures (lecture et Edit, bureau et 390 px) et liste dans la PR chaque différence de famille, de corps ou de graisse trouvée. Si le défaut vu par Nelson est ailleurs, il est ajouté au relevé et traité avec la même règle.

### J.3 Bouton d'ajout de technique

Les sorts ont leur propre bloc (Rouleaux & invocations, annexe F). Dans `Techniques` :
- bouton `+ Technique / sort / kata` → **`+ Technique / kata`** ;
- titre `Autres techniques, kata, sorts` → **`Autres techniques, kata`**.

Les fiches qui ont un sort noté en technique ne sont pas modifiées (pas de migration).

### J.4 Bonus de jet : modèle structuré, sans catalogue

**Décision.** Comme pour les sorts : **aucun catalogue nommé** dans l'outil. Le joueur saisit ses bonus **à la main** (formulaire structuré) ou **par le JSON** de sa fiche (champ `modifiers`, format de l'annexe B, inchangé).

**Retraits.**
- `NAMED_MODIFIERS` (`src/rules/l5r4e.ts`) et son groupe « Catalogue (livre de base 4e, à vérifier) » du menu ;
- les tests qui s'y rapportent (les lister dans la PR).

Les bonus déjà présents dans une fiche (créés depuis le catalogue) restent tels quels : ce sont des données du joueur.

**Modèle.** Le menu « Modèle de bonus » propose les **formes d'effet** possibles, regroupées par source. Chaque modèle préremplit `source`, `appliesTo`, `mode` et les valeurs, avec un **nom vide** et un placeholder qui dit quoi écrire (« Nom de l'avantage », etc.). Aucun nom ni texte du livre.

| Groupe (`source`) | Modèle | Champs préremplis |
|---|---|---|
| **Avantage** | Dés en plus sur une compétence | `skill`, `rolled: 1`, `kept: 1`, `always` |
| | Dés en plus sur un trait | `trait`, `rolled: 1`, `always` |
| | Augmentation gratuite sur une compétence | `skill`, `freeRaises: 1`, `always` |
| | Bonus sur les jets sociaux | `social`, `rolled: 1`, `always` |
| | Pénalité de blessure réduite | `wounds`, `flat: 3`, `always` |
| | Bonus au ND d'armure | `armor`, `flat: 5`, `always` |
| | Bonus situationnel (à cocher au jet) | `all`, `rolled: 1`, `kept: 1`, `optional` |
| **Désavantage** | Malus de dés sur une compétence | `skill`, `rolled: -1`, `always` |
| | Malus de dés sur un trait | `trait`, `rolled: -1`, `always` |
| | ND augmenté sur les jets sociaux | `social`, `tn: 5`, `always` |
| | ND augmenté sur une compétence | `skill`, `tn: 5`, `always` |
| | Pénalité de blessure aggravée | `wounds`, `flat: -5`, `always` |
| | Malus situationnel au total (à cocher) | `all`, `flat: -5`, `optional` |
| **Technique** | Dés en plus aux attaques | `attack`, `rolled: 1`, `always` |
| | Dés en plus aux dégâts | `damage`, `rolled: 1`, `always` |
| | Dés en plus à l'initiative | `initiative`, `rolled: 1`, `always` |
| | Bonus en posture (au choix de la posture) | `attack`, `rolled: 1`, `stance: "attack"`, `always` |
| **Autre** | Bonus libre | tout à 0, `appliesTo: "skill"`, `always` |

- Le menu est un `RichSelect` variante **Catalogue groupé** (comme les écoles) : `<optgroup>` par source, chaque option avec son nom (`.n`) et l'effet en clair (`.d`, `describeModifier` du modèle). « Bonus libre » en tête, choisi par défaut.
- `MODIFIER_TEMPLATES` est réécrit selon le tableau (identifiants stables `adv-skill-dice`, `dis-social-tn`…) ; le type `ModifierTemplate` gagne `placeholder: string`.
- Dans l'éditeur, le nom vide affiche le placeholder du modèle ; la case « Condition, précision » garde son placeholder.
- Texte d'aide en tête du panneau en Edit (une ligne de plus) : « Tu peux aussi les écrire dans le JSON de ta fiche (champ `modifiers`) : voir les modèles de fiche de la Bibliothèque. »

**Annexe B à mettre à jour** (section *Saisie*) : retirer le tableau du catalogue nommé, renvoyer à J.4. **README** : section Bonus de jet, remplacer la liste des modèles par « à la main, à partir d'une forme d'effet (avantage, désavantage, technique), ou dans le JSON » et retirer toute mention du catalogue.

### J.5 Modèles de fiche JSON : shugenja et courtisan

**Fichiers fournis** (validés contre le schéma v2 par `importCharacter`, joints au handoff) :

| Fichier | Personnage | Contenu notable |
|---|---|---|
| `reference/exemple-personnage.json` | Kakita Haruto, bushi Kakita R1 (existant) | inchangé |
| `reference/exemple-shugenja.json` | Tamori Ayane, shugenja Tamori R1 (Dragon) | 2 sorts : *Sentir* (universel, non mémorisé) et *Frappe de jade* (Terre, maîtrise 1, VD `2g2`, mémorisé) ; Sortilèges, Méditation, Artisanat : Forge |
| `reference/exemple-courtisan.json` | Doji Sayuri, courtisane Doji R1 (Grue) | compétences de l'école ; 2 bonus de jet : *Voix* (avantage, +1g1) et un désavantage-modèle vide à adapter |

Les deux fiches portent une note « Modèle … Remplace tout par ton personnage ». Les effets de sort sont des résumés d'une ligne, pas du texte du livre.

**Bibliothèque.** Le bouton « Télécharger un exemple de fiche (JSON) » devient un groupe de trois boutons `btn sm`, sur une ligne qui passe à la ligne sur mobile :
« **Exemple bushi** », « **Exemple shugenja** », « **Exemple courtisan** », précédés du libellé « Modèles de fiche (JSON) : ». Fichiers téléchargés : `exemple-bushi-l5r.json`, `exemple-shugenja-l5r.json`, `exemple-courtisan-l5r.json`.

**Code.** `src/rules/example.ts` exporte `EXAMPLES: { id, label, fileName, build(): Character }[]` (trois entrées, `migrate()` sur chaque JSON). `EXAMPLE_FILE_NAME` et `exampleCharacter()` disparaissent ; adapter leurs usages et tests.

**README** : la ligne « Exemple » cite les trois modèles.

### J.6 Panneau « Dépenser du Vide » comme le panneau Posture

**Constat.** `VoidPanel` affiche encore l'ancien motif des postures (grille de boutons `.stance` + bouton « i » qui déplie les descriptions), alors que le panneau Posture est passé au menu déroulant au lot 19 (I.3.4).

**Correctif : même structure que `StancePanel`.**
- **En-tête** : « Dépenser du Vide » à gauche ; à droite « Points de Vide **n** » (même style que « ND d'armure n ») puis les dépenses actives en étiquettes (`+2g2 au jet`, `+20 ND d'armure`, `Compétence au rang 1`). **Plus de bouton « i »** : `InfoPanel` perd `"void"`.
- **Menu** `RichSelect variant="effet"`, une option par dépense, avec nom (`.n`), étiquettes d'effet (`EffectTags`) et description (`.d`) :

  | Option | Étiquettes | Description | Effet |
  |---|---|---|---|
  | Au jet | `+{m}g{m}` | Dépensé au prochain jet lancé. | bascule `opts.voidPoint` |
  | ND d'armure | `+{10m}` | Jusqu'au prochain round. | bascule `voidArmor` |
  | Compétence au rang 1 | — | Jouer une compétence que tu n'as pas. | bascule `opts.voidSkill` |
  | Activer une capacité | `1 point` | Technique, kata ou avantage payé en Vide. | `voidTechnique` |
  | Initiative (escarmouche seulement) | `+{10m}` | Jusqu'à la fin de l'escarmouche. | `voidInitiative` |
  | Échanger l'Initiative (escarmouche seulement) | `1 point` | Avec un allié consentant ; échangez vos scores à la main. | `voidTechnique` |

  (`m` = `voidMultiplier(c)`.) Choisir une option **ne dépense rien**.
- **Sous le menu** : description de l'option choisie (`.posture-desc`, mêmes étiquettes), puis **un bouton** :
  - pour une bascule : « Dépenser 1 point de Vide » (`btn sm accent`) ou, si elle est active, « Annuler » (`btn sm`), `aria-pressed` ;
  - pour une action ponctuelle : « Dépenser 1 point de Vide » ;
  - désactivé sans point de Vide (sauf « Annuler »).
- Option choisie : nouvel état UI `voidChoice` (défaut « Au jet »), non mémorisé, remis au défaut quand on quitte l'escarmouche si l'option n'existe plus.
- Le message « Déjà un point de Vide dépensé ce round » reste au-dessus du menu.

E12 perd le panneau Vide (reste Déplacement et Rappels d'école).

### J.7 Lanceur de dés affiché par défaut

**Décision.** Le lanceur de dés est **affiché par défaut** (inverse de la v1.1, §3 et §6.2 à mettre à jour, E15 à réécrire). Le bouton d'en-tête et le choix mémorisé restent.

- `store.ts` : `showDiceRoller: true` à l'état initial ;
- `useLibrary.ts` : `dispatch({ type: "diceRoller", show: prefs.showDiceRoller ?? true })` (aujourd'hui seul `true` est relu) ;
- **préférence déjà enregistrée** : la v2.16.0 écrit `showDiceRoller: false` dans les préférences de tout le monde dès l'ouverture. Pour que le nouveau défaut s'applique, la préférence est **renommée** `diceRoller` (lecture : `prefs.diceRoller ?? true`, l'ancienne clé est ignorée puis supprimée à la première écriture). Conséquence assumée : un joueur qui avait masqué le lanceur le retrouve affiché une fois ;
- README : « Par défaut, l'outil lance les dés… Pour jouer avec tes vrais dés, appuie sur **Lanceur de dés** pour le masquer. »

### J.8 Shugenja en escarmouche : sorts avant les attaques

**Constat.** `buildActions`, cas `skirmish` : Initiative → armes → actions fixes → `skirmishSpellActions(c)` (« après les attaques », v2.12.0).

**Correctif** (shugenja seulement, les autres personnages ne changent pas) :
1. Initiative ;
2. **groupe « Sorts »** (`skirmishSpellActions`) ;
3. **groupe « Attaques »** : armes puis actions fixes (mains nues, lutte, Défense totale). Le titre de groupe n'est posé que si le personnage a des sorts, pour que le titre « Sorts » ne coiffe pas les armes.

Mettre à jour F.5 / F.11 (« groupe Sorts après les attaques » → avant) et les tests d'ordre (`core.slots.spec.ts`, `tests/ui/slots.spec.tsx`).

### J.9 Lanceur : retirer « Dés lancés ± »

**Constat.** Le champ « Dés lancés ± » (`opts.extraRolled`) fait doublon avec les bonus de jet et le bonus fixe. **Attention** : il sert aussi à transmettre les **augmentations de dégâts** de l'attaque au jet de dégâts (`store.ts`, `opts.extraRolled = pendingDamage.dice`, cas E7).

**Correctif.**
- retirer le champ de `.opts` dans `Roller.tsx` ; la grille garde ND, augmentations, augmentations gratuites et **Bonus fixe**, **libellés inchangés** (« Augm. libres » / « Augmentations », « Augm. gratuites », décision du 30/10/2026) (E13 : « Bonus fixe » seul sur sa ligne, sans case vide) ;
- **garder** `extraRolled` dans `RollOptions` et le moteur : il ne vient plus que de `pendingDamage` ;
- quand `extraRolled > 0`, l'afficher en lecture seule sous la réserve : « +n g0 · augmentations de l'attaque » (étiquette, comme les bonus) avec un bouton « Retirer » qui le remet à 0 ;
- la ligne « lancer à la main » (`Roller.tsx`, `extra`) garde son texte.

### J.10 Lanceur : Min · Moy. · Max centrés

**Constat.** Dans la ligne de statistiques du lanceur (`.statline`), quand les dégâts explosent sur 9 (Kenjutsu ou Armes lourdes 7), la case Max contient l'étiquette « 9+ ». Or la règle `.statline span` s'applique **aussi** à cette étiquette imbriquée (fond, `padding: 4px 9px`) : la case Max grandit, les cases voisines s'étirent à sa hauteur (`align-items: stretch` par défaut) et leur texte reste collé en haut. Min et Moy. ne sont donc plus centrés verticalement.

**Correctif** (`styles.css`) :
- restreindre la règle aux cases : `.statline > span { … }` au lieu de `.statline span`, pour que l'étiquette « 9+ » garde le style `.tag` ;
- centrer le contenu de chaque case : `.statline > span { display: inline-flex; align-items: center; gap: 4px }` ; les cases gardent la même hauteur.

Vaut pour tous les lanceurs (compétences, dégâts, sorts) et pour la case « Réussite ».

### J.11 Tests du lot 20

| ID | Cas | Attendu |
|---|---|---|
| Q1 | 390 px, bloc Armes en Edit, arme « Katana » | Une carte par arme ; Nom, Compétence, VD visibles en entier (largeur du texte ≤ largeur du champ) ; champs à 16 px ; pas de défilement horizontal |
| Q2 | 390 px, effacer le nom, le VD et les mots-clés d'une arme | Chaque champ se vide entièrement ; le VD vide est accepté pendant la saisie |
| Q3 | Arme sans mot-clé `arc` | Pas de champ « Force de l'arc » ; présent pour un Yumi |
| Q4 | Bloc Identité, lecture et Edit | Valeurs numériques en `--f-mono` au même corps que les autres blocs ; Initiative en `.pool` ; placeholder du Rang d'école en `--f-body` (style calculé) |
| Q5 | Bloc Techniques en Edit | Bouton « + Technique / kata » ; aucun texte « sort » dans le bloc |
| Q6 | Menu « Modèle de bonus » | 4 groupes (Avantage, Désavantage, Technique, Autre) ; aucune entrée nommée d'après le livre ; `NAMED_MODIFIERS` absent du code |
| Q7 | Ajouter le modèle « ND augmenté sur les jets sociaux » | Bonus `source: disadvantage`, `appliesTo: social`, `tn: 5`, nom vide avec placeholder ; un jet d'Étiquette a son ND +5 |
| Q8 | Import d'une fiche avec un bonus créé depuis l'ancien catalogue | Bonus conservé tel quel, toujours appliqué |
| Q9 | Bibliothèque : les 3 modèles | 3 boutons ; chaque fichier téléchargé se réimporte en « Nouvelle fiche » sans erreur ; le shugenja a 2 sorts et l'école Tamori, la courtisane l'école Doji et 2 bonus |
| Q10 | Panneau Vide | Menu déroulant (variante Avec effets), pas de « i » ; choisir une option ne dépense rien ; « Dépenser » sur « Au jet » coche le Vide du lanceur et l'étiquette apparaît dans l'en-tête ; « Annuler » la retire |
| Q11 | Panneau Vide hors escarmouche (duel) | Options Initiative et Échanger absentes |
| Q12 | Première ouverture (préférences vides) | Lanceur affiché : bouton « Lancer » présent |
| Q13 | Préférences v2.16.0 avec `showDiceRoller: false` | Lanceur affiché ; masqué puis rechargé : reste masqué |
| Q14 | Escarmouche, shugenja (fiche exemple) | Ordre : Initiative, titre « Sorts », sorts, titre « Attaques », armes, actions fixes |
| Q15 | Escarmouche, bushi | Ordre inchangé (Initiative, armes, actions fixes), aucun titre de groupe |
| Q16 | Lanceur sur une compétence | Pas de champ « Dés lancés ± » |
| Q17 | Attaque réussie avec 2 augmentations de dégâts, puis Dégâts (E7) | Réserve de dégâts +2g0 ; étiquette « +2g0 · augmentations de l'attaque » ; « Retirer » la ramène à la réserve de base |
| Q18 | Non-régression | `core.rules.spec.ts` inchangé et vert ; tests existants modifiés listés dans la PR (E12, E13, E15, ordre des sorts, catalogue de bonus, exemple de fiche) |
| Q19 | Lanceur sur Dégâts · Katana avec Kenjutsu 7 (étiquette « 9+ ») | Min, Moy., Max et Réussite de même hauteur ; le centre vertical du texte de chaque case est au centre de la case (± 1 px) ; « 9+ » a le style `.tag` |

### J.12 Documents à mettre à jour dans la même PR
- `HANDOFF.md` : §3 (préférence `diceRoller`, affichée par défaut), §6.2 (lanceur affiché par défaut), §10 (E12, E13, E15 réécrits), annexe B (*Saisie*), annexe F (ordre des sorts en escarmouche), §11 point 20 « livrée », J.14 écarts de mise en œuvre ;
- `README.md` : lanceur de dés, bonus de jet, modèles de fiche ;
- `CHANGELOG.md` : entrée `[2.17.0]` (Ajouté : modèles shugenja et courtisan, modèles de bonus par source ; Modifié : lanceur affiché par défaut, panneau Vide, sorts avant les attaques, bloc Armes en Edit ; Corrigé : Min et Moy. centrés dans le lanceur ; Retiré : catalogue nommé des bonus, champ « Dés lancés ± ») ;
- `CONTRIBUTING.md` : point 11 (traductions) non ajouté, la localisation étant reportée.

### J.14 Écarts de mise en œuvre (v2.17.0)
- **J.1** : chaque carte est un groupe « Arme : <nom> » (« Arme : sans nom » tant que le nom est vide) ; ses champs portent leur libellé visible (Nom, Compétence, VD, Force de l'arc, Mots-clés). « Force de l'arc » suit `isRanged(w)`, qui couvre déjà le mot-clé `arc`. `CatalogGap` reste aussi sous l'arme en lecture (mode modification), comme avant.
- **J.2** : relevé sur captures. Écarts trouvés : `.kv b` en mono **18 px** (contre 15 px pour `.cstats b`, les tableaux et `.pool`) ; Initiative en mono noir au lieu de `.pool` ; placeholder du Rang d'école en mono. Corrigé : `.kv b` passe à 15 px (même corps que `.cstats b`), Initiative en `.pool`, `input.in[type=number]::placeholder` en `--f-body`. Le titre du bloc était déjà un `h2` en `--f-display`.
- **J.4** : le groupe **« Autre »** (Bonus libre) est placé **en tête** du menu, puis Avantage, Désavantage, Technique. Le placeholder du nom vient de `MODIFIER_NAME_PLACEHOLDERS[source]` (le champ `placeholder` des modèles en est tiré) : il suit la source si le joueur la change. L'option d'un modèle situationnel ajoute « · au choix » à son effet. « Bonus libre » a la source `other` (auparavant `technique`).
- **J.5** : les trois boutons sont dans un groupe accessible « Modèles de fiche (JSON) ». `EXAMPLES[].build()` (au lieu de `exampleCharacter()`).
- **J.6** : le panneau est un groupe « Dépenser du Vide » ; le menu s'appelle « Dépense de Vide ». `voidChoice` revient à « Au jet » au changement de type de combat si l'option n'existe plus ; une option absente retombe aussi sur « Au jet » à l'affichage. `InfoPanel` perd `"void"`.
- **J.7** : `PrefsStore.set` supprime les clés passées à `undefined` (`mergePrefs`) : chaque écriture des préférences retire `showDiceRoller`.
- **J.8** : le titre « Attaques » est posé sur toutes les armes et actions fixes d'escarmouche (dégâts compris), seulement si le personnage a des sorts.
- **J.9** : l'étiquette « +n g0 · augmentations de l'attaque » et son bouton « Retirer » sont sous la réserve, avant les étiquettes de technique. Sans augmentations mais avec un ND, ND et Bonus fixe sont côte à côte (l'ancienne case d'alignement vide est retirée).
- **Tests existants modifiés** (Q18) : E12, E13 (×2), E15 (unitaires et e2e), M10 et M14 (e2e mobile), « Nouveau round » (repère du panneau Vide), ordre des sorts (`core.slots.spec.ts`), catalogue de bonus (`core.modifiers.spec.ts`, `core.lot12.spec.ts` L21 et Seuil de douleur bas avec des bonus saisis, `tests/ui/modifiers.spec.tsx`), exemple de fiche (`tests/ui/import.spec.tsx`), champs d'arme (E25, Mots-clés d'arme, parcours mobile), dépenses de Vide (F3, consultation, Shiba 5 via `tests/helpers/void.ts`), et les clics « Lanceur de dés : masqué » devenus inutiles (ou inversés pour les parcours aux vrais dés). `core.rules.spec.ts` inchangé.
- **Nouveaux tests** : `tests/ui/lot20.spec.tsx` (Q1 à Q5, Q14, Q15), `tests/e2e/lot20.spec.ts` (Q4, Q19), Q1 dans `tests/e2e/mobile.spec.ts`, Q6 à Q13, Q16, Q17 dans les suites existantes.

### J.13 Points ouverts (à trancher par Nelson)

| # | Point | Défaut si non tranché |
|---|---|---|
| P-J1 | Panneau Vide : dépense par menu + bouton (deux gestes) | Défaut retenu (J.6) : choisir ne dépense jamais par erreur. Alternative : menu seul, la dépense ponctuelle demandant une confirmation. |
| P-J2 | Police d'Identité : quel élément t'a gêné (lecture ou Edit, valeurs, Initiative, Rang d'école) ? | Règle de J.2 appliquée à tout le bloc |
| P-J3 | Lanceur réaffiché une fois pour ceux qui l'avaient masqué (J.7) | Accepté |
| P-J4 | Escarmouche d'un shugenja : titre « Attaques » sur les armes et actions fixes | « Attaques » |

---

### Note : localisation reportée
L'ancienne annexe J (lot 20, français + anglais, `src/i18n`, tests I1 à I13, points P-J1 à P-J4 sur les langues) est retirée du plan le 30/10/2026. Si elle revient, elle repart de `handoff/handoff-lots-15-17.md` (lot 17 d'origine, projet claude.ai) avec de nouveaux numéros de lot, d'identifiants de test et de points ouverts.

