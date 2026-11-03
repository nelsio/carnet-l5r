## Annexe K — Lot 21 : points d'Insight calculés (v2.18.0)

Statut : **livré**. Source : `handoff-insight.md` (30/10/2026), intitulé « Lot 18 » : renuméroté **lot 21** (le lot 18 est le bloc Anneaux, v2.15.0) ; la version v2.18.0 est inchangée. Une PR, version mineure (ajout compatible).

### K.1 Constat (v2.17.0)
- `insightRank` est un entier saisi à la main (1 à 10) dans le bloc Identité, sans lien avec les Traits ni les compétences.
- `xp.total` et `xp.spent` sont saisis à la main ; « XP libre » vaut `total − spent`.
- Aucun calcul des points d'Insight ni des seuils de rang : le rang affiché peut être incohérent avec la fiche.

### K.2 Règle (livre de base 4e)
- **Points d'Insight** = (Terre + Eau + Feu + Air + Vide) × 10 + somme des rangs de toutes les compétences. Chaque Anneau vaut le minimum de ses deux Traits (`rings(c)`), le Vide vaut `voidRing`. Spécialisations, avantages, sorts et techniques ne comptent pas.
- **Rang suggéré** : moins de 150 → 1 ; à partir de 150 → `min(10, 2 + floor((points − 150) / 25))` (Rang 2 de 150 à 174, Rang 3 de 175 à 199, Rang 10 à 350 et plus).
- **Bonus du MJ** : avantages, techniques ou décisions du MJ peuvent ajouter des points hors calcul.

### K.3 Mise en œuvre
- `src/core/insight.ts` : `insightPoints(c)` = Anneaux × 10 + Σ `skills[].rank` + `insightBonus ?? 0` ; `suggestedInsightRank(points)`.
- `src/rules/l5r4e.ts` : `INSIGHT = { ringMultiplier: 10, firstThreshold: 150, step: 25, maxRank: 10 }`.
- Schéma : champ **facultatif** `insightBonus: int(-50, 200)`, absent = 0. `SCHEMA_VERSION` inchangé ; fusion à l'import par `characterShape`, comme les autres champs scalaires.
- `insightRank` **reste saisi et fait foi** (initiative, soins, Feinte, rang d'école) ; le calcul ne le modifie jamais.
- Fiche, bloc Identité : en lecture, ligne « Insight » `125 · Rang 1` (`sheet-insight`) ; en Edit, « Calculé : 125 pts → Rang 1 » sous « Rang d'Insight » (`insight-computed`) et champ « Bonus d'Insight (MJ) » (`OptionalNumber`, −50 à 200). Écart : étiquette `.tag.warn` « Rang saisi 3 · calculé 1 » (`insight-mismatch`), en lecture et en Edit ; ni blocage, ni correction, ni bouton « appliquer ».

### K.4 Tests
| # | Cas | Attendu |
|---|-----|---------|
| I1 | `reference/perso-test-ecoles.json` (Anneaux 2/3/2/2/2) | 119 pts, Rang 1 |
| I2 | `reference/exemple-personnage.json` | 125 pts, Rang 1 |
| I3 | Seuils 149 / 150 / 174 / 175 / 200 / 349 / 350 / 420 | 1 / 2 / 2 / 3 / 4 / 9 / 10 / 10 |
| I4 | Un seul Trait d'une paire monté | Points inchangés |
| I5 | 2 spécialisations ajoutées | Points inchangés |
| I6 | `insightBonus: 10` sur I2 | 135 pts |
| I7 | Fiche sans `insightBonus` importée puis exportée | Champ absent, fiche valide |
| I8 | `insightRank` 3 sur I2 | Badge d'écart ; initiative calculée avec 3 |
| I9 | `insightRank` 1 sur I2 | Aucun badge |
| K1 | E2E bureau, mobile (iPhone 13, Pixel 7) et 360 px | Ligne Insight et badge lisibles, sans débordement |

Les identifiants I1 à I9 sont repris du handoff source (les I1 à I13 de la localisation reportée sont retirés du plan, voir la note de l'annexe J). Le cas E2E est nommé **K1**.

### K.5 Écarts de mise en œuvre
- Numéro de lot : 21 au lieu de 18 (voir le statut).
- Référence de page de la règle : aucune dans le commentaire de `INSIGHT` (page non vérifiée).
- `OptionalNumber` gagne une borne `max` (10 par défaut) pour accepter le bonus jusqu'à 200.
- `Field` gagne une indication `hint`, affichée sous la saisie hors du libellé : le nom accessible du champ reste « Rang d'Insight ».
- Tests : `tests/core.insight.spec.ts` (I1 à I8, bornes et fusion), `tests/ui/insight.spec.tsx` (lecture, I8, I9, bonus du MJ), `tests/e2e/insight.spec.ts` et K1 dans `tests/e2e/mobile.spec.ts`. Aucun test existant modifié.

### K.6 Hors périmètre
- Aucun lien avec l'XP : le coût des achats n'est ni calculé ni vérifié (lot à part, journal d'achats).
- Pas de mise à jour automatique de `insightRank`.

---

