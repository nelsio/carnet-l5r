# Carnet de Rokugan

Compagnon de campagne pour les joueurs de **La Légende des Cinq Anneaux, 4e édition** : ta **fiche de personnage**, et une **aide aux jets Roll & Keep** selon la situation (enquête, cour, déplacement, escarmouche, duel, bataille).

L'outil tient dans **un seul fichier HTML** (`carnet-l5r.html`). Il n'a **ni serveur, ni compte**, et **n'envoie rien sur internet** : tes fiches restent dans ton navigateur.

## Sommaire

1. [Utiliser en ligne](#1-utiliser-en-ligne)
2. [Utiliser hors ligne](#2-utiliser-hors-ligne)
3. [Créer et remplir ta fiche](#3-créer-et-remplir-ta-fiche)
4. [Jouer avec l'aide de jeu](#4-jouer-avec-laide-de-jeu)
5. [Le lanceur : vrais dés ou dés de l'outil](#5-le-lanceur--vrais-dés-ou-dés-de-loutil)
6. [Statistiques](#6-statistiques)
7. [Techniques d'école](#7-techniques-décole)
8. [Bonus des techniques et avantages](#8-bonus-des-techniques-et-avantages)
9. [Sauvegarder et partager](#9-sauvegarder-et-partager)
10. [Changer d'appareil](#10-changer-dappareil)
11. [Pour le MJ](#11-pour-le-mj)
12. [Licences et mentions](#12-licences-et-mentions)

## 1. Utiliser en ligne

Ouvre **https://nelsio.github.io/carnet-l5r/**.

Tes fiches sont **enregistrées automatiquement** dans le navigateur de cet appareil, à chaque modification. Rien n'est envoyé : ni le MJ ni personne d'autre ne les voit tant que tu ne les **exportes** pas (voir [§ 9](#9-sauvegarder-et-partager)).

> Si le navigateur refuse le stockage (navigation privée stricte, par exemple), une **bannière** te prévient : **exporte ta fiche avant de fermer**, sinon elle sera perdue.

## 2. Utiliser hors ligne

1. Télécharge `carnet-l5r.html` depuis la [dernière release](https://github.com/nelsio/carnet-l5r/releases/latest).
2. Ouvre-le dans ton navigateur (double-clic). Il fonctionne **sans connexion**.

Les fiches enregistrées hors ligne restent **propres à ce fichier, sur cet appareil** : pour les retrouver ailleurs, exporte-les (voir [§ 9](#9-sauvegarder-et-partager)).

> Sur **Safari**, un fichier ouvert directement peut ne pas avoir le droit de stocker des données : l'outil passe alors en **mode dégradé**. Utilise la version en ligne, ou un autre navigateur.

## 3. Créer et remplir ta fiche

- **Bibliothèque** → **Créer mon personnage** (ou **Nouvelle fiche**). La Bibliothèque liste toutes tes fiches ; on y revient par le bouton **Bibliothèque** de l'en-tête.
- Chaque bloc de la fiche a son bouton **Edit** : il passe ce bloc en saisie, **Terminer** le repasse en lecture. Plusieurs blocs peuvent être ouverts ensemble. Les réserves (`5g3`, `6g2`…) se recalculent à chaque changement.
- Une arme du livre saisie avec d'autres valeurs (VD, mots-clés) est signalée : **Mettre à jour** reprend celles du livre.
- La **barre d'état**, en haut, reste visible partout :
  - la tuile **Blessures** (`2/38` : blessures subies / maximum) ouvre, sous la barre, **Ajuster** (`−`, le total, `+` : corrections et soins) puis **Dégâts de l'attaque** (Réduction et Vide appliqués, **Encaisser**) ; la piste des 8 niveaux montre leur pénalité effective (sur mobile, un appui sur le résumé ouvre le détail : une ligne par niveau, avec l'intervalle de blessures) ;
  - **points de Vide** : une pastille par point, un appui en dépense ou en rend ;
  - quatre tuiles : **Dépl.** (`10/20 pi` = action libre / action simple), **ND armure**, **Réduction** et **Pénalité** (en rouge dès qu'elle dépasse `0`) ;
  - pour un shugenja (v2.12), la ligne **Sorts** : tes emplacements restants du jour, `restants/max`, en **Air, Terre, Feu, Eau, Vide** (un par point d'Anneau) et **Libres** (autant que ton Anneau de Vide, pour n'importe quel élément). Un appui ouvre l'éditeur (`−` dépense, `+` rend).
- Le bloc **Armure** de la fiche (v2.8) détaille ton armure : « armure du livre » ou « armure personnalisée », **ND d'armure** en posture Attaque (`5 × Réflexes 3 + 5 + armure 5 = 25`, plus les bonus d'office de tes techniques), **Réduction** (armure et techniques), et la **règle spéciale** de l'armure du livre. Son bouton **Edit**, comme les tuiles **ND armure** et **Réduction** de la barre d'état, ouvre l'éditeur : nom, bonus au ND, Réduction.
- La liste **Armure du livre** remplit ces trois champs : aucune, ashigaru, légère, lourde, cavalerie. Son effet suit : armure légère `+5` au ND d'Athlétisme et de Discrétion ; armure lourde `+5` au ND des jets d'Agilité et de Réflexes (sauf école Hida) ; cavalerie `+12` au ND d'armure à cheval, et comme une lourde à pied. Retoucher ensuite le bonus ou la Réduction en fait une **armure personnalisée**, sans effet.
- La section **Rouleaux & invocations** (v2.9), après Techniques d'école, apparaît pour un **shugenja** (école de shugenja choisie, voir [§ 7](#7-techniques-décole)) ou dès qu'un sort est noté ; en tête, le rappel des **sorts de départ** de l'école. Une carte par sort, triée par élément puis maîtrise : élément, `Maîtrise 2 · ND 15`, **mémorisé** ou **parchemin**, portée, zone, durée, mots-clés, VD, augmentations et effet. En **Edit**, tu recopies chaque sort de ton livre avec tes mots : **+ Sort**, et **Ajouter les sorts universels** (Sentir, Communier, Invoquer, élément « Tous »). L'outil ne contient **aucun catalogue de sorts**.
- **Nouvelle journée…** (en tête de fiche) : après une nuit de repos, un aperçu puis **Confirmer** remet tes points de Vide au maximum, soigne `2 × Constitution + Rang` blessures, recharge les emplacements de sorts, et remet l'initiative et les compteurs d'escarmouche à zéro.
- Les libellés suivent l'**édition française** : trait **Vigilance**, compétences **Courtisan**, **Discrétion**, **Représentation : Conte** et **Représentation : Art oratoire**, spécialisation **Courtoisie** d'Étiquette. Une fiche qui emploie encore les anciens noms (Courtoisie, Furtivité, Conteur, Éloquence, Politesse) marche telle quelle ; un bandeau propose **Mettre à jour…** : aperçu des renommages, puis **Renommer** (annulable tout de suite par **Annuler le renommage**) ou **Plus tard**.
- Les niveaux de blessure suivent le livre : Indemne jusqu'à `Terre × 5`, puis `Terre × 2` par niveau. (Le réglage `× 3` à `× 5` de la v2.5 est masqué pour le moment.)

## 4. Jouer avec l'aide de jeu

L'onglet **Aide de jeu** (dans la barre du bas sur mobile) propose les jets de chaque situation :

| Situation | Contenu |
|---|---|
| **Enquête** | Remarquer, fouiller, interroger, percer un mensonge, Courtisan, Étiquette, une action **« Se souvenir »** par compétence `Connaissance : …` de ta fiche, et dans **Repos**, **Méditer** (Méditation/Vide ND 20 : le bouton **Réussi** te rend 1 point de Vide, 2 avec Méditation 3, 3 avec Méditation 7). |
| **Cour** | Jets sociaux : Courtisan, Étiquette, Sincérité, Intimidation, Tentation, Comédie, Commerce, et une action **« Se produire »** par compétence `Représentation : …`. |
| **Déplacement** | Distances en combat (pieds et mètres), Athlétisme, Équitation, Discrétion, Chasse, marche forcée. |
| **Combat** | **Escarmouche**, **Duel iaijutsu** et **Bataille**. Un shugenja retrouve ses sorts en Escarmouche, dans le groupe **Sorts** : pas de sort en **Assaut** ni en **Défense totale** (carte grisée), et le bonus de **Centre** vaut aussi pour un jet de sort. |
| **Magie** | Shugenja seulement (v2.11) : une carte **Lancer** par sort de ton Rouleaux & invocations, groupées par élément, avec la réserve `(Anneau + rang d'école ±1) g Anneau`, le ND (`5 + 5 × maîtrise`) et le temps d'incantation ; **Dégâts** du sort s'il a une VD (sans la Force ni point de Vide). Un sort que ton rang ne permet pas (maîtrise trop haute, élément de déficience au rang 1) est grisé avec sa raison, et **Lancer quand même** reste possible. En fin de liste, **Rester concentré** (Volonté, ND 10, ou 5 + les dégâts subis que tu saisis) après une interruption. |

En **Escarmouche**, de haut en bas :

1. **Initiative** : à lancer au début du combat, elle affiche ensuite ton score (avec `+10` au round qui suit le Centre, et `+10` par point de Vide dépensé pour l'escarmouche).
2. **Nouveau round** : efface le Vide en armure et la Défense totale ; **garde l'initiative et les compteurs**.
3. **Posture** : Attaque, Assaut, Défense, Défense totale, Centre ; le **ND d'armure** se met à jour. Dessous : la case **Monté** (pas d'Assaut à cheval sans Équitation 3) et **Je garde un allié** (ton ND d'armure `−5`, le sien `+10`).
4. **Dépenser du Vide** : `+1g1` au jet, `+10` au ND d'armure, compétence jouée au rang 1, capacité payée en Vide, `+10` à l'Initiative ou échange d'Initiative.
5. Les **attaques** de chaque arme, avec leurs **dégâts** juste dessous (`└`). Une action que ta posture interdit (attaque en Défense, tir en Assaut, tout sauf l'Initiative en Centre) est **grisée** avec la raison, et reste jouable par **Lancer quand même**.

Au round qui suit le Centre, le lanceur propose le **Bonus de Centre** (`+1g1` et ton Anneau de Vide au total, sur un seul jet). Une **Feinte** réussie pré-remplit son bonus sur les dégâts. Pour **encaisser** un coup, la tuile **Blessures** de la barre d'état, puis **Dégâts de l'attaque**, retire ta Réduction (et `10` avec un point de Vide) et ajoute les blessures.

En **Duel iaijutsu**, les étapes Évaluation → Concentration → Frappe remplacent l'initiative et la posture (Centre implicite) : coche une Évaluation **gagnée de 10 ou plus**, saisis l'**écart de Concentration**, et les augmentations gratuites passent sur la Frappe. **Nouveau round** et **Dépenser du Vide** restent présents partout.

En **Bataille**, il n'y a pas d'initiative ; le panneau **Bataille de masse** (v2.7) suit un tour de bataille :

1. **État de l'armée** : si tu commandes, coche **Je commande l'armée** et saisis l'écart de ton jet de Commandement (Bataille/Perception) sur celui du commandant adverse : `5` d'écart pour gagner ou perdre, sinon égalité. Sinon, choisis **Gagne**, **Égalité** ou **Perd** selon ce qu'annonce le MJ.
2. **Engagement** : Réserve, Désengagé, Engagé ou Fortement engagé.
3. **Jet de bataille** : `1d10` (sans explosion) `+ Eau + Bataille`. Saisis ton total, ou, avec le lanceur affiché, **Lancer 1d10**. L'avantage **Tacticien** ajoute `+5` ou `−5`.
4. **Résultat** : la case de la table du livre, « 2 dés de blessures, 1 Gloire, Duel ». Lance ces dés (sans explosion, additionnés) puis **Encaisser** : ta Réduction s'applique, comme pour un coup reçu.

**Nouveau round** efface le jet et garde ton engagement.

Les boutons **« i »** affichent ou masquent le détail des postures, des dépenses de Vide, du déplacement, de la bataille de masse et des rappels d'école.

## 5. Le lanceur : vrais dés ou dés de l'outil

Choisir une action ouvre le **lanceur** (un panneau qui monte du bas sur mobile). Il donne :

- la **réserve** en grand, par exemple `5g2` (5 dés lancés, 2 gardés) ;
- la ligne **« lancer à la main »** : les règles de relance pour **jouer avec tes propres dés** (« Les `10` explosent… », spécialisation, bonus à ajouter au total) ;
- **Min · Moy. · Max** et ta **chance de réussite** contre le **ND final** ;
- les options : **augmentations** (`+5` au ND chacune, au plus ton Anneau de Vide), augmentations gratuites, dés lancés `±`, bonus fixe, point de Vide, **spécialisation** (choisie dans la liste de la compétence : elle relance les `1`), manœuvres sur les attaques.

Par défaut, l'outil **ne lance pas les dés**. Pour lancer dans l'outil, appuie sur **Lanceur de dés** dans l'en-tête (l'icône de dé sur mobile) : le bouton **Lancer**, les résultats et l'historique apparaissent dans toutes les situations. Le choix est **mémorisé**.

> Avec le lanceur de dés affiché, une attaque réussie avec **Augmentation des dégâts** pré-remplit les dés en plus sur le jet de dégâts.

Pour un **sort**, le lanceur montre l'origine de la réserve (« Terre 3 + rang 1 + affinité 1 »), le ND fixé par la maîtrise et, sous les augmentations : l'élément à choisir pour un **sort universel**, les **cases de ton école** (cible non humaine, il fait jour…), ses **augmentations gratuites** appliquées d'office (mot-clé Jade, élément d'affinité d'Isawa), le champ **Augm. pour le temps d'incantation** (« Temps d'incantation : 1 action complexe »), les augmentations du sort, et les rappels (parchemin si le sort n'est pas mémorisé, jet de Volonté si tu es interrompu, effet). L'école **Agasha** peut lancer avec un autre Anneau : le point de Vide est dépensé au lancer. La maîtrise **Sortilèges 5** ajoute `+1g0` aux jets de sort.

La ligne **Emplacement** (v2.12) dit quel emplacement le sort prendra : `Feu 2/3`, `libre 1/2` si l'élément est épuisé, ou **aucun emplacement** en rouge. Un lancer, réussi ou raté, **dépense l'emplacement** : au bouton **Lancer** avec le lanceur de dés, ou aux boutons **Réussi** et **Raté** si tu lances tes propres dés. Un sort réussi puis **interrompu** ne le consomme pas : **Annuler (interrompu)** le rend.

## 6. Statistiques

La page **Statistiques**, à côté de **Fiche** et **Aide de jeu** (dans la barre du bas sur mobile), donne pour **tous tes jets** la réserve, le minimum, la moyenne, le maximum et la **chance de réussite** contre un ND de `10` à `40`.

- Trois cases : **Avec un point de Vide (+1g1)**, **Spécialisations appliquées**, **Pénalité de blessure actuelle**.
- Un shugenja y trouve aussi une ligne par sort (`Sort · Frappe de jade (Terre)`), et ses dégâts.
- Chaque augmentation ajoute `+5` au ND : décale-toi d'une colonne vers la droite.

## 7. Techniques d'école

Sur la fiche, en modification, choisis ton école dans **Techniques d'école** (bloc Identité) : **École (nom affiché)** prend le nom du livre, que tu peux ensuite changer. Le **Rang d'école** vaut ton Rang d'Insight, sauf si tu le changes ; l'en-tête affiche « École de bushi Kakita · Rang 1 ».

Le catalogue compte **40 écoles** :

- **14 écoles de bushi** (v2.0) : Hida, Hiruma, Kakita, Daidoji, Mirumoto, Togashi, Akodo, Matsu, Yoritomo, Tsuruchi, Shiba, Bayushi, Moto, Utaku ;
- **10 écoles de courtisans** (v2.1) : Yasuki, Doji, Kitsuki, Ikoma, Yoritomo, Asako, Bayushi, Ide, Otomo, Miya ;
- **2 écoles Shosuro** (v2.1) : Infiltré et Acteur ;
- **14 écoles de shugenja** (v2.10) : Kuni, Asahina, Tamori, Kitsu, Moshi, Isawa, Agasha, Soshi, Iuchi, Seppun, et dans le groupe **Clans mineurs** Komori (Chauve-souris), Tonbo (Libellule), Kitsune (Renard), Chuda.

Pour un shugenja, le bloc Techniques d'école affiche sous l'école son **affinité** et sa **déficience** (« Affinité Terre · Déficience Air ») : le rang de lancement d'un sort gagne `+1` dans l'élément d'affinité et perd `1` dans celui de déficience. L'école **Isawa** fait choisir son affinité (Vide compris) dans la liste **Affinité (shugenja)** du bloc Identité. Chaque école a sa technique au rang 1 ; les rangs suivants apportent de nouveaux sorts.

Comment elles s'appliquent :

- les techniques de ton rang comptent **d'elles-mêmes** dans les réserves de la fiche, de l'aide de jeu et des statistiques (posture de référence : Attaque) ;
- les techniques **situationnelles** se cochent dans le lanceur (**Techniques à cocher**) ou dans le panneau **Posture** (cases de ND d'armure, compteurs de touches, case **Monté**) ;
- les techniques sans effet chiffré apparaissent dans le panneau **Rappels d'école**, en Combat comme à la Cour ;
- les techniques qui agissent **sur les autres** sont rappelées avec leur valeur, sur la fiche et sous la réserve des jets sociaux (« `+10` au ND de qui te ment ») ;
- certaines dépendent de la **spécialisation** choisie au lanceur : Duperie ou Honnêteté pour Ide, Contrôle pour Yoritomo, Duperie pour Shosuro Acteur ;
- les armes ont des **mots-clés** (Samouraï, Lourde, Petite, Arc…), pré-remplis pour les armes connues : ils décident des techniques qui s'appliquent.

Une fiche d'une version précédente propose d'**associer** l'école reconnue dans son nom (« Associer à École de bushi Kakita ? ») : **rien ne change sans ta confirmation**.

**Maîtrises de compétence** (v2.4) : selon le rang de **chaque compétence** de ta fiche, quelle que soit ton école, l'outil applique ses maîtrises. Par exemple Kenjutsu 3 donne `+1g0` aux dégâts des épées et Kenjutsu 7 les fait exploser sur 9 ; Défense 5 ajoute `+3` au ND d'armure en Défense ; Bataille 5 ajoute son rang à l'Initiative ; Athlétisme 3 et 5 effacent la pénalité de terrain ; toute compétence au rang 10 gagne une augmentation gratuite. Dans le lanceur, elles portent le badge **Maîtrise** (« `+1g0` · Kenjutsu 3 ») ; celles qui dépendent de la situation (Armes d'hast) se cochent, celles sans effet chiffré rejoignent les **rappels**.

> Les résumés sont **écrits pour l'outil** et restent **à vérifier dans ton livre**, qui fait foi.

## 8. Bonus des techniques et avantages

Pour une technique hors catalogue (shugenja, kata), un avantage ou un désavantage qui modifie les jets, le panneau **Bonus de jet** de la fiche (en modification) permet de les saisir :

- **librement**, ou à partir d'un **modèle** (`+1g0` à une compétence, augmentation gratuite, `+5` au ND d'armure, pénalité de blessure réduite, malus situationnel…) ;
- ou depuis le **catalogue** : **Force de la Terre** et **Aspect dérangeant** (résumés à vérifier dans ton livre).

Un bonus **« d'office »** compte dans toutes les réserves ; un bonus **« au choix »** se coche dans le lanceur quand sa condition est remplie.

## 9. Sauvegarder et partager

- **Exporter** : sur la fiche, bloc **Fichier** → **Exporter la fiche**. Tu obtiens un fichier JSON (par exemple `kakita-haruto-l5r.json`). Range-le où tu veux, par exemple dans le **dossier Drive de la campagne**.
- **Lier à un fichier** (**Chrome et Edge sur ordinateur**) : **Lier à un fichier…** enregistre **chaque modification** dans un fichier JSON de ton choix. Avec un dossier Drive synchronisé sur ton ordinateur, ta fiche est donc toujours à jour dans le Drive.
  - Après un rechargement, le navigateur redemande la permission : clique sur **Reprendre l'enregistrement**.
  - Si le fichier a été modifié ailleurs, l'outil te laisse choisir : **Charger la version du fichier**, **Écraser avec ma version**, ou **Fusionner** après un aperçu.
  - **Délier** retire le lien sans toucher au fichier.
- **Exemple** : dans la Bibliothèque, **Télécharger un exemple de fiche (JSON)** donne une fiche complète, déjà remplie, à adapter puis importer.

## 10. Changer d'appareil

1. Sur l'ancien appareil : **Exporter la fiche**.
2. Sur le nouveau : Bibliothèque → **Importer un JSON…** → destination **Nouvelle fiche**.

L'import peut aussi **fusionner** un fichier dans la fiche ouverte : un **aperçu** liste les modifications, ajouts et avertissements avant d'appliquer. **Rien n'est jamais supprimé** par une fusion.

## 11. Pour le MJ

Importe les fichiers JSON des joueurs en **Consultation** (Bibliothèque → **Importer un JSON…**, ou **dépose le fichier sur la page**) :

- la fiche est en **lecture seule** : rien n'y est modifiable ;
- l'aide aux jets reste utilisable, **sans rien dépenser** (points de Vide) ;
- **Rendre modifiable** en crée une **copie**, si besoin.

Pour mettre à jour la fiche d'un joueur, **importe son nouveau fichier**.

## 12. Licences et mentions

- **La Légende des Cinq Anneaux (Legend of the Five Rings, L5R)** est une marque de son éditeur. Ce carnet est un **outil de fan non officiel**, sans lien avec l'éditeur ; il ne reproduit pas les textes des livres. Garde ton livre de base sous la main : **il fait foi**.
- Polices embarquées, sous licence **SIL Open Font License 1.1** :
  - **Shippori Mincho B1** : © The Shippori Mincho Project Authors ;
  - **Zen Kaku Gothic New** : © The Zen Kaku Gothic Project Authors ;
  - **JetBrains Mono** : © The JetBrains Mono Project Authors.

  Textes des licences : [`src/ui/fonts/LICENSES.md`](src/ui/fonts/LICENSES.md).

---

## Développement

Spécification : [`HANDOFF.md`](HANDOFF.md). **Node 24** (voir `.nvmrc`).

```sh
npm install
npm run dev            # serveur de développement
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest
npm run test:coverage  # Vitest + couverture (100 % des lignes de src/core)
npm run build          # dist/carnet-l5r.html, fichier unique autonome
npm run test:e2e       # Playwright, sur le build
```

### Publier une version

1. Mettre à jour `version` dans `package.json` (**SemVer**) et merger sur `main`.
2. Poser le tag correspondant sur le commit de merge : `git tag v1.2.3 && git push origin v1.2.3`.
3. Le workflow `release.yml` **vérifie que le tag correspond à `package.json`**, relance lint, types et tests, construit le fichier et crée la release avec `carnet-l5r.html` en pièce jointe et des notes générées.

Chaque merge sur `main` met aussi à jour la version en ligne (`pages.yml`).
