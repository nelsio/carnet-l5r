# Guide du Carnet de Rokugan

[← Retour au README](../README.md)

Ce guide se lit dans l'ordre la première fois, puis se consulte par section. Chaque section commence par l'essentiel ; le détail des règles est replié sous **« En détail »**, à ouvrir au besoin.

> Les résumés de règles sont **écrits pour l'outil** et restent **à vérifier dans ton livre**, qui fait foi.

**Démarrer**
1. [Le Carnet en 5 minutes](#1-le-carnet-en-5-minutes)
2. [Ouvrir le Carnet, en ligne ou hors ligne](#2-ouvrir-le-carnet-en-ligne-ou-hors-ligne)
3. [Créer ta fiche](#3-créer-ta-fiche)

**Jouer**

4. [Remplir et suivre ta fiche](#4-remplir-et-suivre-ta-fiche)
5. [L'Assistant L5R](#5-lassistant-l5r)
6. [Le lanceur](#6-le-lanceur)
7. [Shugenja : sorts et magie](#7-shugenja--sorts-et-magie)
8. [Écoles, maîtrises et bonus](#8-écoles-maîtrises-et-bonus)
9. [Statistiques](#9-statistiques)

**Garder et partager**

10. [Sauvegarder et changer d'appareil](#10-sauvegarder-et-changer-dappareil)
11. [Pour le MJ](#11-pour-le-mj)
12. [Langue, portail et confidentialité](#12-langue-portail-et-confidentialité)

Licences, polices et crédits : [CREDITS.md](CREDITS.md).

## 1. Le Carnet en 5 minutes

1. **Ouvre** https://nelsio.github.io/carnet-l5r/. Rien à installer, pas de compte.
2. **Crée ta fiche** dans la **Bibliothèque** : **Nouvelle fiche vierge**, un **modèle** (Bushi, Shugenja, Courtisan), une **photo de ta fiche papier** ou un JSON de la **Forge** ([§ 3](#3-créer-ta-fiche)).
3. **Remplis-la** : le bouton **Edit** de chaque bloc passe en saisie, **Terminer** repasse en lecture ([§ 4](#4-remplir-et-suivre-ta-fiche)).
4. **Joue** : onglet **Assistant L5R**, choisis la situation (Enquête, Cour, Déplacement, Combat, Magie), touche une action ([§ 5](#5-lassistant-l5r)).
5. **Lance** : le lanceur affiche la réserve (`5g2`), ta chance de réussite, et lance les dés pour toi, ou te dit comment lancer les tiens ([§ 6](#6-le-lanceur)).
6. **Exporte ta fiche** de temps en temps (bloc **Fichier** → **Exporter la fiche**) : c'est ta sauvegarde ([§ 10](#10-sauvegarder-et-changer-dappareil)).

Ta fiche est **enregistrée automatiquement** dans ton navigateur, à chaque modification. Elle n'est **jamais envoyée** : personne ne la voit tant que tu ne l'exportes pas.

## 2. Ouvrir le Carnet, en ligne ou hors ligne

| Façon | Pour qui | Comment |
|---|---|---|
| **En ligne** | Tout le monde | Ouvre **https://nelsio.github.io/carnet-l5r/** |
| **Installé** | Jouer sans réseau, sur téléphone | Voir ci-dessous |
| **Fichier** | Sans rien installer, sans réseau | Télécharge `carnet-l5r.html` depuis la [dernière release](https://github.com/nelsio/carnet-l5r/releases/latest), ouvre-le d'un double-clic |

### Installer sur ton téléphone ou ton ordinateur

Ouvre l'adresse du Carnet une première fois avec du réseau, puis :

- **Chrome, Edge, Android** : menu du navigateur → **Installer l'application** ;
- **iPhone, iPad (Safari)** : **Partager** → **Sur l'écran d'accueil**.

Le Carnet s'ouvre ensuite **sans connexion** et se met à jour tout seul dès qu'il y a du réseau.

<details>
<summary>Pièges à connaître</summary>

- Sur **iPhone et iPad**, l'application installée garde ses fiches **à part de Safari** : exporte-les depuis Safari, puis importe-les dans l'application ([§ 10](#10-sauvegarder-et-changer-dappareil)).
- Avec le **fichier**, les fiches restent **propres à ce fichier, sur cet appareil** : pour les retrouver ailleurs, exporte-les.
- Sur **Safari**, un fichier ouvert directement peut ne pas avoir le droit de stocker des données : l'outil passe en **mode dégradé**. Utilise la version en ligne, ou un autre navigateur.
- Si le navigateur refuse le stockage (navigation privée stricte, par exemple), une **bannière** te prévient : **exporte ta fiche avant de fermer**, sinon elle sera perdue.

</details>

## 3. Créer ta fiche

La **Bibliothèque** liste toutes tes fiches. On y revient par le bouton **Bibliothèque** de l'en-tête, ou par le **sceau 帳** rouge à gauche du nom. Quatre façons de commencer :

| Point de départ | Bouton | Idéal si… |
|---|---|---|
| **Fiche papier** | **Depuis une photo…** | ton personnage existe déjà sur papier |
| **Forge** du portail | **Importer un JSON…** | tu crées un personnage avec calcul de l'XP ([§ 12](#12-langue-portail-et-confidentialité)) |
| **Modèle** | **Modèles de personnage** → **Utiliser** | tu veux essayer avec un Bushi (Kakita), un Shugenja (Tamori) ou un Courtisan (Doji) déjà remplis |
| **Fiche vierge** | **Nouvelle fiche vierge** (ou **Nouvelle fiche**, sous la liste) | tu préfères tout saisir toi-même |

### Depuis une photo de fiche papier

1. **Depuis une photo…** (Bibliothèque, ou bloc **Fichier** d'une fiche ouverte), puis **Copier le prompt**.
2. Envoie ce prompt, avec une photo de chaque face de ta fiche (à plat, bien éclairée, sans reflet), à l'IA que tu utilises déjà (Claude, ChatGPT, Gemini…).
3. Colle **toute** sa réponse dans le champ, phrases autour comprises, puis **Vérifier**.
4. Choisis la destination, regarde l'aperçu, puis **Importer** ou **Appliquer**.
5. Contrôle les valeurs de l'encadré **À vérifier sur ta fiche** : l'IA a eu du mal à les lire.

Tes photos partent chez le service d'IA que tu choisis, **pas dans le Carnet** : il ne voit que le texte que tu colles. Sur une fiche ouverte, l'import **fusionne** par défaut : pratique pour rattraper une fiche papier tenue à jour en séance.

<details>
<summary>En détail : modèles</summary>

Dans la Bibliothèque vide, **Modèles de personnage** propose trois fiches complètes : **Bushi** (Kakita), **Shugenja** (Tamori, avec deux sorts) et **Courtisan** (Doji, avec deux bonus de jet). **Utiliser** en crée une fiche dans ce navigateur et l'ouvre ; **JSON** télécharge le fichier, à adapter puis importer. Quand tu as déjà des fiches, les modèles sont sous la liste (« Ou partir d'un modèle »). L'onglet du navigateur affiche le nom du personnage ouvert.

</details>

## 4. Remplir et suivre ta fiche

- **Edit** sur un bloc le passe en saisie, **Terminer** le repasse en lecture. Plusieurs blocs peuvent être ouverts ensemble.
- Les **réserves** (`5g3`, `6g2`…) se recalculent à chaque changement, techniques d'école et maîtrises comprises ([§ 8](#8-écoles-maîtrises-et-bonus)).
- **Nouvelle journée…** (en tête de fiche), après une nuit de repos : aperçu puis **Confirmer**. Points de Vide au maximum, `2 × Constitution + Rang` blessures soignées, emplacements de sorts rechargés, initiative et compteurs d'escarmouche remis à zéro.

### La barre d'état

Toujours visible en haut, elle sert en pleine partie :

| Tuile | Ce qu'elle montre | Un appui… |
|---|---|---|
| **Blessures** `2/38` | blessures subies / maximum, piste des 8 niveaux avec leur pénalité | ouvre **Ajuster** (`−` / `+` : corrections, soins) et **Dégâts de l'attaque** (Réduction et Vide appliqués, **Encaisser**) |
| **Points de Vide** | une pastille par point | dépense ou rend un point |
| **Dépl.** `10/20 pi` | action libre / action simple | — |
| **ND armure**, **Réduction** | valeurs en cours | ouvre l'éditeur d'armure |
| **Pénalité** | en rouge dès qu'elle dépasse `0` | — |
| **Sorts** (shugenja) | emplacements restants du jour par élément | ouvre l'éditeur ([§ 7](#7-shugenja--sorts-et-magie)) |

Sur mobile, un appui sur le résumé des blessures ouvre le détail : une ligne par niveau, avec l'intervalle de blessures. Les niveaux suivent le livre : Indemne jusqu'à `Terre × 5`, puis `Terre × 2` par niveau.

<details>
<summary>En détail : armure</summary>

Le bloc **Armure** affiche « armure du livre » ou « armure personnalisée », le **ND d'armure** en posture Attaque (`5 × Réflexes 3 + 5 + armure 5 = 25`, plus les bonus d'office de tes techniques), la **Réduction** (armure et techniques) et la **règle spéciale** de l'armure du livre. Son bouton **Edit**, comme les tuiles **ND armure** et **Réduction**, ouvre l'éditeur : nom, bonus au ND, Réduction.

La liste **Armure du livre** remplit ces trois champs : aucune, ashigaru, légère, lourde, cavalerie. Effets :

- armure légère : `+5` au ND d'Athlétisme et de Discrétion ;
- armure lourde : `+5` au ND des jets d'Agilité et de Réflexes (sauf école Hida) ;
- cavalerie : `+12` au ND d'armure à cheval, et comme une lourde à pied.

Retoucher ensuite le bonus ou la Réduction en fait une **armure personnalisée**, sans effet.

</details>

<details>
<summary>En détail : Insight, armes, anciens noms de compétence</summary>

- **Insight** : le bloc **Identité** calcule tes points (somme des Anneaux × 10, plus les rangs de toutes tes compétences, spécialisations non comprises), affichés `125 · Rang 1`. Rang 1 sous 150 points, puis un rang tous les 25 points (Rang 2 à 150, Rang 3 à 175…), au plus 10. **Bonus d'Insight (MJ)** ajoute les points accordés hors calcul. Le **Rang d'Insight que tu saisis fait foi** pour tous les calculs (initiative, soins, rang d'école…) : s'il diffère du calcul, une étiquette le signale (« Rang saisi 3 · calculé 1 »), sans rien bloquer.
- **Armes** : une arme du livre saisie avec d'autres valeurs (VD, mots-clés) est signalée ; **Mettre à jour** reprend celles du livre.
- **Vocabulaire** : les libellés suivent l'édition française (trait **Vigilance**, compétences **Courtisan**, **Discrétion**, **Représentation : Conte**, **Représentation : Art oratoire**, spécialisation **Courtoisie** d'Étiquette). Une fiche avec les anciens noms (Courtoisie, Furtivité, Conteur, Éloquence, Politesse) marche telle quelle ; un bandeau propose **Mettre à jour…** : aperçu, puis **Renommer** (annulable tout de suite) ou **Plus tard**.

</details>

## 5. L'Assistant L5R

L'onglet **Assistant L5R** (**Assistant** dans la barre du bas sur mobile) propose les jets de chaque situation. Choisis la situation, touche une action : le lanceur s'ouvre ([§ 6](#6-le-lanceur)).

| Situation | Ce que tu y trouves |
|---|---|
| **Enquête** | Remarquer, fouiller, interroger, percer un mensonge, Courtisan, Étiquette, **Se souvenir** (une action par compétence `Connaissance : …`), **Méditer** (dans Repos) |
| **Cour** | Courtisan, Étiquette, Sincérité, Intimidation, Tentation, Comédie, Commerce, **Se produire** (une action par `Représentation : …`) |
| **Déplacement** | Distances en combat (pieds et mètres), Athlétisme, Équitation, Discrétion, Chasse, marche forcée |
| **Combat** | **Escarmouche**, **Duel iaijutsu**, **Bataille** |
| **Magie** | Shugenja seulement ([§ 7](#7-shugenja--sorts-et-magie)) |

**Méditer** (Méditation/Vide ND 20) : le bouton **Réussi** te rend 1 point de Vide, 2 avec Méditation 3, 3 avec Méditation 7.

Une action que ta posture interdit est **grisée** avec la raison ; **Lancer quand même** reste possible. Quand tu connais tes actions par cœur, le **« i »** à côté du titre **Actions** masque leurs explications (réglage mémorisé pour toutes tes fiches) ; les autres **« i »** masquent le détail du Vide, du déplacement, de la bataille et des rappels d'école.

### Escarmouche

De haut en bas, dans l'ordre d'un round :

1. **Initiative** : à lancer au début du combat ; ton score s'affiche ensuite.
2. **Nouveau round** : efface le Vide en armure et la Défense totale, **garde l'initiative et les compteurs**.
3. **Posture** : Attaque, Assaut, Défense, Défense totale ou Centre ; ses effets s'affichent et le **ND d'armure** suit. Dessous : **Monté** et **Je garde un allié**.
4. **Dépenser du Vide** : choisis la dépense, puis **Dépenser 1 point de Vide** ; **Annuler** rend le point.
5. **Attaques** de chaque arme, avec leurs **dégâts** juste dessous (`└`). Un shugenja voit ses **sorts** juste après l'Initiative.

Pour **encaisser** un coup : tuile **Blessures** → **Dégâts de l'attaque**.

<details>
<summary>En détail : postures, Vide, Centre, Feinte</summary>

- **Initiative** : `+10` au round qui suit le Centre, `+10` par point de Vide dépensé pour l'escarmouche.
- **Postures interdites** : pas d'attaque en Défense, pas de tir en Assaut, rien d'autre que l'Initiative en Centre ; pas d'Assaut à cheval sans Équitation 3. Un shugenja ne lance pas de sort en **Assaut** ni en **Défense totale**.
- **Je garde un allié** : ton ND d'armure `−5`, le sien `+10`.
- **Dépenses de Vide** : `+1g1` au jet, `+10` au ND d'armure, compétence jouée au rang 1, capacité payée en Vide, `+10` à l'Initiative ou échange d'Initiative. Choisir ne dépense rien.
- **Bonus de Centre** : au round qui suit le Centre, le lanceur le propose (`+1g1` et ton Anneau de Vide au total, sur un seul jet) ; il vaut aussi pour un jet de sort.
- **Feinte** réussie : son bonus est pré-rempli sur les dégâts.
- **Encaisser** retire ta Réduction (et `10` avec un point de Vide), puis ajoute les blessures.

</details>

### Duel iaijutsu

Les étapes **Évaluation → Concentration → Frappe** remplacent l'initiative et la posture (Centre implicite). Coche une Évaluation **gagnée de 10 ou plus**, saisis l'**écart de Concentration** : les augmentations gratuites passent sur la Frappe.

### Bataille de masse

Pas d'initiative ; le panneau suit un tour de bataille :

1. **État de l'armée** : **Gagne**, **Égalité** ou **Perd**, selon le MJ. Si tu commandes, coche **Je commande l'armée** et saisis l'écart de ton jet de Commandement (Bataille/Perception) sur le commandant adverse (`5` d'écart pour gagner ou perdre).
2. **Engagement** : Réserve, Désengagé, Engagé ou Fortement engagé.
3. **Jet de bataille** : `1d10` (sans explosion) `+ Eau + Bataille` ; saisis ton total, ou **Lancer 1d10**. **Tacticien** ajoute `+5` ou `−5`.
4. **Résultat** : la case de la table du livre (« 2 dés de blessures, 1 Gloire, Duel »). Lance ces dés (sans explosion, additionnés), puis **Encaisser** : ta Réduction s'applique.

**Nouveau round** efface le jet et garde ton engagement.

## 6. Le lanceur

Choisir une action ouvre le **lanceur** (un panneau qui monte du bas sur mobile) :

- la **réserve** en grand : `5g2` = 5 dés lancés, 2 gardés ;
- **Min · Moy. · Max** et ta **chance de réussite** contre le **ND final** ;
- les options : **augmentations** (`+5` au ND chacune, au plus ton Anneau de Vide), augmentations gratuites, bonus fixe, point de Vide, **spécialisation** (elle relance les `1`), manœuvres des attaques ;
- la ligne **« lancer à la main »** : les règles de relance pour **jouer avec tes propres dés** (« Les `10` explosent… », bonus à ajouter au total).

**Dés de l'outil ou vrais dés ?** Par défaut, l'outil lance les dés : bouton **Lancer**, résultat et historique. Pour jouer avec tes dés, appuie sur **Lanceur de dés** dans l'en-tête (l'icône de dé sur mobile) pour le masquer. Le choix est mémorisé.

> Avec le lanceur de dés affiché, une attaque réussie avec **Augmentation des dégâts** pré-remplit les dés en plus sur le jet de dégâts (étiquette « +2g0 · augmentations de l'attaque », que **Retirer** annule).

## 7. Shugenja : sorts et magie

Tout ce qui concerne la magie, de la saisie des sorts au lancer. La section apparaît pour une **école de shugenja** ([§ 8](#8-écoles-maîtrises-et-bonus)) ou dès qu'un sort est noté.

### Noter tes sorts

La section **Rouleaux & invocations** (après Techniques d'école) montre une carte par sort, triée par élément puis maîtrise, et en tête le rappel des **sorts de départ** de l'école. Le Carnet ne contient **aucun catalogue de sorts** : tu les ajoutes de deux façons, en **Edit**.

- **Depuis le grimoire** (le plus rapide) : **Ajouter depuis le grimoire** → **Charger le grimoire** la première fois (environ 110 Ko, gardé ensuite dans ce navigateur, même hors ligne). Cherche par nom (français ou anglais), filtre par élément, **+ Ajouter** (ou Entrée). Complète ensuite l'**effet**, la case **Mémorisé** et souvent la **VD**, que le grimoire ne donne pas encore.
- **À la main** : **+ Sort**, et recopie le sort de ton livre avec tes mots. **Ajouter les sorts universels** ajoute Sentir, Communier et Invoquer (élément « Tous »).

**Autocomplétion** : grimoire chargé, tape au moins deux lettres dans le champ **Nom** d'un sort ; ↑ ↓ pour choisir, Entrée ou clic pour remplir.

<details>
<summary>En détail : grimoire et autocomplétion</summary>

- Un sort déjà noté est marqué « déjà noté ». **Actualiser**, à droite des boutons, recharge le grimoire. Rien n'est envoyé. Grimoire chargé, **Ajouter les sorts universels** les remplit aussi. Sans connexion, tout reste possible à la main.
- Un sort ajouté arrive en fin de liste avec son nom, son élément, sa maîtrise, sa portée, sa zone, sa durée, ses mots-clés et ses augmentations.
- L'autocomplétion propose jusqu'à huit sorts ; Échap ferme la liste, ↓ l'ouvre sur un nom déjà saisi. Elle remplace le nom, l'élément, la maîtrise, puis la portée, la zone, la durée, les mots-clés, les augmentations et la VD (si le grimoire la donne). L'effet et **Mémorisé** ne changent jamais.
- Si tu avais déjà saisi d'autres valeurs, le Carnet te les montre d'abord : **Remplacer**, **Compléter les vides** (garde tes valeurs) ou **Annuler** (rien ne change, ton nom compris). Un nom absent du grimoire est accepté tel quel.
- Sans grimoire chargé, la ligne **charger le grimoire** sous le nom le charge sans ouvrir le panneau.
- Carte d'un sort : élément, `Maîtrise 2 · ND 15`, **mémorisé** ou **parchemin**, portée, zone, durée, mots-clés, VD, augmentations et effet.

</details>

### Emplacements du jour

La ligne **Sorts** de la barre d'état montre tes emplacements restants, `restants/max`, en **Air, Terre, Feu, Eau, Vide** (un par point d'Anneau) et **Libres** (autant que ton Anneau de Vide, pour n'importe quel élément). Un appui ouvre l'éditeur (`−` dépense, `+` rend). **Nouvelle journée…** les recharge.

### Lancer un sort

Onglet **Assistant L5R** → **Magie** : une carte **Lancer** par sort, groupées par élément, avec la réserve `(Anneau + rang d'école ±1) g Anneau`, le ND (`5 + 5 × maîtrise`) et le temps d'incantation. **Dégâts** apparaît si le sort a une VD (sans la Force ni point de Vide). En Escarmouche, tes sorts sont dans le groupe **Sorts**.

- La ligne **Emplacement** du lanceur dit quel emplacement le sort prendra : `Feu 2/3`, `libre 1/2` si l'élément est épuisé, ou **aucun emplacement** en rouge.
- Un lancer, réussi ou raté, **dépense l'emplacement** : bouton **Lancer**, ou **Réussi** / **Raté** avec tes propres dés. Un sort réussi puis **interrompu** ne le consomme pas : **Annuler (interrompu)** le rend.
- Un sort que ton rang ne permet pas (maîtrise trop haute, élément de déficience au rang 1) est grisé avec sa raison ; **Lancer quand même** reste possible.
- **Rester concentré** (en fin de liste) : jet de Volonté, ND 10, ou 5 + les dégâts subis que tu saisis, après une interruption.

<details>
<summary>En détail : ce que le lanceur affiche pour un sort</summary>

- L'origine de la réserve (« Terre 3 + rang 1 + affinité 1 ») et le ND fixé par la maîtrise.
- Sous les augmentations : l'élément à choisir pour un **sort universel**, les **cases de ton école** (cible non humaine, il fait jour…), ses **augmentations gratuites** appliquées d'office (mot-clé Jade, élément d'affinité d'Isawa), **Augm. pour le temps d'incantation**, les augmentations du sort, et les rappels (parchemin si le sort n'est pas mémorisé, jet de Volonté si tu es interrompu, effet).
- L'école **Agasha** peut lancer avec un autre Anneau : le point de Vide est dépensé au lancer.
- La maîtrise **Sortilèges 5** ajoute `+1g0` aux jets de sort.
- **Affinité et déficience** : le bloc Techniques d'école les affiche (« Affinité Terre · Déficience Air ») ; le rang de lancement gagne `+1` dans l'élément d'affinité et perd `1` dans celui de déficience. L'école **Isawa** fait choisir son affinité (Vide compris) dans **Affinité (shugenja)** du bloc Identité. Chaque école a sa technique au rang 1 ; les rangs suivants apportent de nouveaux sorts.

</details>

## 8. Écoles, maîtrises et bonus

Choisis ton école et le Carnet applique le reste : techniques, maîtrises et bonus comptent **d'eux-mêmes** dans les réserves de la fiche, de l'Assistant et des statistiques.

- **École** : en **Edit**, bloc Identité → **Techniques d'école**. **École (nom affiché)** prend le nom du livre, modifiable ensuite. Le **Rang d'école** vaut ton Rang d'Insight, sauf si tu le changes ; l'en-tête affiche « École de bushi Kakita · Rang 1 ».
- **Maîtrises de compétence** : appliquées selon le rang de **chaque compétence**, quelle que soit ton école. Dans le lanceur, elles portent le badge **Maîtrise** (« `+1g0` · Kenjutsu 3 »).
- **Bonus de jet** : pour un avantage, un désavantage ou une technique hors catalogue (kata…), le panneau **Bonus de jet** de la fiche (en **Edit**).

Ce qui dépend de la situation **se coche** : dans le lanceur (**Techniques à cocher**) ou dans le panneau **Posture**. Ce qui n'a pas d'effet chiffré apparaît dans **Rappels d'école**, en Combat comme à la Cour.

<details>
<summary>En détail : les 40 écoles</summary>

- **14 écoles de bushi** : Hida, Hiruma, Kakita, Daidoji, Mirumoto, Togashi, Akodo, Matsu, Yoritomo, Tsuruchi, Shiba, Bayushi, Moto, Utaku ;
- **10 écoles de courtisans** : Yasuki, Doji, Kitsuki, Ikoma, Yoritomo, Asako, Bayushi, Ide, Otomo, Miya ;
- **2 écoles Shosuro** : Infiltré et Acteur ;
- **14 écoles de shugenja** : Kuni, Asahina, Tamori, Kitsu, Moshi, Isawa, Agasha, Soshi, Iuchi, Seppun, et dans le groupe **Clans mineurs** Komori (Chauve-souris), Tonbo (Libellule), Kitsune (Renard), Chuda.

</details>

<details>
<summary>En détail : comment les techniques s'appliquent</summary>

- Les techniques de ton rang comptent dans les réserves avec la posture Attaque comme référence.
- Les techniques **situationnelles** se cochent dans le lanceur ou dans le panneau **Posture** (cases de ND d'armure, compteurs de touches, case **Monté**).
- Les techniques qui agissent **sur les autres** sont rappelées avec leur valeur, sur la fiche et sous la réserve des jets sociaux (« `+10` au ND de qui te ment »).
- Certaines dépendent de la **spécialisation** choisie au lanceur : Duperie ou Honnêteté pour Ide, Contrôle pour Yoritomo, Duperie pour Shosuro Acteur.
- Les armes ont des **mots-clés** (Samouraï, Lourde, Petite, Arc…), pré-remplis pour les armes connues : ils décident des techniques qui s'appliquent.
- Une fiche d'une version précédente propose d'**associer** l'école reconnue dans son nom (« Associer à École de bushi Kakita ? ») : **rien ne change sans ta confirmation**.

</details>

<details>
<summary>En détail : exemples de maîtrises</summary>

Kenjutsu 3 donne `+1g0` aux dégâts des épées et Kenjutsu 7 les fait exploser sur 9 ; Défense 5 ajoute `+3` au ND d'armure en Défense ; Bataille 5 ajoute son rang à l'Initiative ; Athlétisme 3 et 5 effacent la pénalité de terrain ; toute compétence au rang 10 gagne une augmentation gratuite. Celles qui dépendent de la situation (Armes d'hast) se cochent, celles sans effet chiffré rejoignent les **rappels**.

</details>

<details>
<summary>En détail : saisir un bonus de jet</summary>

- À la main, à partir d'une **forme d'effet** classée par source : **avantage** (dés en plus, augmentation gratuite, pénalité de blessure réduite…), **désavantage** (malus de dés, ND augmenté…), **technique** (dés en plus aux attaques, aux dégâts, en posture…) ou **bonus libre** ; tu écris le nom de ton avantage ou de ta technique.
- Ou dans le JSON de ta fiche (champ `modifiers`) : voir les modèles de fiche de la Bibliothèque.

Un bonus **« d'office »** compte dans toutes les réserves ; un bonus **« au choix »** se coche dans le lanceur quand sa condition est remplie.

</details>

## 9. Statistiques

La page **Statistiques**, à côté de **Fiche** et **Assistant L5R** (dans la barre du bas sur mobile), donne pour **tous tes jets** la réserve, le minimum, la moyenne, le maximum et la **chance de réussite** contre un ND de `10` à `40`.

- Trois cases : **Avec un point de Vide (+1g1)**, **Spécialisations appliquées**, **Pénalité de blessure actuelle**.
- Un shugenja y trouve aussi une ligne par sort (`Sort · Frappe de jade (Terre)`), et ses dégâts.
- Chaque augmentation ajoute `+5` au ND : décale-toi d'une colonne vers la droite.

## 10. Sauvegarder et changer d'appareil

| Besoin | Comment |
|---|---|
| **Sauvegarder** | bloc **Fichier** → **Exporter la fiche** : un fichier JSON (`kakita-haruto-l5r.json`), à ranger où tu veux, par exemple dans le **dossier partagé de ton groupe** |
| **Sauvegarder en continu** (Chrome et Edge sur ordinateur) | **Lier à un fichier…** : chaque modification est écrite dans le fichier choisi, par exemple dans un dossier Drive synchronisé |
| **Changer d'appareil** | export sur l'ancien, puis sur le nouveau : Bibliothèque → **Importer un JSON…** → destination **Nouvelle fiche** |
| **Mettre à jour une fiche** | **Importer un JSON…** dans la fiche ouverte : il **fusionne**, après un **aperçu** des modifications, ajouts et avertissements. **Rien n'est jamais supprimé** par une fusion |

<details>
<summary>En détail : fichier lié</summary>

- Après un rechargement, le navigateur redemande la permission : clique sur **Reprendre l'enregistrement**.
- Si le fichier a été modifié ailleurs, l'outil te laisse choisir : **Charger la version du fichier**, **Écraser avec ma version**, ou **Fusionner** après un aperçu.
- **Délier** retire le lien sans toucher au fichier.

</details>

## 11. Pour le MJ

Importe les fichiers JSON des joueurs en **Consultation** (Bibliothèque → **Importer un JSON…**, ou **dépose le fichier sur la page**) :

- la fiche est en **lecture seule** : rien n'y est modifiable ;
- l'aide aux jets reste utilisable, **sans rien dépenser** (points de Vide) ;
- **Rendre modifiable** en crée une **copie**, si besoin.

Pour mettre à jour la fiche d'un joueur, **importe son nouveau fichier**.

## 12. Langue, portail et confidentialité

### Langue

Le Carnet s'ouvre dans la langue de ton navigateur, français ou anglais. Le bouton **FR** / **EN** de l'en-tête, à côté du thème, change de langue ; le choix est mémorisé. **Tes fiches ne sont jamais traduites** : ce que tu as saisi reste tel quel.

<details>
<summary>En détail : le Carnet en anglais</summary>

En anglais, les réserves s'écrivent `5k3`, les distances sont en pieds, et les règles de l'Assistant (anneaux, blessures, postures, actions, explications) sont en anglais ; le grimoire, le portail, les écoles et les techniques restent en français. Une fiche saisie avec les noms anglais des compétences (Stealth, Courtier, Lore: History…) fonctionne comme une fiche française : techniques d'école et maîtrises la reconnaissent.

</details>

### Les chroniques de Rokugan

Un site de fan indépendant (catalogues, Forge de personnage, grimoire), utilisable par n'importe quel groupe ; ce n'est pas forcément le site de ton MJ. La **Forge** est une création guidée : elle calcule l'XP, les traits et les bonus d'école, et exporte un JSON à importer ici avec **Importer un JSON**.

Le bouton **Ressources** (icône de torii, en haut) ouvre les liens vers ce portail, chacun dans un **nouvel onglet**. Le Carnet ne contacte jamais ce site de lui-même et marche toujours hors ligne ; seule exception, quand tu la demandes : **Charger le grimoire**.

<details>
<summary>En détail : tous les liens</summary>

- Menu **Ressources** : la page d'accueil, la page de ton clan (si une fiche est ouverte), la **Forge de personnage**, le **Grimoire**, le **Mémento de combat**, **Bushido & honneur** et **Étiquette & coutumes**.
- Ailleurs : le **nom du clan**, au-dessus du nom du personnage, ouvre la page du clan ; dans **Rouleaux & invocations**, **Grimoire** ouvre le grimoire et l'icône de chaque sort le cherche par son nom et son élément ; dans l'**Assistant L5R**, un encadré propose le **Mémento de combat** en Combat, **Étiquette & coutumes** et **Bushido & honneur** en Cour.
- Le menu se termine par la section **Le Carnet**, avec le numéro de version : ce **guide**, les **nouveautés**, **signaler un problème** (compte GitHub requis) et la **page du projet**. Ces liens sont aussi en **pied de page**, avec **Règles L5R 4e** (rappel des règles de jet utilisées par le Carnet) et **Contact** (message privé à l'auteur). La Bibliothèque vide propose **Lire le guide** dès la première visite.

</details>

### Confidentialité

Tes fiches et le nom de tes personnages **ne partent jamais**. L'adresse web compte les visites avec [GoatCounter](https://www.goatcounter.com), sans cookie : à chaque ouverture, il reçoit l'adresse de la page, le site d'où tu viens, ton navigateur, ta langue et la taille de ton écran. Ton adresse IP sert à déduire ton pays et n'est pas conservée. Si un bloqueur de publicité l'arrête, le Carnet marche à l'identique, et le fichier `carnet-l5r.html` ne compte rien.
