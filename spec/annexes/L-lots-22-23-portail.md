## Annexe L — Lots 22 et 23 : liens vers le portail de campagne (v2.19.0, v2.20.0)

Statut : **validé par Nelson le 30/10/2026**. Lots 22 et 23 **livrés** (v2.19.0, écarts en L.6 ; v2.20.0, écarts en L.10). Source : `handoff-outlinks.md` (30/10/2026), intitulé « lots 21 et 22 » en v2.18.0 et v2.19.0 : renuméroté **lots 22 et 23**, **v2.19.0 et v2.20.0** (le lot 21 est le calcul d'Insight, v2.18.0, annexe K). Prototype de référence : `reference/prototype-outlinks.html` (sélecteurs Écran, Personnage, Thème, Largeur). En cas d'écart, le prototype fait foi pour le rendu, cette annexe pour le comportement.

Une PR et une version mineure par lot. Pas de changement de format de fiche (`schemaVersion` reste 2). Captures « avant » et « après » des vues touchées (bureau 1280 px et 390 px, clair et sombre) à chaque PR.

### L.0 Objet

Le Carnet renvoie vers le **portail de la campagne** du MJ (site statique sur GitHub Pages) :

| Page | Adresse |
|---|---|
| Portail | `https://vincenzorpg.github.io/L5R/index.html` |
| Forge de personnage | `…/createcharacter.html` (export JSON importable dans le Carnet : `FORGE_JSON_OK`, L.12, annexe Q) |
| Grimoire | `…/grimoire.html` |
| Page de clan | `…/clans/<slug>.html` (8 Grands Clans) |
| Mémento de combat | `…/aides/combat-memento.html` |
| Bushido & honneur | `…/aides/bushido-honneur.html` |
| Étiquette & coutumes | `…/aides/etiquette-coutumes.html` |

**Règles communes à tous les liens :**
- Ce sont de simples liens `<a href>` : **aucune requête réseau** n'est ajoutée (§1 inchangé). Le Carnet marche toujours hors ligne et en `file://` ; seul le clic demande une connexion.
- `target="_blank" rel="noopener noreferrer"`, icône « lien externe » (flèche sortant d'un carré, 13 px, `currentColor`) après le libellé.
- Nom accessible complété par « (nouvel onglet) » quand le texte visible ne le dit pas (icône seule, nom de clan).
- Couleur du texte de lien : `--accent-ink` (annexe I.1). Soulignement au survol.
- Les liens restent visibles en **consultation** (ils ne modifient rien).
- Aucun texte du livre n'est ajouté : descriptions d'une ligne, écrites pour le Carnet.

| Lot | Version | Contenu |
|---|---|---|
| **22** | v2.19.0 | Configuration des liens (L.1), bouton et menu **Ressources** (L.2), **Bibliothèque** vide et avec fiches (L.3, L.4) |
| **23** | v2.20.0 | Liens dans la **Fiche** : clan et sorts (L.7), encadré de liens dans l'**Aide de jeu** (L.8) |

### L.1 Configuration : `src/rules/portal.ts` (lot 22)

Un seul module porte toutes les adresses, pour qu'un changement d'URL du portail ne touche qu'un fichier : `PORTAL_BASE`, `PORTAL` (`home`, `forge`, `grimoire`, `combat`, `bushido`, `etiquette`), `clanUrl(clanId)` et `spellUrl(name, element?)` (élément ajouté au lot 29, L.13).

Constante de configuration **`FORGE_JSON_OK`** (lot 27, L.12), **`true` depuis la v2.26.0** (lot 39, annexe Q) : l'export JSON de la Forge s'importe sans erreur dans le Carnet. Les branches `false` restent, pour revenir en arrière en une ligne si un export récent casse l'import.

- `clanUrl` lit le champ **`portalSlug`** de la table des clans (`CLANS`, `src/rules/l5r4e.ts`) : `crabe`, `grue`, `dragon`, `lion`, `mante`, `phenix`, `scorpion`, `licorne`. Araignée, Familles impériales et clan non reconnu n'en ont pas → `null`.
- `spellUrl` : `PORTAL.grimoire + "?q=" + encodeURIComponent(name.trim())`. Un nom vide renvoie `PORTAL.grimoire`.
- Composant commun `ExternalLink` (`src/ui/components/ExternalLink.tsx`) : rend le `<a>` avec les attributs ci-dessus, l'icône (`ExtIcon`) et un nom accessible (`label`) si demandé.

### L.2 En-tête : bouton et menu « Ressources » (lot 22)

- **Quatrième bouton d'en-tête**, après Thème : icône **torii** (deux traverses, deux piliers, trait 1,8 px), libellé « Ressources ». Même style et mêmes règles que Bibliothèque, Lanceur et Thème (§6.2, §7) : icône + texte sur bureau, rond de 40 px icône seule sur mobile.
- `aria-haspopup="menu"`, `aria-expanded` ; ouvert = fond `--accent-pale`, texte `--accent-ink`, bordure `--accent`.
- Présent sur **tous les écrans**, Bibliothèque comprise.

**Contenu du menu**, en trois groupes avec intitulé en petites capitales (`--muted`) :

| Groupe | Entrée | Description (1 ligne) | Kanji |
|---|---|---|---|
| Campagne | Portail de la campagne | Clans, règles, aides de jeu | 帝 |
| Campagne | *Nom du clan de la fiche* (si `clanUrl` ≠ null et une fiche est ouverte) | Histoire, familles et serments | kanji de l'Anneau du clan affiché sur le portail (Crabe 土, Grue 風, Dragon 龍, Lion 武, Mante 雷, Phénix 鳳, Scorpion 忍, Licorne 馬) |
| Créer | Forge de personnage | Exporte un JSON compatible avec le Carnet | 鍛 |
| Références | Grimoire | Sorts, Kihō, recherche par effet | 巻 |
| Références | Mémento de combat | Postures, duel Iaijutsu | 刀 |
| Références | Bushido & honneur | Vertus et barème d'honneur | 義 |
| Références | Étiquette & coutumes | Castes, cadeaux, thé | 茶 |

- Chaque entrée : pastille kanji 28 px (fond `--surface`, bordure `--line`, kanji `--accent-ink`), titre en gras, description `--muted` 12 px, icône externe à droite. Hauteur ≥ 44 px, survol `--accent-pale`.
- Pied : « Site de la campagne. S'ouvre dans un nouvel onglet. » (`--muted`, 12 px).
- **Bureau** : menu déroulant sous le bouton, aligné à droite, 340 px, fond `--surface-2`, ombre `--shadow` (élévation, annexe I.1).
- **Mobile** : **panneau glissant depuis le bas**, comme le lanceur (§7) : poignée, voile `--scrim`, hauteur max 88 %, défilement interne.
- Fermeture : Échap (focus rendu au bouton), clic hors du menu, appui sur le voile, choix d'un lien. À l'ouverture, focus sur la première entrée ; flèches haut/bas entre les entrées.

### L.3 Bibliothèque vide (écran d'accueil sans fiche, lot 22)

Remplace le contenu de l'accueil vide. Deux blocs, puis une ligne.

**Bloc « Pas encore de personnage ? »** (carte `--surface`) :
- Titre, puis : « Deux façons de commencer. Tu as déjà un fichier ? **Importer un JSON** » (lien-bouton qui lance l'import existant).
- **Deux options côte à côte, de même poids** (une colonne sur mobile), chacune sur fond `--bg` avec bordure `--line` :

| | Forger sur le portail | Fiche vierge |
|---|---|---|
| Pastille kanji (40 px, fond `--accent-pale`) | 鍛 | 筆 |
| Description | Création guidée : le portail calcule l'XP, les traits et les bonus d'école. | Saisie directe dans le Carnet, pour recopier une fiche papier existante. |
| Étapes (一 二 三) | **Forger** : clan, école, anneaux, compétences · **Exporter** : bouton « JSON » de la Forge · **Importer** : ici, avec « Importer un JSON » | **Créer** : nom, clan, école et Rang · **Remplir** : anneaux, compétences, techniques · **Jouer** : enregistrée dans ce navigateur |
| Bouton principal (`btn` plein accent) | « Ouvrir la Forge » + icône externe → `PORTAL.forge` | « Nouvelle fiche vierge » → action « Nouvelle fiche » existante |

- Les étapes : empilées à toutes les largeurs depuis le lot 43 (numéro kanji à gauche, intitulé et description à droite, annexe T) ; trois cases en ligne sur bureau jusqu'à la v2.27.0.
- **Ordre des options depuis le lot 43** : Depuis une fiche papier · Forger sur le portail · Fiche vierge, sur bureau et mobile (annexe T). Remplace l'ordre de ce tableau et la règle « Fiche vierge d'abord » de L.12.

**Bloc « Modèles de personnage »** (remplace la ligne « Modèles de fiche (JSON) » de J.5) :
- Sous-titre : « Une fiche d'exemple complète, à ouvrir ou à copier pour partir d'une base. »
- Une carte par entrée de `EXAMPLES` (J.5), trois colonnes sur bureau, une sur mobile. Chaque carte affiche le **type** (Bushi, Shugenja, Courtisan) en petites capitales `--accent-ink`, le **nom** du personnage, le **clan** (pastille de couleur du clan) et le **Rang** : « Clan de la Grue · Rang 1 ». Nom, clan et Rang sont **lus dans la fiche** (`build()`), pas écrits en dur.
- Deux boutons `btn sm` : **« Utiliser »** crée une nouvelle fiche locale à partir du modèle et l'ouvre ; **« JSON »** télécharge le fichier (`exemple-*-l5r.json`, comportement J.5).
- `EXAMPLES` gagne les champs `type` (libellé affiché) et `kanji` (pastille de la carte : 刀, 火, 扇, repris du prototype).

**Ligne finale** : « Nouveau à Rokugan ? **Découvrir la campagne** » → `PORTAL.home` (`--muted`, 12 px).

### L.4 Bibliothèque avec fiches (lot 22)

- En-tête de liste : ne garde que **« Importer un JSON »**. Le bouton « Nouvelle fiche » **en sort**.
- Sous la liste, nouvelle carte **« Un nouveau personnage ? »** :
  - **deux options côte à côte** (une colonne sur mobile), même structure compacte : pastille kanji 40 px, titre, description d'une ligne, bouton principal ;
    - **Forger sur le portail** (鍛) : « Création guidée, puis export JSON à importer ici. » → « Ouvrir la Forge » + icône externe ;
    - **Fiche vierge** (筆) : « Saisie directe dans le Carnet, depuis une fiche papier. » → « Nouvelle fiche » ;
  - ligne de pied : « Ou partir d'un modèle : **Bushi** · **Shugenja** · **Courtisan** » (liens-boutons, même action que « Utiliser » de L.3).
  - **Depuis le lot 43** : trois cartes compactes, dans l'ordre Depuis une fiche papier (写) · Forger sur le portail · Fiche vierge (annexe T).

### L.5 Tests du lot 22

| ID | Cas | Attendu |
|---|---|---|
| O1 | `clanUrl` pour les 11 clans | 8 adresses `clans/<slug>.html` ; `null` pour Araignée, Impériales, non reconnu |
| O2 | `spellUrl("Frappe de jade")`, `spellUrl("  ")` ; avec élément (lot 29, L.13) : `spellUrl("Frappe de jade", "earth")`, `spellUrl("  Sentir ", "all")`, `spellUrl("  ", "fire")` | `…grimoire.html?q=Frappe%20de%20jade` ; `…grimoire.html` ; `…?q=Frappe%20de%20jade&el=terre`, `…?q=Sentir&el=universel`, `…grimoire.html` |
| O3 | Tout lien externe rendu (menu, Bibliothèque) | `target="_blank"`, `rel` contient `noopener` et `noreferrer`, icône externe présente |
| O4 | Menu Ressources, fiche Crabe ouverte | 7 entrées dont « Clan du Crabe » → `clans/crabe.html` ; fiche Araignée : 6 entrées |
| O5 | Menu Ressources au clavier | Entrée/Espace ouvre, focus sur la 1re entrée, flèches, Échap ferme et rend le focus |
| O6 | Menu Ressources à 390 px | Panneau bas avec voile ; appui sur le voile ferme ; bouton rond 40 px sous le nom |
| O7 | Bibliothèque vide | Deux options de même largeur sur bureau, empilées à 390 px ; « Nouvelle fiche vierge » crée une fiche |
| O8 | Modèles | 3 cartes avec type, nom, clan, Rang lus dans `build()` ; « Utiliser » crée et ouvre une fiche ; « JSON » télécharge le bon fichier |
| O9 | Bibliothèque avec fiches | Plus de « Nouvelle fiche » en tête de liste ; carte « Un nouveau personnage ? » avec ses deux boutons et les 3 modèles |
| O10 | Réseau | Aucune requête vers `vincenzorpg.github.io` au chargement ni à l'ouverture du menu (Playwright, écoute réseau) |
| O11 | Contrastes | Liens `--accent-ink` sur `--surface`, `--surface-2`, `--bg` : déjà couverts par C1/C2 ; lint N8 vert |

### L.6 Écarts de mise en œuvre (lot 22)

- **Numérotation** : lots 22 et 23, v2.19.0 et v2.20.0, au lieu de 21 et 22, v2.18.0 et v2.19.0 (voir le statut). Préfixe de tests **O** libre, gardé.
- **`clanUrl(clanId: string | null)`** : accepte directement `clanAccent(c.clan).id`, `null` pour un clan non reconnu. `clanAccent` renvoie aussi `portalSlug` (test du moteur adapté).
- **Kanji des clans** : table `PORTAL_CLAN_KANJI` dans `portal.ts`, plutôt qu'un second champ de `CLANS`.
- **Menu** : composant `ResourcesMenu` (`src/ui/components/ResourcesMenu.tsx`). Entrées `role="menuitem"` dans trois `role="group"` nommés ; Début et Fin vont à la première et à la dernière entrée ; Tab ferme le menu. Le défilement de la page est bloqué sous le panneau mobile (classe `menu-open`, comme `sheet-open` du lanceur).
- **Noms accessibles** : entrées du menu « Titre : description (nouvel onglet) » ; bouton de Forge « Ouvrir la Forge (nouvel onglet) » ; boutons des modèles « Utiliser le modèle Bushi », « JSON du modèle Bushi », « Partir du modèle Bushi » (le texte visible reste « Utiliser », « JSON », « Bushi »).
- **Rang des modèles** : rang d'école (`schoolRankOf`), comme le sous-titre de l'en-tête.
- **Modèles** : le champ `label` de `EXAMPLES` (« Exemple bushi ») est retiré, remplacé par `type` et `kanji`. La ligne d'aide sur le dépôt de fichier reste sous l'en-tête de la liste ; elle disparaît de l'accueil vide.
- **Classes CSS** préfixées (`start-opt`, `step-n`, `res-menu`…) : `.opts` et `.x` existent déjà (options du lanceur, bouton de suppression).
- **Tests existants adaptés** : « Créer mon personnage » → « Nouvelle fiche vierge » et « Aucun personnage dans ce carnet » → « Pas encore de personnage ? » (Vitest et Playwright) ; Q9 sur les cartes de modèles ; H1 et H7 : 4 boutons d'en-tête.
- **Tests** : `tests/core.portal.spec.ts` (O1, O2), `tests/ui/portal.spec.tsx` (O3, O4, O5 aux flèches et Échap, O7 à O9), `tests/e2e/portal.spec.ts` (O4 sur bureau, O5 à Entrée et Espace, O6, O7 en largeur, O10). O11 : aucune couleur nouvelle, jetons existants seulement ; lint N8 vert.

### L.7 Fiche (lot 23, v2.20.0)

**Clan dans l'en-tête** : si `clanUrl(clan)` ≠ null, le surtitre du clan (pastille + nom, annexe G) devient un `ExternalLink` vers la page du clan, avec l'icône externe après le nom et `aria-label` « Clan du Crabe : page du clan sur le portail (nouvel onglet) ». Sinon, il reste du texte.

**Bloc Sorts** (shugenja, annexe F) :
- Dans le titre du bloc, à droite : lien « Grimoire » + icône externe → `PORTAL.grimoire`.
- Sur chaque ligne de sort, bouton-lien icône seule (zone 44 × 44 px, icône externe 18 px, `--accent-ink`, survol `--accent-pale`) → `spellUrl(nom du sort, élément)`, soit `grimoire.html?q=<nom>&el=<élément>` depuis le lot 29 (L.13), `aria-label` « <nom> dans le grimoire (nouvel onglet) ».
- Note sous la liste (`--muted`, 12 px) : « Chaque lien ouvre le grimoire sur ce sort, filtré par son élément. » (lot 29 ; avant : « … avec le nom du sort en recherche. »)
- En édition, les liens restent ; ils ne remplacent aucun contrôle existant.

### L.8 Aide de jeu (lot 23, v2.20.0)

- Pour les situations qui ont des liens, un **encadré compact** s'affiche **à droite des actions** sur bureau (grille 1,4fr / 1fr) et **dessous** sur mobile.
- **Pas de titre** dans l'encadré. Carte `--surface`, bordure `--line`, padding vertical réduit (2 px, les lignes portent leur propre espacement). Une ligne par lien : titre `--accent-ink` en gras, description `--muted` 12 px, icône externe à droite ; séparateur `--line` entre les lignes ; hauteur ≥ 44 px. `aria-label` de l'encadré : « Liens vers le portail ».
- Correspondance (à relier aux identifiants réels des situations dans le code) :

| Situation | Liens |
|---|---|
| Combat (et duel ou escarmouche s'ils existent) | Mémento de combat : « Round d'escarmouche, postures, duel Iaijutsu » |
| Cour | Étiquette & coutumes : « Castes, cadeaux, cérémonie du thé » ; Bushido & honneur : « Vertus, gains et pertes d'honneur » |
| Autres situations | Pas d'encadré, la mise en page reste celle d'aujourd'hui |

- La table vit dans `src/rules/portal.ts` (`SITUATION_LINKS: Record<SituationId, { url, title, desc }[]>`).

### L.9 Tests du lot 23

| ID | Cas | Attendu |
|---|---|---|
| O12 | En-tête, fiche Crabe | Le nom du clan est un lien vers `clans/crabe.html` avec icône ; fiche Araignée : texte simple |
| O13 | Fiche shugenja (`exemple-shugenja.json`) | Lien « Grimoire » dans le titre du bloc ; un lien par sort vers `?q=Sentir`, `?q=Frappe%20de%20jade` |
| O14 | Fiche bushi | Aucun lien de sort (pas de bloc Sorts) |
| O15 | Aide de jeu, Combat puis Cour | 1 lien puis 2 liens, sans titre d'encadré ; autre situation : pas d'encadré |
| O16 | Aide de jeu à 390 px | Encadré sous les actions ; les onglets de situation tiennent toujours sur une ligne (§7) |
| O17 | Consultation | Tous les liens présents et actifs |

### L.10 Écarts de mise en œuvre (lot 23)

- **Encadré de l'Aide de jeu** : la colonne de droite de l'Aide de jeu est celle du lanceur (le prototype n'y montrait qu'un espace réservé). L'encadré se place **en tête de cette colonne, au-dessus du lanceur** (`.aid-side`), à droite des actions sur bureau ; sous les actions dès que la grille passe sur une colonne (≤ 860 px), le lanceur restant un panneau bas sur mobile.
- **Combat** : le lien du Mémento s'affiche pour les trois types de combat (escarmouche, duel, bataille de masse). `SITUATION_LINKS` couvre toutes les situations, liste vide pour Enquête, Déplacement et Magie.
- **Liens de sort** : en lecture, à droite de la carte du sort ; en édition, au pied du sort, avant le bouton de suppression (×). Pas de lien pour un sort sans nom. La note « Chaque lien ouvre le grimoire… » suit la liste en lecture et en édition.
- **Noms accessibles** : « Grimoire (nouvel onglet) » pour le lien du titre ; entrées de l'encadré « Titre : description (nouvel onglet) ».
- **Composant `Block`** : nouvelle prop `extra`, rendue entre le titre et le bouton Edit.
- **Tests** : `tests/ui/portal-sheet.spec.tsx` (O12 à O15, O17 ; clan non reconnu, sort sans nom, types de combat en plus) ; `tests/e2e/portal.spec.ts` (O15 sur bureau, O16 à 390 px). Aucun test existant modifié.

### L.11 Correctif v2.20.1 : options alignées

Retour de Nelson le 30/10/2026 : sur bureau, la description de « Fiche vierge » passe sur deux lignes, si bien que ses cases d'étapes et son bouton descendent plus bas que ceux de « Forger sur le portail », avec des cases de tailles différentes.

- `.start-opts` partage ses lignes avec les deux options (`grid-template-rows: subgrid`, trois lignes : en-tête, étapes, bouton ; deux pour la carte compacte de L.4). En-têtes, étapes et boutons sont alignés, et les six cases ont la même hauteur.
- Sur une colonne (≤ 720 px), chaque option garde ses propres lignes, comme avant.
- O7 (Playwright, bureau) vérifie en plus : options de même hauteur, six cases d'étapes au même niveau et de même hauteur, boutons alignés.

### L.12 Lot 27 : Forge en attente de compatibilité JSON (v2.21.2)

L'export JSON de la Forge ne s'importe pas encore dans le Carnet (demande ouverte côté portail : `issues/issue-export-carnet-rokugan.md`). Prototype : `reference/prototype-forge-attente.html`.

- **Interrupteur** `FORGE_JSON_OK` (`src/rules/portal.ts`, voir L.1). À `false` : pastille « JSON pas encore compatible » (`ForgePending`, jetons `--warn` / `--warn-pale`), carte Forge en pointillés, encadré 待 (`role="note"`), étapes Forger · **Recopier** · Importer (« Bientôt », case en pointillés), descriptions « à recopier dans une fiche vierge » dans la carte « Un nouveau personnage ? » et le menu Ressources. À `true` : textes et étapes de L.2 à L.4.
- **Ordre, dans les deux états** (remplacé au lot 43 : Fiche papier · Forge · Fiche vierge, annexe T ; les boutons ne changent pas) : Fiche vierge d'abord, avec le bouton principal (`btn accent`) ; Forge ensuite, bouton secondaire (`btn`). Description de Fiche vierge (L.3) : « Saisie directe dans le Carnet, depuis une fiche papier ou un personnage créé ailleurs. » En-tête : « Tu as déjà un fichier du Carnet ? »
- **Grille** : les options pleines partagent quatre lignes (en-tête, encadré, étapes, bouton). La ligne de l'encadré est vide côté Fiche vierge : étapes et boutons restent alignés (L.11).
- `--warn-pale` passe de 14 % à 12 % de `--warn` : à 14 %, `--warn` sur `--warn-pale` faisait 4,47:1 en clair.
- **Depuis la v2.26.0** (annexe Q) : constante à `true`, état « en attente » testé seulement dans `tests/ui/forge-pending.spec.tsx` (constante simulée à `false`).
- **Tests** : `tests/core.portal.spec.ts` (constante à `false`), `tests/ui/portal.spec.tsx` (ordre, pastille, encadré, menu), `tests/ui/forge-ok.spec.tsx` (constante simulée à `true` par `vi.mock` : le build livré ne permet pas de la changer dans Playwright), `tests/e2e/portal.spec.ts` (ordre bureau et 390 px, pastille dans la carte et dans le menu, sans défilement horizontal), `tests/colors.spec.ts` (contraste ≥ 4,5:1 dans les deux thèmes).

### L.13 Lot 29 : liens des sorts filtrés par élément (v2.21.4)

Source : `handoff-liens-sorts.md` (30/10/2026), intitulé « lot 28, v2.21.3 » : renuméroté **lot 29, v2.21.4** (le lot 28 est la mise à jour de `sharp`, M.5). Pas de changement de format de fiche ni de changement visuel.

La recherche du grimoire porte aussi sur la description des sorts : le nom seul donne parfois plusieurs résultats (« Sentir » : 3, « Invoquer » : 2). Le grimoire lit le paramètre `el` (vérifié sur la version du 30/10/2026) ; avec lui, chaque sort n'a plus qu'un résultat.

- **`spellUrl(name, element?)`** → `grimoire.html?q=<nom encodé>&el=<élément>` ; sans élément, le lien d'avant ; nom vide → `PORTAL.grimoire`. `encodeURIComponent` est gardé (espaces en `%20`). Un `el` inconnu du grimoire y est ignoré : le lien retombe sur la recherche par nom.
- **`GRIMOIRE_ELEMENT`** (`src/rules/portal.ts`), valeur du filtre « Élément / Voie » du grimoire :

| Élément du Carnet | `air` | `earth` | `fire` | `water` | `void` | `all` |
|---|---|---|---|---|---|---|
| `el=` | `air` | `terre` | `feu` | `eau` | `vide` | `universel` |

- **Pas de paramètre `rang`** : la maîtrise du Carnet ne correspond pas toujours à celle du grimoire (universels en maîtrise 1 dans le Carnet, rang 0 dans le grimoire : 0 résultat). **Pas d'ancre `#sort-<id>`** : le nom est libre et le Carnet ne connaît pas l'identifiant du grimoire.
- **Fiche** : `SpellLink` reçoit l'élément, en lecture et en édition ; en édition, le lien suit les champs Nom et Élément. Le lien « Grimoire » du titre du bloc ne change pas. Note : « Chaque lien ouvre le grimoire sur ce sort, filtré par son élément. »
- **Tests** : `tests/core.portal.spec.ts` (O2 avec élément, `GRIMOIRE_ELEMENT` couvre `SPELL_ELEMENTS`) ; `tests/ui/portal-sheet.spec.tsx` (O13 : adresses avec `el` et nouvelle note ; élément Terre → Feu en édition → `el=feu` ; O17 : mêmes adresses en consultation). Le test « aucune requête réseau » reste vert ; aucune capture de `docs/img/` à refaire.

