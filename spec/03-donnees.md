## 3. Modèle de données

### 3.1 Fiche (`Character`, `schemaVersion: 1`)
Clés de code en anglais, libellés d'interface en français.

**Format courant : `schemaVersion: 2`** (depuis la v2.0). Il ajoute à la v1 ci-dessous `schoolId`, `schoolRank` et les `keywords` des armes (annexe C.2) ; `migrate()` convertit toute fiche v0 ou v1. La v2.1 n'a pas changé le format (annexe D-i).

```ts
type TraitKey = "stamina"|"willpower"|"strength"|"perception"|"agility"|"intelligence"|"reflexes"|"awareness";
type RollTrait = TraitKey | "void";
type Stance = "attack" | "fullAttack" | "defense" | "fullDefense" | "center";   // Attaque, Assaut, Défense, Défense totale, Centre

interface Character {
  schemaVersion: 1;
  name: string;                 // 1..80
  clan: string;                 // libre ; la couleur est déduite (§6.4)
  family: string; school: string;
  insightRank: number;          // entier 1..10
  honor: number; glory: number; status: number;   // 0..10, une décimale
  xp: { total: number; spent: number };           // entiers >= 0
  traits: Record<TraitKey, number>;               // entiers 1..10
  voidRing: number;             // 1..10
  voidPoints: number;           // 0..voidRing   (état de jeu)
  wounds: number;               // >= 0          (état de jeu)
  armor: { name: string; bonus: number; reduction: number };   // bonus = ND d'armure ; reduction = réduction de dégâts (entier >= 0, défaut 0)
  skills: { name: string; rank: number; trait: RollTrait; emphases: string[] }[];   // rank 0..10
  weapons: { name: string; skill: string; dr: string; bowStrength?: number }[];      // dr "3k2" ou "3g2"
  techniques: { name: string; text: string }[];
  maneuvers: { id: string; name: string; cost: number; effect: string; stackable: boolean }[];
  modifiers?: Modifier[];       // facultatif : bonus de jet des techniques et avantages (annexe B)
  advantages: string; disadvantages: string; notes: string;
}
```
- `maneuvers` vide ⇒ manœuvres par défaut des données de règles. **v1.1** : la fiche n'a plus d'encadré « Manœuvres » (ni en lecture, ni en modification). Le champ reste dans le format (compatibilité, import/fusion) et les manœuvres restent proposées dans le lanceur sur les attaques ; une fiche qui en contient garde ses valeurs, mais elles ne s'éditent plus que par import JSON.
- Une arme est **à distance** si `skill` ou `name` contient `kyujutsu`, `arc` ou `yumi` (insensible à la casse) : attaque sur Réflexes, dégâts sur `bowStrength`.
- Taille max d'une fiche sérialisée : 256 Ko.

### 3.2 Bibliothèque locale (IndexedDB, base `carnet-l5r`)
```ts
interface LibraryEntry {
  id: string;                 // UUID local
  character: Character;
  mode: "edit" | "readonly";  // readonly = fiche importée en consultation (MJ)
  updatedAt: string;          // ISO
  linkedFile?: { handle: FileSystemFileHandle; name: string; lastModified: number };  // Chrome/Edge uniquement
}
```
Préférences, dans un magasin séparé : thème, **lanceur de dés** (`diceRoller`, booléen, **affiché par défaut** depuis la v2.17.0 ; l'ancienne clé `showDiceRoller` est ignorée puis supprimée, annexe J.7), **multiplicateur de blessures** (`woundMultiplier`, 2 à 5, 2 par défaut, v2.5 : annexe E.6), dernière fiche ouverte.

### 3.3 État non persisté
Restent en mémoire de l'onglet :
- l'historique des jets ;
- la posture ;
- les effets du round (Vide en armure, défense totale) ;
- le score d'initiative ;
- les manœuvres sélectionnées ;
- la spécialisation choisie au lanceur ;
- les techniques d'école cochées, les compteurs, la case Monté et le Centre du round précédent (annexe C.5) ;
- l'ouverture du panneau mobile.

---

