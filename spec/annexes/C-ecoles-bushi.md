## Annexe C — Techniques d'école (lot 10, bushi)

### C.1 Décisions validées (21/10/2026)
| Sujet | Décision |
|---|---|
| Périmètre v2.0 | 14 écoles bushi : Hida, Hiruma, Kakita, Daidoji, Mirumoto, Togashi, Akodo, Matsu, Yoritomo (bushi), Tsuruchi, Shiba, Bayushi, Moto, Utaku. Courtisans et Shosuro en v2.1. Shugenja exclus (pas de système de sorts). |
| Textes | **Aucun texte du livre dans le dépôt.** Le catalogue contient les effets chiffrés et un **résumé d'une ligne écrit pour l'outil**. Pas d'import des textes complets. |
| Postures | Libellés **Attaque, Assaut, Défense, Défense totale, Centre**. |
| Rang d'école | Égal au Rang d'Insight par défaut, modifiable (`schoolRank`). |
| Kakita R1 | « +1g1 plus Rang d'école » = **+1g1 aux dés et + Rang d'école au total**. |
| Effets après le jet | Rappels textuels seulement (Matsu R5, relances, etc.), quel que soit le mode du lanceur. |

### C.2 Format de fiche v2 (`schemaVersion: 2`)
```ts
interface Character /* v2 */ {
  // … tous les champs v1 …
  schoolId: string;              // "" = aucune école du catalogue (techniques libres seulement)
  schoolRank: number | null;     // null = Rang d'Insight
  weapons: { name; skill; dr; bowStrength?; keywords: WeaponKeyword[] }[];
}
type WeaponKeyword = "samourai" | "lourde" | "paysan" | "ninja" | "arc" | "hast" | "lance"
  | "deux-mains" | "petite" | "moyenne" | "grande" | "distance" | "cimeterre";
```
- **Migration v1 → v2** : `schoolId: ""`, `schoolRank: null`, `keywords` pré-remplis depuis `weaponCatalog` quand le nom de l'arme y figure (comparaison normalisée), sinon `[]`. Le nom d'école v1 reste dans `school` ; l'interface **suggère** une école du catalogue si ce nom contient le nom de famille d'une école (« Associer à École de bushi Kakita ? »), sans l'appliquer d'office.
- Une arme est à distance si ses mots-clés contiennent `distance` ou `arc`, ou selon la règle v1 (Kyujutsu, arc, yumi). Mains nues : action marquée `unarmed`.
- Les `techniques` libres restent (techniques hors catalogue, kata, sorts). L'entrée Hiruma de `NAMED_MODIFIERS` (annexe B) est **retirée** : elle est remplacée par le catalogue.
- La spec moteur v1 (`core.rules.spec.ts`) reste valable : elle passe `schemaVersion: 1`, que `migrate()` convertit.

