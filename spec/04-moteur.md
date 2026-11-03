## 4. Moteur de règles (`src/core`)

Toutes les fonctions sont pures. Le hasard est **injecté** (`rng: () => number`, entier 1..10) pour des tests déterministes. Notation : `XgY` à l'affichage, `XkY` accepté en saisie.

### 4.1 Fonctions exposées
| Fonction | Contrat |
|---|---|
| `rings(c)` | Terre = min(Constitution, Volonté) ; Eau = min(Force, Perception) ; Feu = min(Agilité, Intelligence) ; Air = min(Réflexes, Vigilance) ; Vide = `voidRing`. |
| `findSkill(c, name)` | Comparaison normalisée : minuscules, sans accents, espaces rognés. |
| `parseDR(s)` | `"3k2"`/`"3g2"` → `{rolled:3, kept:2}` ; invalide → `{0,0}`. |
| `applyTenDiceRule(r, k)` | Règle du livre de base 4e (§4.7). Renvoie `{rolled, kept, bonus}`. |
| `computePool(c, action, mods)` | `{rolled, kept, bonus, explodes, explodeOn: 9 \| 10, canRaise, notes[]}` (§4.2). |
| `rollDice(pool, {emphasis, flatBonus}, rng)` | §4.3. |
| `woundState(c)` | `{level, label, penalty, thresholds, status: "ok"|"out"|"dead"}` (§4.4). |
| `armorTN(c, combatState)` | §4.5. |
| `maneuverRaises(selection, maneuvers)` | Somme des coûts ; une manœuvre `stackable` compte coût × nombre, une autre compte une fois. |
| `targetNumber({base, calledRaises, woundPenalty})` | base + 5 × augmentations annoncées + pénalité. `null` si pas de ND (dégâts, initiative) ; `"opposed"` pour une opposition. |
| `raiseCapExceeded(c, called)` | `called > voidRing` (avertissement, jamais bloquant). |
| `mergeCharacter(base, patch)` | §8. Ne modifie jamais `base`. Renvoie `{ok:true, character, changes:{path, before, after, kind:"update"|"add"}[], warnings:string[]}` ou `{ok:false, errors:{path, message}[]}`. |
| `migrate(json)` | Ramène toute version connue au `schemaVersion` courant (annexe A). |
| `movement(c)` | Déplacement en pieds : `{free: Eau×5, simple: Eau×10, max: Eau×20}`. Affichage avec conversion en mètres (× 0,3048, une décimale). |
| `poolStats(pool, {emphasis, flatBonus, samples, seed})` | Statistiques d'une réserve par simulation Monte-Carlo **à graine fixe** (PRNG type mulberry32, 4 000 tirages par défaut). Renvoie `{min, max, open, mean, chance(tn)}`. `min` = gardés + bonus ; `max` = 10 × gardés + bonus (`open` = la réserve explose, donc le max peut être dépassé) ; `chance(tn)` = probabilité que le total atteigne `tn`. Résultats mis en cache par réserve. |

### 4.2 Calcul de réserve
| Type d'action | Lancés / gardés | Explose | Augmentations |
|---|---|---|---|
| `skill`, rang ≥ 1 | trait + rang / trait | oui | oui |
| `skill`, rang 0 | trait / trait | **non** | **non** |
| `skill`, rang 0 + Vide « compétence au rang 1 » | trait + 1 / trait | oui | oui |
| `trait` (jet de trait pur) | trait / trait | oui | oui |
| `damage` | Force (ou `bowStrength` à distance) + VD lancés / VD gardés | oui, **sur 9 et 10** si maîtrise (§4.8) | non |
| `initiative` | Rang + Réflexes / Réflexes | oui | non |

Modificateurs, appliqués dans cet ordre :
1. attaque en posture **Assaut** : +2g1 ;
2. dés lancés ± (saisis par le joueur, ou pré-remplis par les augmentations de dégâts) ;
3. **point de Vide** : +1g1 ;
4. règle des dix dés.

Le bonus fixe s'ajoute au total.

### 4.3 Lancer
Pour chaque dé :
1. tirer une valeur v ;
2. si la **spécialisation** est active, que la réserve est qualifiée et que v = 1 : retirer **une seule fois** ;
3. si la réserve explose : tant que le dernier tirage est ≥ `explodeOn` (10 par défaut, 9 en cas de maîtrise), tirer à nouveau et additionner.

Ensuite : trier les dés par total décroissant et garder les `kept` premiers. Total = somme des dés gardés + bonus de la règle des dix dés + bonus fixe. Chaque dé expose `faces[]`, `total`, `rerolledOne` et `kept` ; `faces` ne contient pas le 1 écarté.

