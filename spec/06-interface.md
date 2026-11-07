## 6. Interface (`src/ui`)

### 6.1 Écrans
| Écran | Contenu |
|---|---|
| **Bibliothèque** (écran d'accueil s'il n'y a aucune fiche, sinon accessible par l'en-tête) | Liste des fiches locales : nom, clan (pastille de couleur), école, date, badge « Consultation » pour les fiches en lecture seule. Actions : Ouvrir, Importer un JSON, Supprimer (avec confirmation intégrée à la page). **Vide** (v2.19.0, annexe L.3) : « Pas encore de personnage ? » avec deux options (Forger sur le portail, Fiche vierge), cartes **Modèles de personnage** (Utiliser, JSON) et lien « Découvrir la campagne ». **Avec fiches** (L.4) : carte « Un nouveau personnage ? » sous la liste (Forge, Nouvelle fiche, modèles). |
| **Fiche** | Comme le prototype (§6.2). Dans **Rouleaux & invocations** en édition : panneau **« Ajouter depuis le grimoire »** et état du grimoire (v2.22.0, annexe N.5) ; autocomplétion du nom de chaque sort (v2.23.0, annexe N.8). |
| **Aide de jeu** | Comme le prototype (§6.2), avec la situation **Cour** en plus (annexe D.8). |
| **Statistiques** | Tableau des chances de réussite de tous les jets (§6.2). Troisième vue, à côté de Fiche et Aide de jeu (v2.1.2). |

**Fiches en consultation** :
- aucun champ éditable, pas de bouton « Modifier » ;
- les pastilles de Vide et les blessures ne sont pas cliquables ;
- le lanceur de dés reste utilisable mais ne dépense rien ;
- le bouton « Rendre modifiable » crée une **copie** éditable.

### 6.2 Comportement à reproduire du prototype
- **En-tête** :
  - **sceau 帳** de l'outil à gauche, qui ouvre aussi la Bibliothèque, et surtitre « CARNET DE ROKUGAN | ● CLAN … » au-dessus du nom (annexe G) ; le nom du clan est un lien vers sa page sur le portail de campagne quand elle existe (v2.20.0, annexe L.7) ;
  - famille, école et Rang dessous ;
  - bouton de thème (auto, clair, sombre) ;
  - **bascule de langue** `FR | EN`, à part des boutons d'action (annexe 58) : les deux langues visibles, l'active surlignée (`aria-pressed`) ; groupe « Langue » / « Language », chaque bouton nommé dans sa propre langue (« Français », « English », attribut `lang`) ; un clic sur la langue active ne fait rien. Sur bureau, coin haut droit de l'en-tête, précédée d'une icône globe, avec ou sans fiche ; le bloc sceau + nom lui réserve sa largeur à droite. Choix mémorisé dans `localStorage["carnet-lang"]` ; sans choix, `navigator.language` (`en*` → anglais, sinon français). Le changement met à jour `<html lang>`, le titre de l'onglet et la description de la page (annexe 52.2, emplacement : annexe 58) ;
  - **boutons d'en-tête** Bibliothèque, Lanceur de dés, Thème et **Ressources** (v2.19.0, annexe L.2 : menu de liens vers le portail de campagne, sur tous les écrans) : chacun = **icône + texte** sur bureau (livres, dé, demi-cercle, torii), **icône seule** sur mobile (§7) ; le texte reste présent pour les lecteurs d'écran et en info-bulle, avec l'état courant (« Thème : sombre », « Lanceur de dés : masqué ») ;
  - bouton **« Lanceur de dés : masqué / affiché »**, à côté du thème et de la Bibliothèque (même style ; fond d'accent pâle quand affiché). **Affiché par défaut** (v2.17.0, annexe J.7), choix mémorisé dans les préférences :
    - **masqué** : le panneau d'action reste un panneau d'aide (réserve, ligne « lancer à la main », Min · Moy. · Max, chance de réussite, ND final, options, manœuvres) mais **sans** bouton « Lancer », sans dés obtenus, sans verdict et sans historique. Les enchaînements qui dépendent d'un lancer (score d'initiative affiché, bonus de Défense totale, dés de dégâts pré-remplis) ne se déclenchent pas ; les dépenses de Vide se font par les pastilles et le panneau Vide ;
    - **affiché** : le bouton « Lancer » et les résultats apparaissent dans tous les lanceurs (Enquête, Cour, Déplacement, Combat) ;
    - le changement s'applique immédiatement, sans recharger ;
  - onglets Fiche, Aide de jeu et Statistiques (dans la barre du bas sur mobile, §7).
