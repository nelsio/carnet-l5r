## Annexe 62 — Lot 62 : noter un jet fait aux vrais dés (v2.34.0)

Un lot, une PR, une version (`handoff-lots-60-62.md`, demande du 12/11/2026, prototype `reference/prototype-saisie-resultat.html`). Elle remplace, pour le lanceur masqué, la phrase du §6.2 selon laquelle les enchaînements d'un lancer ne se déclenchaient pas.

### 62.1 Besoin

Lanceur de dés masqué, le joueur lance ses vrais dés : le score d'Initiative, le bonus de Défense totale et les dégâts pré-remplis ne suivaient pas. Il saisit maintenant le total obtenu ; le Carnet enchaîne exactement comme après **Lancer**.

### 62.2 Jets concernés

- **Initiative** : score affiché dans la carte Initiative ; Centre du round précédent et Vide d'Initiative ajoutés par `initiativeScore`.
- **Attaques** (armes, mains nues, lutte, Frappe du duel) : réussite ou échec contre le ND final ; si l'attaque touche, dés d'Augmentation des dégâts pré-remplis sur les dégâts liés, bonus de Feinte (moitié de l'excédent, plafond 5 × Insight), Désarmement (dégâts 2g1 sans la Force) ; réussite rattrapée sur le ND de base (Akodo R5).
- **Défense totale** : moitié du total (arrondie au supérieur) ajoutée au ND d'armure ce round, posture Défense totale.
- Inchangés, déjà couverts sans tirage : sorts (Réussi / Raté), Méditation (Réussi), Évaluation et Concentration du duel, jet et dés de blessures de la bataille. Aucun champ sur les compétences, traits et dégâts.
- Noter dépense ce que Lancer dépense (Vide coché, compétence au rang 1, techniques payées en Vide, Anneau d'Agasha) et consomme le bonus de Centre (`spendRollCosts`, `afterRoll`).

### 62.3 Interface

- Bloc `.manualroll` (« Ton jet aux vrais dés », `role="group"`) dans `Roller.tsx`, après la ligne ND final, lanceur masqué seulement, pour les jets de 62.2.
- Champ « Total » (`type="number"`, `inputmode="numeric"`, nom « Total obtenu aux dés », décrit par la liste) ; bouton « Noter le résultat » (`btn accent`), désactivé champ vide ; Entrée vaut un clic ; après validation, champ vidé et focus rendu.
- Liste « sert à la suite » (`ul.mr-use`) : une ligne par effet qui s'appliquera, plus « Le point de Vide coché est dépensé en notant. » si une dépense est cochée (absente en consultation : rien n'y est dépensé).
- Résultat : `RollOutcome`, sans rangée de dés et avec l'étiquette « saisi à la main » (`.tag.manual-tag`).
- Historique « Derniers jets » affiché aussi lanceur masqué dès qu'il contient un jet ; une ligne notée porte « ✎ » (nom « saisi à la main »).
- Le conteneur `aria-live` du résultat est sorti du bloc du lanceur : le défilement vers le résultat marche aussi lanceur masqué, sur mobile.
- Carte Initiative, lanceur masqué : « Clique pour saisir à nouveau si un nouveau combat commence » (`initiativeRolled(dice, manual)`).
- CSS : bloc « v2.34.0 » de `styles.css`, repris du prototype.

### 62.4 Mise en œuvre

- `Roller.tsx` : `record(result, manual)` commun à `roll()` et `note(total)` (`{ dice: [], total }`).
- `manualRollUses(c, a, maneuvers, at)` dans `src/ui/rolls.ts` : codes `initiative`, `attack`, `damageDice`, `feint`, `disarm`, `baseTn`, `fullDefense`, `voidSpend`, formatés par `src/i18n` (`roller.manualRoll.uses`). Liste vide : pas de bloc.
- `manual` sur l'action `rolled`, sur `RollRecord` et sur les lignes d'historique ; `correctable` sur `RollRecord`.
- **Correction** : un total noté de nouveau pour la même action, avant « Nouveau round », remplace la ligne d'historique, garde le Vide d'Initiative et ne dépense rien. « Nouveau round » ferme la correction : le total suivant est un nouveau jet.

### 62.5 Textes

`roller.manualRoll` (fr, en) : titre, champ, bouton, étiquette, lignes `uses` ; `aid.initiativeRolled` prend `manual`. Termes anglais alignés sur l'existant : « TN », « Armor TN », « Full Defense », « Feint », « Void Point », « pre-filled ».

### 62.6 Tests

- UI (`tests/ui/manual-roll.spec.tsx`) : MR1 à MR14 (Initiative et Centre, Vide d'Initiative gardé à la correction ; attaque et dégâts liés ; Feinte et plafond ; Désarmement ; Défense totale ; Vide débité une fois, de nouveau après « Nouveau round », jamais en consultation ; historique corrigé ; Akodo R5 ; bloc absent lanceur affiché, sur compétence, Méditation, dégâts et sort ; Entrée et focus ; liste qui suit les manœuvres ; pas de dés ; anglais).
- E2E (`tests/e2e/manual-roll.spec.ts`) : MR15 à 360 et 390 px (champ et bouton sur une ligne, 44 px, résultat visible dans la feuille du bas), MR16 Attaque puis Dégâts aux vrais dés.
- Mis à jour : E15 (`tests/ui/app.spec.tsx`), l'historique reste affiché lanceur masqué.

### 62.7 Documentation

- `docs/GUIDE.md` et `docs/GUIDE-en.md` § 6 : paragraphe « Dés de l'outil ou vrais dés ? » et capture `06b-vrais-des` (quatre sceaux) ; note sur les dégâts pré-remplis valable dans les deux cas.
- §6.2 « masqué » renvoie à cette annexe.

### 62.8 Écarts

- Correction limitée au round : le handoff ne fermait pas la correction ; sans cela, la même attaque notée au round suivant aurait remplacé la ligne d'historique et ignoré le Vide coché.
- `manualRollUses` reçoit les manœuvres et un objet `at` (ND final, ND de base rattrapable, dégâts liés, dépense cochée) calculé par le lanceur, au lieu de `ui` : ces valeurs dépendent des options du lanceur.
- Capture `06b-vrais-des` : le champ montre 31 (remis après « Noter », qui le vide) pour que la capture se lise.
