## Annexe D — Techniques des courtisans et de Shosuro (lot 11, v2.1)

Statut : **validée par Nelson le 24/10/2026, défauts retenus** (D.1). Les effets sont résumés depuis magicalsamurai.wikidot.com (pages `schools-<clan>`), **à vérifier dans le livre** ; les valeurs attendues de D.6 sont calculées par l'agent et vérifiées par le moteur, pas dans un prototype.

### D.1 Décisions (validées le 24/10/2026 : défauts retenus)
| # | Sujet | Décision |
|---|---|---|
| D-a | Périmètre | 10 écoles de courtisans : Yasuki (Crabe), Doji (Grue), Kitsuki enquêteur (Dragon), Ikoma barde (Lion), Yoritomo courtisan (Mante), Asako maître du savoir (Phénix), Bayushi courtisan (Scorpion), Ide émissaire (Licorne), Otomo et Miya héraut (Impérial). Plus **deux** écoles Shosuro (ninja) : Infiltré et Acteur. Voies alternatives (Doji Innocents, Kitsuki Debater, Hand of Peace…) et écoles avancées exclues. |
| D-b | Lequel des Shosuro | Les deux (Infiltré : livre de base ; Acteur : Secrets of the Scorpion). |
| D-c | Spécialisations | Le lanceur remplace la case « Spécialisation » par une **liste** des spécialisations de la compétence (« Aucune » + chacune). La relance des 1 s'applique dès qu'une spécialisation est choisie (comportement actuel inchangé). Les effets conditionnés à une spécialisation (Ide R1, Yoritomo R2, Shosuro Acteur R1) ne s'appliquent qu'au lanceur, quand elle est choisie ; hors lanceur, jamais. |
| D-d | Noms des spécialisations | Comparaison normalisée avec alias FR/EN : Honnêteté/Honesty, Duperie/Deceit, Contrôle/Control, Manipulation, Ragots/Gossip, Politesse/Courtesy/Courtoisie, Rhétorique/Rhetoric. « Courtesy » d'Étiquette est traduit **Politesse** pour ne pas se confondre avec la compétence Courtoisie (Courtier). À corriger selon l'édition française. |
| D-e | Seuil d'Honneur (Doji R1) | Comparaison sur l'Honneur **non arrondi** : 6,0 et plus. (P9, arrondi inférieur, ne vaut que pour l'Honneur utilisé comme valeur.) |
| D-f | Effets sur autrui | Les techniques qui modifient le ND ou les jets **des autres** (Yasuki R4, Ikoma R2, Kitsuki R2, Bayushi R4…) restent des **rappels**, avec la valeur calculée dans le texte (« +10 au ND de qui tente de te tromper »). |
| D-g | Utilisations par séance | « N fois par séance » (relances Yasuki R2, Yoritomo R3, Ikoma R4…) : rappel seulement, pas de compteur. |
| D-h | Suggestion d'école | Plusieurs écoles partagent un nom de famille (Bayushi, Yoritomo, Shosuro). La suggestion retient celles dont le nom de famille figure dans « École », puis filtre par mot de classe (« courtisan », « courtier », « barde », « émissaire », « enquêteur », « héraut », « infiltré », « acteur ») ; sans mot de classe, l'école bushi si elle existe ; sinon aucune suggestion. |
| D-i | Format de fiche | **Inchangé** (`schemaVersion` reste 2) : seuls le catalogue et le moteur évoluent. Pas de migration. |

### D.2 Catalogue (`src/rules/ecoles-courtisans.json`)
Même structure que l'annexe C.3, chargé à la suite de `ecoles-bushi.json` dans `SCHOOLS`. Chaque école gagne `skills: string[]` (compétences d'école, nécessaires à Shosuro Acteur R3). `class` : « Courtisan » ou « Ninja ». Résumés d'une ligne écrits pour l'outil, aucun texte du livre (C.1).

