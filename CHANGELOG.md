# Journal des modifications

Toutes les évolutions notables du Carnet de Rokugan sont notées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le [versionnement sémantique](https://semver.org/lang/fr/). Le détail de chaque version est dans l'annexe correspondante de [`HANDOFF.md`](HANDOFF.md).

## [Non publié]

## [2.20.2] - 2026-10-30

### Modifié
- Documentation : README raccourci avec captures, guide détaillé dans docs/GUIDE.md, crédits dans docs/CREDITS.md.

## [2.20.1] - 2026-10-30

### Corrigé
- Bibliothèque vide : les deux options (Forger sur le portail, Fiche vierge) alignent leurs étapes et leurs boutons ; les six cases d'étapes ont la même taille, même quand une description passe sur deux lignes.

## [2.20.0] - 2026-10-30

### Ajouté
- Le nom du clan, dans l'en-tête, ouvre la page du clan sur le portail de la campagne (8 Grands Clans).
- Bloc Rouleaux & invocations : lien « Grimoire » dans le titre et, pour chaque sort, un lien qui ouvre le grimoire du portail avec le nom du sort en recherche.
- Aide de jeu : encadré de liens vers le portail, au-dessus du lanceur (sous les actions sur mobile) : Mémento de combat en Combat ; Étiquette & coutumes et Bushido & honneur en Cour.

## [2.19.0] - 2026-10-30

### Ajouté
- Bouton **Ressources** dans l'en-tête, sur tous les écrans : liens vers le portail de la campagne (portail, page du clan de la fiche, Forge de personnage, Grimoire, Mémento de combat, Bushido & honneur, Étiquette & coutumes). Menu déroulant sur bureau, panneau glissant depuis le bas sur mobile. Simples liens ouverts dans un nouvel onglet : aucune requête réseau.
- Bibliothèque vide : deux façons de commencer, **Forger sur le portail** ou **Fiche vierge**, chacune en trois étapes ; lien « Découvrir la campagne ».
- Cartes **Modèles de personnage** (type, nom, clan et Rang lus dans la fiche) : **Utiliser** crée et ouvre une fiche, **JSON** télécharge le fichier.
- Bibliothèque avec fiches : carte « Un nouveau personnage ? » sous la liste (Forge, fiche vierge, modèles).

### Modifié
- Le bouton « Nouvelle fiche » quitte l'en-tête de la liste pour la carte « Un nouveau personnage ? ».
- « Créer mon personnage » devient « Nouvelle fiche vierge » ; la ligne « Modèles de fiche (JSON) » est remplacée par les cartes de modèles.

## [2.18.0] - 2026-10-30

### Ajouté
- Points d'Insight calculés dans le bloc Identité : Anneaux × 10 plus les rangs de compétence, avec le Rang d'Insight correspondant (`125 · Rang 1`).
- Champ facultatif « Bonus d'Insight (MJ) » (`insightBonus` dans le JSON) pour les points accordés hors calcul.
- Étiquette d'avertissement quand le Rang d'Insight saisi diffère du calcul ; le rang saisi reste celui de tous les calculs.

## [2.17.0] - 2026-10-30

### Ajouté
- Modèles de fiche **shugenja** (Tamori) et **courtisan** (Doji) dans la Bibliothèque, à côté du modèle bushi.
- Modèles de bonus de jet par source (avantage, désavantage, technique, autre) : des formes d'effet sans nom, à compléter.

### Modifié
- Le lanceur de dés est affiché par défaut ; un joueur qui l'avait masqué le retrouve affiché une fois.
- Panneau « Dépenser du Vide » en menu déroulant, comme le panneau Posture : choisir une dépense ne dépense rien, un bouton la confirme ou l'annule.
- En escarmouche, les sorts d'un shugenja passent avant les attaques (groupes « Sorts » puis « Attaques »).
- Bloc Armes en modification : une carte par arme, champs lisibles en entier sur mobile ; « Force de l'arc » pour les armes à distance seulement.
- Bloc Identité : valeurs au même corps que les autres blocs, Initiative à la couleur des réserves.
- Bouton « + Technique / kata » (les sorts ont leur bloc).

### Corrigé
- Min et Moy. centrés verticalement à côté de Max dans le lanceur, même avec l'étiquette « 9+ ».

### Retiré
- Catalogue nommé des bonus de jet (Force de la Terre, Aspect dérangeant, Seuil de douleur bas) ; les bonus déjà créés restent dans les fiches.
- Champ « Dés lancés ± » du lanceur ; les augmentations de dégâts de l'attaque s'affichent en étiquette.

## [2.16.0] - 2026-10-30

### Modifié
- Listes déroulantes stylées dans les navigateurs qui le permettent (Chrome, Edge, Chrome Android) : menu surélevé aux couleurs du thème, option choisie à la couleur du clan. Ailleurs, la liste native reste.
- Choix d'un Anneau (affinité, élément d'un sort, Anneau du jet) avec le kanji dans un ensō à la couleur de l'Anneau, et ses Traits.
- Techniques d'école groupées par clan, avec la classe et la technique de rang 1 de chaque école.
- Panneau Posture : un menu déroulant remplace les boutons ; chaque posture montre ses effets en étiquettes et sa description, et celle de la posture choisie reste affichée sous le menu. Le bouton « i » du panneau disparaît.

