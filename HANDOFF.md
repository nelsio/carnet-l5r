# Carnet de Rokugan — Handoff pour implémentation

Compagnon de campagne pour joueurs de **L5R 4e édition** : fiche de personnage + aide aux jets Roll & Keep par situation.

Fait foi :
- pour l'UX, le rendu et la version mobile : le prototype validé `reference/prototype.html` ;
- pour l'architecture, les données et les règles : ce document.

**État au 25/10/2026 :** version publiée **v2.7.0**, lots 1 à 12 livrés (§11), format de fiche `schemaVersion: 2`. **Lot 12** (annexe E, validée le 24/10/2026) livré : v2.2.0 (correctifs de règles et retouches d'interface), v2.3.0 (combat complet), v2.4.0 (maîtrises et armures), v2.5.0 (récupération), v2.6.0 (vocabulaire français) et v2.7.0 (bataille de masse).

**Ordre de lecture :** §1 Périmètre → §2 Architecture → §3 Données → §4 Moteur de règles → §5 Stockage → §6 Interface → §7 Mobile → §8 Import/export → §9 Distribution GitHub → §10 Tests → §11 Lots → §12 Points ouverts. Annexes : A (format v0), B (bonus de jet), C (écoles bushi), D (courtisans et Shosuro), E (lot 12 : règles du livre, combat complet, ergonomie).

---

## 1. Périmètre

### Décisions validées
| Sujet | Décision |
|---|---|
| Forme | **Un seul fichier HTML autonome** (JS, CSS et polices inline). Aucun serveur, aucun compte, aucune requête réseau. |
| Distribution | Dépôt **GitHub** : la page est servie par **GitHub Pages**, et le fichier `carnet-l5r.html` est joint à chaque release. Le même fichier marche en ligne et ouvert en local (`file://`). |
| Stockage | Les fiches vivent dans le **navigateur** (IndexedDB). On les échange et on les sauvegarde en **fichiers JSON**, rangés où l'on veut (le Google Drive de la campagne, par exemple). |
| Fichier lié | Sur Chrome et Edge desktop, une fiche peut être **liée à un fichier JSON** : chaque modification y est enregistrée automatiquement (utile avec un dossier Drive synchronisé sur le PC). Ailleurs, on passe par import et export. |
| MJ | Le MJ importe les JSON des joueurs **en consultation** : lecture seule, aucune modification possible. |
| Import | **Fusion** d'un JSON dans une fiche, avec aperçu des changements avant application. Export JSON complet. |
| Thèmes | Clair **écru**, sombre **anthracite**, mode auto. Accent de couleur selon le **clan**. |
| Mobile | Mise en page validée sur téléphone (§7). |

### Hors périmètre
Serveur, comptes, synchronisation automatique entre appareils, édition par le MJ, jets partagés en temps réel, sorts de shugenja (le catalogue d'actions les permettra plus tard).

---

## 2. Architecture

### Principes
1. **Le moteur de règles est du TypeScript pur** (sans DOM ni React), testé à 100 %. Toute la logique L5R y vit.
2. **Les règles sont des données** (`src/rules/l5r4e.ts`). Corriger une règle = modifier une donnée, pas du code.
3. **Le stockage passe par une interface** (`LibraryStore`, §5), indépendante de l'interface utilisateur.
4. **Un seul schéma Zod** valide la fiche partout : chargement, import, liaison de fichier.
5. **Un seul livrable** : `dist/carnet-l5r.html`.

### Structure du dépôt (un seul package, pas de monorepo)
```
carnet-l5r/
├─ src/
│  ├─ core/       # schéma Zod, types, moteur de règles, fusion, migrations (aucune dépendance au DOM)
│  ├─ rules/      # l5r4e.ts : manœuvres, postures, ND, blessures, clans, catalogue d'actions
│  │              # ecoles.ts + ecoles-bushi.json (annexe C) + ecoles-courtisans.json (annexe D) : techniques d'école ; maitrises.json (annexe E.4) : maîtrises de compétence
│  ├─ storage/    # LibraryStore : IndexedDB, fichiers, fichier lié
│  ├─ ui/         # composants React, thème CSS, hooks
│  └─ main.tsx
├─ tests/
│  ├─ core.rules.spec.ts      # fourni : spécification exécutable du moteur
│  ├─ core.*.spec.ts          # bonus de jet (B1 à B11), écoles bushi (T1 à T24), courtisans (T25 à T42), import, moteur
│  ├─ storage/                # Vitest + fake-indexeddb
│  ├─ ui/                     # Vitest + Testing Library
│  └─ e2e/                    # Playwright
├─ reference/     # prototype.html, exemple-personnage.json, ecoles-bushi.json, perso-test-*.json (ne pas modifier)
├─ public/fonts/  # polices embarquées dans le build
├─ .github/workflows/  # ci.yml, pages.yml, release.yml
├─ README.md      # guide joueur (§9.3)
└─ HANDOFF.md
```
Dans les tests fournis, `@carnet/core` est un alias de `src/core` (à déclarer dans `vite.config.ts` et `tsconfig.json`).

### Choix techniques
| Brique | Choix | Raison |
|---|---|---|
| Langage | TypeScript strict | Moteur typé, refactorisation sûre |
| Interface | React 18 + Vite | Composants maintenables. Pas de librairie UI : CSS porté du prototype |
| Fichier unique | `vite-plugin-singlefile` | Un seul HTML qui marche en `file://` |
| État | `useReducer` + contexte | Une fiche à la fois, besoin modeste |
| Validation | Zod | Messages par champ pour l'aperçu d'import |
| Stockage | IndexedDB via `idb` (petit wrapper) | Fiable, plus spacieux que `localStorage` |
| Tests | Vitest, Testing Library, Playwright | |
| CI/CD | GitHub Actions + GitHub Pages | Gratuit, rien à héberger |

---

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
Préférences, dans un magasin séparé : thème, **lanceur de dés** (`showDiceRoller`, booléen, **masqué par défaut**), **multiplicateur de blessures** (`woundMultiplier`, 2 à 5, 2 par défaut, v2.5 : annexe E.6), dernière fiche ouverte.

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

## 5. Stockage (`src/storage`)

```ts
interface LibraryStore {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | undefined>;
  put(entry: LibraryEntry): Promise<void>;        // enregistre + écrit dans le fichier lié s'il y en a un
  remove(id: string): Promise<void>;
}
```

### 5.1 IndexedDB (toujours actif)
- Sauvegarde automatique 500 ms après la dernière modification.
- Indicateur discret « Enregistré dans ce navigateur ».
- Si IndexedDB est indisponible (navigation privée stricte, stockage refusé) : l'outil fonctionne en mémoire, avec une bannière permanente « Sauvegarde impossible dans ce navigateur : exporte ta fiche avant de fermer ».
- Au premier lancement, la page demande `navigator.storage.persist()` pour éviter que le navigateur efface les données. Un refus est silencieux.

### 5.2 Fichier lié (File System Access API)
- Proposé seulement si `window.showSaveFilePicker` existe (Chrome et Edge desktop). Ailleurs, le bouton n'est pas affiché.
- « Lier à un fichier… » : l'utilisateur choisit ou crée un `.json`. La poignée (handle) est gardée dans l'entrée IndexedDB.
- Chaque sauvegarde écrit aussi le fichier.
- **Au rechargement**, la permission d'écriture doit être redemandée : bandeau « Reprendre l'enregistrement dans <fichier> » avec un bouton. Sans clic, la fiche continue d'être sauvée dans le navigateur.
- **Conflit** : avant d'écrire, comparer le `lastModified` du fichier avec la dernière valeur connue. S'il a changé (modifié ailleurs, par exemple par la synchro Drive) : bandeau « Le fichier a été modifié ailleurs » avec trois boutons :
  - « Charger la version du fichier » ;
  - « Écraser avec ma version » ;
  - « Fusionner » (ouvre l'aperçu de fusion §8).
- « Délier » retire le lien sans toucher au fichier.

---

## 6. Interface (`src/ui`)

### 6.1 Écrans
| Écran | Contenu |
|---|---|
| **Bibliothèque** (écran d'accueil s'il n'y a aucune fiche, sinon accessible par l'en-tête) | Liste des fiches locales : nom, clan (pastille de couleur), école, date, badge « Consultation » pour les fiches en lecture seule. Actions : Ouvrir, Nouvelle fiche, Importer un JSON, Supprimer (avec confirmation intégrée à la page). |
| **Fiche** | Comme le prototype (§6.2). |
| **Aide de jeu** | Comme le prototype (§6.2), avec la situation **Cour** en plus (annexe D.8). |
| **Statistiques** | Tableau des chances de réussite de tous les jets (§6.2). Troisième vue, à côté de Fiche et Aide de jeu (v2.1.2). |

**Fiches en consultation** :
- aucun champ éditable, pas de bouton « Modifier » ;
- les pastilles de Vide et les blessures ne sont pas cliquables ;
- le lanceur de dés reste utilisable mais ne dépense rien ;
- le bouton « Rendre modifiable » crée une **copie** éditable.

### 6.2 Comportement à reproduire du prototype
- **En-tête** :
  - nom du clan en couleur au-dessus du nom ;
  - famille, école et Rang dessous ;
  - bouton de thème (auto, clair, sombre) ;
  - **boutons d'en-tête** Bibliothèque, Lanceur de dés et Thème : chacun = **icône + texte** sur bureau (livres, dé, demi-cercle), **icône seule** sur mobile (§7) ; le texte reste présent pour les lecteurs d'écran et en info-bulle, avec l'état courant (« Thème : sombre », « Lanceur de dés : masqué ») ;
  - bouton **« Lanceur de dés : masqué / affiché »**, à côté du thème et de la Bibliothèque (même style ; fond d'accent pâle quand affiché). **Masqué par défaut**, choix mémorisé dans les préférences :
    - **masqué** : le panneau d'action reste un panneau d'aide (réserve, ligne « lancer à la main », Min · Moy. · Max, chance de réussite, ND final, options, manœuvres) mais **sans** bouton « Lancer », sans dés obtenus, sans verdict et sans historique. Les enchaînements qui dépendent d'un lancer (score d'initiative affiché, bonus de Défense totale, dés de dégâts pré-remplis) ne se déclenchent pas ; les dépenses de Vide se font par les pastilles et le panneau Vide ;
    - **affiché** : le bouton « Lancer » et les résultats apparaissent dans tous les lanceurs (Enquête, Cour, Déplacement, Combat) ;
    - le changement s'applique immédiatement, sans recharger ;
  - onglets Fiche, Aide de jeu et Statistiques (dans la barre du bas sur mobile, §7).
- **Barre d'état collante** :
  - piste des 8 niveaux de blessure, avec le niveau courant ;
  - compteur −/+ ;
  - pastilles de Vide cliquables ;
  - quatre **tuiles compactes** (petit libellé au-dessus, valeur en chiffres) : **Dépl.** (action libre / action simple, ex. « 10/20 pi »), **ND armure**, **Réduction**, **Pénalité** (bordure et chiffre rouges dès que la pénalité dépasse 0). Jamais une ligne de texte unique : elle serait tronquée sur mobile.
  - les tuiles **ND armure** et **Réduction** sont cliquables, avec le même aspect que les autres tuiles (ni crayon ni pointillés ; bordure d'accent seulement quand l'éditeur est ouvert) : un appui ouvre sous les tuiles un **éditeur d'armure** avec trois champs, Armure (nom), Bonus au ND et Réduction. Il affiche aussi la formule « ND d'armure = 5 × Réflexes + 5 + bonus = N » et un bouton Fermer. Les valeurs sont enregistrées comme toute modification de la fiche. Le ND d'armure lui-même reste calculé (Réflexes + bonus + posture + Vide) et ne se saisit pas directement. Éditeur absent pour une fiche en consultation.
- **Fiche** :
  - Anneaux et Traits ;
  - identité et réputation ;
  - compétences avec leur réserve ;
  - armes avec les réserves d'attaque et de dégâts ;
  - techniques ;
  - avantages, désavantages, notes.

  Chaque bloc a son bouton « Edit » (« Terminer » pendant l'édition) ; plusieurs blocs peuvent être ouverts ensemble (annexe E.9 S2). Une fiche créée s'ouvre avec le bloc Identité en édition.
- **Aide de jeu** :
  - Enquête / Cour / Déplacement / Combat, avec en Combat les sous-types Escarmouche, Duel iaijutsu et Bataille (Statistiques est une vue à part, voir plus bas) ;
  - en Déplacement, un **encart « Se déplacer en combat »** en tête de liste : trois tuiles (action libre, action simple, maximum par round) en pieds et en mètres, calculées depuis l'Anneau d'Eau, avec un choix de terrain Normal / Modéré / Difficile (Anneau d'Eau −0 / −1 / −2, 1 au minimum, annexe E.2 C4) ;
  - en Escarmouche : carte **Initiative** en premier (elle affiche le score, et « Nouveau round » ne la réinitialise pas), puis la carte **Nouveau round** (bouton et description courte : « Efface le Vide en armure et la Défense totale ; garde l'initiative et les compteurs. », deux lignes au plus sur mobile ; présente dans tous les types de combat), puis Posture (sauf en Duel), puis le panneau Vide, puis les actions.
- **Lanceur** :
  - réserve en grand, et juste dessous la ligne **Min · Moy. · Max** (« Max 30+ » si la réserve explose) et la **chance de réussite** contre le ND final quand il y en a un. Elle se recalcule à chaque option (augmentations, Vide, spécialisation, bonus fixe) ;
  - juste sous la réserve, une ligne **« lancer à la main »** (avant Min · Moy. · Max) qui donne les règles de relance pour jouer avec de vrais dés (pas de phrase « Lance N dés, garde K » : le XgY suffit) :
    - la règle d'explosion applicable : « Les **10** explosent : relance le dé et additionne, tant qu'il retombe sur 10. », ou « Les **9 et 10** explosent… » en cas de maîtrise, ou « Aucun dé n'explose (compétence non maîtrisée). » ;
    - « Spécialisation : relance une fois chaque **1**. » si une spécialisation est choisie (liste des spécialisations de la compétence, ou case si elle n'en a pas, annexe D-c) ;
    - « Ajoute **+N** au total » si bonus fixe ou règle des dix dés (« dont règle des dix dés ») ;
    - elle se met à jour avec chaque option (Vide, dés ±, posture, maîtrise) ;
  - ND de base selon l'action ;
  - augmentations libres et gratuites ;
  - dés ± et bonus fixe ;
  - **disposition des options** en grille de 2 colonnes **sans case vide** : quand une action n'a ni ND ni augmentations (dégâts, initiative), « Dés lancés ± » et « Bonus fixe » partagent la même ligne. Une cellule vide n'est insérée que pour aligner un ND sans augmentations (jet sans compétence) ;
  - cases Vide, Spécialisation (cochée automatiquement si elle correspond) et Vide-compétence ;
  - manœuvres, sur les attaques ;
  - nombre d'augmentations annoncées / maximum ;
  - ND final détaillé ;
  - dés obtenus (gardés mis en évidence, explosions marquées) ; un dé qui a explosé affiche **sous son total le détail des tirages** (« 13 » avec « 9+4 » en petit), visible sans survol, donc aussi sur mobile ;
  - verdict, marge, augmentations possibles ;
  - historique des 6 derniers jets.
- **Statistiques** (troisième vue, à côté de Fiche et Aide de jeu : dans l'en-tête sur bureau, dans la barre du bas sur mobile ; écran pleine largeur, sans lanceur) : tableau de tous les jets du personnage. Colonnes : Jet, Réserve, Min, Moy., Max, puis chance de réussite contre ND 10, 15, 20, 25, 30 et 40.
  - Lignes : Initiative ; pour chaque arme, l'attaque puis les dégâts en sous-ligne (└) ; puis les compétences triées par nom.
  - Les jets sans ND (dégâts, initiative) affichent « sans ND » à la place des pourcentages.
  - Cellules teintées en vert proportionnellement à la chance de réussite.
  - Trois cases à cocher : « Avec un point de Vide », « Spécialisations appliquées » (cochée par défaut), « Pénalité de blessure actuelle » (cochée par défaut).
  - Mention : chaque augmentation ajoute +5 au ND, il suffit de lire une colonne plus à droite. Sur mobile, le tableau défile horizontalement dans son cadre.
- **Détails repliables (« i »)** :
  - les boutons des panneaux **Posture** et **Dépenser du Vide** n'affichent que leur titre ;
  - **un seul** petit bouton rond « i » par panneau, placé dans l'en-tête à côté du titre (« Posture i », « Dépenser du Vide i » ; pas de compteur « reste » dans cet en-tête, les points de Vide restants sont dans la barre d'état ; en-tête sur une seule ligne, y compris sur mobile) ; il déplie ou replie **toutes** les descriptions du panneau à la fois, sans rien sélectionner ;
  - le « i » est rempli en couleur d'accent quand les détails sont ouverts ; les deux panneaux sont indépendants ;
  - l'encart **Se déplacer en combat** affiche par défaut seulement les trois distances en pieds ; son « i », à côté du titre, déplie les mètres, les formules et le rappel « terrain difficile » ;
  - l'état ouvert ou fermé reste en mémoire de l'onglet (non persisté). Accessibilité : `aria-expanded` et libellé « Afficher / Masquer le détail : <panneau> ». Zone de toucher d'au moins 40 px (pseudo-élément étendu).
- **Arbre attaque → dégâts** : chaque carte « Dégâts » est rattachée à son attaque (champ `parent` de l'action). Elle est affichée juste sous cette attaque, décalée d'environ 26 px, avec un connecteur en coude (└). Son titre garde l'arme : « Dégâts · Katana ». Le connecteur passe en couleur d'accent quand des dés de dégâts sont en attente pour ce parent, avec la mention « +Ng0 en attente ». Concerne : armes, mains nues, et Frappe → Dégâts en duel.
- **Enchaînements** :
  - une attaque réussie avec « Augmentation des dégâts » × N pré-remplit +N dés au jet de dégâts suivant ;
  - une Défense totale lancée met à jour la posture et le ND d'armure.

### 6.3 Qualité
- Aucun texte saisi n'est rendu en HTML (pas de `dangerouslySetInnerHTML`).
- Focus clavier visible, Échap ferme le panneau mobile, `prefers-reduced-motion` respecté.
- Aucun appel réseau : polices embarquées, aucune bibliothèque chargée depuis un CDN.

### 6.4 Thème et couleurs
- Couleurs uniquement en variables CSS.
- Clair écru : fond `#ece6d8`, surface `#f7f3ea`, encre `#2a261f`.
- Sombre anthracite : fond `#25272a`, surface `#2f3236`, encre `#e7e5e0`.
- Mode auto selon `prefers-color-scheme` ; choix forcé via `data-theme` sur `<html>`, mémorisé.
- Accent = clan :

| Clan | Clair | Sombre |
|---|---|---|
| Crabe | `#3d5a73` | `#8fb0cc` |
| Grue | `#2f7fb5` | `#8cc4ea` |
| Dragon | `#2f7a45` | `#7fcb93` |
| Licorne | `#6b3fa0` | `#bb9ae6` |
| Lion | `#a87b0c` | `#e6bf55` |
| Mante | `#1f8073` | `#6fd0c1` |
| Phénix | `#c25a14` | `#f0a066` |
| Scorpion | `#a82828` | `#f07a7a` |
| Araignée | `#4a4a4a` | `#b5b5b5` |
| Familles impériales | `#8a6d12` | `#dcc06a` |
| Clan non reconnu | `#7a6a3a` | `#cdb67a` |

- Reconnaissance du clan sans accents ni casse ; les noms anglais sont acceptés (crab, crane, unicorn, mantis, phoenix, spider).
- Les couleurs des Anneaux sont fixes.
- Polices : Shippori Mincho B1 (titres), Zen Kaku Gothic New (texte), JetBrains Mono (chiffres), embarquées en `woff2` (licence OFL, à citer dans le README).

---

## 7. Version mobile (validée sur téléphone)

Point de rupture : **largeur ≤ 720 px**. Au-dessus, mise en page bureau inchangée.

| Élément | Comportement mobile |
|---|---|
| En-tête | Bibliothèque, Lanceur de dés et Thème en **boutons ronds de 40 px, icône seule** ; nom du personnage et icônes tiennent **sur une seule ligne** (le nom passe à la ligne si besoin, jamais les icônes). Lanceur affiché = fond d'accent pâle. |
| Navigation | Onglets Fiche / Aide de jeu / Statistiques dans une **barre fixe en bas**, trois boutons de même largeur. Marge basse = hauteur de la barre + `env(safe-area-inset-bottom)`. Onglet actif sur fond d'accent pâle. Les quatre onglets de situation de l'aide de jeu tiennent sur **une ligne, sans défilement** (360 px compris). |
| Barre d'état | Les quatre tuiles Dépl. / ND armure / Réduction / Pénalité occupent **toute la largeur sur 4 colonnes égales**, texte centré. **Résumé sur une ligne** (niveau de blessure, pénalité, `blessures / seuil max`), cliquable, bordure rouge si le personnage est blessé. Un appui déplie la piste complète en **2 rangées de 4**. En dessous : compteur −/+ (boutons 40 px) et pastilles de Vide (26 px). |
| Lanceur | **Panneau glissant depuis le bas**, ouvert au choix d'une action (pas à l'ouverture de l'écran). Hauteur max 88 vh, défilement interne, fond assombri derrière. Poignée et bouton × en haut ; fermeture par ×, appui sur le fond ou Échap. Bouton « Lancer » **collé en bas** du panneau. Après un lancer, le résultat est amené à l'écran et le panneau reste ouvert. Changer une option ne remet pas le défilement du panneau à zéro. Le défilement de la page est bloqué pendant l'ouverture. |
| Situations | Rangées Enquête / Déplacement / Combat et sous-types en **défilement horizontal**, sans retour à la ligne. |
| Postures et Vide | Grille de 2 colonnes, titres seuls ; un « i » de 26 px dans l'en-tête de chaque panneau, zone de toucher ≥ 40 px. |
| Saisie | Champs en **16 px** (pas de zoom automatique sur iOS). Cibles tactiles d'au moins 40 px. |
| Anneaux | 2 colonnes, le Vide sur toute la largeur. |
| Encoches | Gouttières latérales `max(16px, env(safe-area-inset-left/right))`. Barre du bas et panneau respectent les zones sûres. |

---

## 8. Import et export JSON

### Export
« Exporter la fiche » télécharge `<nom-normalisé>-l5r.json` : JSON indenté, `schemaVersion` inclus. Disponible pour toutes les fiches, y compris en consultation.

### Import
Depuis un fichier (bouton ou glisser-déposer). Trois destinations :

| Destination | Effet |
|---|---|
| **Nouvelle fiche** | Crée une entrée modifiable (fichier complet requis, validé par le schéma complet) |
| **Consultation** (MJ) | Crée une entrée en lecture seule |
| **Fusionner dans la fiche ouverte** | Fusion ci-dessous, avec aperçu |

### Règles de fusion (`mergeCharacter`)
1. Lecture, analyse JSON, `migrate()`.
2. **Validation des champs présents** (types, bornes). Un seul champ invalide bloque tout l'import, avec un message par champ (« traits.agility : doit être un entier entre 1 et 10 »).
3. Les **clés inconnues** sont ignorées et listées en avertissement.
4. Règles par type de champ :
   - **Champs simples** : la valeur du fichier remplace. `null` est ignoré ; `""` vide un texte.
   - **Objets** (`traits`, `armor`, `xp`) : fusion clé par clé.
   - **Listes avec clé** (ajout ou mise à jour, **jamais de suppression**) :
     - `skills`, `weapons`, `techniques` : par nom normalisé ;
     - `maneuvers` : par `id`, sinon par nom normalisé.

     Un élément correspondant est fusionné champ par champ **en gardant son nom d'origine**. Un nouvel élément est ajouté en fin de liste. Une liste vide ne change rien.
   - Un `schemaVersion` plus récent que l'outil est rejeté : « Fichier créé par une version plus récente de l'outil ».
5. **Aperçu** avant application : modifications (`champ : avant → après`), ajouts, avertissements. Boutons « Appliquer » et « Annuler ». Un import refusé n'écrit rien.

---

## 9. Distribution GitHub

### 9.1 Workflows (`.github/workflows/`)
| Workflow | Déclencheur | Étapes |
|---|---|---|
| `ci.yml` | push, pull request | install → lint → `tsc --noEmit` → Vitest → build → Playwright |
| `pages.yml` | push sur `main` | build → publication de `dist/carnet-l5r.html` comme `index.html` sur GitHub Pages |
| `release.yml` | tag `v*` | build → release GitHub avec `carnet-l5r.html` en pièce jointe et notes générées |

### 9.2 Versionnement
- SemVer. La version de l'outil est affichée en pied de page.
- Toute évolution du format de fiche incrémente `schemaVersion` et ajoute une migration testée.
- Une ancienne fiche s'ouvre toujours dans une version plus récente de l'outil.

### 9.3 README (guide joueur, en français)
1. **Utiliser en ligne** : l'adresse GitHub Pages. Les fiches restent dans ton navigateur, rien n'est envoyé.
2. **Utiliser hors-ligne** : télécharger `carnet-l5r.html` depuis la dernière release et l'ouvrir dans le navigateur.
3. **Sauvegarder et partager** :
   - exporter sa fiche en JSON et la ranger dans le dossier Drive de la campagne ;
   - sur Chrome ou Edge, la lier à un fichier du dossier Drive synchronisé.
4. **Pour le MJ** : importer les JSON des joueurs en mode Consultation.
5. **Changer d'appareil** : exporter, puis importer en « Nouvelle fiche ».
6. Licences des polices et mention « L5R est une marque de son éditeur ; outil de fan non officiel ».

---

## 10. Tests

« Terminé » = tests verts, `tsc --noEmit` sans erreur, lint propre, CI verte.

État en v2.7.0 : **493 tests Vitest** (moteur, stockage, interface) et **60 tests Playwright** (chromium, iPhone 13, Pixel 7), lignes de `src/core` couvertes à 100 %.

### 10.1 Moteur (`tests/core.rules.spec.ts`) — fourni, 80 tests
- C'est la **spécification exécutable** du moteur. Elle a été validée contre une implémentation de référence : 80 tests sur 80 passent (v1.1 : règle des dix dés du livre, maîtrise 7+).
- **Changement d'attendus en v1.1** : la règle des dix dés précédente était fausse. Les cas `12k5`, `14k9` et la réserve 14k7 du test « règle des dix dés en dernier » ont des valeurs corrigées, conformes au livre.
- L'agent implémente `src/core` jusqu'à ce que le fichier passe, **sans modifier les valeurs attendues**. Un désaccord se signale (§12), il ne se corrige pas.
- Couverture visée : 100 % des lignes de `src/core`.
- Personnage de référence : `reference/exemple-personnage.json` (Kakita Haruto).

### 10.1 bis Bonus de jet (annexe B) — à écrire par l'agent
Ces cas complètent la spec fournie. L'agent les écrit dans `tests/core.modifiers.spec.ts` avec la signature réelle de son implémentation, sans changer les attendus.

| # | Scénario | Attendu |
|---|---|---|
| B1 | Bonus `skill` Kenjutsu +1g0, `always` | Attaque Kenjutsu 5g3 → 6g3 ; Investigation inchangée |
| B2 | Bonus `trait` Agilité +0g1 | Kenjutsu et Équitation gagnent +0g1 ; jet de Constitution inchangé |
| B3 | Bonus `social` +5 au ND | ND final de Courtoisie, Étiquette, Sincérité +5 ; Kenjutsu inchangé |
| B4 | Hiruma rang 1 : +1g0 aux attaques, `stance: "attack"` | +1g0 en Attaque ; rien en Assaut ni en Défense |
| B5 | Bonus `armor` +5 avec posture Défense | ND d'armure +5 en Défense seulement |
| B6 | Bonus `wounds` 3 (Force de la Terre), 11 blessures (Égratigné +3) puis 18 (Éraflé +5) | Pénalité 0, puis 2 ; jamais sous 0 |
| B7 | Malus −3g0 sur une réserve de 2g2 | 0g0 au minimum, jamais négatif |
| B8 | Ordre : bonus +6g0 sur 7g3 en Assaut avec Vide | 7+2 → 9g4, +6 → 15g4, +1g1 → 16g5, dix dés → 10g8 |
| B9 | Bonus `optional` | Absent des réserves de la fiche et des statistiques ; proposé décoché dans le lanceur |
| B10 | Augmentations gratuites +1 | Ajoutées à celles saisies, sans changer le ND |
| B11 | Fusion d'un JSON avec un `modifier` de même `id` | Mise à jour, pas de doublon |

### 10.2 Stockage (Vitest + `fake-indexeddb`)
| # | Scénario | Attendu |
|---|---|---|
| S1 | `put` puis `list` / `get` | Entrée relue à l'identique |
| S2 | IndexedDB indisponible | Le store bascule en mémoire et signale le mode dégradé |
| S3 | Fichier lié (API simulée) : `put` | Fichier écrit avec le JSON de la fiche |
| S4 | `lastModified` du fichier changé avant écriture | Pas d'écriture, conflit remonté |
| S5 | Permission refusée | La fiche reste sauvée dans le navigateur, état « non lié » exposé |

### 10.3 Interface (Vitest + Testing Library)
| # | Scénario | Attendu |
|---|---|---|
| U1 | Fiche en consultation | Aucun `input`, `textarea` ou `select` éditable ; pas de bouton « Modifier » ; pastilles inactives |
| U2 | Saisie d'un trait | Les réserves des compétences liées se mettent à jour |
| U3 | Clan « Scorpion » puis « crane » | Accent rouge, puis bleu ciel |
| U4 | Notes contenant `<img src=x onerror=alert(1)>` | Affichées telles quelles, aucun `img` créé |
| U5 | Aperçu d'import | Modifications, ajouts et avertissements listés ; « Annuler » ne change rien |
| U6 | Navigateur sans `showSaveFilePicker` | Pas de bouton « Lier à un fichier » |

### 10.4 Bout en bout (Playwright, sur le build `dist/carnet-l5r.html`)
| # | Parcours | Attendu |
|---|---|---|
| E1 | Ouvrir en `file://`, réseau coupé | Aucune requête sortante ; création d'une fiche ; données conservées après rechargement |
| E2 | Même fichier servi en HTTP (comme sur Pages) | Comportement identique |
| E3 | Export, puis import en « Nouvelle fiche » | Fiche identique |
| E4 | Import en « Consultation » | Badge visible, lecture seule, jet de dés possible sans dépense de Vide |
| E5 | Import par fusion ajoutant Kyujutsu et un arc | Aperçu correct ; après application, tir sur Réflexes et dégâts sur la force de l'arc |
| E6 | Escarmouche | Initiative en tête ; Assaut fait passer le ND d'armure de 20 à 10 ; « Nouveau round » garde l'initiative |
| E7 | Attaque réussie avec 2 « Augmentation des dégâts » | Dégâts pré-remplis à +2 dés |
| E8 | Thème forcé, puis rechargement | Le choix est conservé ; en auto, la page suit le système |
| E9 | Statistiques | Une ligne par compétence, attaque, dégâts et initiative ; cocher « point de Vide » augmente les réserves de +1g1 et les pourcentages |
| E10 | Lanceur : ajouter une augmentation | Le ND final monte de 5 et la chance de réussite baisse |
| E11 | Kenjutsu passé à 7 (dés forcés : 9, 4…) | Les dégâts du katana affichent la note de maîtrise ; le 9 est relancé et le dé affiche « 13 » avec « 9+4 » ; la compétence de l'arme est trouvée même écrite « kenjutsu » ou avec des espaces |
| E12 | Boutons « i » de Posture, Vide et Déplacement | Descriptions masquées par défaut ; un clic sur le « i » d'un panneau déplie toutes ses descriptions, un second les replie ; aucun effet sur la posture, le Vide ni l'autre panneau |
| E13 | Lanceur sur Dégâts · Katana | « Dés lancés ± » et « Bonus fixe » sur une seule ligne ; ligne « Les 10 explosent… » sans phrase « Lance… » ; avec Kenjutsu 7, « Les 9 et 10 explosent… » |
| E14 | Appui sur la tuile ND armure | L'éditeur d'armure s'ouvre ; bonus 5 avec Réflexes 2 → tuile ND 20 ; réduction 3 → tuile Réduction 3 ; valeurs conservées au rechargement |
| E15 | Option « Lanceur de dés » | Par défaut « masqué » : aucun bouton « Lancer » ni historique dans les lanceurs  ; « affiché » : le bouton apparaît partout ; le choix survit au rechargement |

### 10.5 Mobile (Playwright, appareils « iPhone 13 » et « Pixel 7 »)
| # | Scénario | Attendu |
|---|---|---|
| M1 | Toutes les vues | Aucun défilement horizontal de la page |
| M2 | Barre de navigation | Fixe en bas, visible sur Fiche comme sur Aide de jeu |
| M3 | Résumé de blessures | Un appui déplie la piste (2 × 4), un second la replie |
| M4 | Choisir une action | Le panneau s'ouvre ; « Lancer » est visible sans faire défiler |
| M5 | Lancer | Résultat visible, panneau toujours ouvert ; modifier une option ne ramène pas le panneau en haut |
| M6 | Fermeture du panneau | Par ×, par appui sur le fond et par Échap |
| M7 | Champs en mode modification | Taille de police calculée ≥ 16 px |
| M8 | Cibles tactiles (boutons −/+, pastilles, onglets) | Au moins 40 × 40 px |
| M9 | Tuiles de la barre d'état à 360 px de large | Les 4 libellés et valeurs sont entièrement visibles, sans troncature ni retour à la ligne |
| M10 | Boutons « i » | Zone de toucher ≥ 40 × 40 px ; les panneaux Posture et Vide tiennent sur moins d'un écran détails fermés |
| M11 | En-tête à 360 px de large | Bibliothèque, Lanceur de dés et Thème en icônes de 40 px sur la même ligne que le nom ; libellé accessible avec l'état courant |
| M12 | Combat sur mobile, et à 360 px de large | Carte « Nouveau round » entre l'Initiative et la Posture ; sa description tient sur 2 lignes au plus |
| M13 | Aide de jeu sur mobile, et à 360 px de large | Les 4 onglets de situation (Enquête, Cour, Déplacement, Combat) sur une ligne, sans défilement ni texte tronqué, zones de 40 px de haut ; Statistiques est dans la barre du bas |
| M14 | Bonus de jet sur mobile, et à 360 px de large (E24) | Chaque bonus sur 3 lignes (nom et source, effet, cible et note), aucun texte tronqué |
| M15 | Bataille de masse sur mobile, et à 360 px de large (E.8) | Panneau rempli (jet, résultat, dés de blessures, Encaisser) sans défilement horizontal ; boutons d'état et d'engagement de 40 px de haut, sans texte tronqué |

---

## 11. Plan de livraison (lots)

Chaque lot fait l'objet d'une PR, livrée avec ses tests verts.

1. **Socle** : Vite + React + TypeScript strict, ESLint, Vitest, `vite-plugin-singlefile`, workflow `ci.yml`.
2. **Moteur** : schéma Zod, migrations, données de règles, moteur → `core.rules.spec.ts` vert.
3. **Interface bureau** : portage du prototype en composants, thème, clans. Revue visuelle par comparaison avec `reference/prototype.html`.
4. **Mobile** : §7 → tests M1 à M9 (M10 à M15 ajoutés ensuite).
5. **Stockage** : bibliothèque IndexedDB, écran Bibliothèque, mode consultation → S1, S2, U1.
6. **Import / export** : fusion avec aperçu, trois destinations → U5, E3 à E5.
7. **Fichier lié** : File System Access, reprise de permission, conflits → S3 à S5, U6.
8. **Distribution** : `pages.yml`, `release.yml`, README joueur, premier tag `v1.0.0`.
9. **v1.1 — règles et ergonomie** : règle des dix dés du livre (§4.7), maîtrise 7+ (§4.8), détails repliables « i » (§6.2), ligne « lancer à la main » et options alignées du lanceur, retrait de l'encadré Manœuvres de la fiche, éditeur d'armure depuis la barre d'état, option « Lanceur de dés » (masqué par défaut), boutons d'en-tête en icônes sur mobile, cas B1 à B11 → spec moteur verte (80 tests), E11 à E15, M10, M11 ; tag `v1.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 1).
10. **v2.0 — techniques d'école (bushi)** : annexe C. Format de fiche v2 et migration, moteur d'effets, catalogue `reference/ecoles-bushi.json` (14 écoles), choix d'école sur la fiche, effets automatiques et à cocher, mots-clés d'arme, rappels, badge « Action simple » → cas T1 à T24, E16 à E19 ; tag `v2.0.0`.
11. **v2.1 — techniques des courtisans et de Shosuro** : même moteur, nouvelles entrées de catalogue (compétences sociales, Connaissance, conditions d'Honneur, spécialisations). Annexe D (validée le 24/10/2026) : catalogue `src/rules/ecoles-courtisans.json` (12 écoles), situation Cour, spécialisation choisie au lanceur → cas T25 à T42, E20 à E23 ; tag `v2.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 2).
   - **v2.1.1** (patch) : carte « Nouveau round » entre l'Initiative et la Posture, avec une description de deux lignes au plus sur mobile (§6.2, M12) ; test du fichier lié rendu robuste (lecture du fichier avant sa première écriture).
   - **v2.1.2** (patch) : Statistiques devient une vue à part (en-tête sur bureau, barre du bas sur mobile) ; les 4 onglets de situation tiennent sur une ligne à 360 px (§7, M13).
12. **v2.2 à v2.7 — règles du livre, combat complet, ergonomie** : annexe E (validée le 24/10/2026). Six versions : correctifs de règles et retouches d'interface (v2.2.0, **livrée**, tag `v2.2.0`, écarts en E.12), combat complet (v2.3.0, **livrée**, tag `v2.3.0`, écarts en E.13), maîtrises et armures (v2.4.0, **livrée**, tag `v2.4.0`, écarts en E.14), récupération (v2.5.0, **livrée**, tag `v2.5.0`, écarts en E.15), vocabulaire français (v2.6.0, **livrée**, tag `v2.6.0`, écarts en E.16), bataille de masse (v2.7.0, **livrée**, tag `v2.7.0`, écarts en E.17) → cas L1 à L27, E24 à E28.
13. **À définir** : voies alternatives et écoles avancées (exclues en D-a), shugenja et sorts (hors périmètre, §1), compteurs « N fois par séance » (D-g).

---

## 12. Points ouverts

À trancher par Nelson. L'agent ne décide pas seul.

| # | Point | Défaut si non tranché |
|---|---|---|
| P1 | Dépôt **public ou privé** ? GitHub Pages est gratuit pour un dépôt public ; pour un dépôt privé, il faut un compte payant. Sans Pages, on peut distribuer uniquement le fichier de release. | Dépôt public (l'outil est public, les fiches restent chez chacun) |
| P2 | **Vérifié sur le livre le 24/10/2026** (`verification-livre-4e.md`) : corrections dans l'annexe E (Feinte, Centre, Vide, duel, bataille de masse, manœuvres). Hors de combat rempli = mort : confirmé. | Annexe E |
| P3 | **Vérifié** : recharge quotidienne après repos ; Méditation ND 20 (annexe E.6). | Annexe E.6 |
| P4 | Nom du dépôt et de la page | `carnet-l5r` |
| P5 | **Vérifié** : Eau × 5 / × 10, maximum × 20, en pieds (page 87) ; terrain : Eau −1 ou −2 rangs (E.2 C4). | Pieds + conversion en mètres |
| P6 | **Tranché le 18/10/2026 (v1.0.0)** : les bonus de jet (annexe B) sont un champ **facultatif** du format v1 (`modifiers?`), sans incrémenter `schemaVersion`, la spécification fournie attendant `schemaVersion: 1`. Rétrocompatible : une fiche sans bonus est inchangée. | Décision retenue. Toute évolution du format **après** la v1.0.0 suit le §9.2 : `schemaVersion` 2, migration testée, et mise à jour de la spécification du moteur. |
| P7 | ~~Tranché le 20/10/2026 : toutes les compétences martiales.~~ **Corrigé le 24/10/2026 d'après le livre** : seules Kenjutsu et Armes lourdes au rang 7 font exploser les dégâts sur 9 (annexe E-b, E.4). | Annexe E |
| P8 | **Tranché le 20/10/2026** : règle des dix dés, un dé lancé impair en trop alors que les gardés sont sous 10 est **perdu** (11k4 → 10k4). | Décision retenue |
| P9 | « Rang d'Honneur » utilisé comme bonus (Matsu, Akodo, Utaku, Daidoji) : arrondi à l'inférieur (6,5 → 6) | Arrondi à l'inférieur |
| P10 | **Vérifié** : catalogue d'armes corrigé (annexe E.2 C8) et catalogue d'armures ajouté (E.5). | Annexe E |

---

## Annexe A — Format du prototype (v0) → v1
| v0 | v1 |
|---|---|
| `insight` | `insightRank` |
| `honor`, `glory`, `status` (texte) | nombres (`parseFloat`, 0 si vide) |
| `xpTotal`, `xpSpent` | `xp.total`, `xp.spent` |
| `void` | `voidRing` |
| `skills[].emph` (texte séparé par virgules) | `skills[].emphases[]` |
| `weapons[].dr` en `g` | accepté tel quel |
| `weapons[].bow` | `weapons[].bowStrength` |
| `maneuvers[]{k,n,cost,eff,rep}` | `maneuvers[]{id,name,cost,effect,stackable}` |
| `armor.reduction` absent | `armor.reduction: 0` |
| pas de `schemaVersion` | v0 |

---

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
Panneau « Bonus de jet » de la fiche : bonus libre, ou départ d'un **modèle** générique (`MODIFIER_TEMPLATES` dans `src/rules/l5r4e.ts` : +1g0 à une compétence, augmentation gratuite, +5 au ND d'armure, +5 au ND des jets sociaux, pénalité de blessure réduite, malus situationnel…).

Le **catalogue nommé** (`NAMED_MODIFIERS`) ne contient que des entrées demandées, résumées par leur effet chiffré (aucun texte du livre), avec leur source et la mention « à vérifier dans le livre » :

| Entrée | Effet encodé | Source |
|---|---|---|
| Hiruma Bushi, rang 1 (Torch's Flame Flickers) | +1g0 aux attaques en posture Attaque, d'office | magicalsamurai.wikidot.com/schools-crab ; lasthaiku.wikidot.com/sccrab |
| Hiruma Bushi, rang 2 (Wolf's Little Lesson) | +5 au ND d'armure par touche au corps à corps en posture Attaque (cumulable jusqu'au rang d'école), à cocher | idem |
| Hiruma Bushi, rang 3 (Hummingbird Wings) | + 2 × rang d'école au ND d'armure contre une attaque, une fois par round, à cocher | idem |
| Force de la Terre (Strength of the Earth) | pénalités de blessure réduites de 3 | magicalsamurai.wikidot.com/advantages |
| Aspect dérangeant (Disturbing Countenance) | +5 au ND des jets de compétences sociales | magicalsamurai.wikidot.com/disadvantages |

Les rangs 4 et 5 de l'école Hiruma Bushi n'ont pas d'effet sur les jets (attaque en action simple, blessures excédentaires reportées) : ils restent dans le texte des techniques de la fiche.

---

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
