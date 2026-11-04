## Annexe E — Lot 12 : règles du livre, combat complet, ergonomie (v2.2 à v2.7)

Statut : **validée par Nelson le 24/10/2026** (proposition du rapport `verification-livre-4e.md`, défauts retenus, plus les retouches E.9). Source des règles : **livre de base 4e** (PDF du dossier de conception, numéros de **pages du PDF**). Les règles sont **résumées**, jamais recopiées (C.1) ; les tables chiffrées (armes, armures, bataille) sont des données.

### E.1 Décisions
| # | Sujet | Décision |
|---|---|---|
| E-a | Découpage | Six versions, une PR par version : **v2.2.0** correctifs de règles et retouches d'interface (E.2, E.9) ; **v2.3.0** combat complet (E.3) ; **v2.4.0** maîtrises et armures (E.4, E.5) ; **v2.5.0** récupération (E.6) ; **v2.6.0** vocabulaire français (E.7) ; **v2.7.0** bataille de masse (E.8). |
| E-b | P7 corrigé | La maîtrise 7+ « dégâts sur 9 et 10 » ne vaut que pour **Kenjutsu (épées)** et **Armes lourdes** (page 143). Remplace la décision P7 du 20/10. |
| E-c | Format de fiche | **Inchangé** (`schemaVersion` 2) jusqu'à v2.5. La v2.6 (vocabulaire) ne change que des **libellés et des noms de compétence** : renommage proposé à l'ouverture d'une fiche (E.7), sans migration de format. |
| E-d | Multiplicateur de blessures | Réglage **de préférence** (pas dans la fiche) : Terre × 2 par défaut, × 3 à × 5 en option (page 86). Indemne reste Terre × 5. |
| E-e | Garde | Action du panneau **Posture** (case « Je garde un allié »), pas une manœuvre du lanceur. |
| E-f | Feinte | Moitié de l'excédent **arrondie à l'inférieur**. |
| E-g | Dé de bataille | 1 dé à 10 faces **sans explosion** (la table s'arrête à 30). |
| E-h | Arrondi Bayushi courtisan R1 | Arrondi **au plus proche** (page 129) : 8 points → 3 augmentations. Ajouter `Value.round: "nearest"`. |

### E.2 v2.2.0 — Correctifs de règles
| # | Correction | Règle (page) |
|---|---|---|
| C1 | **Maîtrise des dégâts** | `MASTERY` devient une table par compétence : Kenjutsu 7 et Armes lourdes 7 → `explodeOn: 9`. Kyujutsu 7 : **force de l'arc +1** (pas d'explosion sur 9). Jiujutsu : voir E.4. (143-144) |
| C2 | **Vide et dégâts** | La case « point de Vide (+1g1) » est **absente des jets de dégâts**, sauf arme **Katana** : « Vide : +1g1 aux dégâts (katana) », une fois par jet, même avec une technique qui autorise plusieurs points. `computePool` ignore `voidPoint` sur `damage` sauf `weapon.special === "katanaVoid"`. (80, 206) |
| C3 | **Défense totale** | Bonus = **moitié du jet arrondie au supérieur**. (86) |
| C4 | **Terrain** | Sélecteur dans l'encart « Se déplacer en combat » : Normal / Modéré / Difficile → Anneau d'Eau −0 / −1 / −2 (minimum 1) pour les distances ; texte « distances divisées par deux » supprimé. Tuile « Dépl. » de la barre d'état : terrain normal. (87) |
| C5 | **Coup ciblé** | Choix de la zone au lanceur : membre 1, main ou pied 2, tête 3, œil ou doigt 4 augmentations. (88) |
| C6 | **Désarmement** | Si l'attaque réussit avec Désarmement, le jet de dégâts suivant est **2g1 sans la Force**, sans augmentation de dégâts ; note dans le lanceur. (88) |
| C7 | **Renversement** | Option « quadrupède » : 4 augmentations au lieu de 2. (89) |
| C8 | **Catalogue d'armes** | Corriger `weaponCatalog` (tableau ci-dessous) ; la migration ne touche pas les armes déjà saisies, mais la fiche signale un écart de mots-clés ou de VD avec le catalogue (« Le livre indique 2k3 : mettre à jour ? »). (201-206) |
| C10 | **Bayushi courtisan R1** | Arrondi au plus proche (E-h) : `Value.round: "nearest"`. (129) |
| C11 | **Force de l'arc plafonnée** | Force effective de l'arc = **min(force de l'arc, Force du personnage)** : un archer moins fort que son arc utilise sa Force. Kyujutsu 7 ajoute +1 à la force de l'arc **avant** ce plafond (P16). (202) |
| C12 | **Arcs et cheval** | Yumi : +10 au ND des tirs **monté** ; dai-kyu : +10 au ND des tirs **à pied**, et avertissement si Force < 3. Appliqué selon la case « Monté » ; note dans le lanceur. (202) |
| C9 | **Bataille, jets fixes** | Retirer l'action « Jet de bataille personnel » (Bataille/Perception ND 15), remplacée en v2.7 (E.8). Commandement : 5 d'écart pour gagner. (238) |

Catalogue d'armes corrigé :
| Arme | Mots-clés | Compétence | VD | Remarque |
|---|---|---|---|---|
| Katana | samourai, moyenne | Kenjutsu | 3k2 | `special: "katanaVoid"` |
| Wakizashi | samourai, **moyenne** | Kenjutsu | 2k2 | lançable à 20 pieds |
| No-dachi | grande, deux-mains | Kenjutsu | 3k3 | **pas Samouraï** |
| Tanto | petite | Couteaux | 1k1 | |
| Cimeterre | cimeterre, moyenne | Kenjutsu | **2k3** | |
| Tetsubo | lourde, grande, deux-mains | Armes lourdes | 3k3 | armes lourdes : deux mains (page 202) |
| Ono | lourde, grande, deux-mains | Armes lourdes | 0k4 | |
| Dai tsuchi | lourde, grande, deux-mains | Armes lourdes | 5k2 | ajout |
| Masakari | lourde, moyenne | Armes lourdes | 2k3 | ajout |
| Yari | lance, grande | Lances | 2k2 | |
| Naginata | hast, samourai, grande, deux-mains | Armes d'hast | **3k2** | |
| Bo | grande, deux-mains | Bâtons | **1k2** | **pas Paysan** |
| Kama | paysan, petite | **Couteaux** | **0k2** | |
| Ninja-to | ninja, moyenne | Ninjutsu | 2k2 | ajout |
| Yumi | arc, distance, grande | Kyujutsu | 2k2 (flèche), force 3 | **pas Samouraï** ; ND +10 à cheval |
| Dai-kyu | arc, distance, grande | Kyujutsu | 2k2 (flèche), force 4 | **pas Samouraï** ; Force 3 minimum |

Conséquences : Hiruma R4, Kakita R4, Mirumoto R3, Akodo R3 ne s'appliquent plus aux arcs ; Shosuro Acteur R2/R4 ne s'appliquent plus au wakizashi.

### E.3 v2.3.0 — Combat complet
| # | Fonction | Comportement (page) |
|---|---|---|
| F1 | **Centre** | En posture Centre, le lanceur affiche « Aucune action ce round ». Au round suivant (après « Nouveau round ») : case **« Bonus de Centre »** dans le lanceur, **+1g1 et + Anneau de Vide au total** sur **un seul jet** (la case se décoche et disparaît après usage) ; **+10 au score d'Initiative** de ce round, affiché sur la carte Initiative. Se cumule avec Kakita R1 et Mirumoto R2. (86) |
| F2 | **Restrictions de posture** | Assaut : attaques à distance **indisponibles** (carte grisée, raison affichée) et posture désactivée si la case « Monté » est cochée, sauf Équitation ≥ 3. Défense et Défense totale : cartes d'attaque grisées. Centre : toutes les actions grisées sauf Initiative. Aucun blocage dur : un lien « Lancer quand même » reste disponible. (86, 142) |
| F3 | **Vide en combat** | Panneau Vide : **« +10 Initiative (escarmouche) »** (ajouté au score jusqu'à la fin de l'escarmouche), **« Échanger l'Initiative »** (rappel), et dans l'encaissement des dégâts (F6) « −10 blessures ». (80) |
| F4 | **Feinte** | Après une attaque réussie avec Feinte : dégâts **+ moitié (arrondie à l'inférieur) de l'excédent sur le ND final**, plafonné à **5 × Rang d'Insight**, pré-rempli en bonus fixe sur les dégâts liés. (88) |
| F5 | **Garde** | Case « Je garde un allié » dans le panneau Posture (action simple, indisponible en Assaut) : ton ND d'armure −5 jusqu'à ton tour suivant ; rappel « ton allié : +10 au ND d'armure ». Daidoji R2 : pas de malus, allié +15, dure un round de plus. Shiba R1 : action gratuite, allié +5 seulement. « Nouveau round » ne la décoche pas (elle dure jusqu'à ton tour). (88-89) |
| F6 | **Encaisser des dégâts** | Dans la barre d'état, à côté du compteur de blessures : champ « Dégâts reçus » + bouton « Encaisser » : blessures ajoutées = max(0, dégâts − Réduction totale − 10 si « Vide −10 » coché). Le point de Vide est dépensé. (80, 200) |
| F7 | **Opposition et augmentations** | Sur un jet en opposition avec N augmentations : la ligne du ND affiche « Bats l'adversaire d'au moins 5 × N ». Saisie facultative du total adverse → verdict. (82) |
| F8 | **Augmentations gratuites → ND** | Option au lanceur : « Utiliser les augmentations gratuites pour baisser le ND » (−5 par augmentation). (81) |
| F9 | **Tir au contact** | Case « Cible au corps à corps » sur les attaques à distance : −10 au total. (84) |
| F10 | **Duel** | En Duel iaijutsu, posture **Centre implicite** (effets `center` actifs). Évaluation : case « Gagnée de 10 ou plus » → +1g1 à la Concentration (+2g2 avec Iaijutsu 7). Concentration : saisie de l'écart → « Tu frappes en premier, N augmentations gratuites » (5 d'écart, puis 1 par tranche de 5 ; Kakita R3 : 3 et 3) pré-remplies sur la Frappe ; sinon « Frappe simultanée ». (89, 142) |
| F12 | **Augmentation des dégâts groupée** | Rappel dans le lanceur : toutes les augmentations de dégâts d'un round comptent comme **un seul effet** pour les réductions de coût de manœuvre. (89) |
| F11 | **Effets des blessures** | Estropié : rappel « mouvements d'un cran plus chers ». À terre : « actions gratuites seulement, en dépensant 1 point de Vide ». (84) |