## [2.15.0] - 2026-10-30

### Modifié
- Bloc Anneaux de la fiche à l'encre et au pinceau : liseré en coup de pinceau, valeur de l'Anneau dans un ensō, kanji de l'Anneau en filigrane (土 水 火 風 空), à la couleur de chaque Anneau dans les deux thèmes.

## [2.14.0] - 2026-10-30

### Modifié
- Couleurs en jetons : fond sombre réchauffé (anthracite chaud), surfaces surélevées (`--surface-2`) pour le lanceur mobile, l'import et les éditeurs de la barre d'état.
- Accent de clan lisible : tout texte en couleur de clan utilise une teinte assombrie (clair) ou éclaircie (sombre), au moins 4,5:1 pour les onze accents.
- Couleurs d'état indépendantes du clan : danger (blessure, erreur), réussite et avertissement (augmentations au-delà du Vide, conflit de fichier lié). Un personnage Scorpion indemne n'a plus l'air blessé.
- Les boutons pleins à la couleur du clan portent un texte lisible dans les deux thèmes.

### Ajouté
- Android : barre de Chrome à la couleur du thème, contrôles natifs assortis, aucun flash du mauvais thème au chargement.
- Tests de contraste et lint des couleurs littérales (N1 à N12).

## [2.13.3] - 2026-10-30