### C.3 Catalogue (`reference/ecoles-bushi.json`, à copier dans `src/rules/`)
Fichier de données fourni et **validé dans le prototype**. Structure :
```ts
interface School { id; clan; name; class; ranks: { rank: 1|2|3|4|5; name; summary; effects: Effect[] }[] }
type Value = number | { ref: "schoolRank" | "honor" | `ring:${Ring}` | `trait:${TraitKey}` | `skill:${string}` | "input";
                        mult?: number; div?: number /* arrondi inférieur */; add?: number; min?: number };
interface When {                 // toutes les conditions présentes doivent être vraies
  stance?: Stance[]; stanceNot?: Stance[]; mounted?: boolean;
  centerOrAfter?: boolean;       // posture Centre, ou Centre au round précédent
  skillGroup?: "bugei";
  weapon?: { keywordsAny?: WeaponKeyword[]; melee?: boolean; ranged?: boolean; unarmed?: boolean };
  anyOf?: When[];
}
type Effect =
  | { kind: "roll"; on: On[]; rolled?: Value; kept?: Value; flat?: Value; freeRaises?: Value; when?; mode: "auto"|"optional"; void?: number; label?; input?: string }
  | { kind: "armor"; value: Value; when?; mode: "auto"|"optional"; stack?: { max: Value; label }; label? }
  | { kind: "reduction"; value: Value; mode: "auto" }
  | { kind: "wounds"; perLevel?: Value; ignorePenalty?: Value | "all"; on?: On[]; when?; mode; void?; label? }
  | { kind: "maneuver"; cost?: { maneuver; value }; freeRaisesFor?: { maneuver; count }; when?; mode; label? }
  | { kind: "move"; value: Value; when?; mode: "auto" }
  | { kind: "targetTn"; value: Value; stack: { max: Value; label }; mode: "optional" }
  | { kind: "void"; points: 2; rolled; kept; label }          // option de dépense (Shiba R1)
  | { kind: "voidDouble" }                                     // chaque point de Vide compte double (Shiba R5)
  | { kind: "keyword"; weaponKeyword; adds }                   // Moto R1 : cimeterre → samourai
  | { kind: "simpleAttack"; when? }                            // badge « Attaque : Action simple »
  | { kind: "verdict"; rule: "baseTnSuccess"; when? }          // Akodo R5
  | { kind: "reminder"; context: "combat"|"duel"|"damage"; text? };
type On = "attack" | "damage" | "initiative" | "focus" | "skill" | "trait" | "bugei" | `skill:${string}`;
```
Un rang sans effet est purement descriptif (catégorie « texte »).

### C.4 Moteur (`src/core`)
| Fonction | Contrat |
|---|---|
| `activeEffects(c)` | Effets des rangs ≤ `schoolRank ?? insightRank` de l'école `schoolId`, chacun avec `key`, `source` (« Hiruma R1 »). |
| `resolveValue(v, c, input?)` | `ref` → valeur (`honor` = Honneur arrondi à l'inférieur, P9), puis `× mult`, `÷ div` arrondi inférieur, `+ add`, plancher `min`. |
| `weaponKeywords(c, w)` | Mots-clés de l'arme, plus ceux ajoutés par un effet `keyword`. |
| `computePool(c, action, mods)` | `mods` gagne `ctx: {stance, mounted, centerLastRound}`, `selected: Set<key>`, `inputs`. Ordre : posture → dés ± → **effets `roll` auto + sélectionnés** → Vide (× 2 si `voidDouble` ; option 2 points Shiba) → règle des dix dés. Le `flat` des techniques s'ajoute **après** la règle des dix dés. Renvoie aussi `applied[]`, `optional[]`, `freeRaises`, `techFlat`. Réserve jamais négative. |
| `woundState(c, ctx)` | Seuils + `perLevel` (auto) à chaque niveau ; pénalité − `ignorePenalty` (auto, selon posture), plancher 0. |
| `armorTN(c, ctx, sel)` | v1 + effets `armor` auto, cochés et cumulés (`stack × value`) + Vide × 10 × (2 si `voidDouble`). |
| `reduction(c)` | `armor.reduction` + effets `reduction`. |
| `maneuverCost(c, m)` / `maneuverRaises(...)` | Coût modifié par `maneuver.cost` ; les augmentations gratuites `freeRaisesFor` se déduisent du coût de la manœuvre visée. |
| `targetNumber(...)` | ND cible des attaques + `targetTn × stack` ; une option `wounds.ignorePenalty: "all"` cochée met la pénalité à 0 pour ce jet. |
| `verdict(total, tn, baseTn, effects)` | Si échec, qu'Akodo R5 s'applique (Bugei) et que `total ≥ baseTn` : « réussite sans les augmentations ». |
| `movement(c, ctx)` | v1 + effets `move` (affichés en note, sans dépasser le maximum). |

Contexte de référence **hors lanceur** (fiche, statistiques) : posture Attaque, non monté, pas de Centre au round précédent, aucun effet optionnel coché.

### C.5 Interface
- **Fiche, bloc Identité** (mode modification) : « École (nom affiché) » libre, liste **« Techniques d'école »** groupée par clan (option « Aucune »), **« Rang d'école »** (indication « = Insight (N) »).
- **Fiche, bloc Techniques d'école** : titre de l'école, clan et rang ; les 5 rangs avec nom, **résumé** et badges **auto / à cocher / rappel / texte** ; rangs non atteints grisés avec « rang N ». En dessous, « Autres techniques, kata, sorts » (liste libre v1).
- **Armes** : colonne **Mots-clés** en modification (pré-remplie depuis le catalogue, modifiable), étiquettes en lecture. Réserves d'attaque et de dégâts calculées avec les effets auto.
- **Barre d'état** : Réduction et ND d'armure incluent les techniques ; l'éditeur d'armure les détaille.
- **Combat, panneau Posture** : section « Techniques d'école » avec la case **Monté** (si l'école a des effets montés), l'étiquette « Bonus de Centre du round précédent actif », les **compteurs** −/+ (Hiruma R2, Yoritomo R2, plafond = valeur `max`) et les **cases** de ND d'armure (Hiruma R3, Mirumoto R1, Bayushi R1, Yoritomo R4, Utaku R2). « Nouveau round » : mémorise si la posture était Centre, décoche les cases d'armure ; les compteurs restent jusqu'à la fin de l'escarmouche (remise à zéro manuelle).
- **Combat, panneau « Rappels d'école »** (sous le panneau Vide) : noms des techniques de contexte combat (et duel en Duel iaijutsu), détails par le « i » du panneau.
- **Cartes d'action** : réserve avec bonus fixe (« 4g3 +6 ») ; badge **« Attaque : Action simple »** quand un effet `simpleAttack` s'applique.
- **Lanceur** :
  - étiquettes des effets appliqués sous la réserve (« +1g0 · Hiruma R1 ») ;
  - section **« Techniques à cocher »** (libellé, effet, coût en Vide, source ; champ de saisie si `input`), remise à zéro à chaque nouvelle action ;
  - case « 2 points de Vide (+2g2) » si Shiba R1 ; libellés de Vide doublés avec Shiba R5 ;
  - coût des manœuvres modifié affiché, augmentations gratuites réservées signalées ;
  - rappels de contexte `damage` sur les jets de dégâts ;
  - avec le lanceur affiché : les effets cochés avec `void` dépensent leurs points au lancer ; verdict Akodo.