### 4.4 Blessures
- Seuils cumulés : Indemne jusqu'à Terre × 5, puis Terre × 2 de plus par niveau (× 3 à × 5 en préférence depuis la v2.5, annexe E.6 : `woundMultiplier` du contexte).
- Niveaux et pénalités : Indemne +0, Égratigné +3, Éraflé +5, Blessé +10, Gravement blessé +15, Estropié +20, À terre +40, Hors de combat (aucune action) ; au-delà du dernier seuil : **Mort**.
- Exemple Terre 2 : seuils `[10,14,18,22,26,30,34,38]`. 11 blessures → Égratigné ; 35 → Hors de combat ; 39 → Mort.

### 4.5 ND d'armure
- Base : 5 × Réflexes + 5 + bonus d'armure.
- Postures :
  - Assaut −10 ;
  - Défense + Air + rang de Défense ;
  - Défense totale + moitié (arrondie en dessous) du jet Défense (Réflexes) ;
  - Attaque et Centre +0.
- Vide en armure : +10 jusqu'au round suivant.

### 4.6 Points de Vide
Dépenses possibles : +1g1 à un jet ; +10 au ND d'armure pour le round ; compétence non maîtrisée jouée au rang 1 ; activation d'une capacité.

Chaque dépense décrémente `voidPoints` (jamais sous 0). Une seconde dépense dans le même round est permise, avec avertissement. « Nouveau round » efface les effets du round, mais pas l'initiative.

### 4.7 Règle des dix dés (livre de base 4e, « Special Dice Rules »)
Aucun jet ne dépasse 10 dés lancés ni 10 dés gardés. Algorithme, dans cet ordre :
1. `extra` = dés lancés au-delà de 10 ; lancés = 10.
2. Tant que `extra ≥ 2` et gardés < 10 : +1 gardé, `extra −= 2` (deux lancés en trop = un gardé).
3. Si les gardés atteignent 10 : chaque dé lancé restant donne **+2** au total. Sinon, le dé impair restant est perdu (décision P8).
4. Chaque dé gardé au-delà de 10 donne **+2** ; gardés = 10.
5. Gardés = min(gardés, lancés).

Exemples du livre (tous dans la spec) : 12k4 → 10k5 ; 13k9 → 10k10 +2 ; 10k12 → 10k10 +4 ; 14k12 → 10k10 +12.

### 4.8 Maîtrise des compétences martiales
- Une compétence martiale au **rang 7 ou plus** fait **exploser les dés de dégâts sur 9 et 10** (au lieu de 10 seulement). Les jets d'attaque ne sont pas concernés.
- S'applique à toutes les compétences martiales (décision P7). La compétence considérée est celle de l'arme (`weapon.skill`) ; Jiujutsu pour les mains nues. **Corrigé en v2.2 (E-b)** : seuls Kenjutsu et Armes lourdes ; depuis la v2.4, la règle est une entrée du catalogue `src/rules/maitrises.json` (`explodeOn: 9`, annexe E.4).
- `explodeOn` est porté par la réserve et utilisé par `rollDice` et `poolStats` (simulation et cache).
- Affichage : dans le lanceur, une note en couleur d'accent « Maîtrise Kenjutsu 7 : les dés explosent sur 9 et 10 » ; dans les statistiques, une étiquette « 9+ » à côté du max.

### 4.9 Données de règles (`src/rules/l5r4e.ts`)
Contenu initial = prototype :
- **Échelle des ND** : 5 Trivial, 10 Facile, 15 Moyen, 20 Difficile, 25 Très difficile, 30 Ardu, 40 Héroïque, 50 Légendaire.
- **Postures** — libellés d'interface validés : **Attaque, Assaut, Défense, Défense totale, Centre** (« Assaut » remplace « Attaque totale » ; clé de code `fullAttack` inchangée).
- **Manœuvres par défaut** (coût en augmentations) : Augmentation des dégâts 1 (cumulable, +1g0), Coup ciblé 1, Feinte 2, Renversement 2, Désarmement 3, Attaque supplémentaire 5.
- **Clans** (§6.4).
- **Catalogue d'actions** par situation : Enquête ; Déplacement ; Combat avec trois sous-types (Escarmouche, Duel iaijutsu, Bataille).
  - Forme d'une action : `{id, situation, sub?, parent?, label, kind, skill?, trait, emphasisHint?, tn: number|"target"|"opposed"|"assessment"|null, attack?, fullDefense?, description}`. `parent` = id de l'attaque dont dépend un jet de dégâts.
  - Les attaques et dégâts sont générés depuis les armes ; mains nues et lutte (Jiujutsu) sont fixes.
  - ND d'Évaluation en duel : 10 + 5 × Rang adverse.

---