### E.4 v2.4.0 — Maîtrises de compétences
Nouveau catalogue `src/rules/maitrises.json`, même format d'effet que l'annexe C, chargé pour **chaque compétence de la fiche** selon son rang (et non selon l'école). Les effets ne s'appliquent qu'aux jets de cette compétence (page 135), sauf mention. Badge **« Maîtrise »** dans le lanceur (« +1g0 · Kenjutsu 3 »).

| Compétence | Rang | Effet encodé | Mode |
|---|---|---|---|
| Toutes | 10 | 1 augmentation gratuite | auto |
| Kenjutsu | 3 | +1g0 aux dégâts des épées (Kenjutsu) | auto |
| Kenjutsu | 7 | dégâts des épées : `explodeOn: 9` | auto |
| Armes lourdes | 3 | rappel : Réduction de la cible −2 | rappel |
| Armes lourdes | 5 | 1 augm. gratuite pour Renversement | auto |
| Armes lourdes | 7 | dégâts : `explodeOn: 9` | auto |
| Kyujutsu | 7 | force de l'arc +1 | auto |
| Jiujutsu | 3 | +1g0 aux dégâts à mains nues | auto |
| Jiujutsu | 5 | rappel : 1 augm. gratuite pour une lutte | rappel |
| Jiujutsu | 7 | +0g1 de plus aux dégâts à mains nues | auto |
| Ninjutsu | 3 / 7 | +1g0 / +0g1 aux dégâts des armes ninja | auto |
| Défense | 5 | +3 au ND d'armure en Défense et Défense totale | auto |
| Défense | 3 / 7 | rappels (garder le jet de Défense totale ; une action simple en Défense totale) | rappel |
| Iaijutsu | 5 | 1 augm. gratuite à la Concentration | auto |
| Iaijutsu | 7 | Évaluation gagnée de 10 : +2g2 au lieu de +1g1 (F10) | auto |
| Équitation | 3 | Assaut possible à cheval (F2) | auto |
| Armes d'hast | 3 | +5 à l'Initiative au premier round (case) | case |
| Armes d'hast | 5 | +1g0 aux dégâts contre un cavalier ou plus grand (case) | case |
| Lances | 3 | rappel : ignorer 3 de Réduction au premier round | rappel |
| Bâtons | 5 | 1 augm. gratuite pour Renversement | auto |
| Bâtons | 7 | bâton petit : +1g0 aux dégâts | auto |
| Couteaux | 5 / 7 | sai et jitte : 1 augm. gratuite pour Désarmer ; tout couteau : 1 pour Attaque supplémentaire | auto |
| Bataille | 5 | + rang de Bataille au score d'Initiative (escarmouche) | auto |
| Athlétisme | 3 / 5 | terrain modéré / difficile sans pénalité de déplacement (C4) | auto |
| Méditation | 3 / 7 | 2 / 3 points de Vide récupérés (E.6) | auto |

Les autres maîtrises (dégainer, bander un arc, portée…) restent hors outil.

### E.5 v2.4.0 — Catalogue d'armures
L'éditeur d'armure gagne une liste « Armure du livre » qui remplit nom, bonus et réduction (modifiables ensuite) :

| Armure | Bonus ND | Réduction | Effet encodé |
|---|---|---|---|
| Aucune | 0 | 0 | — |
| Ashigaru | +3 | 1 | — |
| Légère | +5 | 3 | +5 au ND des jets d'Athlétisme et de Discrétion |
| Lourde | +10 | 5 | +5 au ND des jets d'Agilité et de Réflexes (Hida R1 : ignoré sauf Discrétion) |
| Cavalerie | +4, **+12 monté** | 4 | compte comme lourde ; +5 au ND d'Agilité et Réflexes à pied |

`armor` gagne un champ facultatif `catalogId` (format v2 inchangé, champ facultatif comme `modifiers`).

### E.6 v2.5.0 — Récupération
- **Multiplicateur de blessures** (E-d) : réglage dans les préférences (à côté du thème) : Terre × 2 (défaut), × 3, × 4, × 5 pour les niveaux après Indemne ; Indemne reste Terre × 5. Utilisé par `woundState`, la barre d'état et le détail. (86)
- **« Nouvelle journée »** (bouton de la fiche, avec confirmation intégrée) : points de Vide = Anneau de Vide ; blessures − (2 × Constitution + Rang d'Insight), plancher 0 ; remise à zéro de l'initiative et des compteurs d'escarmouche. (80, 86)
- **Méditation** : action « Méditer (récupérer du Vide) » dans l'onglet **Enquête**, groupe « Repos » : Méditation (Récupération du Vide)/Vide ND 20. Bouton « Réussi : +1 point de Vide » (+2 avec Méditation 3, +3 avec Méditation 7), plafonné à l'Anneau de Vide. (139)

### E.7 v2.6.0 — Vocabulaire de l'édition française
Libellés alignés sur le fichier de techniques français (dossier de conception) :
| Clé | Avant | Après |
|---|---|---|
| trait `awareness` | Intuition | **Vigilance** |
| compétence Courtier | Courtoisie | **Courtisan** |
| spécialisation Etiquette (Courtesy) | Politesse | **Courtoisie** |
| compétence Stealth | Furtivité | **Discrétion** |
| Perform: Storytelling / Oratory | Conteur / Éloquence | **Conte / Art oratoire** |

- Les catalogues (`ecoles-*.json`, actions, modèles de bonus) utilisent les nouveaux noms ; les **alias** (D-d) gardent l'ancien nom reconnu, donc une fiche v2.5 continue de fonctionner sans rien faire.
- À l'ouverture d'une fiche qui contient un ancien nom, bandeau « Mettre à jour le vocabulaire (Courtoisie → Courtisan, …) » : renommage en un clic, annulable, aperçu comme l'import (§8). Attention : « Courtoisie » **compétence** devient Courtisan, « Courtoisie » **spécialisation d'Étiquette** reste Courtoisie.

### E.8 v2.7.0 — Bataille de masse
- Données : **`reference/table-bataille.json`** (fourni, transcrit de la page 242), à copier dans `src/rules/`.
- Sous-type **Bataille** du Combat :
  - **Commandement** (si tu commandes) : Bataille/Perception en opposition, saisie de l'écart → « Ton armée gagne / égalité / perd » (5 d'écart). Sinon, choix manuel de l'état de l'armée.
  - **Engagement** : Réserve / Désengagé / Engagé / Fortement engagé.
  - **Jet de bataille** : « 1d10 + Eau N + Bataille M » ; en lanceur affiché, tirage ; sinon saisie du total. Avantage Tacticien : ±5 (case).
  - **Résultat** : case de la table (colonne = engagement + décalage de l'état ; ligne = total, plafonné à la ligne 28-30) → « N dés de blessures, G Gloire, Duel / Occasion héroïque ». Bouton « Lancer les dés de blessures » (N d10 additionnés, lanceur affiché) qui passe par « Encaisser » (F6).

### E.9 Retouches d'interface (v2.2.0)
| # | Retouche | Comportement attendu |
|---|---|---|
| S1 | **Bonus de jet sur mobile** | En lecture, chaque bonus s'affiche sur **3 lignes** à ≤ 720 px : 1) nom + étiquette de source ; 2) le modificateur (« +1g1 · d'office ») ; 3) la cible et la note. Plus de tableau à deux colonnes sur mobile (le bureau peut garder les 2 colonnes). |
| S2 | **Bouton « Edit » par bloc** | Le bouton général « Modifier la fiche » disparaît. Chaque bloc modifiable (Anneaux & Traits, Identité & réputation, Compétences, Armes, Techniques d'école, Bonus de jet, Avantages/désavantages/notes) a dans son en-tête un bouton **« Edit »**, qui devient **« Terminer »** pendant l'édition. Plusieurs blocs peuvent être ouverts en même temps ; l'état est par bloc (`ui.editing: Set<BlockId>`). « Supprimer ce personnage » passe dans le bloc Identité en édition. En consultation : aucun bouton Edit, « Rendre modifiable » reste en tête de fiche. |
| S3 | **Détail des blessures sur mobile** | Au lieu de la grille horizontale 2 × 4, l'appui sur le résumé ouvre **sous la barre d'état un bloc pleine largeur** (comme sur bureau) avec **une ligne par niveau** : nom, intervalle de blessures (« 11–14 »), pénalité ; niveau courant surligné, niveaux dépassés atténués. Repli par le même appui. |
| S4 | **Fiche d'exemple** | `reference/exemple-personnage.json` est **remplacé** (fourni, format v2) : Kakita Haruto rattaché à `kakita-bushi`, armure légère, katana, wakizashi et yumi avec mots-clés du livre, avantage Voix en bonus de jet ; plus de « techniques d'exemple à adapter ». `src/rules/example.ts` le reprend tel quel (plus d'ajout de bonus fictifs). Noms de compétence au vocabulaire E.7 ; les alias le rendent compatible avant la v2.6. |
| S5 | **Pénalités du détail** | Le détail des blessures affiche les **pénalités effectives** de chaque niveau, réduites par les effets (Force de la Terre −3, Matsu R4, bonus `wounds`), plancher 0, et augmentées par les malus (Seuil de douleur bas +5 par niveau, page 162). Même calcul que la tuile Pénalité : fonction `woundPenaltyAt(c, level, ctx)` utilisée par les deux. |

### E.10 Tests
Personnage : `reference/perso-test-ecoles.json` (sans école sauf mention), compétences ajoutées par le cas. Posture Attaque, terrain normal.

| # | Cas | Attendu |
|---|---|---|
| L1 | Dégâts katana avec Kenjutsu 2 ; 3 ; 7 | 5g2 explose sur 10 ; 6g2 sur 10 ; 6g2 sur **9** |
| L2 | Dégâts tetsubo avec Armes lourdes 6 ; 7 | 5g3 sur 10 ; 5g3 sur 9 |
| L3 | Kyujutsu 7, **Force 4** : attaque yumi ; dégâts yumi | 10g3 ; **6g2** (force 3 + 1 = 4, ≤ Force 4) explose sur 10 |
| L4 | Dégâts à mains nues avec Jiujutsu 0 ; 3 ; 7 | 2g1 ; 3g1 ; 3g2 |
| L5 | Dégâts avec 1 point de Vide : katana ; wakizashi | 6g3 ; 4g2 (Vide refusé) |
| L6 | Défense totale, jet 15 ; jet 14 | ND 28 ; ND 27 |
| L7 | Round après Centre, attaque katana, case Bonus de Centre | 6g4 +2 ; case absente au jet suivant ; Initiative +10 |
| L8 | Eau 3 : déplacement normal / modéré / difficile | 15/30/60 ; 10/20/40 ; 5/10/20 |
| L9 | Défense 5, posture Défense | ND 31 (20 + Air 3 + Défense 5 + 3) |
| L10 | Assaut : carte Tir yumi ; Assaut monté, Équitation 1 ; Équitation 3 | grisée ; Assaut désactivé ; Assaut permis |
| L11 | Feinte réussie, total 32 contre ND final 30 ; total 45 | dégâts +1 ; +5 (plafond 5 × Insight 1) |
| L12 | Désarmement réussi, puis dégâts katana | 2g1 |
| L13 | Coup ciblé « tête », ND de base 20 | ND final 35 |
| L14 | Garde ; Garde en Assaut ; Daidoji R2 | ND 15 ; indisponible ; ND 20 |
| L15 | Encaisser 12 dégâts, armure légère (Réduction 3) ; avec Vide −10 ; Hida R2 | +9 blessures ; +0 ; +7 (Réduction 3 + Terre 2) |
| L16 | Duel, écart de Concentration 12 ; Kakita R3 écart 12 ; écart 4 | premier, 1 augm. gratuite ; premier, 3 ; frappe simultanée |
| L17 | Nouvelle journée, 20 blessures, Constitution 2, Insight 1 | 15 blessures, Vide plein |
| L18 | Méditation réussie, Vide 0/2 ; Méditation 3 | 1/2 ; 2/2 |
| L19 | Bataille : total 8, Engagé, armée gagnante ; égalité ; total 31, Fortement engagé, perdante | 2 dés de blessures, 1 Gloire ; 3 dés, 1 Gloire, Duel ; 3 dés, 5 Gloire, Occasion héroïque |
| L20 | Bayushi courtisan R1 : 7 ; 8 ; 16 points | 2 ; 3 ; 5 augmentations gratuites |
| L21 | Détail des blessures, Terre 2, Force de la Terre | pénalités 0, 0, 2, 7, 12, 17, 37, ✕ (tuile identique au niveau courant) |
| L22 | Fiche d'exemple importée | ND d'armure 25, Réduction 3, Initiative 4g3 +6, Représentation : Art oratoire 5g4 (4g3 + Voix 1g1) |
| L23 | Vocabulaire : fiche avec « Courtoisie » (compétence) et Étiquette (Politesse) | bandeau ; après renommage : Courtisan, Étiquette (Courtoisie) ; Doji R1 s'applique avant et après |
| L25 | Multiplicateur × 3, Terre 2 | seuils 10, 16, 22, 28, 34, 40, 46, 52 |
| L26 | Force 2 : dégâts yumi (force 3) ; dégâts dai-kyu (force 4) | 4g2 ; 4g2 + avertissement « Force 3 minimum » |
| L27 | Tir yumi monté ; dai-kyu à pied ; dai-kyu monté | ND +10 ; ND +10 ; ND +0 |
| L24 | Non-régression | T1 à T42 inchangés, sauf conséquences documentées de C1, C8 et C11 : arcs plus Samouraï, wakizashi moyen ; avec Force 2, les dégâts au yumi passent de 5g2 à 4g2 (spec v1 « arc : dégâts sur la force de l'arc »), T14 Tsuruchi : 7g2 → 6g2 |

Interface et mobile :
| # | Parcours | Attendu |
|---|---|---|
| E24 | Mobile 360 px, fiche avec 2 bonus de jet | 3 lignes par bonus, aucun texte tronqué |
| E25 | « Edit » sur Compétences puis sur Armes | deux blocs en édition, les autres en lecture ; « Terminer » referme un seul bloc |
| E26 | Mobile, appui sur le résumé des blessures | bloc vertical sous la barre, 8 lignes, niveau courant surligné |
| E27 | Force de la Terre, 11 blessures | résumé, tuile et détail : pénalité +0 |
| E28 | Lanceur, dégâts au wakizashi | pas de case Vide ; au katana : « Vide : +1g1 aux dégâts (katana) » |

### E.11 Points ouverts du lot 12
| # | Point | Défaut |
|---|---|---|
| P12 | **Tranché le 24/10/2026** : moitié de l'excédent de la Feinte arrondie à l'inférieur (E-f). | Décision retenue |
| P13 | **Tranché le 24/10/2026** : le dé de bataille n'explose pas (E-g). | Décision retenue |
| P14 | Multiplicateur de blessures | Préférence, × 2 (E-d) |
| P15 | Libellés français définitifs (E.7) | Ceux du fichier de techniques français |
| P16 | Kyujutsu 7 et plafond de Force (C11) : le +1 s'ajoute-t-il avant ou après le plafond ? | Avant le plafond (un archer faible n'en profite pas) |
| P17 | **Tranché le 25/10/2026** : les dés de blessures de la bataille de masse n'explosent pas, comme le dé de bataille (E-g). | Décision retenue |
| P18 | **Tranché le 25/10/2026** : la Réduction (armure, techniques) s'applique aux blessures de bataille, encaissées comme des dégâts (F6). | Décision retenue |
| P19 | **Tranché le 25/10/2026** : la Gloire gagnée en bataille est affichée, pas ajoutée à la fiche. | Décision retenue |

### E.12 Écarts de mise en œuvre (v2.2.0)
- **L1** : les dés de plus des maîtrises Kenjutsu 3 et 7 (+1g0) viennent avec le catalogue de maîtrises (E.4, v2.4) ; la v2.2.0 livre l'explosion sur 9 (Kenjutsu 7 : 5g2 sur 9).
- **Tests** : l'ancienne fiche d'exemple (format v1, sans école) est conservée en `tests/fixtures/kakita-v1.json`, base des tests T1 à T42 et des parcours existants ; la nouvelle fiche d'exemple a ses propres cas (L22). `reference/perso-test-ecoles.json` est inchangé : son yumi garde le mot-clé Samouraï saisi, donc T1 à T24 ne changent que par C11 (T14 : 6g2, T23 : 4g2).
- **Alias de compétence** (`SKILL_ALIASES`) : ajoutés dès la v2.2.0 pour que la fiche d'exemple (vocabulaire E.7 : Courtisan, Art oratoire) réponde aux actions du catalogue (Courtoisie, Éloquence) ; le renommage proposé reste en v2.6.
- **Case « Monté »** : proposée aussi sans école quand la fiche porte un yumi ou un dai-kyu (C12), dans un encart « Monture » du panneau Posture.
- **Désarmement** (C6) : les dégâts liés passent à 2g1 sans la Force ni dés en plus ; le point de Vide n'y est pas proposé, même au katana.
- **Seuil de douleur bas** : ajouté au catalogue nommé des bonus (`appliesTo: wounds`, +5 à chaque niveau sauf Indemne), pour S5.
- **Écart d'arme** (C8) : signalé dans le bloc Armes en lecture, fiche modifiable seulement ; « Mettre à jour » reprend VD et mots-clés du livre, pas la compétence.

### E.13 Écarts de mise en œuvre (v2.3.0)
- **Logique de combat** dans `src/core/combat.ts` : restrictions de posture, Initiative, Feinte, encaissement, Concentration, opposition. Garde et Concentration lisent des effets de catalogue (`guard` : Daidoji R2, Shiba R1 ; `duelFocus` : Kakita R3, qui n'est plus un simple rappel).
- **Case « Monté »** : toujours dans le panneau Posture (F2 en a besoin pour toutes les fiches), plus dans l'encart « Techniques d'école ».
- **Encaisser** (F6) : un bouton « Dégâts… » à côté du compteur ouvre une ligne pleine largeur (dégâts, Vide −10, aperçu, « Encaisser »), comme l'éditeur d'armure, pour ne pas grandir la barre collante sur mobile. Le −10 du Vide est doublé par Shiba R5, comme le Vide en armure.
- **+10 Initiative (Vide)** : cumulable, remis à zéro par un nouveau jet d'Initiative (nouvelle escarmouche). « Échanger l'Initiative » dépense le point ; l'échange se fait à la main.
- **Opposition** (F7) : sans augmentation, un total égal donne « Égalité » ; avec N augmentations, il faut au moins 5 × N d'écart.
- **Augmentations gratuites → ND** (F8) : toutes les augmentations gratuites du jet (saisies et techniques) sont converties ; elles ne comptent plus au résultat.
- **Garde de Daidoji R2** : le « round de plus » est affiché ; la case reste cochée tant que tu ne la décoches pas (« Nouveau round » ne la touche pas).

### E.14 Écarts de mise en œuvre (v2.4.0)
- **Maîtrises = effets d'école** : `activeEffects(c)` renvoie les effets de l'école puis ceux des maîtrises (`masteryEffects`), avec `source` « Kenjutsu 3 » et `mastery` (nom de la compétence de la fiche). Tout le moteur existant (réserves, ND d'armure, manœuvres, rappels, cases à cocher) les lit sans cas particulier. Dans `on`, « own » désigne les jets de la compétence maîtrisée (maîtrise 10 de toute compétence).
- **Extensions du format d'effet** : `roll.explodeOn` (Kenjutsu et Armes lourdes 7, remplace `MASTERY.explodeOn9`) ; `bowStrength` (Kyujutsu 7, remplace `MASTERY.bowStrength`) ; `terrain` (Athlétisme 3 et 5) ; `voidRecovery` (Méditation 3 et 7, lu par `meditationVoidPoints`, prêt pour la v2.5) ; `heavyArmor` (Hida R1, ajouté à `src/rules/ecoles-bushi.json`, `reference/` inchangé) ; `When.weapon.skill` (compétence de l'arme) et `When.weapon.names` (sai, jitte).
- **Iaijutsu 7 et Équitation 3** : entrées du catalogue sans effet, pour mémoire ; leurs règles restent portées par `DUEL_ASSESSMENT_WIN` et `MOUNTED_ASSAULT_RIDING` (v2.3).
- **Armes ninja** (Ninjutsu 3 et 7) : reconnues à la compétence de l'arme (Ninjutsu), comme les épées (Kenjutsu).
- **Désarmement** : les dégâts d'un Désarmement réussi (2g1) ne reçoivent plus aucun effet de jet, ni de maîtrise ni de technique (E.12 : « ni dés en plus »).
- **Armures** : `ARMOR_CATALOG` dans `src/rules/l5r4e.ts` (pas de fichier JSON, cinq lignes). Les effets ne suivent que `armor.catalogId` : une armure saisie à la main, même nommée « Armure lourde », n'en a pas. Le malus d'armure lourde vaut pour tous les jets de compétence et de trait sur Agilité ou Réflexes, **attaques comprises**, pas pour l'Initiative ni les dégâts ; il s'affiche au ND final (« + 5 armure ») et en note du lanceur (jets en opposition compris). Cavalerie : l'écart à cheval (+8) s'ajoute au bonus saisi. « Personnalisée » retire `catalogId` et garde les valeurs.
- **Panneau des rappels** : « Rappels d'école », « Rappels de maîtrise » ou « Rappels » selon ce qu'il contient.
- **L22** (fiche d'exemple) : inchangé, aucune compétence de la fiche n'atteint un rang de maîtrise.
- **Tests** : `tests/core.masteries.spec.ts` (maîtrises, L1 à L4, L8, L9, armures) et `tests/ui/masteries.spec.tsx` (badge, rappels, terrain, armure du livre). L1 et E11 passent à 6g2 avec Kenjutsu 3 ou 7.

### E.15 Écarts de mise en œuvre (v2.5.0)
- **Multiplicateur de blessures** : bouton d'en-tête « Blessures : Terre × N » à côté du thème, qui passe de × 2 à × 5 puis revient à × 2 (icône seule sur mobile, M11). Préférence `woundMultiplier`, gardée d'une fiche à l'autre. Dans le moteur, champ facultatif `woundMultiplier` de `SchoolContext`, lu par `woundThresholds` ; `contextOf(ui)` le transmet, donc barre d'état, détail, lanceur et statistiques suivent.
- **Nouvelle journée** : `newDay(c)` et `dailyHealing(c)` dans `src/core/recovery.ts` (données `DAILY_HEALING`). Bouton « Nouvelle journée… » en tête de fiche (fiche modifiable seulement, absent en consultation), aperçu (« Vide 0 → 2 ; blessures 20 → 15 ») puis « Confirmer la nouvelle journée » ou « Annuler ». Remet aussi à zéro les effets du round (Vide en armure, Défense totale, Garde, Centre), les dégâts en attente et le duel en cours, en plus de l'initiative, du Vide d'Initiative et des compteurs.
- **Méditation** : action `meditate` du catalogue (Méditation/Vide ND 20, spécialisation « Récupération du Vide »), champ facultatif `ActionDef.group` titré dans la liste d'actions (« Repos »). Le bouton « Réussi : +N point(s) de Vide » est dans le lanceur, **que le lanceur de dés soit affiché ou non** (jet aux vrais dés) ; désactivé quand le Vide est plein et en consultation. `meditate(c)` lit `meditationVoidPoints` (v2.4).
- **Tests** : `tests/core.recovery.spec.ts` (L17, L18, L25) et `tests/ui/recovery.spec.tsx` (préférence, nouvelle journée, méditation) ; M11 vérifie aussi le nouveau bouton d'en-tête.

### E.16 Écarts de mise en œuvre (v2.6.0)
- **Catalogues** : actions, `ARMOR_CATALOG`, `ecoles-bushi.json` (Hida R1 : sauf Discrétion) et `ecoles-courtisans.json` emploient Vigilance, Courtisan, Étiquette (Courtoisie), Discrétion, Représentation : Conte et Art oratoire. `reference/` est inchangé ; les tableaux des annexes C et D gardent l'ancien vocabulaire (cas T1 à T42 tels que validés).
- **Alias** : `SKILL_ALIASES` met le nouveau nom en premier, puis l'ancien libellé français, puis l'anglais ; `EMPHASIS_ALIASES` : Courtoisie, Politesse, Courtesy. Une fiche v2.5 répond donc aux actions et techniques sans renommage.
- **Renommage** : données `VOCABULARY_UPDATES` (`src/rules/l5r4e.ts`), moteur `vocabularyChanges(c)` et `updateVocabulary(c)` (`src/core/vocabulary.ts`). Sont renommés : les noms de compétence, la spécialisation Politesse **sous Étiquette seulement**, et la compétence visée par un bonus de jet (`modifiers[].skill`). Comparaison normalisée (accents, casse) ; une compétence n'est pas renommée si la fiche porte déjà le nouveau nom (pas de doublon), une spécialisation non plus.
- **Bandeau** : en tête de fiche, fiche modifiable seulement (absent en consultation). « Mettre à jour le vocabulaire (Courtoisie → Courtisan, …) » avec **Plus tard** et **Mettre à jour…** ; l'aperçu liste chaque renommage (« Compétence : « Courtoisie » → « Courtisan » », « Spécialisation (Étiquette) : … », « Bonus « Voix » : … ») avec **Annuler** et **Renommer**. Après renommage, **Annuler le renommage** rend la fiche d'avant tant qu'elle n'a pas changé depuis. État dans `ui.vocabulary` (action `vocabulary` : `update`, `undo`, `hide`), remis à zéro à l'ouverture d'une fiche. Pas de fenêtre d'import : le renommage ne change que des libellés, l'aperçu tient dans le bandeau.
- **Tests** : `tests/core.vocabulary.spec.ts` (L23, libellés, alias, cas limites, non-régression de toutes les écoles avant et après renommage) et `tests/ui/vocabulary.spec.tsx` (bandeau, aperçu, renommage, annulation, consultation, Vigilance). Les tests existants gardent leurs fiches à l'ancien vocabulaire, couvertes par les alias.

### E.17 Écarts de mise en œuvre (v2.7.0)
- **Données** : `src/rules/table-bataille.json`, copie exacte de `reference/` (vérifiée par un test), lue par `src/rules/l5r4e.ts` : `BATTLE_TABLE` (cases `{ wounds, glory, event }`), `BATTLE_COLUMNS` (ordre d'engagement, décalage de l'état), `BATTLE_EVENT_LABELS`, plus `ENGAGEMENTS`, `ARMY_STATUSES`, `BATTLE_COMMAND` (5 d'écart) et `BATTLE_ROLL` (Tacticien ±5).
- **Moteur** (`src/core/battle.ts`) : `armyStatus(gap)` (écart ≥ 5 : gagne ; ≤ −5 : perd ; sinon égalité), `battleRollBonus(c)` et `battleRollTotal(c, die)` (1d10 + Anneau d'Eau + Bataille), `battleOutcome(total, engagement, status)` (case, ligne, colonne et décalage) et `rollBattleDice(n, rng)`. Un total sous 1 (Tacticien −5) prend la **première** ligne, au-delà de 30 la dernière.
- **Panneau « Bataille de masse »** dans l'aide de jeu, sous « Nouveau round », en Bataille seulement : case « Je commande l'armée » (écart de Commandement saisi, négatif si tu perds, → « Ton armée gagne / Égalité / Ton armée perd ») ou boutons Gagne / Égalité / Perd ; boutons d'engagement ; jet de bataille ; case de la table. Le « i » du panneau détaille l'engagement et le calcul (« Total 14 (Tacticien +5) → ligne 13-15 ; colonne Engagé, décalée de 1 »). La carte d'information « Niveau d'engagement » est retirée, son contenu passe dans le panneau.
- **Jet de bataille** : un champ « Total du jet » (1d10 + Eau + Bataille, **sans** le Tacticien) toujours modifiable ; avec le lanceur affiché, « Lancer 1d10 » le remplit et affiche le d10. **Tacticien** : case, puis +5 ou −5 (+5 par défaut), ajouté au total pour lire la table.
- **Dés de blessures** : **sans explosion**, comme le dé de bataille (E-g, P17) ; additionnés. L'encaissement réutilise le composant **Encaisser** de la barre d'état (F6 : Réduction, Vide −10 ; la Réduction s'applique, P18), pré-rempli par « Lancer les dés de blessures (Nd10) » avec le lanceur affiché, à saisir sinon. Après l'encaissement, « Blessures du tour encaissées » ; rien à encaisser en consultation.
- **Gloire et événements** (Duel, Occasion héroïque) : affichés seulement ; la Gloire de la fiche n'est pas modifiée (P19).
- **État** : `ui.battle` (non persisté). « Nouveau round » efface l'écart, le jet et les dés de blessures, et garde le commandement, l'état choisi, l'engagement et le Tacticien ; « Nouvelle journée » remet tout à zéro. Changer l'état, l'engagement ou le jet remet à zéro les dés de blessures du tour.
- **Tests** : `tests/core.battle.spec.ts` (L19, table, commandement, jet, bornes) et `tests/ui/battle.spec.tsx` (panneau, L19, commandement, vrais dés, lanceur et Tacticien, nouveau round, consultation) ; Playwright M15 (mobile et 360 px).

### E.18 v2.8.0 — Bloc « Armure » de la fiche
Statut : **validé par Nelson le 24/10/2026**, absent de la v2.7.0 (ajouté au HANDOFF de conception après le départ du lot 12). Une PR, version **v2.8.0**, format de fiche inchangé (`schemaVersion` 2, `armor.catalogId` déjà présent).

- **Place** : nouveau bloc « Armure » de la fiche, entre « Armes » et « Techniques d'école », avec son bouton **Edit** (S2). Les champs Armure, Bonus d'armure et Réduction **sortent du bloc Identité**.
- **Lecture** :
  - nom de l'armure, avec l'étiquette « armure du livre » (`catalogId` présent) ou « armure personnalisée » ;
  - **ND d'armure détaillé**, posture de référence Attaque : « 5 × Réflexes 3 + 5 + armure 5 = 25 », puis les bonus automatiques des techniques et maîtrises (« + 3 Défense 5 » s'il y a lieu) ; armure de cavalerie : valeur à cheval en plus ;
  - **Réduction totale** : armure + techniques (« armure 3 + Hida R2 2 = 5 ») ;
  - **règle spéciale** de l'armure du catalogue (`ARMOR_CATALOG`), résumée (« +5 au ND des jets d'Athlétisme et de Discrétion »), avec la technique qui l'annule (« Hida R1 : ignorée sauf Discrétion ») ;
  - bonus d'armure à cocher en combat (techniques, bonus de jet `armor` facultatifs), en rappel : « À cocher en combat (panneau Posture) : … ».
- **Édition** : composant `ArmorCatalog` (liste « Armure du livre ») puis nom, bonus au ND, Réduction, comme l'éditeur de la barre d'état. Choisir une armure du livre remplit les trois valeurs ; modifier ensuite bonus ou Réduction retire `catalogId` (« armure personnalisée », E.14).
- **Barre d'état** : les tuiles ND armure et Réduction ouvrent toujours l'éditeur rapide ; bloc et éditeur restent synchronisés.
- **Consultation** : bloc en lecture, sans bouton Edit.
- **Fiche d'exemple** : `reference/exemple-personnage.json` porte désormais `"catalogId": "light"` sur son armure légère (fourni), pour afficher « armure du livre » et sa règle spéciale.

Tests :
| # | Cas | Attendu |
|---|---|---|
| L28 | Bloc Armure : armure légère, Réflexes 3 ; Athlétisme/Force ; Hida R1 avec armure lourde : Discrétion, Kenjutsu | ND 25, Réduction 3 ; ND du jet +5 ; Discrétion ND +5, Kenjutsu sans pénalité |
| E29 | Fiche : bloc Armure, Edit, choix « Armure lourde » puis bonus modifié à 8 | ND +10 / Réduction 5, puis « armure personnalisée » ; barre d'état à jour |
| E30 | Identité en édition | plus de champs d'armure |
| M16 | Bloc Armure sur mobile, à 360 px | ND et Réduction côte à côte, règle spéciale lisible, aucun texte tronqué |

### E.19 v2.8.0 — Retouches d'interface (25/10/2026)
Demandées par Nelson le 25/10/2026 après essai de la v2.7.0. Même PR que E.18.

| # | Retouche | Comportement attendu |
|---|---|---|
| S6 | **Multiplicateur de blessures masqué** | Le bouton d'en-tête « Blessures : Terre × N » (goutte) est **retiré de l'affichage pour le moment**. Le moteur et la préférence restent (`woundMultiplier`, L25 inchangé côté moteur), mais l'interface utilise **× 2** quelle que soit la valeur enregistrée, tant que le bouton est masqué (constante `SHOW_WOUND_MULTIPLIER = false`). M11 : l'en-tête mobile revient à 3 icônes. |
| S7 | **Nom sur deux lignes au plus** | Le nom du samouraï (`h1` de l'en-tête) tient en **2 lignes maximum** : la taille de police baisse de 1 px en 1 px jusqu'à ce qu'il tienne, **sans minimum** (garde-fou technique à 8 px) et **sans coupure « … »**. Recalcul au changement de nom et de largeur de fenêtre. |
| S8 | **Sous-titre de l'en-tête** | Sous le nom, seulement **le nom d'école affiché et le rang d'école** : « École de bushi Kakita · Rang 1 » (espace insécable dans « Rang 1 »), le rang étant `schoolRankOf(c)` (rang d'école saisi, sinon Rang d'Insight). Plus de famille. Sans école affichée : « Rang 1 ». Le clan reste au-dessus du nom. |
| S9 | **École (nom affiché) pré-remplie** | Dans le bloc Identité en édition, choisir une école dans « Techniques d'école » remplit **« École (nom affiché) »** avec le nom de l'école du catalogue (« École de bushi Kakita »). Le champ reste modifiable ensuite ; il n'est réécrit qu'au prochain changement de « Techniques d'école ». Choisir « — Aucune » ne vide pas le champ. Même chose pour le bouton « Associer » du bloc Techniques d'école. Le bloc Techniques d'école garde son bouton Edit et sa liste « Autres techniques, kata, sorts » (S10 proposée puis abandonnée le 25/10/2026). |
| S11 | **Ligne Blessures et Vide** | Le libellé « Blessures » au-dessus du compteur est **retiré**. La ligne ne contient plus que la tuile **« Blessures »** (S14) et le bloc Vide. **Mobile** : le bloc « Vide N/M » (libellé court, « Points de » masqué) occupe **au plus la moitié de la largeur** ; les pastilles se répartissent sur cette largeur (`repeat(N, minmax(0, 40px))`, rond visible à 65 %) et **rétrécissent** au lieu de déborder. Bureau : libellé « Points de Vide N/M » inchangé. |
| S12 | **Pas de séparateur (mobile)** | Essayé puis retiré le 25/10/2026 : aucun filet entre la ligne « Blessures… / Vide » et les tuiles Dépl., ND armure, Réduction, Pénalité. |
| S13 | **Détail des blessures (mobile), dessin** | Retour au dessin de la maquette du 24/10 (préféré par Nelson) : **une seule carte** (fond `--surface`, filet, coins 8 px), une ligne par niveau séparée par un **pointillé**, colonnes nom / intervalle / pénalité ; niveau courant sur fond rouge pâle, en gras, coins arrondis ; niveaux dépassés atténués (50 %). Plus de cartes séparées par ligne. |
| S14 | **Tuile et panneau « Blessures »** | Le bouton « Dégâts… » devient une **tuile « Blessures »**, même dessin que les tuiles de combat (fond `--surface`, filet, coins 6 px) : ligne 1, libellé « BLESSURES » à gauche et total « 2/38 » à droite (mono) ; ligne 2, « Ajuster / Encaisser ▾ » (▴ ouvert). **Mobile** : la tuile occupe toute la colonne de gauche **jusqu'au bloc Vide** (colonnes `minmax(0, 1fr) fit-content(50 %)` : le Vide prend sa largeur utile, au plus la moitié) ; la tuile reste **toujours sur deux lignes** : si la place manque, la police de la 2e ligne baisse avec la largeur de la tuile (`container-type: inline-size`, `font-size: min(14px, 100cqi / 9.4)`), jamais de retour à la ligne ni de « … ». Bureau : tuile compacte (150 px mini). Elle ouvre la ligne pleine largeur sous la barre, qui contient **en tête « Ajuster » avec −, le champ et +** (corrections, soins, blessures sans Réduction), un pointillé, puis **« Dégâts de l'attaque »** (Réduction et Vide −10 appliqués), Vide −10, aperçu et « Encaisser ». Le panneau reste ouvert après −, + ou une saisie ; « Encaisser » le referme. La bataille de masse réutilise le panneau **sans** la ligne − / + (`counter` faux). Consultation : nombre affiché, pas de tuile. Noms accessibles : « Blessures : ajuster ou encaisser des dégâts », « Blessures subies » pour le champ. |

Tests :
| # | Cas | Attendu |
|---|---|---|
| E31 | En-tête, multiplicateur enregistré à × 3 | pas de bouton goutte ; seuils de blessures à × 2 |
| E32 | Nom « Kakita Haruto no Hikaru-sama des Plaines du Matin » à 360 px et 1200 px | 2 lignes au plus, nom complet affiché sans « … » (360 px : police réduite, environ 12 px) |
| E33 | En-tête de la fiche d'exemple | sous-titre « École de bushi Kakita · Rang 1 » |
| E34 | Identité : choisir Hiruma, renommer « École Hiruma (variante) », puis choisir Kakita | champ = nom Hiruma, puis texte saisi gardé, puis nom Kakita |
| M17 | Barre d'état à 360 et 390 px, Anneau de Vide 2 puis 6 | bloc Vide ≤ 50 % de la largeur, à droite de « Dégâts… » sans chevauchement ; 6 pastilles sur une ligne, réduites ; pas de libellé « Blessures » |
| M18 | Barre d'état à 360 px : tuile « Blessures », + deux fois, puis 12 dégâts avec armure légère ; Vide 2 puis 6 | tuile de la marge gauche jusqu'au Vide, « 2/38 » ; panneau Ajuster / Dégâts de l'attaque ; « Encaisser » : 11 blessures, panneau refermé ; avec 6 points de Vide, tuile toujours sur 2 lignes (police de la 2e ligne réduite), aucun « … » |

**Prototype v2.8.0** : `reference/prototype.html` = v2.7.0 en ligne + E.18 et E.19, construit à partir d'une branche locale non poussée (`proto-v2.8`). Points d'implémentation retenus dans ce prototype, à reprendre ou améliorer :
- `SHOW_WOUND_MULTIPLIER` et `shownWoundMultiplier(n)` dans `src/rules/l5r4e.ts`, utilisés par `contextOf` et les statistiques ; bouton d'en-tête rendu seulement si la constante est vraie.
- Panneau Blessures : prop `counter` de `TakeDamage` (barre d'état : vrai ; bataille : faux).
- `FitName` dans `Header.tsx` : paliers de 1 px sans minimum (garde-fou 8 px), pas de coupure, recalcul au redimensionnement.
- Bloc Armure : composant `Armor` dans `Sheet.tsx`, `BlockId` « armor » ; le ND affiché = 5 × Réflexes + 5 + bonus + `schoolArmorBonus` d'office (posture Attaque), sans les bonus de jet `armor` à cocher.
- Tests existants à mettre à jour (échouent avec ces changements, comportement voulu) : en-tête « famille, école et Rang » (`tests/ui/app.spec.tsx`), armure dans le bloc Identité (`tests/ui/masteries.spec.tsx`), bouton du multiplicateur (4 cas de `tests/ui/recovery.spec.tsx`, à garder côté moteur pour L25).

### E.20 Écarts de mise en œuvre (v2.8.0)
- **Moteur** : `armorSheet(c)` dans `src/core/armor.ts` réunit le bloc Armure : armure du livre, ND en posture Attaque (`5 × Réflexes + 5 + bonus`, puis les bonus d'office : techniques et maîtrises `auto`, et bonus de jet `armor` en mode « toujours », comme la tuile ND armure de la barre d'état sans rien de coché), ND à cheval pour l'armure de cavalerie (« ; à cheval 32 »), Réduction (armure, puis chaque technique avec sa source), technique qui lève le malus d'armure lourde (affichée seulement avec une armure lourde ou de cavalerie), et bonus à cocher en combat (techniques facultatives, compteurs « +5 × Touches au corps à corps », bonus de jet facultatifs).
- **Édition** : `ArmorFields` (`ArmorCatalog.tsx`) sert au bloc Armure et à l'éditeur de la barre d'état ; le champ du nom s'appelle « Nom » dans les deux. Changer le bonus ou la Réduction retire `catalogId` ; changer le nom le garde.
- **Fiche d'exemple** : `reference/exemple-personnage.json` ne portait pas encore `"catalogId": "light"` : ajouté dans cette PR (la fiche téléchargeable de la Bibliothèque la reprend).
- **Identité** : le bloc ne montre plus l'armure, ni en lecture ni en édition.
- **Vide** : le libellé existe en deux versions, « Points de Vide N/M » (bureau) et « Vide N/M » (mobile), l'une ou l'autre masquée par le CSS.
- **Tuile Blessures** : le panneau de la barre d'état intitule son champ « Dégâts de l'attaque » ; la bataille de masse garde son libellé (pas de ligne Ajuster). En consultation : « Blessures » et le nombre, sans tuile.
- **Nom** (`FitName`) : recalcul aussi après le chargement des polices embarquées (`document.fonts.ready`), qui change la largeur du texte.
- **École** : `chooseSchool` remplit « École (nom affiché) » pour la liste « Techniques d'école » et le bouton « Associer ».
- **Tests** : `tests/core.armor.spec.ts` (L28, Réduction des techniques, bonus d'office, cavalerie, bonus à cocher) ; `tests/ui/v280.spec.tsx` (bloc Armure, E29, E30, consultation, E33, E34, « Associer », tuile Blessures) ; E31 remplace les 4 cas du bouton multiplicateur de `tests/ui/recovery.spec.tsx` (L25 reste côté moteur) ; Playwright E32 (`tests/e2e/header.spec.ts`), M16 à M18 (`tests/e2e/mobile.spec.ts`), M8 et M11 mis à jour (panneau Blessures ouvert, 3 icônes d'en-tête). Les tests qui utilisaient −, + ou « Blessures subies » ouvrent d'abord la tuile (`tests/helpers/wounds.ts`, `tests/e2e/wounds.ts`).

---