- **Statistiques** : effets auto inclus (posture Attaque) ; mention en bas du tableau.

### C.6 Tests du moteur (`tests/core.schools.spec.ts`, à écrire par l'agent)
Personnage : `reference/perso-test-ecoles.json` (Agilité, Réflexes, Intuition 3 ; autres traits 2 ; Vide 2 ; Honneur 6,5 ; Iaijutsu 3, Kenjutsu 2, Défense 1, Kyujutsu 2, Équitation 1 ; Katana, Yumi force 3, Tetsubo). `insightRank` = rang d'école du cas. Posture Attaque sauf mention. **Valeurs vérifiées dans le prototype.**

| # | École, rang | Cas | Attendu |
|---|---|---|---|
| T1 | Kakita 1 | Initiative | 4g3 +6 |
| T2 | Kakita 1 | Attaque katana en Attaque / en Centre | 5g3 / 6g4 +1 |
| T3 | Kakita 1 | « Nouveau round » en Centre, puis posture Attaque | 6g4 +1 (bonus du round suivant) |
| T4 | Kakita 2 | Case « Initiative plus basse » cochée | 7g3 |
| T5 | Hiruma 3 | Attaque katana en Attaque / en Assaut | 6g3 / 7g4 |
| T6 | Hiruma 3 | ND d'armure ; 2 touches ; + Ailes du colibri | 20 ; 30 ; 36 |
| T7 | Hiruma 3 | Badge Action simple | absent (rang 4 non atteint) |
| T8 | Hida 2 | Réduction ; dégâts tetsubo ; dégâts katana | 2 ; 6g3 ; 5g2 |
| T9 | Daidoji 1 | Seuils de blessure (Honneur 6,5) | 12, 18, 24, 30, 36, 42, 48, 54 |
| T10 | Daidoji 1 | Seuils avec Honneur 4,0 (minimum 1) | 11, 16, 21, 26, 31, 36, 41, 46 |
| T11 | Matsu 4 | Dégâts katana | 5g2 +6 |
| T12 | Matsu 4 | Pénalité à 11 blessures ; à 27 ; à 27 en Assaut | 0 ; 14 ; 8 |
| T13 | Matsu 4 | Bonus de déplacement en Assaut | +5 pieds |
| T14 | Tsuruchi 2 | Initiative ; tir yumi ; dégâts yumi ; attaque katana | 5g3 +3 ; 6g3 ; 7g2 ; 5g3 |
| T15 | Tsuruchi 2 | Coup ciblé annoncé au tir | coût en augmentations 0 (1 gratuite) |
| T16 | Bayushi 2 | Initiative ; coût de la Feinte | 6g4 ; 1 |
| T17 | Moto 5 | Dégâts katana en Assaut / en Attaque / monté en Attaque | 5g3 / 5g2 / 6g3 |
| T18 | Togashi 2 | Mains nues : attaque / dégâts | 4g4 / 3g2 |
| T19 | Utaku 1 | Équitation | 4g3 +6 |
| T20 | Shiba 5 | Attaque katana avec 1 point de Vide ; ND d'armure avec Vide en armure | 7g5 ; 40 |
| T21 | Akodo 5 | ND 20, 2 augmentations (ND 30), total 27 | Échec, « réussite sans les augmentations » |
| T22 | Akodo 5 | Même cas sur un jet non Bugei | Échec simple |
| T23 | Aucune école | Toutes les réserves | Identiques à la spec v1 |
| T24 | Migration | Fiche v1 Kakita (exemple) | `schemaVersion: 2`, `schoolId: ""`, katana `["samourai","moyenne"]`, wakizashi `["samourai","petite"]` |

