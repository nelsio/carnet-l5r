## Annexe B — Bonus de jet (techniques, avantages, désavantages)

Intégré à la v1.0.0 (voir P6) : certaines techniques d'école, certains avantages et désavantages modifient les jets.

### Données (`Character.modifiers`, facultatif)
```ts
interface Modifier {
  id: string; name: string;                        // ex. « Voie de la Grue (Rang 1) »
  source: "technique" | "advantage" | "disadvantage" | "other";
  appliesTo: "all" | "skill" | "trait" | "social" | "attack" | "damage" | "initiative" | "armor" | "wounds";
  skill?: string;                                   // si appliesTo = skill (nom normalisé)
  trait?: RollTrait;                                // si appliesTo = trait
  rolled: number; kept: number;                     // −10..10, défaut 0 (négatif = malus)
  flat: number;                                     // −50..50 : bonus fixe au total ; ND d'armure (armor) ; réduction de pénalité (wounds)
  freeRaises: number;                               // 0..10 : augmentations gratuites
  tn: number;                                       // −50..50 : modification du ND des jets concernés
  stance?: Stance;                                  // posture requise (sinon : toutes)
  mode: "always" | "optional";                      // d'office, ou situationnel (à cocher au jet)
  note: string;                                     // condition, précision
}
```

### Règles
- **Portée** : `all` = jets de compétence et de trait ; `skill` = cette compétence ; `trait` = jets sur ce trait (compétence ou trait pur) ; `social` = compétences sociales (`SOCIAL_SKILLS` : Comédie, Courtisan (ou Courtoisie), Étiquette, Sincérité, Intimidation, Tentation, Représentation et ses spécialités) ; `attack` = attaques ; `damage` = dégâts ; `initiative` ; `armor` = ND d'armure ; `wounds` = pénalité de blessure (réduite de `flat`, jamais sous 0, toujours appliquée). Ni `armor` ni `wounds` ne concernent un jet.
- **Posture** : un bonus avec `stance` ne s'applique que dans cette posture (jets et ND d'armure). Hors du lanceur (fiche, statistiques), la posture de référence est Attaque.
- **ND** : `tn` s'ajoute au ND final des jets concernés (`targetNumber({…, modifier})`).
- **Ordre** dans `computePool` : posture → dés ± → **bonus de jet** → point de Vide → règle des dix dés. Un malus ne descend jamais sous 0 dé. Le bonus fixe s'ajoute au total ; les augmentations gratuites s'ajoutent à celles saisies.
- **Application** : un bonus `always` est compris dans les réserves de la fiche, des actions et des statistiques, et coché d'office dans le lanceur (décochable pour un jet). Un bonus `optional` est proposé décoché. Les cases sont remises à zéro au choix d'une action. Les bonus de ND d'armure situationnels se cochent dans le panneau Posture.
- **Fusion** (§8) : liste avec clé, par `id` puis par nom normalisé.

### Saisie
Panneau « Bonus de jet » de la fiche : départ d'un **modèle** (`MODIFIER_TEMPLATES` dans `src/rules/l5r4e.ts`, liste en J.4), « Bonus libre » par défaut ; ou saisie dans le JSON de la fiche (champ `modifiers`).

**Lot 20 (annexe J.4)** : le catalogue nommé (`NAMED_MODIFIERS`) est **retiré**. Les modèles sont des formes d'effet regroupées par source (avantage, désavantage, technique, autre), sans nom ni texte du livre ; le joueur peut aussi écrire ses bonus dans le JSON de sa fiche (champ `modifiers`).

Les rangs 4 et 5 de l'école Hiruma Bushi n'ont pas d'effet sur les jets (attaque en action simple, blessures excédentaires reportées) : ils restent dans le texte des techniques de la fiche.

---