### D.3 Extensions du format d'effet
| Ajout | Sens | Utilisé par |
|---|---|---|
| `When.honorMin: number` | Honneur (non arrondi) ≥ valeur | Doji R1 |
| `When.emphasis: string[]` | Spécialisation choisie au lanceur parmi ces noms (alias D-d) | Ide R1, Yoritomo R2, Shosuro Acteur R1 |
| `On` : `"social"`, `"lore"`, `"school"` | Compétences sociales (`SOCIAL_SKILLS`) ; toute compétence « Connaissance… » / « Lore… » ; compétences de l'école | Asako, Otomo, Yasuki, Shosuro Acteur R3 |
| `skill:Connaissance` | Correspond aussi à « Connaissance : Histoire » (préfixe avant « : ») | — |
| Effet `roll` : `tn?: Value` | Modifie le ND de ce jet | Ide R1 (+5 en Duperie) |
| Effet `roll` : `unlimitedRaises?: true` | Augmentations non limitées par l'Anneau de Vide pour ce jet | Shosuro Infiltré R2, Acteur R5 |
| `Value.max` | Plafond après calcul | Bayushi courtisan R1 (÷ 3, max 5) |
| Effet `voidBoost` `{ on, when?, rolled, kept }` | Chaque point de Vide dépensé sur ces jets donne `rolled`g`kept` au lieu de 1g1 | Asako R1 (Étiquette, 3g1), Shosuro Acteur R1 (Comédie, Sincérité en Duperie, 3g1) |
| Effet `void` : `on?: On[]` | Option de dépense de plusieurs points limitée à ces jets ; se cumule avec `voidBoost` | Shosuro Acteur R3 (2 points, compétences d'école) |
| `ReminderContext` : `"social"` | Rappel affiché au lanceur sur les jets de compétences sociales | la plupart des courtisans |

### D.4 Effets encodés
Mode : **auto** = d'office ; **case** = à cocher au lanceur ; **rappel** = texte.

| École | R | Effet encodé | Mode |
|---|---|---|---|
| Yasuki | 1 | 1 augm. gratuite en Commerce ; rappel : pas de perte d'Honneur en public | auto + rappel |
| | 2 | Relance de Sincérité ou Intimidation ratée, Rang d'école fois par séance | rappel |
| | 3 | Trouver un objet rare (Commerce/Intuition ND 20) | rappel |
| | 4 | + 5 × Rang d'école au ND de qui tente de te tromper | rappel chiffré |
| | 5 | +5g0 aux jets sociaux opposés contre qui tu as fourni un objet utile | case |
| Doji | 1 | Honneur ≥ 6,0 : 1 augm. gratuite en Courtoisie, Sincérité, Étiquette | auto |
| | 2–4 | Langage silencieux, cadeau parfait, voix de l'Honneur | rappel |
| | 5 | Conseil de la Dame ; +5g0 si la cible est un allié | rappel + case |
| Kitsuki | 1 | 1 augm. gratuite en Investigation ; + Perception au ND d'armure | auto |
| | 2 | + 5 × Rang d'école au ND de qui te ment, te feinte ou te désarme | rappel chiffré |
| | 3–5 | Lire les motivations, trouver les liens, détecter le mensonge | rappel |
| Ikoma | 1, 3, 4 | Héraut de gloire, voix des ancêtres, force de la tradition | rappel |
| | 2 | + 5 × Rang d'école au ND d'Intimidation et de Tentation contre toi | rappel chiffré |
| | 5 | + rang de « Représentation : Conteur » en dés lancés aux jets sociaux opposés (précédent historique) | case |
| Yoritomo courtisan | 1 | + Rang d'école augm. gratuites aux jets sociaux contre un hors-la-loi | case |
| | 2 | Intimidation en Contrôle : +1g1 (Volonté + 1) ; contre un Statut inférieur : +1g1 de plus | auto (spéc.) + case |
| | 3, 4 | Relance en Intimidation, volonté de la tempête | rappel |
| | 5 | +5g0 en Intimidation ; rappel : +5g0 pour résister à l'Intimidation, la Tentation, la Peur | auto + rappel |
| Asako | 1 | 1 augm. gratuite en Connaissance ; Vide en Étiquette : 3g1 | auto |
| | 2 | +2g0 aux jets sociaux après un jour d'observation de la cour | case |
| | 3, 4 | Voix de l'univers, esprit invincible | rappel |
| | 5 | +5g0 en Connaissance | auto |
| Bayushi courtisan | 1 | 1 augm. gratuite par 3 points de désavantages mentaux et sociaux de la cible (max 5), saisie ; 1 augm. gratuite en Courtoisie pour répandre une rumeur | case (saisie) + case |
| | 2–4 | Eaux peu profondes, secrets, piqûre | rappel |
| | 5 | +5g0 si tu fais chanter la cible | case |
| Ide | 1 | Sincérité en Honnêteté : 1 augm. gratuite ; en Duperie : +5 au ND | auto (spéc.) |
| | 2, 3, 5 | Percer les voiles, le cœur écoute, main de la paix | rappel |
| | 4 | + Rang d'école en dés lancés aux jets des techniques R2 et R3 | case |
| Otomo | 1–4 | Voix du ciel, destin, voix du maître, protection de l'Empereur | rappel |
| | 5 | +5g0 aux jets sociaux opposés contre qui révère l'autorité impériale | case |
| Miya | 1, 3, 4 | Voix, main et bénédiction de l'Empereur | rappel |
| | 2 | + Rang d'Honneur au total en Étiquette pour résister à une influence | case |
| | 5 | +5g0 en Courtoisie et Étiquette contre une cible d'Honneur ≥ 1,0 | case |
| Shosuro Infiltré | 1 | +2g0 en Furtivité ; rappel : pas de perte d'Honneur (compétences basses, Ninjutsu) | auto + rappel |
| | 2 | Contre une cible qui ne te voit pas : + Rang d'école en dés lancés à l'attaque, augmentations non limitées | case |
| | 3 | Attaque en Action simple avec une arme ninja ; rappel : aussi depuis une embuscade | badge + rappel |
| | 4 | Tu restes caché après avoir attaqué | rappel |
| | 5 | Vide : deux dés de dégâts à 10 | rappel (dégâts) |
| Shosuro Acteur | 1 | Vide en Comédie et en Sincérité (Duperie) : 3g1 | auto (spéc.) |
| | 2 | +2g0 aux attaques avec une arme petite | auto |
| | 3 | Jusqu'à 2 points de Vide sur les compétences d'école | option de Vide |
| | 4 | Attaque en Action simple avec une arme petite | badge |
| | 5 | Contre une cible qui ne te voit pas : augmentations non limitées | case |

Les personas (Acteur R1, R3, R5) restent dans le résumé.

### D.5 Interface
- **Liste « Techniques d'école »** : groupes par clan inchangés, la classe s'affiche après le nom (« Bayushi — Courtisan »).
- **Lanceur** : liste des spécialisations (D-c) ; étiquettes des effets appliqués comme en C.5 (« ND +5 · Ide R1 ») ; rappels `social` sous la réserve pour les compétences sociales ; libellé de Vide modifié (« 1 point de Vide (+3g1) ») ; option de 2 points limitée aux compétences d'école ; mention « Augmentations non limitées » quand la case est cochée.
- **Fiche, bloc Techniques d'école** : rappels chiffrés calculés (« +10 au ND… » au rang 2).
- **Combat** : Kitsuki R1 dans le ND d'armure (barre d'état, éditeur d'armure).

### D.6 Tests du moteur (`tests/core.courtiers.spec.ts`)
Personnage proposé : `reference/perso-test-courtisans.json` — Intuition, Volonté, Perception, Intelligence 3 ; autres traits 2 ; Vide 2 ; Honneur 6,5 ; Courtoisie 3 (Manipulation), Étiquette 3 (Politesse), Sincérité 2 (Honnêteté, Duperie), Intimidation 2 (Contrôle), Connaissance : Histoire 2, Investigation 2, Commerce 1, Comédie 2, Couteaux 2, Furtivité 2, Représentation : Conteur 3 ; Tanto (petite, samouraï), Katana. `insightRank` = rang d'école du cas. **Valeurs calculées, à vérifier.**

| # | École, rang | Cas | Attendu |
|---|---|---|---|
| T25 | Doji 1 | Courtoisie/Intuition, Honneur 6,5 ; Honneur 5,9 ; Intimidation/Volonté | 6g3, 1 augm. ; 6g3, 0 ; 5g3, 0 |
| T26 | Asako 1 | Connaissance : Histoire/Intelligence ; Étiquette/Intuition + 1 Vide (sans école : 7g4) | 5g3, 1 augm. ; 9g4 |
| T27 | Asako 5 | Connaissance : Histoire/Intelligence | 10g3, 1 augm. |
| T28 | Ide 1 | Sincérité/Intuition en Honnêteté ; en Duperie (ND 15) ; sans spécialisation | 1 augm. ; ND 20 ; aucun effet |
| T29 | Kitsuki 1 | ND d'armure (Réflexes 2) ; Investigation/Perception | 18 ; 5g3, 1 augm. |
| T30 | Shosuro Acteur 1 | + 1 Vide : Comédie/Intuition ; Sincérité en Duperie ; Sincérité en Honnêteté | 8g4 ; 8g4 ; 6g4 |
| T31 | Shosuro Acteur 3 | + 2 Vide : Sincérité en Duperie ; Étiquette/Intuition | 10g5 (11g5, P8) ; 8g5 |
| T32 | Shosuro Acteur 2 | Attaque tanto ; attaque katana | 6g2 ; 2g2 |
| T33 | Shosuro Acteur 4 | Badge Action simple : tanto ; katana | présent ; absent |
| T34 | Yoritomo courtisan 2 | Intimidation/Volonté en Contrôle ; + case Statut inférieur ; sans spécialisation | 6g4 ; 7g5 ; 5g3 |
| T35 | Yoritomo courtisan 5 | Intimidation/Volonté en Contrôle ; sans spécialisation | 10g4 (11g4, P8) ; 10g3 |
| T36 | Miya 2 | Étiquette/Intuition, case « Résister à une influence » | 6g3 +6 |
| T37 | Bayushi courtisan 1 | Saisie 7 points ; 16 points | 2 augm. ; 5 augm. |
| T38 | Shosuro Infiltré 2 | Furtivité/Agilité ; attaque tanto, case « Cible qui ne te voit pas » | 6g2 ; 6g2, augmentations non limitées |
| T39 | Ikoma 5 | Courtoisie/Intuition, case « Précédent historique » | 9g3 |
| T40 | Kitsuki 2 ; Yasuki 4 | Rappels chiffrés | « +10 au ND… » ; « +20 au ND… » |
| T41 | Suggestion | « Bayushi » ; « Courtisan Bayushi » ; « Shosuro » | bushi Bayushi ; courtisan Bayushi ; aucune |
| T42 | Non-régression | T1 à T24, spec v1 | inchangés |

### D.7 Tests d'interface et de bout en bout
| # | Parcours | Attendu |
|---|---|---|
| E20 | Choisir « École de courtisans Doji », Honneur 6,5 puis 5,0 | Courtoisie : « 1 augm. gratuite · Doji R1 » puis plus rien |
| E21 | Lanceur, Ide 1, Sincérité : spécialisation Duperie puis Honnêteté | « ND +5 · Ide R1 » puis « 1 augm. gratuite · Ide R1 » ; relance des 1 dans les deux cas |
| E22 | Lanceur, Yasuki 4, Étiquette | Rappel « +20 au ND de qui tente de te tromper » sous la réserve |
| E23 | Lanceur, Shosuro Acteur 3, Comédie | Option « 2 points de Vide (+6g2) » ; absente en Kenjutsu |

Livraison : tag `v2.1.0` (mineure : catalogue et moteur, format inchangé).

### D.8 Écarts relevés à l'implémentation (lot 11)
- **Situation « Cour »** (ajout) : le lanceur n'avait aucune action pour Sincérité, Intimidation, Tentation, Comédie ni Commerce, ce qui rendait la plupart des techniques inutilisables. Nouvel onglet **Cour** entre Enquête et Déplacement, avec ces jets (en opposition, sauf Commerce ND 15) et une action « Se produire » par compétence « Représentation : … » de la fiche. En **Enquête**, l'action générique « Se souvenir (Connaissance) » est remplacée par une action par compétence « Connaissance : … » de la fiche, quand il y en a. Les panneaux « Rappels d'école » de la Cour et du lanceur affichent les rappels `social`.
- **Spécialisation (D-c)** : la liste ne remplace la case que si la compétence a des spécialisations nommées ; sans spécialisation, la case « relancer les 1 » reste. La présélection par l'indice de l'action tient compte des alias.
- **Alias (D-d)** : la fiche d'exemple note « Courtoisie » comme spécialisation d'Étiquette. « Courtoisie » est donc un alias de Politesse/Courtesy (seulement parmi les spécialisations, la compétence Courtoisie n'est pas concernée). « Rhétorique/Rhetoric » est ajouté (Miya R4).
- **Suggestion (D-h)** : sans mot de classe ni école bushi, la suggestion retient l'école quand elle est **seule** de sa famille (« Doji » → courtisans Doji). « Shosuro » seul reste sans suggestion.
- **Ide R1 (ND +5 en Duperie)** : les jets de la Cour sont en opposition, donc l'effet s'affiche en étiquette (« ND +5 · Ide R1 ») et ne modifie un ND chiffré que sur un jet à ND.
- **Liste « Techniques d'école »** : la classe n'est pas ajoutée après le nom (D.5), les noms du catalogue la contiennent déjà (« École de courtisans Bayushi », « École d'acteurs Shosuro »).
- **Shosuro Infiltré** : pas de liste de compétences d'école (aucun effet ne s'en sert, et la source ne la donnait pas).
- **Tests** : T25 à T42 sont dans un fichier à part, `tests/core.courtiers.spec.ts`. Les valeurs calculées de D.6 sont toutes confirmées par le moteur. Le test d'interface « spécialisation cochée automatiquement » vérifie maintenant la liste.

---