### C.7 Tests d'interface et de bout en bout
| # | Parcours | Attendu |
|---|---|---|
| E16 | Choisir « École de bushi Hiruma », Rang d'Insight 2 | Bloc Techniques : R1 et R2 avec résumés et badges, R3 à R5 grisés ; attaque katana 6g3 sur la fiche |
| E17 | Escarmouche, Hiruma 2, compteur « Touches » à 2 | ND d'armure +10 ; passage en Assaut : le bonus disparaît du ND |
| E18 | Lanceur, Kakita 2, attaque | Étiquette « +1g1 +1 · Kakita R1 » en Centre ; case « Cible à l'Initiative plus basse » décochée par défaut, remise à zéro à l'action suivante |
| E19 | Fiche v1 importée | Suggestion « Associer à École de bushi Kakita ? » ; rien n'est appliqué sans confirmation |

### C.8 Écarts relevés à l'implémentation (lot 10)
- **E18** : l'étiquette attendue « +1g1 +1 · Kakita R1 » correspond au rang d'école 1. Au rang 2, la règle C.1 (+ Rang d'école au total) donne « +1g1 +2 » : c'est ce que l'outil affiche et ce que testent E18 (interface et Playwright). À confirmer.
- **Yoritomo R4** : le catalogue de référence vise la manœuvre `knock` (identifiant du prototype) ; l'outil l'appelle `knockdown`. La copie `src/rules/ecoles-bushi.json` est corrigée, `reference/` reste inchangé.
- **Spec v1** : deux tests de migration de `core.rules.spec.ts` attendaient `schemaVersion: 1` ; ils attendent désormais la fiche v2 (P6 : mise à jour de la spécification avec le format). Aucune valeur de règle n'a changé.
- **Type `Character`** : `schoolId`, `schoolRank` et `keywords` sont facultatifs dans le type (les fiches v1 de la spec restent typées) ; `migrate()` et la fusion les remplissent (`""`, `null`, `[]`).


---

