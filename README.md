# Carnet de Rokugan

Compagnon de campagne pour les joueurs de **La Légende des Cinq Anneaux, 4e édition** : la fiche de personnage, et une aide aux jets Roll & Keep selon la situation (enquête, cour, déplacement, escarmouche, duel, bataille).

L'outil tient dans **un seul fichier HTML**. Il n'a ni serveur, ni compte, et n'envoie rien sur internet : tes fiches restent dans ton navigateur.

## 1. Utiliser en ligne

Ouvre **https://nelsio.github.io/carnet-l5r/**.

Tes fiches sont enregistrées dans le navigateur de cet appareil, automatiquement, à chaque modification. Rien n'est envoyé : ni le MJ ni personne d'autre ne les voit tant que tu ne les exportes pas.

> Si le navigateur refuse le stockage (navigation privée stricte, par exemple), une bannière te prévient : exporte ta fiche avant de fermer.

## 2. Utiliser hors ligne

1. Télécharge `carnet-l5r.html` depuis la [dernière release](https://github.com/nelsio/carnet-l5r/releases/latest).
2. Ouvre-le dans ton navigateur (double-clic). Il fonctionne sans connexion.

Les fiches enregistrées hors ligne restent propres à ce fichier sur cet appareil : pour les retrouver ailleurs, exporte-les (voir 3).

> Sur Safari, un fichier ouvert directement peut ne pas avoir le droit de stocker des données : l'outil passe alors en mode dégradé. Utilise la version en ligne, ou un autre navigateur.

## 3. Sauvegarder et partager

- **Exporter** : sur la fiche, bloc « Fichier » → **Exporter la fiche**. Tu obtiens un fichier JSON (par exemple `kakita-haruto-l5r.json`). Range-le où tu veux, par exemple dans le **dossier Drive de la campagne**.
- **Lier à un fichier** (Chrome et Edge sur ordinateur) : **Lier à un fichier…** enregistre chaque modification dans un fichier JSON de ton choix. Avec un dossier Drive synchronisé sur ton ordinateur, ta fiche est donc toujours à jour dans le Drive.
  - Après un rechargement, le navigateur redemande la permission : clique sur « Reprendre l'enregistrement ».
  - Si le fichier a été modifié ailleurs, l'outil te laisse choisir : charger la version du fichier, écraser avec la tienne, ou fusionner après un aperçu.
- **Exemple** : dans la Bibliothèque, **Télécharger un exemple de fiche (JSON)** donne une fiche complète, déjà remplie, à adapter puis importer.

## 4. Pour le MJ

Importe les fichiers JSON des joueurs en **Consultation** (Bibliothèque → **Importer un JSON…**, ou dépose le fichier sur la page) :

- la fiche est en lecture seule : rien n'y est modifiable ;
- l'aide aux jets reste utilisable, sans rien dépenser (points de Vide) ;
- **Rendre modifiable** en crée une copie, si besoin.

Pour mettre à jour la fiche d'un joueur, importe son nouveau fichier.

## 5. Changer d'appareil

1. Sur l'ancien appareil : **Exporter la fiche**.
2. Sur le nouveau : Bibliothèque → **Importer un JSON…** → destination **Nouvelle fiche**.

L'import peut aussi **fusionner** un fichier dans la fiche ouverte : un aperçu liste les modifications, ajouts et avertissements avant d'appliquer. Rien n'est jamais supprimé par une fusion.

## Lancer avec de vrais dés, ou dans l'outil

Par défaut, l'aide de jeu ne lance pas les dés : elle donne la réserve (par exemple `5g2`), les règles de relance pour jouer avec tes propres dés (« Les 10 explosent… », spécialisation, bonus à ajouter), tes chances de réussite et le ND final.

Pour lancer dans l'outil, appuie sur le bouton **Lanceur de dés** de l'en-tête (l'icône de dé sur mobile) : le bouton « Lancer », les résultats et l'historique apparaissent dans toutes les situations. Le choix est mémorisé.

Les tuiles **ND armure** et **Réduction** de la barre d'état ouvrent l'éditeur d'armure. Les boutons « i » de l'aide de jeu affichent ou masquent le détail des postures, des dépenses de Vide et du déplacement.

## Techniques d'école

Les 14 écoles de bushi du livre de base (Hida, Hiruma, Kakita, Daidoji, Mirumoto, Togashi, Akodo, Matsu, Yoritomo, Tsuruchi, Shiba, Bayushi, Moto, Utaku) sont intégrées. Sur la fiche, en modification, choisis ton école dans **Techniques d'école** (bloc Identité) ; le **Rang d'école** vaut ton Rang d'Insight, sauf si tu le changes.

- Les techniques de ton rang s'appliquent d'elles-mêmes aux réserves de la fiche, de l'aide de jeu et des statistiques (posture de référence : Attaque).
- Les techniques situationnelles se cochent dans le lanceur (**Techniques à cocher**) ou dans le panneau **Posture** (cases de ND d'armure, compteurs de touches, case **Monté**).
- Les techniques sans effet chiffré apparaissent dans le panneau **Rappels d'école**.
- Les armes ont des **mots-clés** (Samouraï, Lourde, Arc…) pré-remplis pour les armes connues : ils décident des techniques qui s'appliquent.

Depuis la v2.1, le catalogue compte aussi 10 écoles de **courtisans** (Yasuki, Doji, Kitsuki, Ikoma, Yoritomo, Asako, Bayushi, Ide, Otomo, Miya) et deux écoles **Shosuro** (Infiltré, Acteur). Pour elles :

- la situation **Cour** de l'aide de jeu propose les jets sociaux (Courtoisie, Étiquette, Sincérité, Intimidation, Tentation, Comédie, Commerce) et une action par **Représentation** de ta fiche. **Enquête** propose une action par **Connaissance** de ta fiche ;
- dans le lanceur, la **Spécialisation** se choisit dans une liste. Certaines techniques en dépendent : Duperie ou Honnêteté pour Ide, Contrôle pour Yoritomo ;
- les techniques qui agissent sur les autres (« +10 au ND de qui te ment ») sont rappelées avec leur valeur, sur la fiche et sous la réserve des jets sociaux.

Une fiche d'une version précédente propose d'associer l'école reconnue dans son nom (« Associer à École de bushi Kakita ? ») : rien ne change sans ta confirmation. Les résumés sont écrits pour l'outil : réfère-toi à ton livre pour le texte exact.

## Bonus des techniques et avantages

Pour une technique hors catalogue (shugenja, kata), un avantage ou un désavantage qui modifie les jets, Sur la fiche, en modification, le panneau **Bonus de jet** permet de les saisir :

- librement, ou à partir d'un **modèle** (+1g0 à une compétence, augmentation gratuite, +5 au ND d'armure…) ;
- ou depuis le **catalogue**, qui contient Force de la Terre et Aspect dérangeant. Ces entrées sont des résumés à vérifier dans ton livre.

Un bonus « d'office » est compté dans toutes les réserves ; un bonus « au choix » se coche dans le lanceur quand sa condition est remplie.

## Licences et mentions

- **La Légende des Cinq Anneaux (Legend of the Five Rings, L5R)** est une marque de son éditeur. Ce carnet est un **outil de fan non officiel**, sans lien avec l'éditeur ; il ne reproduit pas les textes des livres. Garde ton livre de base sous la main : il fait foi.
- Polices embarquées, sous licence **SIL Open Font License 1.1** :
  - **Shippori Mincho B1** : © The Shippori Mincho Project Authors ;
  - **Zen Kaku Gothic New** : © The Zen Kaku Gothic Project Authors ;
  - **JetBrains Mono** : © The JetBrains Mono Project Authors.

  Textes des licences : [`src/ui/fonts/`](src/ui/fonts/LICENSES.md).

---

## Développement

Spécification : [HANDOFF.md](HANDOFF.md). Node 24 (voir `.nvmrc`).

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

1. Mettre à jour `version` dans `package.json` (SemVer) et merger sur `main`.
2. Poser le tag correspondant : `git tag v1.2.3 && git push origin v1.2.3`.
3. Le workflow `release.yml` vérifie que le tag correspond à `package.json`, relance lint, types et tests, construit le fichier et crée la release avec `carnet-l5r.html` en pièce jointe et des notes générées.

Chaque merge sur `main` met aussi à jour la version en ligne (`pages.yml`).
