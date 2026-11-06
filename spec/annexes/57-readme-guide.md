## Annexe 57 — Lot 57 : README français par défaut, guide plus digeste et illustré (v2.32.2)

Un lot, une PR, une version de documentation : aucun fichier de `src/` ne change. Le public du Carnet est d'abord francophone : la page d'accueil du dépôt redevient française. Le guide joueur, long et rangé par écran, devient un parcours par tâche.

### 57.1 README français par défaut

- `README.md` : **français** (l'ancien `README-fr.md`, renommé avec `git mv`), page d'accueil GitHub du dépôt.
- `README-en.md` : **anglais** (l'ancien `README.md`, renommé avec `git mv`).
- Ligne sous les badges : `[English](README-en.md) · **Français**` et `**English** · [Français](README.md)`.
- Liens des documents français (`CONTRIBUTING.md`, `docs/GUIDE.md`, `docs/CREDITS.md`) : `README-fr.md` → `README.md`.
- Puce « Guide d'utilisation » / « User guide » de « En savoir plus » : décrit la nouvelle forme du guide.
- §9.3 et arborescence du §2 mis à jour.

### 57.2 Guide plus digeste

- En tête, **« Le Carnet en 5 minutes »** : six étapes, de l'ouverture à l'export, chacune renvoyant à sa section.
- Sommaire regroupé en trois parties : Démarrer, Jouer, Garder et partager.
- Douze sections par tâche. Chacune commence par l'essentiel ; le détail des règles (armure, Insight, postures, grimoire, écoles, maîtrises, bonus de jet, fichier lié, liens du portail…) est replié dans des blocs `<details>` « En détail », rendus par GitHub.
- Tableaux pour les choix : façons d'ouvrir le Carnet, points de départ d'une fiche, tuiles de la barre d'état, situations de l'Assistant, besoins de sauvegarde.
- La magie, dispersée entre la fiche, l'Assistant et le lanceur, est regroupée dans **§ 7 Shugenja : sorts et magie** : noter ses sorts, emplacements du jour, lancer un sort.
- Langue, portail des Chroniques de Rokugan et confidentialité sont réunis en fin de guide (§ 12) ; la mention du bouton **Contact** du pied de page (lot 56) y est ajoutée.
- Aucune information retirée : environ 2 700 mots visibles sans rien déplier, contre 4 400 auparavant.
- Ancres conservées pour les liens existants : `#installer-sur-ton-téléphone-ou-ton-ordinateur` et `#11-pour-le-mj`. Le chemin `docs/GUIDE.md`, cité par l'application (`src/rules/links.ts`), ne change pas.

### 57.3 Vérifications

- Tous les liens relatifs et ancres des deux README, de `docs/GUIDE.md`, `docs/CREDITS.md` et `CONTRIBUTING.md` résolus par un script ponctuel (hors dépôt), comme en 55.2.

### 57.4 Écarts

- Le guide reste en français seulement (point ouvert depuis l'annexe 55.3).
- Captures du guide en français seulement.

### 57.5 Guide illustré

Complément du lot, dans la même PR (`handoff-guide-visuel-langue.md`). Les sections clés du guide portent une **capture annotée** : sceaux numérotés en kanji posés sur les vrais éléments de l'écran, trait de pinceau autour, cadre washi, puis une liste juste sous l'image qui explique chaque sceau dans le même ordre. Légende : `- **一** (1) **Libellé exact de l'écran** : à quoi il sert.` Six sceaux au plus par capture.

### 57.6 Script `scripts/guide-shots.mjs`

- `npm run build && npm run guide-shots`, hors CI. Même base que `scripts/screenshots.mjs` : Playwright, `sharp`, échelle 2x, modèles intégrés (Kakita Haruto, Tamori Ayane), aucune fiche personnelle.
- Sortie `docs/img/guide/NN-sujet.png`, PNG palette ; capture de bureau à 1500 px au plus (moins pour un recadrage étroit, jamais agrandi au-delà de 2x), téléphone à 700 px ; cadre washi en plus.
- Thème clair pour toutes les captures du guide, accordé au papier du cadre.
- Une entrée de données par capture : identifiant, cartouche kanji, fenêtre (bureau 1280 × 720 ou téléphone 390 × 844), modèle ouvert, étapes, sceaux (`[numéro, locator ou liste de locators, coin]`), recadrage (union de locators, 24 px de marge).
- Annotations injectées dans la page capturée, jamais dans l'application : aucun fichier de `src/` ne change.
- Français seulement : l'argument `en` est reconnu et refusé avec un message, en attendant un guide anglais.
- Écarts au handoff :
  - **Recadrage sans défilement** : pour une capture recadrée, la page reste en haut et la fenêtre est agrandie jusqu'au bas de la zone. Défiler posait la barre d'état (collante) au milieu de l'image et cachait un sceau sous elle.
  - **Dés reproductibles** : `Math.random` est remplacé dans la page capturée par un générateur à graine fixe ; le lanceur et les statistiques donnent les mêmes images à chaque exécution.
  - **Sceau maintenu dans la fenêtre** : un sceau posé sur un élément collé au bord (onglets du bas sur téléphone) est ramené à l'intérieur.
  - **Police du cartouche** : `fc-list` n'existe pas sous macOS ; le script accepte Noto Serif CJK JP ou Hiragino Mincho ProN (fournie par macOS) et échoue avec un message clair sinon.

### 57.7 Captures livrées

15 images, 3,7 Mo en tout (limite 4 Mo).

| Fichier | Section | Écran | Sceaux |
|---|---|---|---|
| `01-accueil.png` | § 1 | Bureau, Bibliothèque vide | Depuis une photo…, Ouvrir la Forge, Nouvelle fiche vierge, Importer un JSON |
| `01b-modeles.png` | § 3 | Bureau, Modèles de personnage | 五 Utiliser (suite de la numérotation de `01-accueil`) |
| `03-photo.png` | § 3 | Bureau, fenêtre « Importer depuis une fiche papier » | Copier le prompt, Réponse de l'IA, Vérifier |
| `04-fiche.png` | § 4 | Bureau, Kakita Haruto | Bibliothèque, Lanceur de dés, Ressources, onglets, barre d'état, Edit |
| `04-edition.png` | § 4 | Bureau, Anneaux & Traits en saisie, Agilité passée à 4 | Agilité, Terminer |
| `04-fiche-mobile.png` | § 4 | Téléphone, Kakita Haruto | boutons ronds, barre d'état, onglets du bas |
| `04-barre-etat.png` | § 4 | Bureau, barre d'état et Nouvelle journée | niveaux, Blessures, Points de Vide, tuiles, Nouvelle journée… |
| `05-assistant.png` | § 5 | Bureau, Combat → Escarmouche | situations, type de combat, Attaque · Katana, Mémento de combat |
| `05-escarmouche.png` | § 5 | Bureau, Initiative à Dépenser du Vide | Posture, Nouveau round, Initiative |
| `06-lanceur.png` | § 6 | Bureau, Attaque · Katana lancée | réserve, Réussite, Augm. libres, Lancer, résultat |
| `07-magie-mobile.png` | § 7 | Téléphone, Tamori Ayane, Magie | Sorts, Magie, Lancer · Frappe de jade, Dégâts |
| `07-sorts.png` | § 7 | Bureau, Rouleaux & invocations en lecture | Edit, Grimoire, icône du sort |
| `09-stats.png` | § 9 | Bureau, Statistiques | Avec un point de Vide, réserve, ND 20 |
| `10-fichier.png` | § 10 | Bureau, bloc Fichier | Exporter la fiche, Importer un JSON…, Lier à un fichier… |
| `12-en-tete.png` | § 12 | Bureau, en-tête, menu Ressources ouvert | bouton de langue, Ressources, lien du clan |

Écarts au handoff : `01-accueil` illustre le § 1 et `01b-modeles` le § 3 (une image par section, pas de doublon) ; `07-sorts` montre le bloc en lecture, pas en saisie (≈ 2 600 px de haut en saisie), avec le bouton Edit à la place de « + Sort », et les emplacements restent sur `07-magie-mobile` ; `07-magie-mobile` a un sceau de plus (Dégâts) ; `04-edition` met en évidence Agilité, modifiée par le script.

### 57.8 Style « rouleau de Rokugan »

- **Images** : sceaux vermillon carrés à chiffre kanji, double trait de pinceau, cadre washi généré par `sharp` (grain, double filet, cartouche vertical au kanji de la section, petit sceau 帳).
- **Titres** : `## 四 · Le registre du samouraï : remplir et suivre ta fiche`. Un `<a id="…">` devant chaque titre garde l'ancre d'origine : les liens des README (`#installer-sur-ton-téléphone-ou-ton-ordinateur`, `#11-pour-le-mj`) et ceux du guide ne changent pas.
- **Épigraphe** : une phrase en italique sous chaque titre de section, écrite pour l'outil, aucune citation des livres.
- **Sommaire** : 天 · Le seuil, 地 · La voie, 人 · La mémoire.
- **Blocs repliés** : « 詳 · Pour aller plus loin ».
- Libellés de l'écran inchangés dans le texte ; une ligne d'introduction explique les sceaux.
- Vérifications : script exécuté de bout en bout sur un build propre ; liens, ancres (titres et `<a id>`) et images du guide résolus par le script ponctuel de 57.3 ; aucune image absente ou en trop dans `docs/img/guide/`.