- **Barre d'état collante** :
  - piste des 8 niveaux de blessure, avec le niveau courant. Aucun libellé n'y est coupé : trois niveaux y sont abrégés (« Égrat. », « Grav. », « HdC », champ `short` de `WOUND_LEVELS`, 6 caractères au plus), le nom complet reste en infobulle et pour les lecteurs d'écran. Le résumé, le détail déplié et la tuile Blessures gardent les noms complets. Entre 721 et 1179 px, la piste prend sa propre ligne au-dessus des tuiles (annexe 45) ;
  - compteur −/+ ;
  - pastilles de Vide cliquables ;
  - quatre **tuiles compactes** (petit libellé au-dessus, valeur en chiffres) : **Dépl.** (action libre / action simple, ex. « 10/20 pi »), **ND armure**, **Réduction**, **Pénalité** (bordure et chiffre rouges dès que la pénalité dépasse 0). Jamais une ligne de texte unique : elle serait tronquée sur mobile.
  - les tuiles **ND armure** et **Réduction** sont cliquables, avec le même aspect que les autres tuiles (ni crayon ni pointillés ; bordure d'accent seulement quand l'éditeur est ouvert) : un appui ouvre sous les tuiles un **éditeur d'armure** avec trois champs, Armure (nom), Bonus au ND et Réduction. Il affiche aussi la formule « ND d'armure = 5 × Réflexes + 5 + bonus = N » et un bouton Fermer. Les valeurs sont enregistrées comme toute modification de la fiche. Le ND d'armure lui-même reste calculé (Réflexes + bonus + posture + Vide) et ne se saisit pas directement. Éditeur absent pour une fiche en consultation.
