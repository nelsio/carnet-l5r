## Annexe F — Lot 13 : shugenja et Magie (v2.9.0 à v2.12.0)

Statut : **validé par Nelson le 28/10/2026** (visuel du prototype et découpage en quatre versions). Les kata sont reportés à un lot ultérieur. Quatre versions, une PR par version (F-g). Format de fiche : `schemaVersion` 2 inchangé, **trois champs facultatifs** ajoutés (comme `modifiers`). Source : livre de base 4e, **pages du PDF**. Règles résumées, aucun texte du livre ; **pas de catalogue de sorts** : chaque joueur saisit ses sorts dans le Rouleaux & invocations.

### F.1 Décisions
| # | Sujet | Décision |
|---|---|---|
| F-a | Périmètre | Écoles de shugenja du livre de base (F.4), jet de sort, affinité et déficience, emplacements de sorts, section Rouleaux & invocations en champs libres, situation « Magie ». **Hors périmètre** : catalogue de sorts, maho (Chuda de l'Araignée, p. 215 et 270-276), kiho (p. 263-265), kata (lot ultérieur), sorts en rituel combiné. |
| F-b | Rouleaux & invocations | Section de fiche en **champs libres**, comme le bloc Armes : le joueur recopie les caractéristiques de ses sorts (F.3) et résume l'effet avec ses mots. |
| F-c | Sorts universels | Les trois sorts connus de tout shugenja (Sense, Commune, Summon, p. 166) sont proposés en un clic (« Ajouter les sorts universels ») avec nom, élément « Tous », maîtrise 1 ; le reste est à compléter. Noms français à confirmer (P20). |
| F-d | Emplacements | Persistés dans la fiche (comme les blessures) ; remis à zéro par « Nouvelle journée ». |
| F-e | Rang de lancement | Le **rang d'école** (`schoolRankOf`) sert au jet et à la limite de maîtrise ; l'affinité et la déficience ne changent que le jet (p. 166). |
| F-f | Nom | Onglet de l'aide de jeu **« Magie »** ; section de fiche **« Rouleaux & invocations »** (bloc `magic`). |
| F-g | Découpage | **v2.9.0** Rouleaux & invocations (champ `spells`, section de fiche, sorts universels, fusion ; aucun moteur) → G15 ; **v2.10.0** Écoles de shugenja (catalogue, choix dans Identité, affinité Isawa, étiquettes Affinité / Déficience) → G2 (affichage), G5 (affinité) ; **v2.11.0** Situation Magie et lanceur de sort (jet, ND, augmentations, temps d'incantation, options d'école, dégâts de sort, Sortilèges 5, Statistiques) → G1 à G6, G9 à G13 ; **v2.12.0** Emplacements et combat (champ `spellSlotsUsed`, ligne Sorts et panneau, décompte, Nouvelle journée, sorts en escarmouche avec postures et Centre, Rester concentré) → G7, G8, G14, G16, G17, E36. |

### F.2 Règles (p. 82, 140, 165-166)
- **Jet de sort** : (Anneau de l'élément + rang d'école effectif) g Anneau. Explosion sur 10, augmentations (5 au ND chacune, au plus l'Anneau de Vide), point de Vide +1g1, règle des dix dés, pénalité de blessure au ND : comme les autres jets.
- **Rang d'école effectif** : rang d'école **+1** pour l'élément d'affinité, **−1** pour l'élément de déficience. À 0, l'élément ne peut pas être lancé (« Déficience : impossible au rang 1 »).
- **ND** = 5 + 5 × maîtrise du sort.
- **Limite** : pas de sort de maîtrise supérieure au rang d'école (carte grisée, raison affichée, « Lancer quand même »).
- **Temps d'incantation** = maîtrise en actions complexes ; chaque augmentation annoncée pour ça le réduit de 1, minimum 1.
- **Emplacements par jour** : autant que l'Anneau dans chaque élément (Vide compris), plus des **emplacements libres** = Anneau de Vide, utilisables pour n'importe quel élément. Un lancer **raté consomme** l'emplacement ; un sort réussi puis **interrompu ne le consomme pas** (jet de Volonté ND 10, ou 5 + dégâts subis, pour ne pas être interrompu).
- **Sort universel** (élément « Tous ») : l'élément est choisi au lancement (Anneau et emplacement de cet élément).
- **Parchemin** : un sort non mémorisé se lance parchemin en main ; mémoriser un sort coûte autant d'XP que sa maîtrise (p. 166) — rappel, pas de calcul d'XP.
- **Sortilèges (Spellcraft) 5** : +1g0 aux jets de sort (maîtrise, p. 140), ajoutée au catalogue de maîtrises (`maitrises.json`, `on: ["spell"]`).

### F.3 Caractéristiques d'un sort (Rouleaux & invocations)
`Character.spells` (facultatif) : liste de sorts, fusion par `id` puis nom (§8).
```ts
interface Spell {
  id: string; name: string;                        // « Feux intérieurs »
  element: "air" | "earth" | "fire" | "water" | "void" | "all";   // « all » : sort universel
  mastery: number;                                 // 1 à 6 (niveau de maîtrise)
  keywords: string[];                              // Bataille, Artisanat, Défense, Divination, Illusion, Jade, Tonnerre, Voyage, Protection, ou libre
  range: string; area: string; duration: string;   // « 30 pieds », « une cible », « 5 rounds »
  raises: string;                                  // augmentations propres, une par ligne : « Portée (+10 pieds) »
  damage?: string;                                 // VD facultative (« 2k2 ») : ajoute l'action « Dégâts · <sort> »
  memorized: boolean;
  effect: string;                                  // résumé libre du joueur
}
```
Autres champs facultatifs : `affinity?: Ring` (écoles à affinité au choix : Isawa) et `spellSlotsUsed?: Partial<Record<Ring | "free", number>>`.

### F.4 Écoles de shugenja (catalogue `src/rules/ecoles-shugenja.json`)
Une seule technique par école (rang 1) ; les rangs suivants apportent des sorts (rappel « Rang N : nouveaux sorts », sans effet). Champ `spellcasting` : `affinity`, `deficiency` (élément, `"choice"` ou `null`), `freeRaiseKeywords` (mots-clés qui donnent une augmentation gratuite), `freeRaiseAffinity` (Isawa), `options` (cases du lanceur de sort), `startingSpells` (rappel), `page`.

| École (clan, page) | Affinité / déficience | Technique, effet encodé |
|---|---|---|
| Kuni (Crabe, p. 109) | Terre / Air | +1g0 au jet si la cible n'est pas humaine (case) ; dégâts de sort +1g1 contre une cible souillée (case) ; augm. gratuite : Jade |
| Asahina (Grue, p. 112) | Air / Feu | rappel : Vide → dégâts adverses −0g1 à 20 pieds pendant le rang d'école en rounds ; augm. gratuite : Défense |
| Tamori (Dragon, p. 115) | Terre / Air | rappel : un emplacement pour stocker un sort à une cible dans une potion ; augm. gratuite : Artisanat |
| Kitsu (Lion, p. 120) | Eau / Feu | rappel : jet de sort (Eau) contre Volonté × 5 pour connaître les avantages spirituels ; augm. gratuite : Bataille |
| Moshi (Mante, p. 123) | Air / Terre | affinité Feu en plus le jour (case « Il fait jour ») ; augm. gratuite : Tonnerre |
| Isawa (Phénix, p. 126) | au choix (Vide compris) / aucune | augm. gratuite sur tous les sorts de l'élément d'affinité |
| Agasha (Phénix, p. 127) | Feu / Eau | option : 1 point de Vide pour lancer avec un autre Anneau (emplacement de cet Anneau) ; augm. gratuite : Artisanat |
| Soshi (Scorpion, p. 129) | Air / Terre | option : un emplacement de plus du même élément, sort non offensif sans signe visible ; augm. gratuite : Illusion |
| Iuchi (Licorne, p. 133) | Eau / Feu | rappel : un emplacement (action complexe) pour donner une action de déplacement simple à une cible ; augm. gratuite : Voyage |
| Komori (Chauve-souris, p. 219) | Air / Terre | rappel : un emplacement pour un message murmuré (30 s par rang, 100 miles par rang) |
| Tonbo (Libellule, p. 220) | Eau / Feu | option sur les jets sociaux : dépenser 1 emplacement par +1g0, au plus le rang d'école ; augm. gratuite : Divination |
| Kitsune (Renard, p. 222) | Terre / Air | rappel : sorts universels sur les esprits animaux ; augm. gratuite sur un sort non offensif visant un animal (case) |
| Chuda, école originale (p. 226) | Terre / Air | rappel : Vide → Réduction d'une cible −rang d'école ; + rang d'école aux dégâts de sort contre une cible souillée (case) |
| Seppun (Impérial, p. 231) | Feu / Eau | augm. gratuite pour protéger l'Empereur ou sa famille (case) ; augm. gratuite sur les sorts propres aux familles impériales (case) |

Les écoles s'ajoutent au sélecteur « Techniques d'école » du bloc Identité, groupées par clan (Chauve-souris, Libellule, Renard, Chuda : groupe « Clans mineurs »). Un shugenja est une fiche dont l'école a `class: "Shugenja"`, ou qui a au moins un sort.

### F.5 Interface
- **Bloc Identité (édition)** : école Isawa → liste « Affinité » (Air, Terre, Feu, Eau, Vide). Lecture : « Affinité Terre · Déficience Air » sous l'école dans le bloc Techniques d'école.
- **Section « Rouleaux & invocations »** (fiche, après Techniques d'école, bouton Edit, shugenja seulement ou s'il contient des sorts) :
  - **lecture** : une carte par sort, triée par élément puis maîtrise : nom ; étiquette d'élément (couleur de l'Anneau) ; « Maîtrise 2 · ND 15 » ; « mémorisé » ou « parchemin » ; ligne Portée · Zone · Durée ; mots-clés en étiquettes ; augmentations (une par ligne) ; VD si présente ; effet.
  - **édition** : une carte par sort (comme les bonus de jet sur mobile) : Nom, Élément, Maîtrise, Mots-clés (liste à cocher + libre), Portée, Zone, Durée, Augmentations (zone de texte), VD, Mémorisé, Effet ; « + Sort » et « Ajouter les sorts universels ».
  - en tête du bloc : rappel des sorts de départ de l'école (« Départ : universels, 3 Terre, 2 Feu, 1 Eau »).
- **Barre d'état** (shugenja seulement) : ligne **« Sorts »** sous les tuiles, six mini-tuiles **Air, Terre, Feu, Eau, Vide, Libres** « restants/max » (bordure haute à la couleur de l'Anneau, comme le bloc Anneaux). Appui → éditeur pleine largeur (comme l'armure) avec − / + par ligne. À 360 px, les six tiennent sur une ligne.
- **Aide de jeu, situation « Magie »** (shugenja seulement ; sur mobile, les 5 situations tiennent sur une ligne sans défilement) :
  - groupes par élément ; carte « Lancer · <sort> » : réserve, « ND 15 · 2 actions », mots-clés ; grisée avec la raison si maîtrise > rang ou rang effectif 0 ;
  - « Dégâts · <sort> » rattachés (comme une arme) si VD : VD seule, sans Force, sans point de Vide ;
  - action **« Rester concentré (Volonté) »** après une interruption : Volonté, ND 10 (5 + dégâts subis à saisir).
- **Aide de jeu, Combat › Escarmouche** (v2.12.0, shugenja seulement) : groupe **« Sorts »** juste après l'Initiative, **avant** le groupe « Attaques » (armes et actions fixes, v2.17.0, annexe J.8), mêmes cartes que la situation Magie (ids préfixés `sk-`). Restrictions de posture (F2, p. 86) : **Assaut** « attaques seulement, pas de sort », **Défense totale** « actions gratuites seulement, pas de sort », **Centre** « aucune action ce round » ; Attaque et Défense permises ; carte grisée et « Lancer quand même ». Le bonus de Centre (F1) vaut pour un jet de sort. Le lanceur affiche la même restriction.
- **Lanceur d'un sort** :
  - réserve et origine (« Feu 3 + rang 1 + affinité 1 ») ; ND de base fixe ; augmentations (max Vide), dont **« Augm. pour le temps d'incantation »** → ligne « Temps d'incantation : N action(s) complexe(s) » ;
  - sort universel : choix de l'élément ; Agasha : case Vide + choix de l'Anneau ;
  - augmentations gratuites de l'école (mot-clé ou affinité) appliquées d'office, cases de l'école (cible non humaine, il fait jour…) ;
  - augmentations du sort rappelées en liste (texte du Rouleaux & invocations) ;
  - ligne **« Emplacement : Feu 2/3 »** (ou « libre 1/2 » si l'élément est épuisé ; « aucun emplacement » en rouge) ;
  - rappels : parchemin si non mémorisé, interruption (Volonté), effet du sort ;
  - avec le lanceur de dés : l'emplacement est dépensé au lancer (réussite ou échec), bouton « Annuler (interrompu) » ; sans lanceur : boutons **« Réussi »** et **« Raté »** qui dépensent l'emplacement.
- **Nouvelle journée** : emplacements remis à zéro (aperçu « Emplacements de sorts rechargés »).
- **Statistiques** : une ligne par sort du Rouleaux & invocations (réserve, chances aux ND 10 à 40).

### F.6 Tests
Personnage : `reference/perso-test-shugenja.json` (Kuni rang 1, Terre 3, Air 2, Feu 2, Eau 2, Vide 2, Sortilèges 3).

| # | Cas | Attendu |
|---|---|---|
| G1 | Jet de sort Terre maîtrise 1 ; Feu ; Air (déficience) | 5g3 ND 10 ; 3g2 ; 2g2 (réserve affichée, carte grisée : G2) |
| G2 | Kuni rang 1, sort Air : rang effectif 0 | carte grisée « Déficience : impossible au rang 1 » |
| G3 | Sort Terre maîtrise 2, rang 1 | grisé « maîtrise 2 > rang 1 », lancer quand même possible |
| G4 | Sort Jade (Kuni) ; sort Bataille | 1 augmentation gratuite ; aucune |
| G5 | Isawa, affinité Vide, Vide 2, rang 1 : sort de Vide | 4g2, 1 augmentation gratuite |
| G6 | Maîtrise 3, 2 augmentations pour le temps | ND 20 + 10, 1 action complexe |
| G7 | Emplacements Terre 3, Vide 2 : 4 sorts de Terre lancés | Terre 0/3, libres 1/2 ; le 6e « aucun emplacement » |
| G8 | Lancer raté ; lancer réussi puis « Annuler (interrompu) » | emplacement dépensé ; rendu |
| G9 | Sort universel lancé en Feu | 3g2, emplacement Feu |
| G10 | Sortilèges 5 | +1g0, badge Maîtrise |
| G11 | Moshi, sort Feu, case « Il fait jour » | rang effectif +1 |
| G12 | Agasha, sort Feu lancé avec l'Anneau d'Eau (Vide) | réserve sur l'Eau, emplacement Eau, 1 point de Vide dépensé |
| G13 | Dégâts d'un sort VD 3k2 | 3g2, sans Force, pas de case Vide |
| G14 | Nouvelle journée | emplacements pleins |
| G15 | Fusion d'une fiche avec 2 sorts dont 1 modifié | Rouleaux & invocations fusionné par id |
| G16 | Escarmouche, posture Assaut ; Défense totale ; Défense | sorts grisés « attaques seulement » ; grisés « actions gratuites seulement » ; permis |
| G17 | Round après Centre, sort Terre maîtrise 1 avec le bonus de Centre | 6g4 + 2 (Vide 2) |
| E36 | Mobile 360 px : ligne Sorts, situation Magie, Rouleaux & invocations en édition | 6 tuiles sur une ligne ; 5 situations sur une ligne ; aucun débordement |

### F.7 Points ouverts
| # | Point | Défaut |
|---|---|---|
| P20 | Noms français : sorts universels, mots-clés, compétence Spellcraft | Sentir, Communier, Invoquer ; Bataille, Artisanat, Défense, Divination, Illusion, Jade, Tonnerre, Voyage, Protection ; « Sortilèges » (alias Spellcraft) |
| P21 | Rang d'école d'un shugenja avec plusieurs écoles | Rang d'école saisi, sinon Rang d'Insight |

### F.8 Écarts de mise en œuvre (v2.9.0)
- **Format** : `SpellSchema` dans `src/core/schema.ts`, maîtrise de **1 à 6** comme en F.3 (le prototype acceptait jusqu'à 10) ; VD vide acceptée (champ effacé = absent). `affinity` et `spellSlotsUsed` arrivent avec leurs versions (v2.10.0, v2.12.0) : d'ici là, une fiche qui les porte (dont `perso-test-shugenja.json`) se lit, ils sont ignorés.
- **Moteur** : `src/core/spells.ts` : `spellTn`, `sortSpells` (universels, puis Air, Terre, Feu, Eau, Vide ; maîtrise ; nom), `spellRaises`, `createSpell`, `isShugenja`. Constantes dans `src/rules/l5r4e.ts` : `ELEMENT_LABELS`, `SPELL_KEYWORDS`, `UNIVERSAL_SPELLS`, `SPELL_TN`.
- **Shugenja** : sans catalogue d'écoles de shugenja (v2.10.0), la section s'affichait aussi quand « École (nom affiché) » contenait « shugenja » ; ce relais est retiré en v2.10.0 (F.9). La section reste ouverte tant qu'on l'édite, même vidée.
- **Lecture** : les augmentations tiennent sur une ligne, séparées par « · » (comme le prototype) ; une ligne Portée · Zone · Durée seulement si l'un des trois est saisi.
- **Import** : l'aperçu de fusion nomme un sort ajouté « Sort ».
- **Tests** : `tests/core.spells.spec.ts` (format, G15, ND, tri, augmentations, shugenja) ; `tests/ui/spells.spec.tsx` (lecture, apparition, édition complète, suppression) ; Playwright M19 (`tests/e2e/mobile.spec.ts`, partie « Rouleaux & invocations en édition » de E36 à 360 px).

### F.9 Écarts de mise en œuvre (v2.10.0)
- **Catalogue** : `src/rules/ecoles-shugenja.json`, repris du prototype avec toutes les données de F.4 (options, rappels, `ringSwap` d'Agasha, sorts de départ), dont le lanceur de sort se servira en v2.11.0. Types `Spellcasting` et `SpellOption` dans `src/rules/ecoles.ts`. Les rangs 2 à 5 figurent au catalogue (« Rang N : nouveaux sorts », sans effet) : le prototype ne montrait que le rang 1.
- **Moteur** (`src/core/spells.ts`) : `spellcastingOf`, `affinityOf` (affinité de l'école, ou `affinity` de la fiche pour une école « au choix » ; ignorée sinon), `deficiencyOf`, `castingRank` (rang d'école ±1). G2 et G5 sont vérifiés sur le rang de lancement ; la réserve et la carte grisée arrivent avec la situation Magie (v2.11.0).
- **Shugenja** : seulement l'école de classe « Shugenja » ou au moins un sort ; le relais par le nom affiché (F.8) est retiré.
- **Nom court** : `shortSchoolName` ignore la précision entre parenthèses (« Komori », « Chuda »), pour les sources « Komori R1 » et la suggestion d'école.
- **Fiche** : `affinity` est gardée si l'on quitte l'école Isawa (sans effet ailleurs) ; « — à choisir » la retire. L'en-tête du bloc Techniques d'école reprend le clan du catalogue (« Clans mineurs » pour Komori, Tonbo, Kitsune, Chuda).
- **Tests** : `tests/core.shugenja.spec.ts` (catalogue, tableau F.4, groupes, nom court, suggestion, G2, G5, champ `affinity`) ; `tests/ui/spells.spec.tsx` (étiquettes d'affinité, rangs grisés, liste Affinité d'Isawa, sorts de départ) ; M19 choisit l'école Kuni dans la liste.

### F.10 Écarts de mise en œuvre (v2.11.0)
- **Moteur** : `PoolAction` gagne `spell` (sort, élément choisi d'un sort universel, `ring` d'Agasha, cases cochées) et `spellDamage`. `spellCast` donne l'élément, l'Anneau, le rang de lancement (affinité de l'école, de la fiche ou d'une case comme Moshi le jour) et les raisons des augmentations gratuites ; `spellDamage` la VD et les cases de dégâts (Kuni +1g1, Chuda + rang d'école au total). Un jet de sort explose sur 10, accepte un point de Vide (+1g1) et le bonus de Centre ; les dégâts de sort n'ont ni point de Vide, ni bonus de Centre, ni augmentation. Le rang 0 n'ajoute rien à la réserve (« 2g2 » en Air pour un Kuni de rang 1, carte grisée).
- **Élément d'un sort universel** : par défaut, celui à la plus grosse réserve (Anneau + rang de lancement), à égalité dans l'ordre Air, Terre, Feu, Eau, Vide ; c'est aussi celui de la carte et des Statistiques.
- **Agasha** : l'affinité et la déficience restent celles de l'élément du sort ; seul l'Anneau du jet change. Le point de Vide est dépensé au lancer du lanceur de dés (comme le point de Vide du jet) ; sans lanceur de dés, rien n'est dépensé (comme aujourd'hui pour le Vide).
- **Cases de l'école** : au jet, celles qui donnent des dés, une augmentation gratuite ou une affinité ; aux dégâts, celles de dégâts. La case de Soshi (emplacement de plus) arrive avec les emplacements (v2.12.0).
- **Restrictions** : rang de lancement 0 en premier (« Déficience : impossible au rang 1. »), puis maîtrise > rang (« Maîtrise 2 > rang 1. ») ; même mécanisme que les postures (carte grisée, « Lancer quand même », rappel rouge dans le lanceur).
- **Augmentations pour le temps** : elles s'ajoutent aux augmentations annoncées (+5 au ND chacune, plafond du Vide) ; remises à zéro, comme l'élément, l'Anneau et les cases, à chaque nouvelle action.
- **Sortilèges** : alias « Spellcraft » ; maîtrise 5 dans `maitrises.json` (`on: ["spell"]`, badge Maîtrise).
- **Hors v2.11.0** (v2.12.0, F-g) : emplacements et ligne « Emplacement », boutons Réussi/Raté et « Annuler (interrompu) », action « Rester concentré », sorts en escarmouche. L'interruption est rappelée en texte dans le lanceur.
- **Tests** : `tests/core.magic.spec.ts` (G1 à G6, G9 à G13, case Kuni, actions de la situation) ; `tests/ui/magic.spec.tsx` (onglet, cartes grisées, lanceur, G6, G9, G11, G12 avec le Vide dépensé, G13, Statistiques) ; M19 vérifie les 5 situations sur une ligne et le lanceur de sort à 360 px.

### F.11 Écarts de mise en œuvre (v2.12.0)
- **Format** : `spellSlotsUsed` (clés `air`, `earth`, `fire`, `water`, `void`, `free`, entiers ≥ 0), fusionné comme un champ simple (l'objet entier). « Nouvelle journée » le remet à `{}` s'il existe ; une fiche sans le champ n'en reçoit pas.
- **Moteur** (`src/core/spells.ts`) : `spellSlots` (max = Anneau, libres = Anneau de Vide ; un compte au-delà du max est plafonné à l'affichage), `slotFor` (l'élément, sinon un libre), `spellSlotNeed` (Anneau du jet : élément choisi d'un universel, Anneau d'Agasha ; +1 par case Soshi « sans signe visible »), `spendSpellSlots` / `refundSpellSlots`, `setSpellSlotsUsed`.
- **Lancer** : avec le lanceur de dés, les emplacements sont dépensés au lancer (réussite ou échec ; jet sans ND : dépensé, non annulable) ; aux vrais dés, **Réussi** / **Raté** dépensent aussi le point de Vide coché et celui d'Agasha, et consomment le bonus de Centre, comme un lancer. Sans emplacement, le lancer reste possible (rien n'est dépensé, ligne rouge « aucun emplacement »). En consultation, rien n'est dépensé (Réussi / Raté désactivés). Le dernier lancer (`ui.spellCast`) est oublié au changement d'action.
- **Ligne Sorts** : le libellé « Sorts » est masqué sur mobile (les six tuiles prennent toute la largeur, comme le prototype). L'éditeur passe par l'action `set` de la fiche.
- **Escarmouche** : sorts après les actions fixes (groupe « Sorts ») ; Centre : « Posture Centre : aucune action ce round. » comme toute action ; la déficience et la maîtrise grisent aussi en escarmouche (la posture passe en premier). Pas de sort en duel ni en bataille.
- **Rester concentré** : action `concentrate` (Volonté) en fin de situation Magie, groupe « Interruption », pas en escarmouche ; champ « Dégâts subis » à la place de l'échelle des ND (`concentrationTn`).
- **Tests** : `tests/core.slots.spec.ts` (emplacements, G7, G8, Agasha et Soshi, G14, format, escarmouche, G16, G17, Rester concentré) ; `tests/ui/slots.spec.tsx` (ligne Sorts, éditeur, consultation, ligne Emplacement, G8 aux vrais dés et au lanceur, G14, G16, G17, Rester concentré) ; M19 complète E36 (6 tuiles sur une ligne à 360 px).

**Prototype** : `reference/prototype.html` = v2.8.0 en ligne + annexe F complète (les quatre versions), construit depuis une branche locale non poussée ; fiche de test `reference/perso-test-shugenja.json` (sorts de test : valeurs non vérifiées sur le livre, à ne pas reprendre comme catalogue).

---