### Corrigé
- Valeurs de dégâts toujours affichées en `XgY` (fiche, aide de jeu, lanceur), même saisies ou stockées en `XkY` ; catalogue d'armes livré en `g`.
- Suppression depuis le bloc Identité : même confirmation que dans la Bibliothèque (« Supprimer définitivement », « Annuler »).
- En consultation, les boutons sans effet (« Réussi » / « Raté » d'un sort, « Réussi » de la méditation) ne sont plus affichés.
- « Rang d'Insight » remplace « Rang (Insight) » dans le bloc Identité.

## [2.13.2] - 2026-10-29

### Ajouté
- Fichiers du dépôt : licence MIT, guide de contribution, code de conduite, politique de sécurité, ce journal.
- Modèles d'issue (bug, règle à vérifier, idée) et de PR, mises à jour Dependabot mensuelles, `.editorconfig`.
- Badges CI, release et licence dans le README ; section « Contribuer ».

## [2.13.1] - 2026-10-28

### Modifié
- Le bouton Bibliothèque reste affiché à côté du sceau.

## [2.13.0] - 2026-10-28

### Ajouté
- Nom de l'outil dans l'en-tête : sceau 帳 qui ouvre la Bibliothèque, surtitre.
- Titre d'onglet qui suit la fiche ouverte, favicon.

## [2.12.0] - 2026-10-28

### Ajouté
- Emplacements de sorts par élément dans la barre d'état.
- Sorts utilisables en combat.

## [2.11.0] - 2026-10-28

### Ajouté
- Situation Magie et lanceur de sort.

## [2.10.0] - 2026-10-28

### Ajouté
- Écoles de shugenja et leurs techniques.

## [2.9.0] - 2026-10-28

### Ajouté
- Bloc Rouleaux & invocations sur la fiche.

## [2.8.0] - 2026-10-25

### Ajouté
- Bloc Armure sur la fiche.

### Modifié
- Retouches d'interface.

## [2.7.0] - 2026-10-25

### Ajouté
- Bataille de masse.

## [2.6.0] - 2026-10-25

### Modifié
- Vocabulaire aligné sur l'édition française du livre.

## [2.5.0] - 2026-10-25

### Ajouté
- Récupération : « Nouvelle journée », Méditation, multiplicateur de blessures.

## [2.4.0] - 2026-10-25

### Ajouté
- Maîtrises de compétence.
- Catalogue d'armures.

## [2.3.0] - 2026-10-25

### Ajouté
- Combat complet : posture Centre, restrictions de posture, Vide en combat, encaissement des dégâts.

## [2.2.0] - 2026-10-24

### Corrigé
- Règles vérifiées sur le livre (Feinte, Centre, Vide, duel, catalogue d'armes, maîtrises de compétences martiales).

### Modifié
- Retouches d'interface.

## [2.1.2] - 2026-10-24

### Modifié
- Statistiques deviennent une vue à part.
- Les quatre onglets de situation tiennent sur une ligne à 360 px.

## [2.1.1] - 2026-10-24

### Ajouté
- Carte « Nouveau round » entre l'Initiative et la Posture.

### Corrigé
- Test du fichier lié rendu robuste.

## [2.1.0] - 2026-10-24

### Ajouté
- Techniques des courtisans et de Shosuro (12 écoles).
- Situation Cour, spécialisation choisie au lanceur.

## [2.0.0] - 2026-10-21

### Ajouté
- Techniques d'école bushi (14 écoles) : effets automatiques et à cocher, mots-clés d'arme, rappels.

### Modifié
- Format de fiche v2, avec migration automatique des fiches v1.

## [1.1.0] - 2026-10-20

### Ajouté
- Règle des dix dés du livre, maîtrise au rang 7.
- Détails repliables « i », éditeur d'armure depuis la barre d'état, option « Lanceur de dés ».

### Modifié
- Boutons d'en-tête en icônes sur mobile.

## [1.0.0] - 2026-10-18

### Ajouté
- Fiche de personnage et aide aux jets Roll & Keep par situation, bureau et mobile.
- Bibliothèque locale (IndexedDB), import et export JSON avec fusion, fichier lié.
- Bonus de jet : techniques, avantages et désavantages.
- Publication sur GitHub Pages et en release (fichier HTML unique).

[Non publié]: https://github.com/nelsio/carnet-l5r/compare/v2.20.2...HEAD
[2.20.2]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.20.2
[2.20.1]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.20.1
[2.20.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.20.0
[2.19.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.19.0
[2.18.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.18.0
[2.17.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.17.0
[2.16.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.16.0
[2.15.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.15.0
[2.14.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.14.0
[2.13.3]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.13.3
[2.13.2]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.13.2
[2.13.1]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.13.1
[2.13.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.13.0
[2.12.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.12.0
[2.11.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.11.0
[2.10.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.10.0
[2.9.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.9.0
[2.8.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.8.0
[2.7.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.7.0
[2.6.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.6.0
[2.5.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.5.0
[2.4.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.4.0
[2.3.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.3.0
[2.2.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.2.0
[2.1.2]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.1.2
[2.1.1]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.1.1
[2.1.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.1.0
[2.0.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v2.0.0
[1.1.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v1.1.0
[1.0.0]: https://github.com/nelsio/carnet-l5r/releases/tag/v1.0.0