- **Fiche** :
  - Anneaux et Traits ;
  - identité et réputation ;
  - compétences avec leur réserve ;
  - armes avec les réserves d'attaque et de dégâts ;
  - techniques ;
  - avantages, désavantages, notes.

  Chaque bloc a son bouton « Edit » (« Terminer » pendant l'édition) ; plusieurs blocs peuvent être ouverts ensemble (annexe E.9 S2). Une fiche créée s'ouvre avec le bloc Identité en édition.
- **Aide de jeu** :
  - Enquête / Cour / Déplacement / Combat, avec en Combat les sous-types Escarmouche, Duel iaijutsu et Bataille (Statistiques est une vue à part, voir plus bas) ;
  - en Déplacement, un **encart « Se déplacer en combat »** en tête de liste : trois tuiles (action libre, action simple, maximum par round) en pieds et en mètres, calculées depuis l'Anneau d'Eau, avec un choix de terrain Normal / Modéré / Difficile (Anneau d'Eau −0 / −1 / −2, 1 au minimum, annexe E.2 C4) ;
  - en Escarmouche : carte **Initiative** en premier (elle affiche le score, et « Nouveau round » ne la réinitialise pas), puis la carte **Nouveau round** (bouton et description courte : « Efface le Vide en armure et la Défense totale ; garde l'initiative et les compteurs. », deux lignes au plus sur mobile ; présente dans tous les types de combat), puis Posture (sauf en Duel), puis le panneau Vide, puis les actions.
- **Lanceur** :
  - réserve en grand, et juste dessous la ligne **Min · Moy. · Max** (« Max 30+ » si la réserve explose) et la **chance de réussite** contre le ND final quand il y en a un. Elle se recalcule à chaque option (augmentations, Vide, spécialisation, bonus fixe) ;
  - juste sous la réserve, une ligne **« lancer à la main »** (avant Min · Moy. · Max) qui donne les règles de relance pour jouer avec de vrais dés (pas de phrase « Lance N dés, garde K » : le XgY suffit) :
    - la règle d'explosion applicable : « Les **10** explosent : relance le dé et additionne, tant qu'il retombe sur 10. », ou « Les **9 et 10** explosent… » en cas de maîtrise, ou « Aucun dé n'explose (compétence non maîtrisée). » ;
    - « Spécialisation : relance une fois chaque **1**. » si une spécialisation est choisie (liste des spécialisations de la compétence, ou case si elle n'en a pas, annexe D-c) ;
    - « Ajoute **+N** au total » si bonus fixe ou règle des dix dés (« dont règle des dix dés ») ;
    - elle se met à jour avec chaque option (Vide, dés ±, posture, maîtrise) ;
  - ND de base selon l'action ;
  - augmentations libres et gratuites ;
  - dés ± et bonus fixe ;
  - **disposition des options** en grille de 2 colonnes **sans case vide** : quand une action n'a ni ND ni augmentations (dégâts, initiative), « Dés lancés ± » et « Bonus fixe » partagent la même ligne. Une cellule vide n'est insérée que pour aligner un ND sans augmentations (jet sans compétence) ;
  - cases Vide, Spécialisation (cochée automatiquement si elle correspond) et Vide-compétence ;
  - manœuvres, sur les attaques ;
  - nombre d'augmentations annoncées / maximum ;
  - ND final détaillé ;
  - dés obtenus (gardés mis en évidence, explosions marquées) ; un dé qui a explosé affiche **sous son total le détail des tirages** (« 13 » avec « 9+4 » en petit), visible sans survol, donc aussi sur mobile ;
  - verdict, marge, augmentations possibles ;
  - historique des 6 derniers jets.
- **Statistiques** (troisième vue, à côté de Fiche et Aide de jeu : dans l'en-tête sur bureau, dans la barre du bas sur mobile ; écran pleine largeur, sans lanceur) : tableau de tous les jets du personnage. Colonnes : Jet, Réserve, Min, Moy., Max, puis chance de réussite contre ND 10, 15, 20, 25, 30 et 40.
  - Lignes : Initiative ; pour chaque arme, l'attaque puis les dégâts en sous-ligne (└) ; puis les compétences triées par nom.
  - Les jets sans ND (dégâts, initiative) affichent « sans ND » à la place des pourcentages.
  - Cellules teintées en vert proportionnellement à la chance de réussite.
  - Trois cases à cocher : « Avec un point de Vide », « Spécialisations appliquées » (cochée par défaut), « Pénalité de blessure actuelle » (cochée par défaut).
  - Mention : chaque augmentation ajoute +5 au ND, il suffit de lire une colonne plus à droite. Sur mobile, le tableau défile horizontalement dans son cadre.
- **Détails repliables (« i »)** (depuis le lot 19, le panneau Posture est un menu déroulant sans « i », description toujours affichée, annexe I.3.4) :
  - les boutons du panneau **Dépenser du Vide** n'affichent que leur titre ;
  - **un seul** petit bouton rond « i » par panneau, placé dans l'en-tête à côté du titre (« Dépenser du Vide i » ; pas de compteur « reste » dans cet en-tête, les points de Vide restants sont dans la barre d'état ; en-tête sur une seule ligne, y compris sur mobile) ; il déplie ou replie **toutes** les descriptions du panneau à la fois, sans rien sélectionner ;
  - le « i » est rempli en couleur d'accent quand les détails sont ouverts ; les panneaux sont indépendants ;
  - l'encart **Se déplacer en combat** affiche par défaut seulement les trois distances en pieds ; son « i », à côté du titre, déplie les mètres, les formules et le rappel « terrain difficile » ;
  - l'état ouvert ou fermé reste en mémoire de l'onglet (non persisté). Accessibilité : `aria-expanded` et libellé « Afficher / Masquer le détail : <panneau> ». Zone de toucher d'au moins 40 px (pseudo-élément étendu).
- **Vue compacte des actions** (v2.28.0, annexe 46) : la liste des actions de l'Assistant a un titre **Actions** dans chaque situation, suivi d'un « i » au même rendu que ceux des panneaux.
  - « i » plein (défaut) : explications affichées ; « i » vide : vue compacte, avec la mention « explications masquées » à sa droite. `aria-pressed` = explications affichées ; nom et `title` « Explications des actions ».
  - En vue compacte, une carte de jet non choisie n'a plus de description (non rendue) et un padding vertical de 7 px ; « Attaque : Action simple » passe sur la ligne du titre. La carte choisie, les cartes bloquées (raison et « Lancer quand même ») et les cartes info sont inchangées, de même que les panneaux Posture, Vide et Nouveau round.
  - Réglage d'appareil, conservé au changement de fiche et mémorisé dans les préférences (`compactActions`, §3).
- **Arbre attaque → dégâts** : chaque carte « Dégâts » est rattachée à son attaque (champ `parent` de l'action). Elle est affichée juste sous cette attaque, décalée d'environ 26 px, avec un connecteur en coude (└). Son titre garde l'arme : « Dégâts · Katana ». Le connecteur passe en couleur d'accent quand des dés de dégâts sont en attente pour ce parent, avec la mention « +Ng0 en attente ». Concerne : armes, mains nues, et Frappe → Dégâts en duel.
- **Enchaînements** :
  - une attaque réussie avec « Augmentation des dégâts » × N pré-remplit +N dés au jet de dégâts suivant ;
  - une Défense totale lancée met à jour la posture et le ND d'armure.

### 6.3 Qualité
- Aucun texte saisi n'est rendu en HTML (pas de `dangerouslySetInnerHTML`).
- Aucun texte d'interface en dur dans un composant : libellés, `aria-label`, `title`, `placeholder` viennent de `useT()` (annexe 50). Dates et nombres suivent `useLocale().intl`. En anglais : réserves en `XkY` (`formatPool`), distances en pieds (`formatDistance`), `50%` sans espace ; en français, comportement inchangé (annexe 52.3). Les saisies acceptent `3g2` et `3k2` dans les deux langues. Le grimoire et le portail, en français, sont signalés comme tels en anglais (annexe 52.4). `scripts/check-i18n.mjs` refuse tout texte JSX brut dans `src/ui` depuis le lot 51 (annexe 51.3).
- Focus clavier visible, Échap ferme le panneau mobile, `prefers-reduced-motion` respecté.
- Aucun appel réseau : polices embarquées, aucune bibliothèque chargée depuis un CDN. Exceptions sur un clic du joueur : le grimoire du portail (annexe N) et l'envoi du formulaire Contact (annexe 56).
- Fenêtres modales (`Modal`, imports et Contact) : Échap, clic sur le fond, focus piégé dans la fenêtre et rendu à l'élément d'origine à la fermeture (annexe 56.2).

### 6.4 Thème et couleurs
> **Remplacé au lot 17 (v2.14.0) par l'annexe I.1** (jetons, accents lisibles, couleurs sémantiques, Android), livré : l'annexe I.1 fait foi, cette section décrit l'état v2.13.

- Couleurs uniquement en variables CSS.
- Clair écru : fond `#ece6d8`, surface `#f7f3ea`, encre `#2a261f`.
- Sombre anthracite : fond `#25272a`, surface `#2f3236`, encre `#e7e5e0`.
- Mode auto selon `prefers-color-scheme` ; choix forcé via `data-theme` sur `<html>`, mémorisé.
- Accent = clan :

| Clan | Clair | Sombre |
|---|---|---|
| Crabe | `#3d5a73` | `#8fb0cc` |
| Grue | `#2f7fb5` | `#8cc4ea` |
| Dragon | `#2f7a45` | `#7fcb93` |
| Licorne | `#6b3fa0` | `#bb9ae6` |
| Lion | `#a87b0c` | `#e6bf55` |
| Mante | `#1f8073` | `#6fd0c1` |
| Phénix | `#c25a14` | `#f0a066` |
| Scorpion | `#a82828` | `#f07a7a` |
| Araignée | `#4a4a4a` | `#b5b5b5` |
| Familles impériales | `#8a6d12` | `#dcc06a` |
| Clan non reconnu | `#7a6a3a` | `#cdb67a` |

- Reconnaissance du clan sans accents ni casse ; les noms anglais sont acceptés (crab, crane, unicorn, mantis, phoenix, spider).
- Les couleurs des Anneaux sont fixes.
- Polices : Shippori Mincho B1 (titres), Zen Kaku Gothic New (texte), JetBrains Mono (chiffres), embarquées en `woff2` (licence OFL, citées dans `docs/CREDITS.md`).

---

