# Carnet de Rokugan — Handoff pour implémentation

Compagnon de campagne pour joueurs de **L5R 4e édition** : fiche de personnage + aide aux jets Roll & Keep par situation.

Fait foi :
- pour l'UX, le rendu et la version mobile : le prototype validé `reference/prototype.html` ;
- pour l'architecture, les données et les règles : ce document.

**État au 30/10/2026 :** version **v2.20.1**, lots 1 à 23 livrés (§11) dont le lot 13 shugenja et Magie (annexe F, v2.9.0 à v2.12.0) et le lot 14 nom de l'outil dans l'en-tête (annexe G, v2.13.0 et v2.13.1), format de fiche `schemaVersion: 2`. **Lot 12** (annexe E, validée le 24/10/2026) livré : v2.2.0 (correctifs de règles et retouches d'interface), v2.3.0 (combat complet), v2.4.0 (maîtrises et armures), v2.5.0 (récupération), v2.6.0 (vocabulaire français), v2.7.0 (bataille de masse) et v2.8.0 (bloc Armure et retouches d'interface, E.18 et E.19).

**Ordre de lecture :** §1 Périmètre → §2 Architecture → §3 Données → §4 Moteur de règles → §5 Stockage → §6 Interface → §7 Mobile → §8 Import/export → §9 Distribution GitHub → §10 Tests → §11 Lots → §12 Points ouverts. Annexes : A (format v0), B (bonus de jet), C (écoles bushi), D (courtisans et Shosuro), E (lot 12 : règles du livre, combat complet, ergonomie), F (lot 13 : shugenja et Magie), G (lot 14 : nom de l'outil dans l'en-tête), H (lots 15 et 16 : dépôt GitHub et correctifs), I (lots 17 à 19 : couleurs, Anneaux, sélecteurs), J (lot 20 : correctifs et retouches), K (lot 21 : points d'Insight), L (lots 22 et 23 : liens vers le portail de campagne).

**Prochain lot (30/10/2026) :** à définir (§11, point 24). Les lots 22 et 23 (annexe L, liens vers le portail de campagne) sont livrés ; la localisation est reportée.

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
| Portail de campagne | Liens vers le portail de campagne du MJ (simples liens ouverts dans un nouvel onglet, **aucune requête**) : menu Ressources, Forge de personnage, pages de clan, grimoire (annexe L). |

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
| **Bibliothèque** (écran d'accueil s'il n'y a aucune fiche, sinon accessible par l'en-tête) | Liste des fiches locales : nom, clan (pastille de couleur), école, date, badge « Consultation » pour les fiches en lecture seule. Actions : Ouvrir, Importer un JSON, Supprimer (avec confirmation intégrée à la page). **Vide** (v2.19.0, annexe L.3) : « Pas encore de personnage ? » avec deux options (Forger sur le portail, Fiche vierge), cartes **Modèles de personnage** (Utiliser, JSON) et lien « Découvrir la campagne ». **Avec fiches** (L.4) : carte « Un nouveau personnage ? » sous la liste (Forge, Nouvelle fiche, modèles). |
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
  - **sceau 帳** de l'outil à gauche, qui ouvre aussi la Bibliothèque, et surtitre « CARNET DE ROKUGAN | ● CLAN … » au-dessus du nom (annexe G) ; le nom du clan est un lien vers sa page sur le portail de campagne quand elle existe (v2.20.0, annexe L.7) ;
  - famille, école et Rang dessous ;
  - bouton de thème (auto, clair, sombre) ;
  - **boutons d'en-tête** Bibliothèque, Lanceur de dés, Thème et **Ressources** (v2.19.0, annexe L.2 : menu de liens vers le portail de campagne, sur tous les écrans) : chacun = **icône + texte** sur bureau (livres, dé, demi-cercle, torii), **icône seule** sur mobile (§7) ; le texte reste présent pour les lecteurs d'écran et en info-bulle, avec l'état courant (« Thème : sombre », « Lanceur de dés : masqué ») ;
  - bouton **« Lanceur de dés : masqué / affiché »**, à côté du thème et de la Bibliothèque (même style ; fond d'accent pâle quand affiché). **Affiché par défaut** (v2.17.0, annexe J.7), choix mémorisé dans les préférences :
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
- **Détails repliables (« i »)** (depuis le lot 19, le panneau Posture est un menu déroulant sans « i », description toujours affichée, annexe I.3.4) :
  - les boutons du panneau **Dépenser du Vide** n'affichent que leur titre ;
  - **un seul** petit bouton rond « i » par panneau, placé dans l'en-tête à côté du titre (« Dépenser du Vide i » ; pas de compteur « reste » dans cet en-tête, les points de Vide restants sont dans la barre d'état ; en-tête sur une seule ligne, y compris sur mobile) ; il déplie ou replie **toutes** les descriptions du panneau à la fois, sans rien sélectionner ;
  - le « i » est rempli en couleur d'accent quand les détails sont ouverts ; les panneaux sont indépendants ;
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
> **Remplacé au lot 17 (v2.14.0) par l'annexe I.1** (jetons, accents lisibles, couleurs sémantiques, Android), livré : l'annexe I.1 fait foi, cette section décrit l'état v2.13.

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
| En-tête | Sceau de 52 px à gauche du nom ; Bibliothèque, Lanceur de dés, Thème et Ressources en **boutons ronds de 40 px, icône seule**, **sous** le bloc sceau + nom, alignés à gauche (annexe G). Lanceur affiché = fond d'accent pâle. Ressources ouvre un **panneau glissant depuis le bas**, comme le lanceur : poignée, voile, hauteur max 88 vh (annexe L.2). |
| Navigation | Onglets Fiche / Aide de jeu / Statistiques dans une **barre fixe en bas**, trois boutons de même largeur. Marge basse = hauteur de la barre + `env(safe-area-inset-bottom)`. Onglet actif sur fond d'accent pâle. Les quatre onglets de situation de l'aide de jeu tiennent sur **une ligne, sans défilement** (360 px compris). |
| Barre d'état | Les quatre tuiles Dépl. / ND armure / Réduction / Pénalité occupent **toute la largeur sur 4 colonnes égales**, texte centré. **Résumé sur une ligne** (niveau de blessure, pénalité, `blessures / seuil max`), cliquable, bordure rouge si le personnage est blessé. Un appui déplie la piste complète en **2 rangées de 4**. En dessous : compteur −/+ (boutons 40 px) et pastilles de Vide (26 px). |
| Lanceur | **Panneau glissant depuis le bas**, ouvert au choix d'une action (pas à l'ouverture de l'écran). Hauteur max 88 vh, défilement interne, fond assombri derrière. Poignée et bouton × en haut ; fermeture par ×, appui sur le fond ou Échap. Bouton « Lancer » **collé en bas** du panneau. Après un lancer, le résultat est amené à l'écran et le panneau reste ouvert. Changer une option ne remet pas le défilement du panneau à zéro. Le défilement de la page est bloqué pendant l'ouverture. |
| Situations | Rangées Enquête / Déplacement / Combat et sous-types en **défilement horizontal**, sans retour à la ligne. |
| Vide | Grille de 2 colonnes, titres seuls ; un « i » de 26 px dans l'en-tête du panneau, zone de toucher ≥ 40 px. (Posture : menu déroulant pleine largeur en 16 px, annexe I.3.4.) |
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

État en v2.8.0 : **509 tests Vitest** (moteur, stockage, interface) et **70 tests Playwright** (chromium, iPhone 13, Pixel 7), lignes de `src/core` couvertes à 100 %.

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
| E12 | Boutons « i » de Déplacement et Rappels d'école (Posture retirée au lot 19, remplacée par D3, I.3.7 ; Vide retiré au lot 20, remplacé par Q10, J.6) | Descriptions masquées par défaut ; un clic sur le « i » d'un panneau déplie toutes ses descriptions, un second les replie ; aucun effet sur la posture, le Vide ni l'autre panneau |
| E13 | Lanceur sur Dégâts · Katana | « Bonus fixe » seul sur sa ligne, sans case vide (« Dés lancés ± » retiré, J.9) ; ligne « Les 10 explosent… » sans phrase « Lance… » ; avec Kenjutsu 7, « Les 9 et 10 explosent… » |
| E14 | Appui sur la tuile ND armure | L'éditeur d'armure s'ouvre ; bonus 5 avec Réflexes 2 → tuile ND 20 ; réduction 3 → tuile Réduction 3 ; valeurs conservées au rechargement |
| E15 | Option « Lanceur de dés » | Par défaut « affiché » (J.7) : le bouton « Lancer » apparaît partout ; « masqué » : aucun bouton « Lancer » ni historique dans les lanceurs ; le choix survit au rechargement |

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
| M10 | Boutons « i » (reformulé au lot 19, I.3.7) | Zone de toucher ≥ 40 × 40 px ; le panneau Vide tient sur moins d'un écran détails fermés ; le panneau Posture tient sur moins d'un écran avec sa description |
| M11 | En-tête à 360 px de large | Sceau de 52 px ; Bibliothèque, Lanceur de dés et Thème en icônes de 40 px sous le nom, alignés à gauche ; libellé accessible avec l'état courant (annexe G, H7) |
| M12 | Combat sur mobile, et à 360 px de large | Carte « Nouveau round » entre l'Initiative et la Posture ; sa description tient sur 2 lignes au plus |
| M13 | Aide de jeu sur mobile, et à 360 px de large | Les 4 onglets de situation (Enquête, Cour, Déplacement, Combat) sur une ligne, sans défilement ni texte tronqué, zones de 40 px de haut ; Statistiques est dans la barre du bas |
| M14 | Bonus de jet sur mobile, et à 360 px de large (E24) | Chaque bonus sur 3 lignes (nom et source, effet, cible et note), aucun texte tronqué |
| M15 | Bataille de masse sur mobile, et à 360 px de large (E.8) | Panneau rempli (jet, résultat, dés de blessures, Encaisser) sans défilement horizontal ; boutons d'état et d'engagement de 40 px de haut, sans texte tronqué |
| M16 à M18 | Bloc Armure, bloc Vide et tuile Blessures à 360 et 390 px (E.18, E.19) | Voir les tableaux de tests des annexes E.18 et E.19 |

---

## 11. Plan de livraison (lots)

Chaque lot fait l'objet d'une PR, livrée avec ses tests verts.

1. **Socle** : Vite + React + TypeScript strict, ESLint, Vitest, `vite-plugin-singlefile`, workflow `ci.yml`.
2. **Moteur** : schéma Zod, migrations, données de règles, moteur → `core.rules.spec.ts` vert.
3. **Interface bureau** : portage du prototype en composants, thème, clans. Revue visuelle par comparaison avec `reference/prototype.html`.
4. **Mobile** : §7 → tests M1 à M9 (M10 à M18 ajoutés ensuite).
5. **Stockage** : bibliothèque IndexedDB, écran Bibliothèque, mode consultation → S1, S2, U1.
6. **Import / export** : fusion avec aperçu, trois destinations → U5, E3 à E5.
7. **Fichier lié** : File System Access, reprise de permission, conflits → S3 à S5, U6.
8. **Distribution** : `pages.yml`, `release.yml`, README joueur, premier tag `v1.0.0`.
9. **v1.1 — règles et ergonomie** : règle des dix dés du livre (§4.7), maîtrise 7+ (§4.8), détails repliables « i » (§6.2), ligne « lancer à la main » et options alignées du lanceur, retrait de l'encadré Manœuvres de la fiche, éditeur d'armure depuis la barre d'état, option « Lanceur de dés » (masqué par défaut), boutons d'en-tête en icônes sur mobile, cas B1 à B11 → spec moteur verte (80 tests), E11 à E15, M10, M11 ; tag `v1.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 1).
10. **v2.0 — techniques d'école (bushi)** : annexe C. Format de fiche v2 et migration, moteur d'effets, catalogue `reference/ecoles-bushi.json` (14 écoles), choix d'école sur la fiche, effets automatiques et à cocher, mots-clés d'arme, rappels, badge « Action simple » → cas T1 à T24, E16 à E19 ; tag `v2.0.0`.
11. **v2.1 — techniques des courtisans et de Shosuro** : même moteur, nouvelles entrées de catalogue (compétences sociales, Connaissance, conditions d'Honneur, spécialisations). Annexe D (validée le 24/10/2026) : catalogue `src/rules/ecoles-courtisans.json` (12 écoles), situation Cour, spécialisation choisie au lanceur → cas T25 à T42, E20 à E23 ; tag `v2.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 2).
   - **v2.1.1** (patch) : carte « Nouveau round » entre l'Initiative et la Posture, avec une description de deux lignes au plus sur mobile (§6.2, M12) ; test du fichier lié rendu robuste (lecture du fichier avant sa première écriture).
   - **v2.1.2** (patch) : Statistiques devient une vue à part (en-tête sur bureau, barre du bas sur mobile) ; les 4 onglets de situation tiennent sur une ligne à 360 px (§7, M13).
12. **v2.2 à v2.8 — règles du livre, combat complet, ergonomie** : annexe E (validée le 24/10/2026). Sept versions : correctifs de règles et retouches d'interface (v2.2.0, **livrée**, tag `v2.2.0`, écarts en E.12), combat complet (v2.3.0, **livrée**, tag `v2.3.0`, écarts en E.13), maîtrises et armures (v2.4.0, **livrée**, tag `v2.4.0`, écarts en E.14), récupération (v2.5.0, **livrée**, tag `v2.5.0`, écarts en E.15), vocabulaire français (v2.6.0, **livrée**, tag `v2.6.0`, écarts en E.16), bataille de masse (v2.7.0, **livrée**, tag `v2.7.0`, écarts en E.17), bloc Armure et retouches d'interface (v2.8.0, **livrée**, E.18 et E.19, écarts en E.20) → cas L1 à L28, E24 à E34, M16 à M18.
13. **v2.9 à v2.12 — shugenja et Magie** : annexe F (validée le 28/10/2026). Quatre versions : Rouleaux & invocations (v2.9.0, **livrée**, écarts en F.8), écoles de shugenja (v2.10.0, **livrée**, écarts en F.9), situation Magie et lanceur de sort (v2.11.0, **livrée**, écarts en F.10), emplacements et combat (v2.12.0, **livrée**, écarts en F.11) → cas G1 à G17, E36.
14. **v2.13.0 — nom de l'outil dans l'en-tête** : annexe G (maquette validée). Sceau 帳 qui ouvre la Bibliothèque, surtitre, titre d'onglet dynamique, favicon (**livrée**, écarts en G.6) → cas H1 à H12. **v2.13.1** (patch) : le bouton Bibliothèque est gardé à côté du sceau (G.6).
15. **v2.13.2 — fichiers du dépôt GitHub** : annexe H.1 à H.4 (**livrée**, écarts en H.11). Licence MIT, contribution, code de conduite, sécurité, `CHANGELOG.md`, modèles d'issue et de PR, Dependabot, `.editorconfig` → cas R1 à R4. Code applicatif inchangé (sauf `package.json`).
16. **v2.13.3 — correctifs** : annexe H.5 à H.8 (**livrée**, écarts en H.12). Notation `XgY` partout à l'affichage (`formatDR`, données en `g`), boutons en trop et incohérences (relevé X1 à X6, captures avant / après) → cas K1 à K8.
17. **v2.14.0 — couleurs** : annexe I.1, **remplace le §6.4**. Jetons `--surface-2`, `--accent-ink`, `--on-accent`, couleurs sémantiques `--danger` / `--ok` / `--warn`, jetons `--ring-*`, `theme-color` et thème sans flash (**livrée**, écarts en I.6) → cas N1 à N12.
18. **v2.15.0 — bloc Anneaux « Ensō »** : annexe I.2, CSS seul (`reference/anneaux-enso.css`) (**livrée**, écarts en I.7) → cas A1 à A8.
19. **v2.16.0 — sélecteurs** : annexe I.3. Sélecteurs `appearance: base-select` (`reference/selecteurs.css`), panneau Posture en menu déroulant sans « i » (**livrée**, écarts en I.8) → cas D1 à D10 ; E12 et M10 adaptés.
20. **v2.17.0 — correctifs et retouches** (**livrée**, écarts en J.14) : annexe J (retours de jeu du 30/10/2026). Bloc Armes en Edit lisible sur mobile, police du bloc Identité, bouton de technique sans « sort », bonus de jet sans catalogue (modèles par source), modèles de fiche shugenja et courtisan, panneau Vide en menu déroulant, lanceur de dés affiché par défaut, sorts avant les attaques en escarmouche, champ « Dés lancés ± » retiré, Min · Moy. · Max centrés dans le lanceur → cas Q1 à Q19.
21. **v2.18.0 — points d'Insight** (**livrée**, écarts en K.5) : annexe K. Points d'Insight calculés et Rang suggéré dans le bloc Identité, champ facultatif `insightBonus`, étiquette d'écart avec le rang saisi (qui fait foi) → cas I1 à I9, K1.
22. **v2.19.0 — portail de campagne : menu et Bibliothèque** (**livrée**, écarts en L.6) : annexe L.1 à L.5. Adresses dans `src/rules/portal.ts`, bouton et menu **Ressources** (panneau bas sur mobile), Bibliothèque vide (Forge ou fiche vierge, cartes de modèles) et avec fiches (« Un nouveau personnage ? ») → cas O1 à O11.
23. **v2.20.0 — portail de campagne : Fiche et Aide de jeu** (**livrée**, écarts en L.10) : annexe L.7 à L.9. Clan de l'en-tête en lien, liens de sort vers le grimoire, encadré de liens de l'Aide de jeu (Combat, Cour) → cas O12 à O17.
   - **v2.20.1** (patch, L.11) : options de la Bibliothèque vide alignées (étapes et boutons sur les mêmes lignes, cases de même taille) → O7 renforcé.
24. **À définir** : journal d'achats en XP (K.6), **localisation** (français + anglais, reportée le 30/10/2026, spécification d'origine dans `handoff/handoff-lots-15-17.md`, lot 17), kata (évalués le 26/10/2026, reportés), voies alternatives et écoles avancées (exclues en D-a), catalogue de sorts (fichier personnel importable, pas dans le dépôt), compteurs « N fois par séance » (D-g).

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
Panneau « Bonus de jet » de la fiche : départ d'un **modèle** (`MODIFIER_TEMPLATES` dans `src/rules/l5r4e.ts`, liste en J.4), « Bonus libre » par défaut ; ou saisie dans le JSON de la fiche (champ `modifiers`).

**Lot 20 (annexe J.4)** : le catalogue nommé (`NAMED_MODIFIERS`) est **retiré**. Les modèles sont des formes d'effet regroupées par source (avantage, désavantage, technique, autre), sans nom ni texte du livre ; le joueur peut aussi écrire ses bonus dans le JSON de sa fiche (champ `modifiers`).

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

## Annexe G — Lot 14 : nom de l'outil dans l'en-tête (v2.13.0)

Statut : **maquette validée** (planches « avec personnage » et « sans personnage », clair, sombre et mobile). Une version, une PR. Ne touche que l'**identité de l'outil** : en-tête (`src/ui/components/Header.tsx`), titre d'onglet et favicon. Les données, les vues (Fiche / Aide de jeu / Statistiques) et le pied de page ne changent pas ; format de fiche inchangé.

Prototype de référence : `reference/prototype-title.html`. Il est interactif (thème, largeur, personnage, mode) et reprend le CSS de G.3. Les règles mobiles y sont en `@container` pour simuler la largeur ; dans l'appli, elles restent en `@media (max-width:720px)`.

### G.1 Problème
« Carnet de Rokugan » n'apparaissait qu'en pied de page et dans `<title>`. Le `<h1>Carnet de Rokugan</h1>` de l'en-tête n'était rendu que sans personnage : dès qu'une fiche est ouverte, le nom du samouraï le remplace.

### G.2 Décisions
| # | Sujet | Décision |
|---|---|---|
| G-a | Sceau 帳 (« carnet ») | Tampon carré vermillon à gauche du bloc `.who`, sur tous les écrans. Avec personnage, il ouvre la Bibliothèque. ~~Il remplace le bouton « Bibliothèque ».~~ **Corrigé en v2.13.1** : le bouton est gardé (G.6). |
| G-b | Surtitre | Avec personnage, la ligne du clan devient `CARNET DE ROKUGAN \| ● CLAN DU CRABE`. |
| G-c | Titre d'onglet | `Okado Hiruma · Carnet de Rokugan` avec personnage, `Carnet de Rokugan` sans ; favicon reprenant le sceau. |
| G-d | Couleur | Le sceau a une couleur **fixe**, indépendante du clan : c'est la marque de l'outil, pas celle du personnage. Le liseré sous l'en-tête suit toujours `--gold`. |

### G.3 Rendu
**Sceau**

| Propriété | Bureau | Mobile (≤ 720 px) |
|---|---|---|
| Taille | 64 × 64 px | 52 × 52 px |
| Coins | 8 px | 7 px |
| Kanji | 帳, `--f-display` 800, 38 px | 30 px |
| Double filet | `box-shadow: inset 0 0 0 3px var(--seal), inset 0 0 0 5px var(--seal-ink)` | idem |
| Inclinaison | `rotate: -3deg` | idem |
| Écart avec le nom | 16 px | 12 px |

- Rien sous le sceau, ni texte ni légende.
- **Avec personnage** : `<button>` qui appelle `library.showLibrary()`, `aria-label="Carnet de Rokugan — ouvrir la bibliothèque"`, `title="Carnet de Rokugan — Bibliothèque"`. Cliquable aussi en consultation.
- **Sans personnage** : `<span aria-hidden="true">` décoratif ; le `<h1>` porte déjà le nom de l'outil.

**Surtitre** (avec personnage seulement)
- `.brand` : `--muted`, 12 px, 700, majuscules, `letter-spacing: .16em` ; séparateur : filet vertical 1 × 12 px en `--line` ; `.mon` inchangé.
- Conteneur `.eyebrow` en `flex-wrap: wrap` : un nom de clan long passe à la ligne.
- Mobile : 10 px, `letter-spacing: .08em` (`.12em` pour `.brand`), pastille de 9 px, filet de 10 px.
- Sans clan reconnu : « CARNET DE ROKUGAN » seul, sans séparateur. Sans personnage : pas de surtitre, `<h1>Carnet de Rokugan</h1>` et « Compagnon de campagne · L5R 4e ».

**Boutons de droite**
- Bureau : Bibliothèque, Lanceur de dés, Thème, puis Fiche / Aide de jeu / Statistiques (Bibliothèque gardée en v2.13.1, G.6).
- Mobile : les boutons ronds de 40 px **passent sous le bloc sceau + nom, alignés à gauche** (`header.top` repasse en `wrap` / `flex-end`, `.top-right` sur toute la largeur). Les onglets restent dans la barre du bas. Remplace la règle « nom et icônes sur une seule ligne » du §7.

**Jetons** (dans les trois blocs de thème ; couleurs seulement en variables, comme le reste de `styles.css`)
```css
/* clair */  --seal:#a8382a; --seal-ink:#f7f3ea;
/* sombre */ --seal:#b5402f; --seal-ink:#f3ece0;
```

La règle globale `button{font:inherit}` (0,0,1) est plus faible que `.seal` (0,1,0) : la taille du kanji s'applique. Ne pas ajouter de règle plus spécifique sur les boutons de l'en-tête, sinon le kanji retombe à 15 px.

`FitName` mesure la largeur de son `<h1>` : le sceau réduit la place disponible, ce qui est voulu ; un nom long tient toujours sur deux lignes (H4).

### G.4 Police et favicon
- **Kanji** : les polices embarquées sont des sous-ensembles latins ; 帳 s'afficherait en police de repli. Sous-ensemble kanji `src/ui/fonts/shippori-mincho-b1-800-kanji.woff2` (Shippori Mincho B1 800, avec les kanji des Anneaux 土水火風空 pour un usage ultérieur), déclaré avec `unicode-range: U+5E33, U+571F, U+6C34, U+706B, U+98A8, U+7A7A`. Commande dans `fonts/LICENSES.md`.
- **Favicon** : `src/ui/favicon.svg`, carré vermillon à coins arrondis, filet intérieur et 帳 **vectorisé en tracé** (contour du glyphe extrait avec fontTools, pas de `<text>`) ; `src/ui/apple-touch-icon.png` 180 × 180 rendu depuis le SVG.
- **Fichier unique** : le livrable est un seul HTML (§2) et Pages ne publie que lui (§9.1). Les deux icônes sont donc **inlinées en data URI** au build (plugin `carnet:inline-icons` de `vite.config.ts`) ; pas de dossier `public/`, pas de question de préfixe `base`.

### G.5 Tests
| ID | Cas | Attendu |
|---|---|---|
| H1 | Fiche ouverte, bureau, thèmes clair et sombre | Sceau 64 px à gauche du nom, couleur du thème et non du clan, surtitre `CARNET DE ROKUGAN \| ● CLAN DU …`, bouton Bibliothèque présent (v2.13.1) |
| H2 | Clic ou Entrée sur le sceau, ou clic sur le bouton Bibliothèque | La Bibliothèque s'ouvre ; focus visible sur le sceau |
| H3 | Aucun personnage | Sceau non focalisable (`span`, `aria-hidden`), `<h1>Carnet de Rokugan</h1>` et sous-titre ; pas de surtitre ; liseré à l'accent par défaut |
| H4 | Nom long, bureau et 390 px | `FitName` le tient sur 2 lignes au plus, sans chevaucher le sceau |
| H5 | « Clan de la Licorne » et nom long, 390 px | Le surtitre passe à la ligne, aucun débordement horizontal |
| H6 | Clan non reconnu ou vide | Surtitre réduit à « CARNET DE ROKUGAN », sans séparateur orphelin |
| H7 | Mobile ≤ 720 px | Sceau 52 px ; trois boutons ronds (Bibliothèque, Lanceur de dés, Thème) **sous** le nom, alignés à gauche ; barre d'onglets du bas inchangée (M11) |
| H8 | `document.title` | `Nom · Carnet de Rokugan` à l'ouverture d'une fiche, suit un renommage, `Carnet de Rokugan` après retour à la Bibliothèque |
| H9 | Glyphe 帳 | Rendu en Shippori Mincho B1 embarquée, sans police de repli |
| H10 | Couleurs | Aucune couleur littérale hors des jetons `--seal` / `--seal-ink` |
| H11 | Consultation | Sceau cliquable vers la Bibliothèque, badge « Consultation » inchangé |
| H12 | Favicon | Favicon et apple-touch-icon présentes dans le fichier unique (data URI) |

### G.6 Écarts de mise en œuvre (v2.13.0)
- **Corrections du handoff d'origine** : identifiants de tests T1 à T12 renommés **H1 à H12** (T1 à T42 existent déjà, §10) ; prototype dans `reference/` (pas `handoff/reference/`) ; les documents `HANDOFF-colors.md` et `handoff-ringstyle.md` cités n'existent pas dans le dépôt, la vérification « lint C8 » devient H10 (C8 est ici le catalogue d'armes, annexe E.2) ; favicon inlinée au lieu de `public/` (G.4).
- **CSS mobile** : les règles du sceau et du surtitre sont intégrées au bloc mobile existant, qui remplaçait `header.top{flex-wrap:nowrap;align-items:center}` ; pas de second bloc qui le surcharge.
- **Titre d'onglet** : `useEffect` dans `Header`, sur le nom sans espaces de bord ; un nom vide donne « Carnet de Rokugan ».
- **Bouton Bibliothèque gardé (v2.13.1)** : décision de Nelson après la v2.13.0. Sur mobile, le sceau seul ne se devinait pas comme bouton ; le bouton « Bibliothèque » (icône livres, rond de 40 px sur mobile) revient en tête des boutons de droite, partout, et le sceau reste un accès en plus. H1, H2, H7 et M11 adaptés.
- **Tests** : `tests/ui/header.spec.tsx` (H1, H2, H3, H6, H8, H11) ; Playwright `tests/e2e/header.spec.ts` (H1 clair et sombre, H2 au clavier, H3, H4 à 390 et 1200 px, H5, H9 par les polices réellement rendues, H12) ; M11 devient H7 (3 icônes sous le nom, à gauche, sceau 52 px). Les tests qui ouvraient la Bibliothèque par le bouton passent par le sceau. H10 : revue du diff (seules les lignes de jetons portent des couleurs).

---

## Annexe H — Lots 15 et 16 : dépôt GitHub et correctifs (v2.13.2, v2.13.3)

Statut : lot 15 **livré** (écarts en H.11), lot 16 **livré** (écarts en H.12). Source : `handoff-lots-15-17.md` (29/10/2026), audit fait sur `main` au commit `dfaac10` (v2.13.1) ; les numéros de ligne cités peuvent avoir bougé, se fier aux extraits. Ordre des lots tranché le 29/10/2026 : **15 → 16 → 17 → 18 → 19 → 20** (visuel avant, annexe I ; langues ensuite, **reportées** le 30/10/2026, §11 point 22). Une PR par lot, CI verte, tag posé après merge (procédure du README).

| Lot | Version | Contenu | Code applicatif touché |
|---|---|---|---|
| **15** | v2.13.2 | Fichiers classiques d'un dépôt GitHub (licence, contribution, modèles…) | Non (sauf `package.json`) |
| **16** | v2.13.3 | Correctifs : notation `XkY` → `XgY`, boutons en trop, incohérences | Oui |

### H.1 Lot 15 — fichiers à créer
| Fichier | Contenu |
|---|---|
| `LICENSE` | Licence **MIT** (P-H1), titulaire « Nelson » (ou le pseudo GitHub `nelsio`), année 2026. Texte MIT standard, en anglais (c'est le texte qui fait foi). |
| `CONTRIBUTING.md` | En français. Plan en H.2. |
| `CODE_OF_CONDUCT.md` | **Contributor Covenant 2.1**, traduction française officielle (récupérée sur contributor-covenant.org, pas réécrite). Contact : signalement privé via GitHub (pas d'adresse e-mail publiée). |
| `SECURITY.md` | Court : l'outil n'a ni serveur ni compte ; une faille possible = injection de contenu via un JSON importé, ou fuite de données. Signalement par **« Report a vulnerability »** (signalement privé GitHub, à activer dans Settings → Security). Seule la dernière version est corrigée. |
| `CHANGELOG.md` | Format *Keep a Changelog*. Une entrée par version publiée, reconstruite depuis le §11 et les releases GitHub (v1.0.0 → v2.13.2). Résumé en 1 à 4 puces par version, pas de copie des annexes. Section `[Non publié]` en tête. |
| `.github/ISSUE_TEMPLATE/bug.yml` | Formulaire : version (pied de page), navigateur et appareil, bureau ou mobile, étapes, attendu, obtenu, fiche JSON jointe facultative (avec rappel : retirer ce qu'on ne veut pas partager). |
| `.github/ISSUE_TEMPLATE/regle.yml` | « Règle à vérifier » : règle concernée, page du livre 4e (édition française ou anglaise), ce que fait l'outil, ce que dit le livre. **Pas de recopie de texte du livre** (rappel dans le formulaire). |
| `.github/ISSUE_TEMPLATE/idee.yml` | Idée d'évolution : besoin en jeu, situation (enquête, escarmouche…), proposition. |
| `.github/ISSUE_TEMPLATE/config.yml` | `blank_issues_enabled: false`. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Lot / version, résumé, cases à cocher : lint, typecheck, Vitest, Playwright, captures bureau + 390 px (si interface), `CHANGELOG.md` à jour, `HANDOFF.md` à jour (écarts de mise en œuvre). |
| `.github/dependabot.yml` | `npm` et `github-actions`, **mensuel**, regroupement des mises à jour mineures et correctives (`groups`), 5 PR ouvertes au plus. |
| `.editorconfig` | UTF-8, LF, indentation 2 espaces, retour à la ligne final ; `*.md` sans suppression des espaces de fin. |

### H.2 `CONTRIBUTING.md` (plan)
1. **Esprit du projet** : outil de fan, un seul fichier HTML, aucune requête réseau, rien n'est envoyé. Toute contribution respecte ces contraintes.
2. **Signaler un bug ou une règle** : passer par les modèles d'issue.
3. **Proposer une évolution** : ouvrir une issue avant de coder. Les évolutions importantes passent par une annexe de `HANDOFF.md` (spécification avant code).
4. **Développer** : renvoi à la section Développement du README (Node 24, commandes). Ne pas dupliquer les commandes.
5. **Règles du code** : TypeScript strict ; logique de jeu dans `src/core` (pur, sans DOM, couvert à 100 %) ; règles en données dans `src/rules` ; couleurs uniquement en jetons CSS (vérifié par le lint N8 à partir du lot 17, annexe I.1) ; aucun `dangerouslySetInnerHTML` ; aucune dépendance chargée depuis un CDN.
6. **Tests attendus** : la spécification `tests/core.rules.spec.ts` ne se modifie pas pour faire passer du code ; un désaccord avec le livre se signale en issue « Règle à vérifier ».
7. **Branches et commits** : une branche par lot ou correctif (`lot-16-correctifs`, `fix-…`) ; messages en français, à l'impératif ; PR vers `main`.
8. **Versions** : SemVer, procédure de publication du README. Un changement du format de fiche incrémente `schemaVersion` et ajoute une migration testée.
9. **Textes du livre** : ne jamais recopier les textes des livres L5R (techniques, sorts, descriptions). Résumés courts et références de page seulement.
10. **Traductions** : prévues avec la localisation, reportée (§11, point 22).

### H.3 Lot 15 — fichiers modifiés
- `package.json` : `"license": "MIT"`, `"repository": { "type": "git", "url": "https://github.com/nelsio/carnet-l5r" }`, `"homepage": "https://nelsio.github.io/carnet-l5r/"`. Garder `"private": true` (empêche une publication npm par erreur).
- `README.md` :
  - sous le titre, trois badges : CI, dernière release, licence ;
  - §12 Licences et mentions : ajouter « Code sous licence MIT (voir `LICENSE`) » avant les polices ;
  - nouvelle section **Contribuer** après Développement : 3 lignes, liens vers `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- Réglages GitHub (**à faire par Nelson**, pas par l'agent) : activer le signalement privé de vulnérabilités ; renseigner la description et l'URL du dépôt ; sujets `l5r`, `legend-of-the-five-rings`, `rpg`, `character-sheet`.

### H.4 Tests du lot 15
| ID | Vérification | Attendu |
|---|---|---|
| R1 | Onglet « Insights → Community standards » du dépôt | Toutes les cases cochées (description, README, code de conduite, contribution, licence, sécurité, modèles d'issue et de PR) |
| R2 | « New issue » | Les 3 formulaires proposés, pas d'issue vierge |
| R3 | CI | Verte ; aucun changement dans `dist/carnet-l5r.html` hors numéro de version |
| R4 | `dependabot.yml` | Validé par GitHub (pas d'erreur dans l'onglet Dependabot) |

### H.5 Lot 16 — notation des dés : `XkY` affiché à la place de `XgY`
**Problème.** La règle (§4) est : `XgY` à l'affichage, `XkY` accepté en saisie. Plusieurs endroits affichent la VD **brute**, telle que stockée. Or le catalogue d'armes est écrit en `k` : une arme ajoutée depuis le catalogue (bouton « Associer ») ou une ancienne fiche s'affiche « VD 3k3 ».

**Correctif en deux parties.**
1. **Un seul formateur**, dans `src/core` (pur, testé), à côté de `parseDR` (`src/core/engine.ts`) :
   ```ts
   /** VD pour l'affichage : « 3k3 », « 3 K 3 », « 3g3 » → « 3g3 » ; texte invalide rendu tel quel, rogné. */
   export function formatDR(s: string, letter = "g"): string {
     const m = /^\s*(\d+)\s*[kg]\s*(\d+)\s*$/i.exec(s);
     return m ? `${Number(m[1])}${letter}${Number(m[2])}` : s.trim();
   }
   ```
   Le second paramètre servira à la localisation (`g` en français, `k` en anglais), reportée (§11, point 22).
2. **Appliquer `formatDR` à chaque affichage** d'une VD. Relevé de l'audit :

   | Fichier | Endroit |
   |---|---|
   | `src/ui/components/Sheet.tsx` | Ligne d'arme en lecture : `VD {w.dr}` |
   | `src/ui/components/Sheet.tsx` | Suggestion du catalogue (écart avec le livre) : `gap.dr` affiché |
   | `src/ui/components/Sheet.tsx` | Étiquette de sort : `VD {s.damage}` |
   | `src/ui/components/Roller.tsx` | Détail de la réserve de dégâts : `+ VD ${a.dr}` et `VD ${a.spell?.damage}` |
   | `src/core/actions.ts` | Descriptions des actions de dégâts (`VD de la flèche ${w.dr}`, `Force + VD ${w.dr}`) |
   | `src/core/spells.ts` | Description « Dégâts · sort » (`VD ${spell.damage}`) |

   Puis chercher les autres occurrences : `grep -rnE 'VD \$\{|\.dr\}|damage\}' src`.

**Données.** Normaliser en `g` les sources livrées avec l'outil :
- `src/rules/ecoles-bushi.json` : les 16 `"dr"` du catalogue d'armes (`"3k2"` → `"3g2"`, etc.) ;
- `src/rules/l5r4e.ts` : `DISARM_DAMAGE = "2k1"` → `"2g1"` ;
- `src/core/schema.ts` : message « doit être au format 2g2 » et commentaire ;
- `reference/` : ne pas toucher.

**Ce qu'on ne fait pas.** On ne réécrit pas les VD déjà enregistrées dans les fiches : `parseDR` accepte les deux lettres et l'affichage passe par `formatDR`. Dans les champs de saisie (mode Edit), on laisse la valeur tapée par le joueur. Pas de changement de `schemaVersion`. `src/core/schools.ts` compare les VD en ramenant `g` à `k` : comportement correct, ne pas modifier.

### H.6 Lot 16 — boutons en trop et incohérences
L'audit a été fait sur le code, sans capture d'écran. **Avant de coder**, l'agent :
1. génère les captures Playwright de chaque vue (Bibliothèque vide et pleine, Fiche en lecture, Fiche avec tous les blocs en Edit, Aide de jeu × chaque situation, Statistiques, Consultation), en bureau et en 390 px, thèmes clair et sombre ;
2. complète le relevé H.7 avec ce qu'il voit, en appliquant la définition ci-dessous ;
3. joint les captures « avant » et « après » à la PR.

**Définition d'un bouton en trop :**
- deux contrôles **visibles en même temps sur le même écran** qui font la même chose, sans raison de contexte ;
- un bouton **désactivé en permanence** dans l'état courant (exemple : consultation) : on le masque ;
- un bouton **qui reste affiché** alors que l'action est déjà engagée (confirmation sans « Annuler », bouton d'origine toujours visible).

Ne sont **pas** en trop (décisions de Nelson, à garder) :
- le bouton Bibliothèque **et** le sceau 帳 (G.6, v2.13.1) ;
- les boutons « Edit » / « Terminer » par bloc (E.9 S2) ;
- « Importer un JSON… » dans la Bibliothèque **et** dans le panneau Fichier de la fiche : contextes différents (nouvelle fiche ou fusion).

### H.7 Relevé
| # | Endroit | Constat | Correctif |
|---|---|---|---|
| X1 | `Sheet.tsx`, `DeleteCharacter` (bloc Identité en Edit) | « Supprimer ce personnage… » reste affiché à côté de « Confirmer la suppression » ; pas de bouton Annuler ; couleur en style inline (`style={{ color: "var(--bad)" }}`). Diffère du motif de la Bibliothèque. | Même motif que la Bibliothèque : au clic, remplacer le bouton par « Supprimer « Nom » ? » + **« Supprimer définitivement »** (`btn sm danger`) + **« Annuler »**. Plus de style inline. |
| X2 | `Roller.tsx`, `SpellCastLine` en consultation | « Réussi » et « Raté » affichés mais `disabled` : sans effet en consultation. | En consultation, ne pas les afficher. Garder le libellé « Jet aux vrais dés » seulement si un résultat est montré. |
| X3 | `FileActions.tsx` | `<ImportButton label="Importer un JSON…" />` répète la valeur par défaut. | Retirer la prop (nettoyage). |
| X4 | `Library.tsx` et `Stats.tsx` | `"fr-FR"` en dur (`Intl.DateTimeFormat`, `toLocaleString`). | Sans effet visible au lot 16. Passera par la langue courante avec la localisation, reportée (§11, point 22). Le noter ici, ne rien changer. |
| X5 | `Sheet.tsx`, Identité | Libellé « Rang (Insight) » et indication « = Insight (n) » : terme anglais isolé dans l'interface française. | Point P-H4 : défaut « Rang d'Insight » partout (déjà utilisé dans `l5r4e.ts`). |
| X6 | `Roller.tsx`, `MeditationSuccess` en consultation | « Réussi : +n point de Vide » affiché mais `disabled` : sans effet en consultation (même cas que X2). | En consultation, ne pas l'afficher ; le rappel « Vide n/max. » reste. |
| X7… | *À compléter par Nelson* | | |

> **Nelson** : ajoute ici les boutons en trop que tu as repérés en jeu (écran, bureau ou mobile, libellé du bouton). L'agent les traite en priorité.

### H.8 Tests du lot 16
| ID | Cas | Attendu |
|---|---|---|
| K1 | `formatDR` : `"3k3"`, `"3K3"`, `" 3 k 3 "`, `"3g3"`, `"0k4"`, `"abc"`, `""` | `3g3`, `3g3`, `3g3`, `3g3`, `0g4`, `abc`, `""` |
| K2 | Fiche avec une arme en `"3k3"` et un sort `damage: "2k2"`, vues Fiche, Aide de jeu (Escarmouche, Duel), Statistiques, lanceur ouvert sur les dégâts | `document.body.textContent` ne contient aucune correspondance de `/\b\d+k\d+\b/` ; « 3g3 » et « 2g2 » présents |
| K3 | Données livrées | Aucun `"dr"` de `src/rules/*.json` ni constante de `l5r4e.ts` ne contient `k` (test sur les données) |
| K4 | « Associer » une arme du catalogue | La VD enregistrée et affichée est en `g` |
| K5 | Export puis import d'une fiche ancienne (`"3k2"`) | Fusion sans changement signalé sur la VD ; affichage en `3g2` |
| K6 | X1 : suppression depuis le bloc Identité | Un clic : confirmation + Annuler, bouton d'origine masqué ; Annuler revient à l'état initial ; confirmer supprime et ramène à la Bibliothèque |
| K7 | X2 : sort en consultation | Aucun bouton « Réussi » / « Raté » dans le DOM |
| K8 | Non-régression | `core.rules.spec.ts` et toutes les suites existantes vertes sans modifier les valeurs attendues (sauf libellés touchés par X5, à lister dans la PR) |

### H.9 Points ouverts (à trancher par Nelson)
| # | Point | Défaut si non tranché |
|---|---|---|
| P-H1 | Licence du code | **MIT**. Alternative : GPL-3.0 si tu veux que les forks restent libres. |
| P-H4 | « Insight » dans l'interface française | « Rang d'Insight » partout (X5). Alternative : un terme français de ton choix. |

Les points P-H2, P-H3, P-H5 et P-H6 du handoff d'origine portent sur les langues : ils suivent la localisation, reportée (§11, point 22).

### H.10 Corrections du handoff d'origine
- **Numéros de lot** : le handoff prévoyait les langues au lot 17 (v2.14.0). Le visuel (couleurs, Anneaux, sélecteurs, annexe I) passe avant : les langues devenaient le lot 20 (v2.17.0) ; elles sont **reportées** le 30/10/2026 (§11, point 22) et le lot 20 devient correctifs et retouches (annexe J).
- **Identifiants** : relevé B1 à B6 renommé **X1 à X6** (B1 à B11 existent déjà, §10.1 bis) ; tests de langue L1 à L13 renommés **I1 à I13** (L1 à L28 existent, E.10). R1 à R4 et K1 à K8 sont gardés.
- **« lint C8 »** dans `CONTRIBUTING.md` : C8 est ici le catalogue d'armes (E.2) ; le lint des couleurs s'appelle **N8** (annexe I.1) et n'existe qu'à partir du lot 17.
- `DISARM_DAMAGE` vaut aujourd'hui `"2k1"` (le handoff donnait directement la valeur cible). `formatDR` reçoit dès le lot 16 son paramètre `letter`.

### H.11 Écarts de mise en œuvre (v2.13.2)
- **Code de conduite** : texte officiel `content/version/2/1/code_of_conduct.fr.md` du dépôt `EthicalSource/contributor_covenant`, en-tête TOML retiré ; seul le contact `[INSÉRER UNE ADRESSE EMAIL]` est remplacé par la fonction « Report content » de GitHub (« Report to repository admins »).
- **Étiquettes** : `bug.yml` → `bug`, `idee.yml` → `enhancement` (étiquettes existantes) ; `regle.yml` → `règle`, **étiquette à créer par Nelson** (sans elle, GitHub n'en pose aucune).
- **CHANGELOG** : à la livraison, v2.9.0 à v2.13.1 étaient sur `main` sans tag ni release ; leurs entrées sont datées du merge. Tags et releases créés le 29/10/2026 ; liens ajoutés au lot 17.
- **CONTRIBUTING** : point 10 = renvoi au code de conduite ; les traductions prendront le point 11 quand la localisation reviendra. Le README gagne aussi, à l'étape 1 de « Publier une version », la mise à jour de `CHANGELOG.md`.
- **R3** vérifié en local : `dist/carnet-l5r.html` ne diffère de la v2.13.1 que par le numéro de version (1 octet).

### H.12 Écarts de mise en œuvre (v2.13.3)
- **Captures** (H.6) : 56 vues « avant » et « après » (14 vues × bureau 1280 px et 390 px × clair et sombre), hors dépôt, jointes à la PR pour les vues touchées. Seul ajout au relevé : **X6** (bouton de méditation en consultation). Les points de Vide et la tuile « Sorts » de la barre d'état, désactivés en consultation, restent affichés : ils montrent l'état de la fiche.
- **X1** : la question reprend le nom du personnage (« Supprimer « Kuni Taeko » ? ») ; mise en page par une classe `.confirm-line` (alignée à gauche, contrairement à `.entry-actions`).
- **X2** : en consultation, la ligne « Jet aux vrais dés » disparaît entièrement tant qu'aucun résultat n'est montré.
- **X5** : « Rang d'Insight » pour le libellé **et** l'indication du Rang d'école, chiffre en tête pour rester lisible dans un champ étroit (« n (Rang d'Insight) »). Libellés de test touchés : `tests/ui/schools.spec.tsx`, `tests/e2e/schools.spec.ts`.
- **K4** : il n'y a pas de bouton « Associer » pour les armes (c'est celui de l'école, E19) ; l'arme du catalogue passe par « Mettre à jour » (écart avec le livre, E.2 C8). Testé sur le Cimeterre `3k2` → `2g3`.
- **K5** : testé au niveau du cœur (`mergeCharacter` sur l'export d'une fiche `3k2`) ; l'affichage en `g` est couvert par K2.
- **Tests existants modifiés** (valeurs attendues, pas de règle) : libellés `VD 2k2` / `3k2` / `2k3` → `g` (`core.lot12`, `core.magic`, `ui/lot12`, `ui/magic`, `ui/spells`, `e2e/import-export`) ; « Confirmer la suppression » → « Supprimer définitivement » (`ui/library`) ; boutons désactivés → absents en consultation (`ui/slots`, `ui/recovery`). `core.rules.spec.ts` inchangé.

---

## Annexe I — Lots 17 à 19 : couleurs, Anneaux, sélecteurs (v2.14.0 à v2.16.0)

Statut : lots 17 à 19 **livrés** (écarts en I.6 à I.8), maquettes validées (artifacts « Anneaux de la fiche », proposition B, et « Sélecteurs du Carnet », hors dépôt). Sources : `HANDOFF-colors.md`, `handoff-ringstyle.md`, `handoff-selectors.md`. Trois lots, une PR chacun, dans l'ordre : les Anneaux et les sélecteurs utilisent les jetons du lot 17. Ne touche pas aux données de fiche : pas de migration de schéma. La typographie et la mise en page ne changent pas, sauf le bloc Anneaux (I.2) et le panneau Posture (I.3).

| Lot | Version | Contenu |
|---|---|---|
| **17** | v2.14.0 | Jetons de couleur, accents de clan lisibles, couleurs sémantiques, Android (I.1) — **remplace le §6.4** |
| **18** | v2.15.0 | Bloc Anneaux « Ensō » : liseré au pinceau, valeur dans un ensō, kanji en filigrane (I.2), CSS seul |
| **19** | v2.16.0 | Sélecteurs stylés (`appearance: base-select`) ; panneau Posture en menu déroulant (I.3) |

Références : `reference/anneaux-enso.css` (CSS du lot 18), `reference/selecteurs.css` (CSS du lot 19), `reference/enso-mask.py` (régénère le masque `--enso`, vérifié : il redonne exactement le tracé des deux fichiers CSS).

### I.1 Lot 17 — Couleurs (v2.14.0)
Toutes les valeurs ont été vérifiées (contraste WCAG 2.1, luminance relative ; recontrôlées le 29/10/2026 par script, mélanges en oklab : voir I.1.9).

**I.1.1 Objectifs**
1. **Lisibilité** : tout texte atteint au moins 4,5:1 sur son fond, dans les deux thèmes et pour les onze accents de clan.
2. **Identité commune** : le thème sombre garde la chaleur « papier et encre » du thème clair.
3. **Sens indépendant du clan** : un personnage Scorpion ne doit pas avoir l'air « blessé » en permanence.
4. **Android** : la barre de Chrome et les contrôles natifs suivent le thème, sans flash du mauvais thème au chargement.

**I.1.2 Principes**
- Couleurs **uniquement en variables CSS**. Aucune couleur littérale dans un composant.
- Mode auto selon `prefers-color-scheme` ; choix forcé via `data-theme="light" | "dark"` sur `<html>`, mémorisé.
- Chaque jeton est défini d'abord sur `:root` (valeurs claires), puis redéfini dans les deux blocs sombres (media query et `[data-theme="dark"]`).
- **Les couleurs de clan sont des données** (`CLANS` et `UNKNOWN_CLAN` de `src/rules/l5r4e.ts`). Les quatre valeurs par clan (I.1.4) y sont stockées en hexadécimal, sans calcul à l'exécution, pour que les tests puissent les vérifier.
- Seuls les fonds et filets décoratifs (`--muted`, `--line`, `--accent-pale`, `--*-pale`) sont calculés avec `color-mix()`.

**I.1.3 Jetons de base**
| Jeton | Rôle | Clair (écru) | Sombre (anthracite chaud) |
|---|---|---|---|
| `--bg` | Fond de page | `#ece6d8` | `#26252a` *(avant `#25272a`)* |
| `--surface` | Cartes, panneaux, tuiles | `#f7f3ea` | `#302f33` *(avant `#2f3236`)* |
| `--surface-2` | **Nouveau.** Menus déroulants, panneau du lanceur, éditeurs pleine largeur, popovers | `#fdfbf6` | `#3a393e` |
| `--ink` | Texte principal | `#2a261f` | `#e7e5e0` |
| `--muted` | Texte secondaire, libellés, notes | `color-mix(in oklab, var(--ink) 70%, var(--surface))` ≈ `#615d55` *(avant `#6c6556`)* | idem ≈ `#abaaa8` *(avant `#a2a19c`)* |
| `--line` | Bordures, séparateurs | `color-mix(in oklab, var(--ink) 18%, transparent)` *(avant `#d2cab7`)* | idem *(avant `#44474c`)* |
| `--shadow` | Ombre des éléments surélevés | `0 10px 28px rgb(60 45 20 / .18)` | `0 10px 28px rgb(0 0 0 / .45)` |

Le sombre est légèrement réchauffé : la teinte bleutée de `#25272a` disparaît et l'anthracite rejoint la famille de l'écru. Contrastes de l'encre : 13,6:1 sur la surface claire, 10,6:1 sur la surface sombre, 9,1:1 sur `--surface-2` sombre. `--muted` : au moins 4,9:1 sur `--bg`, `--surface` et `--surface-2`, dans les deux thèmes.

Jetons existants **gardés** (absents du handoff d'origine) : `--sunk` (fond des étiquettes `.tag`, valeurs inchangées), `--seal` / `--seal-ink` (annexe G), polices `--f-*`.

**I.1.4 Accents de clan**

| Jeton | Rôle |
|---|---|
| `--accent` | Bordures, pastilles, icônes, remplissage du « i » ouvert, connecteurs. **Jamais pour du texte.** Remplace `--gold`. |
| `--accent-ink` | **Nouveau.** Tout texte en couleur d'accent : option choisie, onglet actif (libellé), « +Ng0 en attente », réserves (`.pool`), surtitre `.mon`, liens. |
| `--accent-pale` | Fond d'accent pâle (onglet actif, lanceur affiché, option choisie). `color-mix(in oklab, var(--accent) 16%, var(--surface))`. Remplace `--gold-soft`. |
| `--on-accent` | Texte posé sur un fond `--accent` plein : `#ffffff` en clair, `--bg` en sombre. Voir P-I1. |

Raison : en clair, Lion, Phénix, Grue et Mante descendent sous 4,5:1 quand on les utilise comme texte (Lion à 3,1:1 sur le fond). `--accent-ink` est la même teinte assombrie avec l'encre ; en sombre, elle est éclaircie pour rester lisible sur `--surface-2` et sur le fond pâle.

| Clan | Accent clair | Accent-ink clair | Accent sombre | Accent-ink sombre |
|---|---|---|---|---|
| Crabe | `#3d5a73` | `#374754` | `#8fb0cc` | `#a1bbd0` |
| Grue | `#2f7fb5` | `#345f7d` | `#8cc4ea` | `#9fcbe8` |
| Dragon | `#2f7a45` | `#335b37` | `#7fcb93` | `#96d1a2` |
| Licorne | `#6b3fa0` | `#533971` | `#bb9ae6` | `#c4a9e6` |
| Lion | `#a87b0c` | `#795c20` | `#e6bf55` | `#e6c776` |
| Mante | `#1f8073` | `#2e5f54` | `#6fd0c1` | `#8bd5c7` |
| Phénix | `#c25a14` | `#8a4921` | `#f0a066` | `#f0ae80` |
| Scorpion | `#a82828` | `#7b2d26` | `#f07a7a` | `#f1918e` |
| Araignée | `#4a4a4a` | `#3e3d3a` | `#b5b5b5` | `#bfbebd` |
| Familles impériales | `#8a6d12` | `#66531f` | `#dcc06a` | `#dec884` |
| Clan non reconnu (`UNKNOWN_CLAN`) | `#7a6a3a` | `#5c5131` | `#cdb67a` | `#d2bf8f` |

Les colonnes « Accent » sont inchangées. Les colonnes « Accent-ink » se calculent ainsi (pour un futur clan) : clair `color-mix(in oklab, accent 65%, #2a261f)` ; sombre `color-mix(in oklab, accent 80%, #e7e5e0)`. Contraste minimal obtenu, tous clans confondus : **4,73:1** en clair (sur `--bg` et sur `--accent-pale`), **4,58:1** en sombre (sur `--surface-2` et sur `--accent-pale`). La reconnaissance du clan ne change pas : sans accents ni casse, noms anglais acceptés.

**Application.** `applyClan` (`src/ui/theme.ts`) pose quatre variables sur `<html>` : `--clan-l`, `--clan-ink-l`, `--clan-d`, `--clan-ink-d` (remplacent `--acc-l` / `--acc-d`) ; un clan non reconnu les retire et la feuille de style garde les valeurs d'`UNKNOWN_CLAN`. Les blocs de thème choisissent la paire :
```css
:root { --accent: var(--clan-l); --accent-ink: var(--clan-ink-l); }
/* blocs sombres */ { --accent: var(--clan-d); --accent-ink: var(--clan-ink-d); }
```

**I.1.5 Couleurs sémantiques**
**Indépendantes du clan.** Elles remplacent tout usage de l'accent ou d'un rouge littéral pour signifier un état.

| Jeton | Usage | Clair | Sombre |
|---|---|---|---|
| `--danger` | Bordure « blessé », Hors de combat, Mort, erreurs d'import, bouton `.btn.danger`. Remplace `--bad`. | `#b3261e` | `#f2867e` |
| `--ok` | Teinte des pourcentages de réussite, import valide, fichier lié synchronisé, verdict réussi | `#276b2b` *(avant `#2e7a4b`)* | `#7fcb93` *(avant `#6cc58f`)* |
| `--warn` | **Nouveau.** Augmentations au-delà du Vide (`raiseCapExceeded`), conflit de fichier lié, avertissements de fusion | `#8a5800` | `#e6bf55` |
| `--danger-pale`, `--ok-pale`, `--warn-pale` | Fonds d'alerte | `color-mix(in oklab, var(--x) 14%, var(--surface))` | idem |

Contrastes : au moins 4,6:1 en texte sur `--bg` et `--surface` dans les deux thèmes. Sur leur propre fond pâle, `--warn` clair descend à 4,3:1 : dans un bandeau d'alerte, mettre le texte en `--ink` et réserver `--warn` à l'icône et à la bordure.

Règle : la bordure rouge de la barre d'état utilise `--danger`, jamais `--accent`. Un personnage Scorpion indemne n'a aucune bordure rouge.

**I.1.6 Anneaux**
Les couleurs des Anneaux restent indépendantes du clan et passent en jetons nommés `--ring-earth`, `--ring-water`, `--ring-fire`, `--ring-air`, `--ring-void` (remplacent `--earth` … `--void`, P-I3), plus `--on-ring` pour un kanji ou un chiffre posé sur une pastille d'Anneau pleine.

Contrairement au §6.4 d'origine (« fixes »), l'appli a **deux jeux** depuis le prototype : clair `#5e6d2c` `#245f8c` `#a8382a` `#6a7f99` `#5d4290`, sombre `#9fb25a` `#6fb0e0` `#e8735f` `#a9bbd2` `#a98be0` (Terre, Eau, Feu, Air, Vide). Ces deux jeux sont **gardés** (ils sont la variante sombre que prévoyait le handoff). Contrôle du 29/10/2026 :
- face à `--surface` : clair 3,7 à 7,2:1, sombre 4,5 à 6,8:1 — tous ≥ 3:1 ;
- face au blanc : clair 4,1 à 7,9:1, mais **sombre 2,0 à 3,0:1** (échec). D'où P-I2 : `--on-ring: #ffffff` en clair, `var(--bg)` en sombre (5,1 à 7,8:1).

**I.1.7 Élévation**
| Niveau | Fond | Bordure | Ombre |
|---|---|---|---|
| Page | `--bg` | — | — |
| Carte, tuile, panneau intégré | `--surface` | `--line` | aucune |
| Surélevé : menu déroulant, panneau du lanceur (mobile), éditeur pleine largeur, popover | `--surface-2` | `--line` | `--shadow` |
| Voile derrière le panneau mobile | `rgb(0 0 0 / .35)` en clair, `rgb(0 0 0 / .55)` en sombre (jeton `--scrim`) | — | — |

En sombre, l'ombre se voit peu : c'est l'écart `--surface` → `--surface-2` qui marque l'élévation. Il ne faut pas le supprimer.

**I.1.8 Android et chargement**
Dans le `<head>` de `index.html`, avant toute feuille de style :
```html
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ece6d8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#26252a" media="(prefers-color-scheme: dark)">
<script>
  try {
    var t = localStorage.getItem('carnet-theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```
- La préférence de thème reste stockée dans IndexedDB (préférences du store, champ `theme`, §3.2). IndexedDB est asynchrone et ne peut pas être lu avant le premier rendu : la valeur est **recopiée** dans `localStorage` (`carnet-theme`) à chaque changement. `localStorage` ne sert que de cache contre le flash ; en cas d'écart, IndexedDB fait foi.
- Le script fonctionne en `file://` et ne fait aucun appel réseau.
- `color-scheme: light` sur `:root`, `color-scheme: dark` dans les deux blocs sombres : champs natifs, barres de défilement et sélecteurs suivent le thème.
- **Thème forcé** : les deux balises `theme-color` sont remplacées par une seule, à la valeur de `--bg` du thème choisi. En mode auto, on remet les deux balises avec `media`.

**I.1.9 Bloc CSS de référence**
```css
:root {
  color-scheme: light;
  --bg: #ece6d8; --surface: #f7f3ea; --surface-2: #fdfbf6; --ink: #2a261f;
  --muted: color-mix(in oklab, var(--ink) 70%, var(--surface));
  --line:  color-mix(in oklab, var(--ink) 18%, transparent);
  --shadow: 0 10px 28px rgb(60 45 20 / .18);
  --scrim: rgb(0 0 0 / .35);

  --clan-l: #7a6a3a; --clan-ink-l: #5c5131; --clan-d: #cdb67a; --clan-ink-d: #d2bf8f; /* UNKNOWN_CLAN */
  --accent: var(--clan-l); --accent-ink: var(--clan-ink-l);
  --accent-pale: color-mix(in oklab, var(--accent) 16%, var(--surface));
  --on-accent: #ffffff;

  --danger: #b3261e; --ok: #276b2b; --warn: #8a5800;
  --danger-pale: color-mix(in oklab, var(--danger) 14%, var(--surface));
  --ok-pale:     color-mix(in oklab, var(--ok) 14%, var(--surface));
  --warn-pale:   color-mix(in oklab, var(--warn) 14%, var(--surface));

  --ring-earth: #5e6d2c; --ring-water: #245f8c; --ring-fire: #a8382a; --ring-air: #6a7f99; --ring-void: #5d4290;
  --on-ring: #ffffff;
  /* + --sunk, --seal, --seal-ink, --f-* : inchangés */
}

@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  color-scheme: dark;
  --bg: #26252a; --surface: #302f33; --surface-2: #3a393e; --ink: #e7e5e0;
  --shadow: 0 10px 28px rgb(0 0 0 / .45);
  --scrim: rgb(0 0 0 / .55);
  --accent: var(--clan-d); --accent-ink: var(--clan-ink-d);
  --on-accent: var(--bg);
  --danger: #f2867e; --ok: #7fcb93; --warn: #e6bf55;
  --ring-earth: #9fb25a; --ring-water: #6fb0e0; --ring-fire: #e8735f; --ring-air: #a9bbd2; --ring-void: #a98be0;
  --on-ring: var(--bg);
  /* + --sunk, --seal, --seal-ink sombres : inchangés */
}}

:root[data-theme="dark"] { /* mêmes déclarations que le bloc précédent */ }
```
Les jetons calculés (`--muted`, `--line`, `--accent-pale`, `--*-pale`) n'ont pas besoin d'être redéclarés en sombre : ils se recalculent à partir des jetons redéfinis.

**I.1.10 Migration**
1. Fusionner le bloc I.1.9 dans le bloc de thème de `src/ui/styles.css` (ne pas le remplacer en entier : `--sunk`, `--seal*`, `--f-*` restent).
2. Ajouter `inkLight` et `inkDark` à `ClanInfo` (`CLANS`) et à `UNKNOWN_CLAN` dans `src/rules/l5r4e.ts` ; `clanAccent` les renvoie ; `applyClan` pose les quatre variables `--clan-*`.
3. Renommer `--gold` → `--accent`, `--gold-soft` → `--accent-pale`, `--bad` → `--danger`, `--earth` … `--void` → `--ring-*` (`.ring`, `.spell.el-*`, `.slot` / `.s-*`, `Sheet.tsx`). Le liseré sous l'en-tête (G-d) suit `--accent`.
4. Rechercher tout texte coloré avec l'accent (`color: var(--gold)` : `.mon`, `.pool`, etc.) et le passer en `--accent-ink`.
5. Rechercher tout rouge, vert ou orange littéral, et tout usage de l'accent pour un état : remplacer par `--danger`, `--ok`, `--warn`.
6. Menus, panneau du lanceur, éditeurs pleine largeur : fond `--surface-2` et ombre `--shadow`.
7. Ajouter I.1.8 en tête de `index.html` et la recopie dans `localStorage` au changement de thème (`applyTheme`).
8. Aucune donnée de fiche n'est touchée : pas de migration de schéma.

**I.1.11 Tests**
C1 à C11 du handoff d'origine renommés **N1 à N11** (C1 à C12 existent déjà, E.2).

| ID | Cas | Attendu |
|---|---|---|
| N1 | Pour chaque clan (11), thème clair : `accent-ink` sur `--bg`, `--surface` et `--accent-pale` | Contraste ≥ 4,5:1 |
| N2 | Pour chaque clan (11), thème sombre : `accent-ink` sur `--surface`, `--surface-2` et `--accent-pale` | Contraste ≥ 4,5:1 |
| N3 | Pour chaque clan, `accent` sur `--surface` dans les deux thèmes | Contraste ≥ 3:1 (bordures, icônes) |
| N4 | `--ink` et `--muted` sur `--bg`, `--surface`, `--surface-2`, deux thèmes | ≥ 4,5:1 |
| N5 | `--danger`, `--ok`, `--warn` sur `--bg` et `--surface`, deux thèmes | ≥ 4,5:1 |
| N6 | Couleurs d'Anneau face à `--on-ring` et face à `--surface`, deux thèmes | ≥ 3:1 |
| N7 | Personnage Scorpion indemne | Aucune bordure `--danger` sur la barre d'état ; blessé : bordure `--danger` |
| N8 | Aucune couleur littérale hors des blocs de thème | Test de lint sur les fichiers CSS de `src/ui` (hex, `rgb()`, `hsl()` interdits hors `:root` et blocs sombres ; exceptions : `--shadow`, `--scrim`). Remplace la revue manuelle de H10. |
| N9 | Thème forcé sombre, système clair, rechargement à froid | Aucune image rendue en thème clair avant le thème sombre (Playwright : capture au premier rendu) |
| N10 | Changement de thème | `theme-color` vaut `--bg` du thème actif ; `localStorage.carnet-theme` à jour |
| N11 | Mode auto | Deux balises `theme-color` avec `media` présentes |
| N12 | Texte sur fond `--accent` plein (P-I1) | ≥ 4,5:1 pour chaque clan, deux thèmes |

N1 à N6 et N12 se testent dans Vitest sur les valeurs hexadécimales des données (I.1.4) et des jetons, avec une petite fonction de contraste WCAG et un mélange oklab pour les jetons calculés ; pas besoin de navigateur. U3 (§10.3) et E8 (§10.4) restent valables.

### I.2 Lot 18 — Bloc Anneaux « Ensō » (v2.15.0)
Ne traite que l'apparence du **bloc Anneaux de la fiche** (classes `.rings` / `.ring`). Les données, les règles de calcul, le mode édition et les couleurs des Anneaux ne changent pas.

**I.2.1 Objectif.** Remplacer les cartes rectangulaires à liseré coloré par un rendu « encre et pinceau » :
1. **Liseré en coup de pinceau** en haut de chaque carte : attaque fine à gauche, trait plein légèrement incliné, fin effilochée en poils secs, petite trace de pinceau sec dans le trait.
2. **Valeur de l'Anneau dans un ensō** : cercle **parfaitement rond**, dont seule l'épaisseur varie (attaque appuyée en haut à droite, trait qui ondule et s'allège, fin effilée en trois poils secs). Ouverture en haut à droite.
3. **Kanji de l'Anneau en filigrane**, centré, sur presque toute la hauteur de la carte, **jamais coupé** : 土 Terre, 水 Eau, 火 Feu, 風 Air, 空 Vide.

**I.2.2 Périmètre**
- **CSS seul.** Aucun changement de JSX : le style s'appuie sur ce que produit le bloc Anneaux de `Sheet.tsx` (`Cg()` dans le prototype minifié) :
  - `<div className={`ring ${key}`} style={{ "--rc": `var(--${key})` }}>` avec `key` ∈ `earth | water | fire | air | void` (après le lot 17 : `var(--ring-${key})`) ;
  - enfants `.rn` (nom), `.rv` (valeur), `.tr` (lignes de Traits).
- Le CSS de `reference/anneaux-enso.css` s'ajoute **après** les règles `.ring` existantes (il en surcharge une partie : `border-top`, alignement, taille de `.rv`, qui passe de 28 à 26 px).
- La grille `.rings` (5 colonnes, 2 colonnes sous 720 px, Vide en pleine largeur) est inchangée.
- Couleurs : tout passe par `--rc`. Jetons utilisés : `--rc`, `--f-display`. Aucune couleur littérale (les masques SVG sont des formes, pas des couleurs : la teinte vient de `background: var(--rc)`).
- Kanji : le sous-ensemble `shippori-mincho-b1-800-kanji.woff2` contient déjà 土水火風空 (G.4) ; rien à ajouter.

**I.2.3 Détails de rendu**
| Élément | Implémentation | Notes |
|---|---|---|
| Liseré pinceau | `.ring::after`, fond `--rc`, masque SVG `--brush` étiré (`100% 100%`) | 10 px de haut, inset 6 px, rotation −0,8° ; `padding-top` de la carte porté à 18 px |
| Ensō | `.rv::before`, fond `--rc`, masque SVG `--enso` (`contain`) | `.rv` fait 64 px, rond ; le masque déborde de 3 px pour que le trait ne colle pas au chiffre |
| Kanji | `.ring::before`, `content` selon la classe de l'Anneau | Taille `min(9.6rem, 90cqi)` : pleine hauteur, mais réduit sur carte étroite pour ne jamais être coupé ; opacité 0,11 |
| Empilement | `.ring` en `isolation: isolate`, enfants en `z-index: 1`, kanji en `z-index: 0` | Le texte et les champs d'édition restent au-dessus du kanji et cliquables (`pointer-events: none` sur le kanji) |
| Taille relative | `container-type: inline-size` sur `.ring` | Nécessaire pour l'unité `cqi` du kanji |

Pseudo-éléments utilisés : `.ring::before` (kanji), `.ring::after` (liseré), `.rv::before` (ensō). Ne pas les réutiliser ailleurs sur ces éléments. Le masque `--enso` sert aussi au sélecteur Anneau (I.3) : le déclarer **une seule fois** (sur `:root`) plutôt que de recopier la data URI. Pour modifier le trait : `reference/enso-mask.py` (changer `thick()`, garder `R` constant pour que le cercle reste rond).

**I.2.4 Tests**
R1 à R8 du handoff d'origine renommés **A1 à A8** (R1 à R4 = lot 15).

| ID | Cas | Attendu |
|---|---|---|
| A1 | Fiche en lecture, thème clair puis sombre | 5 cartes avec liseré pinceau, ensō rond et kanji en filigrane, à la couleur de chaque Anneau |
| A2 | Largeur ≤ 720 px | 2 colonnes, Vide en pleine largeur ; kanji entier, non coupé, sur chaque carte |
| A3 | Bureau étroit (5 colonnes serrées, cartes ≈ 110 px) | Kanji réduit, toujours entier ; ensō et chiffre intacts |
| A4 | Mode édition du bloc Anneaux | Champs de Traits et d'Anneau de Vide visibles au-dessus du kanji, cliquables, focus visible |
| A5 | Valeur à 2 chiffres (10) | Le chiffre tient dans l'ensō sans toucher le trait |
| A6 | Correspondance kanji | Terre 土, Eau 水, Feu 火, Air 風, Vide 空 (test DOM : `getComputedStyle(ring, '::before').content`) |
| A7 | Aucune couleur littérale ajoutée | Le lint N8 passe (les data URI de masque ne contiennent pas de couleur) |
| A8 | Navigateur sans `mask` | Repli acceptable : `-webkit-mask` est fourni ; Chrome Android, Edge, Firefox et Safari récents le gèrent |

A1 à A5 : captures Playwright (deux thèmes × deux largeurs) à joindre à la PR.

### I.3 Lot 19 — Sélecteurs et panneau Posture (v2.16.0)
Remplace les listes déroulantes natives de l'app par des sélecteurs stylés (`appearance: base-select`), et **remplace les boutons du panneau Posture par un menu déroulant**. Variantes retenues : **Champ, En ligne, Anneau (ensō), Catalogue groupé, Avec effets**. CSS complet : `reference/selecteurs.css`.

**I.3.1 Principes**
- Une base commune `.cs` + une classe de variante : `class="cs cs-champ"`, `class="cs cs-ligne"`, etc.
- Tout le style est sous `@supports (appearance: base-select)` : un navigateur qui ne le gère pas (Firefox, Safari à ce jour) garde la **liste native**, qui doit rester utilisable (I.3.6).
- Jetons de l'annexe I.1 uniquement : `--surface`, `--surface-2`, `--ink`, `--muted`, `--line`, `--shadow`, `--accent`, `--accent-ink`, `--accent-pale`, polices `--f-display`, `--f-body`, `--f-mono`. Menu déroulant = élément surélevé : fond `--surface-2`, ombre `--shadow` (I.1.7). Texte en couleur d'accent = `--accent-ink`.
- Les variantes riches ont un `<button><selectedcontent></selectedcontent></button>` en **premier enfant** du `<select>`, et un `value` explicite sur chaque `<option>`.
- Mobile : champs en 16 px sous 720 px (pas de zoom Android), options d'au moins 40 px de haut.
- **React 18** (version du dépôt) : `<button>`, `<selectedcontent>` et des `<span>` dans `<option>` sont créés par le DOM de React, pas par le parseur HTML : ils sont conservés. React peut émettre un avertissement `validateDOMNesting` en développement, sans effet en production. Garder le `<select>` contrôlé (`value` + `onChange`) et des `value` sur toutes les options. Encapsuler dans un composant `RichSelect` pour ne pas répéter la structure.

**I.3.2 Où chaque variante s'applique**
Les `<select>` actuels sont dans `Sheet.tsx`, `Roller.tsx`, `Modifiers.tsx` et `ArmorCatalog.tsx` (16 au 29/10/2026). On ne transforme en sélecteur que ce qui est déjà un `<select>`, plus le panneau Posture.

| Variante | Classe | Usages |
|---|---|---|
| Champ | `cs-champ` | Formulaires d'édition : bloc Identité (Clan, Famille), Trait d'une compétence, Compétence d'une arme, et tout `<select>` de modification |
| En ligne | `cs-ligne` | Barre d'état, en-têtes de panneau, options du lanceur (ex. armure dans l'éditeur, choix « Vide : lancer avec l'Anneau ») |
| Anneau | `cs-anneau` | Affinité / déficience Isawa, élément d'un sort (« Élément du sort universel »), Anneau d'un jet de Vide |
| Catalogue groupé | `cs-catalogue` | « Techniques d'école » (groupées par clan, option « Aucune »), sorts, manœuvres |
| Avec effets | `cs-effet` | **Panneau Posture** (I.3.4) ; état de bataille de masse |

**I.3.3 Structure des variantes riches**
**Anneau** (pastille ensō + kanji, Traits en dessous dans la liste) :
```html
<select class="cs cs-anneau" value={affinity} onChange={…} aria-label="Affinité">
  <button><selectedcontent></selectedcontent></button>
  <option value="earth" style="--rc: var(--ring-earth)"><span class="k">土</span><span class="n">Terre</span><span class="d">Constitution · Volonté</span></option>
  <option value="water" style="--rc: var(--ring-water)"><span class="k">水</span><span class="n">Eau</span><span class="d">Force · Perception</span></option>
  <option value="fire"  style="--rc: var(--ring-fire)"><span class="k">火</span><span class="n">Feu</span><span class="d">Agilité · Intelligence</span></option>
  <option value="air"   style="--rc: var(--ring-air)"><span class="k">風</span><span class="n">Air</span><span class="d">Réflexes · Vigilance</span></option>
  <option value="void"  style="--rc: var(--ring-void)"><span class="k">空</span><span class="n">Vide</span><span class="d">Points de Vide</span></option>
</select>
```
Noms d'Anneaux et de Traits tirés de `RINGS` / `TRAIT_LABELS` de `l5r4e.ts`, pas recopiés. Le kanji est à la couleur de l'Anneau, dans l'ensō au pinceau ; une fois l'option choisie, seuls la pastille et le nom restent.

**Catalogue groupé** : `<optgroup><legend>Clan</legend>…</optgroup>` ; option = `.n` nom, `.m` référence (« p. 109 »), `.d` résumé sur une ligne.

**Avec effets** : option = `.n` nom, `.fx` étiquettes d'effet (`.up` pour un bonus, neutre pour un malus ou une contrainte), `.d` description.

**I.3.4 Panneau Posture : menu déroulant à la place des boutons**
Les **boutons de posture** du panneau Combat (Attaque, Assaut, Défense, Défense totale, Centre) sont **remplacés par un seul sélecteur `cs-effet`**. Conséquences :
- La **description de la posture choisie est toujours affichée**, sous le sélecteur (`.posture-desc`), précédée de ses étiquettes d'effet.
- Le bouton **« i » du panneau Posture est supprimé**, ainsi que l'état ouvert / fermé associé. L'en-tête devient simplement « Posture ».
- Les « i » des panneaux **Dépenser du Vide**, **Rappels d'école** et de l'encart **Se déplacer en combat** **ne changent pas**.
- La section « Techniques d'école » du panneau (case Monté, compteurs, cases de ND d'armure, étiquette « Bonus de Centre ») reste en dessous, inchangée.

```html
<div class="panel-head"><h2>Posture</h2></div>
<select class="cs cs-effet" value={stance} onChange={…} aria-label="Posture" aria-describedby="posture-desc">
  <button><selectedcontent></selectedcontent></button>
  <option value="attack">
    <span class="n">Attaque</span>
    <span class="fx"><span>aucun modificateur</span></span>
    <span class="d">{description de la posture}</span>
  </option>
  <option value="fullAttack">
    <span class="n">Assaut</span>
    <span class="fx"><span class="up">+2g1 attaque</span><span>ND armure −10</span></span>
    <span class="d">…</span>
  </option>
  <!-- defense, fullDefense, center sur le même modèle -->
</select>
<div class="posture-desc" id="posture-desc">
  <div class="fx">…étiquettes de la posture choisie…</div>
  {description de la posture choisie}
</div>
```
- Noms et descriptions viennent de `STANCES` (`l5r4e.ts`). Les **étiquettes d'effet n'existent pas encore** dans les données : les ajouter à `STANCES` (champ `tags: { label, up? }[]`), pas dans le composant. Étiquettes de la maquette, à confirmer contre les règles : Attaque « aucun modificateur » ; Assaut « +2g1 attaque » (bonus), « ND armure −10 » ; Défense « ND armure +Défense +Air » (bonus) ; Défense totale « ND armure +jet » (bonus), « pas d'attaque » ; Centre « bonus au round suivant » (bonus), « aucune action ». Les effets ajoutés par une technique d'école (ex. Hiruma) s'affichent aussi en étiquettes.
- Dans la liste, chaque option montre nom, étiquettes **et** description : on lit l'effet avant de choisir. Le champ fermé n'affiche que le nom.

**Comportements conservés**
- Changer de posture met à jour le ND d'armure, les réserves et la barre d'état, comme le bouton aujourd'hui.
- Enchaînement : une **Défense totale lancée** met le sélecteur sur « Défense totale ».
- « Nouveau round » : mémorise si la posture était Centre (inchangé).
- Fiche en consultation : même règle qu'aujourd'hui pour les boutons de posture.

**I.3.5 CSS**
`reference/selecteurs.css`, sections 5.1 (base commune, une fois) à 5.6 (Avec effets et `.posture-desc`). À la mise en œuvre : `--rc` des options d'Anneau pointe vers `--ring-*` ; la data URI `--enso` n'est pas recopiée (I.2.3).

**I.3.6 Repli sans `base-select`**
- La liste native n'affiche que le texte des options, mis bout à bout. Ordre des `<span>` imposé (nom d'abord) pour que le début de ligne reste le nom.
- **Posture** : la description permanente `.posture-desc` est hors du `<select>`, donc visible partout ; le repli reste complet.
- **Anneau** : en repli, le kanji précède le nom (« 風Air… ») ; acceptable.
- Aucun message « navigateur non compatible » dans l'app.

**I.3.7 Tests**
S1 à S10 du handoff d'origine renommés **D1 à D10** (S1 à S5 existent deux fois, §10.2 et E.9).

| ID | Cas | Attendu |
|---|---|---|
| D1 | Chrome / Edge récents, chaque variante | Menu stylé sur `--surface-2` avec ombre ; option choisie sur `--accent-pale` ; focus visible |
| D2 | Firefox | Listes natives, toutes utilisables ; panneau Posture : description visible sous le select |
| D3 | Panneau Posture | Aucun bouton de posture ni bouton « i » ; un `<select>` « Posture » ; description et étiquettes de la posture choisie affichées en permanence |
| D4 | Choisir « Assaut » | ND d'armure −10 dans la barre d'état ; réserve d'attaque +2g1 ; description mise à jour |
| D5 | Lancer une Défense totale | Le sélecteur passe sur « Défense totale » |
| D6 | Hiruma R3 (`reference/perso-test-ecoles.json`) | Techniques d'école toujours affichées sous le sélecteur ; effets ajoutés visibles en étiquettes |
| D7 | Sélecteur Anneau | 5 options avec ensō et kanji à la couleur de l'Anneau ; champ fermé : pastille + nom |
| D8 | Techniques d'école | Groupes par clan, option « Aucune », référence de page à droite ; liste à la largeur du champ |
| D9 | Mobile 360 px (« Pixel 7 », « iPhone 13 ») | Pas de zoom à l'ouverture (16 px), options ≥ 40 px, menu dans l'écran, pas de défilement horizontal |
| D10 | Lint couleurs (N8) | Aucune couleur littérale dans ces règles |

**Tests existants mis à jour au lot 19** : E12 (§10.4) ne porte plus que sur les « i » de Vide, Déplacement et Rappels d'école, le cas Posture est remplacé par D3 ; M10 (§10.5) devient « Boutons "i" : zone de toucher ≥ 40 × 40 px ; le panneau Vide tient sur moins d'un écran détails fermés ; le panneau Posture tient sur moins d'un écran avec sa description » ; §6.2 « Détails repliables » et §7 « Postures et Vide » : retirer Posture.

### I.4 Points ouverts (à trancher par Nelson)
| # | Point | Défaut si non tranché |
|---|---|---|
| P-I1 | `--on-accent` blanc sur l'accent clair plein : **Lion 3,8:1, Phénix 4,4:1, Grue 4,35:1** (sous 4,5:1, contrôle du 29/10/2026). Le handoff ne liste aucun texte sur accent plein, mais le « i » ouvert est rempli d'accent et porte une lettre. | Un fond plein qui porte du texte utilise `--accent-ink` en clair (blanc dessus : 6,2:1 au moins) ; `--accent` reste pour les bordures et pastilles sans texte. Test N12. |
| P-I2 | `--on-ring` en sombre : le blanc échoue (2,0 à 3,0:1) sur les Anneaux sombres. | `--on-ring: var(--bg)` en sombre (5,1:1 au moins). |
| P-I3 | Nom des jetons d'Anneau | Renommer `--earth` … `--void` en `--ring-*` au lot 17 (tous les usages mis à jour dans la même PR). |
| P-I4 | Étiquettes d'effet des postures (I.3.4) | Textes de la maquette, ajoutés à `STANCES`. |

### I.5 Corrections des handoffs d'origine
- **Noms de jetons** : les handoffs supposent `--accent`, `--bad`, `--earth`, `--acc-l` ; le code utilise `--gold` / `--gold-soft` (accent), `--bad`, `--earth` … `--void`, `--acc-l` / `--acc-d`, et a aussi `--sunk`. Correspondance et renommages en I.1.10 ; `--sunk` et `--seal*` gardés.
- **« Remplacer le bloc de thème »** devient « fusionner » (I.1.10, étape 1) pour ne pas perdre `--sunk`, `--seal*` et les polices.
- **Couleurs d'Anneau** : elles ne sont pas « fixes » mais en deux jeux clair / sombre (I.1.6) ; le jeu sombre tient lieu de la variante `--ring-*-d` envisagée.
- **Vocabulaire** (édition française, E.7) : posture « Attaque totale » → **« Assaut »** ; Trait de l'Air « Intuition » → **« Vigilance »**.
- **Posture** : « aucun texte nouveau » n'est pas tenable pour les étiquettes d'effet, absentes de `STANCES` ; elles s'y ajoutent (P-I4).
- **Composant `Cg()`** : nom du prototype minifié ; dans l'appli, bloc Anneaux de `Sheet.tsx`.
- **Masque `--enso`** recopié deux fois dans les handoffs : une seule déclaration (I.2.3).
- **Identifiants** : C1 à C11 → N1 à N11 (+ N12, P-I1) ; R1 à R8 → A1 à A8 ; S1 à S10 → D1 à D10 ; « lint C8 » → N8.
- **Maquettes** : les artifacts cités ne sont pas dans le dépôt ; le CSS validé est dans `reference/anneaux-enso.css` et `reference/selecteurs.css`.

### I.6 Écarts de mise en œuvre (v2.14.0)
- **`--accent-fill`** (nouveau, P-I1 au défaut) : fond plein qui porte du texte (`.btn.accent`, sous-onglet de situation actif, « i » ouvert) ; `--accent-ink` en clair, `--accent` en sombre, texte `--on-accent`. N12 le vérifie pour les onze accents. La classe `.btn.gold` devient `.btn.accent`.
- **Élévation** : `--surface-2` + `--shadow` pour le lanceur mobile (et son en-tête collant), la fenêtre d'import et les éditeurs de la barre d'état (ND d'armure, blessures, emplacements). Le lanceur reste intégré (`--surface`) au bureau. Ombre de l'onglet actif : `0 1px 2px var(--line)` (plus de `rgba` littéral).
- **`--warn`** : augmentations au-delà du Vide (lanceur) et bandeau de conflit du fichier lié (texte `--ink`, bordure et fond `--warn`). Les autres alertes restent en `--danger`.
- **Thème au chargement** : l'état initial reprend le cache `localStorage` ; à la lecture des préférences, IndexedDB fait foi (sans thème enregistré : auto, cache effacé). `applyTheme` gère les balises `theme-color`.
- **Jetons gardés** : `--sunk` sombre (`#1c1e21`) inchangé comme prévu ; `color-mix` des badges d'Anneau (`.b-cocher`, `.b-rappel`, `.tag.el`) gardés en `srgb`.
- **N7** testé en Playwright (bordures calculées de la barre d'état, bureau et 390 px, clair et sombre) ; **N8** dans Vitest (`tests/colors.spec.ts`) sur tous les `.css` de `src/ui` ; **N9** relève le fond à la première image. Les colonnes « Accent-ink » sont aussi vérifiées contre la formule de mélange (±2 par canal).
- **Tests existants modifiés** : U3 (`ui/app`, variables `--clan-*`), couleur de clan (`core.engine`, champs `inkLight` / `inkDark`), E8 (`e2e/storage`, `--bg` sombre `#26252a`).

### I.7 Écarts de mise en œuvre (v2.15.0)
- **CSS fusionné, pas ajouté** : les surcharges de `reference/anneaux-enso.css` sont fondues dans les règles `.ring` existantes de `styles.css` (plus de `border-top`, `padding-top` à 18 px, `.rv` à 26 px) au lieu d'être recopiées après. Rendu identique, une seule source par propriété.
- **Masques sur `:root`** : `--brush` et `--enso` sont déclarés dans le premier bloc de thème (`:root`), pas sur `.ring::after` / `.rv::before`. Un second bloc `:root` aurait remplacé le premier dans l'analyse de `tests/colors.spec.ts` ; les data URI ne contiennent ni `;` ni couleur. Le lot 19 réutilise `var(--enso)` sans recopier le tracé.
- **Tests** : A1 à A6 et A8 en Playwright (`tests/e2e/rings.spec.ts`, Chromium) : jsdom ne calcule pas les pseudo-éléments, donc A6 (`::before`) ne peut pas tourner dans Vitest. « Kanji entier » est vérifié par la taille de police calculée (≤ plus petit côté de la carte − 8 px) ; A5 par la largeur du texte « 10 » (≤ diamètre − 20 px). A7 est le lint N8 existant. Les captures (deux thèmes × 1200 et 390 px, bureau étroit 760 px, édition, valeur 10) sont écrites dans `test-results/anneaux/` (hors dépôt).

### I.8 Écarts de mise en œuvre (v2.16.0)
- **Composant `RichSelect`** (`src/ui/components/RichSelect.tsx`) pour les cinq variantes : `<select>` contrôlé de classes `in cs cs-<variante>`, avec `<button><selectedcontent>` en tête pour les variantes riches. `.in` est gardé pour la liste native de repli. `RingOption` (kanji, nom, Traits tirés de `RINGS` / `TRAIT_LABELS`) et `EffectTags` (étiquettes `.fx`) évitent de répéter la structure. Le type `selectedcontent` est déclaré pour JSX dans ce fichier.
- **Variantes retenues** pour les 16 `<select>` : Champ pour Trait d'une compétence et tous les champs du bloc Bonus de jet (dont « Modèle de bonus ») ; En ligne pour Spécialisation, ND de base et zone du Coup ciblé (lanceur), et « Armure du livre » dans l'éditeur de la barre d'état (Champ dans le bloc Armure, prop `variant` d'`ArmorFields`) ; Anneau pour Affinité, Élément d'un sort (option « Tous » sans kanji ni ensō), Élément du sort universel et Anneau du jet ; Catalogue groupé pour Techniques d'école. Clan et Famille restent des champs texte (pas de `<select>`), l'état de bataille de masse reste en boutons.
- **Catalogue groupé** : les écoles n'ont pas de référence de page ; `.m` affiche la classe (« Bushi », « Courtisan », « Shugenja ») et `.d` la technique de rang 1. Le champ prend **toute une ligne** de la grille du bloc Identité (`Field wide`, `.form-grid .field.wide`), comme le sélecteur Posture dans son panneau : largeur `min(100%, 24rem)` au lieu de 22rem, liste à la largeur du champ (`anchor-size(width)`), nom, classe et technique de rang 1 en entier, sur plusieurs lignes au besoin ; rien n'est tronqué (vérifié en D8). Le `<optgroup>` garde son `label` pour la liste native, avec un `<legend>` pour `base-select`.
- **CSS** : `min-width: 13rem` des variantes Champ et Anneau retiré (cellules de tableau de 140 px, colonnes de 150 px) ; `font: inherit` déjà posé sur tous les `select`, donc retiré de `.cs` (il écrasait `.mono` du ND de base). Descriptions `.d` des variantes Avec effets et Catalogue en `white-space: normal` (sinon coupées). Les étiquettes `.fx` de `.posture-desc` reprennent le style de celles de la liste, hors `@supports`, pour le repli. Mobile : Champ, Anneau, Catalogue et Avec effets en pleine largeur et 16 px.
- **Panneau Posture** : en-tête « Posture » + ND d'armure, sans « i » ; `InfoPanel` perd `stance`. L'Assaut monté sans Équitation 3 devient une option désactivée avec la même raison en `title`. Étiquettes d'effet : champ `tags` de `STANCES` (P-I4 au défaut) ; les effets d'école réservés à une posture viennent de `stanceEffects` (moteur), au format « +1g0 · Hiruma R1 ».
- **Tests** : D3 à D8 dans Vitest (`tests/ui/selectors.spec.tsx`, structure DOM, posture par `tests/helpers/stance.ts`) ; D1, D7 et D8 dans Playwright (`tests/e2e/selectors.spec.ts`, Chromium, deux thèmes, captures dans `test-results/selecteurs/`, hors dépôt) ; D9 dans `mobile.spec.ts` (« Pixel 7 » en `base-select`, « iPhone 13 » en WebKit, donc en liste native) ; D10 est le lint N8. **D2 (Firefox) n'est pas automatisé** : Firefox n'est pas installé pour Playwright ; le repli sans `base-select` est couvert par WebKit (D9, M1 à M19).
- **Tests existants modifiés** : les tests qui cliquaient un bouton de posture choisissent l'option (`app`, `combat`, `schools`, `slots`, e2e `schools` et `mobile`) ; E12 et M10 selon I.3.7 ; liste de l'Affinité (`spells`) lue dans `.n` ; e2e `schools` choisit l'école par valeur, le texte de l'option n'étant plus le seul nom.

---

## Annexe J — Lot 20 : correctifs et retouches (v2.17.0)

Statut : **à livrer**. Retours de jeu de Nelson du 30/10/2026, audit fait sur `main` au commit `783c009` (v2.16.0). Les numéros de ligne cités peuvent avoir bougé : se fier aux extraits.

La **localisation** prévue ici (ex-annexe J, français + anglais) est **reportée** : retirée du plan, notée au §11 point 22. `formatDR(s, letter)` garde son second paramètre, sans autre usage pour l'instant.

Une PR, CI verte, captures « avant » et « après » (bureau 1280 px et 390 px, clair et sombre) des vues touchées, tag `v2.17.0` après merge. Version **mineure** : nouveaux modèles de fiche et nouveau comportement par défaut du lanceur. **Pas de changement de format de fiche** (`schemaVersion` reste 2).

| # | Retour | Zone |
|---|---|---|
| J.1 | Panneau Armes en mobile : champs tronqués, difficile de tout effacer | `Sheet.tsx` `Weapons`, `styles.css` |
| J.2 | Police du bloc Identité & réputation incohérente | `Sheet.tsx` `Identity`, `styles.css` |
| J.3 | Bouton d'ajout de technique qui mentionne les sorts | `Sheet.tsx` `Techniques` |
| J.4 | Bonus de jet : plus de catalogue, un modèle structuré ; saisie à la main ou par JSON | `Modifiers.tsx`, `l5r4e.ts`, annexe B |
| J.5 | Modèles JSON de shugenja et de courtisan | `reference/`, `src/rules/example.ts`, `Library.tsx` |
| J.6 | Panneau « Dépenser du Vide » comme le panneau Posture | `Aid.tsx` `VoidPanel` |
| J.7 | Lanceur de dés affiché par défaut | `store.ts`, `useLibrary.ts`, prefs |
| J.8 | Shugenja en escarmouche : sorts avant les attaques | `core/actions.ts` |
| J.9 | Lanceur : retirer le champ « Dés lancés ± » (Bonus fixe gardé, champs d'augmentations inchangés) | `Roller.tsx` |
| J.10 | Lanceur : Min et Moy. pas centrés en hauteur à côté de Max | `styles.css` `.statline` |

### J.1 Panneau Armes sur mobile

**Constat.** En Edit, `Weapons` est un tableau de 6 colonnes dans `.tbl` (défilement horizontal) avec des largeurs fixes (`td` de 80 et 70 px, mots-clés `minWidth: 140`). À 390 px, les champs Nom, Compétence et VD n'affichent que quelques caractères : on ne voit pas ce qu'on tape et on vise mal le texte à effacer.

**Correctif.** Même présentation que les sorts en Edit (`.spelledit`) **à toutes les largeurs**, plus de tableau en Edit :
- une **carte par arme** (`.weaponedit`, mêmes règles que `.spelledit`) : ligne 1 **Nom** (pleine largeur) + bouton Retirer ; puis grille `form-grid` : **Compétence**, **VD**, **Force de l'arc** ; puis **Mots-clés** (pleine largeur) ;
- chaque champ avec un `label` visible (`Field`), les `aria-label` actuels deviennent inutiles ;
- mobile ≤ 720 px : grille sur 2 colonnes (Compétence pleine largeur, VD + Force de l'arc côte à côte), champs à **16 px** (pas de zoom iOS) et 40 px de haut ;
- les champs texte gardent `type="text"` ; ajouter `enterkeyhint="next"` et `autocapitalize="off"` sur VD ;
- « Force de l'arc » n'apparaît que pour une arme à distance (`isRanged(w)` ou mot-clé `arc`) ; sinon la cellule disparaît ;
- `CatalogGap` (mise à jour proposée depuis le livre) reste sous la carte concernée.

Le mode lecture (tableau Arme / Attaque / Dégâts) ne change pas.

**Effacement.** Vérifier sur téléphone que chaque champ se vide entièrement (sélection + suppression) et que la valeur vide est acceptée pendant la saisie : `TextListField` (mots-clés) et `OptionalNumber` (Force de l'arc) le permettent déjà ; le VD vide doit rester saisissable (validation au moment du jet, pas à la frappe).

### J.2 Police du bloc Identité & réputation

**Constat (à confirmer par capture).** Le bloc mélange plusieurs polices sans règle visible :
- en lecture, `.kv b` affiche Honneur, Gloire, Statut, XP **et** l'Initiative en JetBrains Mono 18 px, alors que les réserves ailleurs (Compétences, Armes) sont en `.pool` (mono gras, couleur `--accent-ink`) et les valeurs simples en mono 15 px (`.cstats`, tableaux) ;
- en Edit, le placeholder du Rang d'école (« n (Rang d'Insight) ») hérite de `input.in[type=number]` et s'affiche en mono, au milieu de champs texte en police du corps.

**Règle à appliquer** (la même que le reste de l'outil) : **chiffres en mono, textes en police du corps, réserves en `.pool`**.
- `.kv b` : mono, **même corps que les valeurs des autres blocs** (aligner sur `.cstats b` ou la valeur la plus proche dans la fiche, à choisir sur capture) ;
- Initiative : classe `pool` (couleur d'accent, comme les colonnes « Jet » des tableaux) ;
- `input.in[type=number]::placeholder { font-family: var(--f-body) }` (vaut pour tous les champs numériques facultatifs) ;
- nom du bloc : identique aux autres titres (`h2`, `--f-display`).

**Avant de coder**, l'agent compare le bloc Identité aux blocs Compétences, Armes et Armure sur les captures (lecture et Edit, bureau et 390 px) et liste dans la PR chaque différence de famille, de corps ou de graisse trouvée. Si le défaut vu par Nelson est ailleurs, il est ajouté au relevé et traité avec la même règle.

### J.3 Bouton d'ajout de technique

Les sorts ont leur propre bloc (Rouleaux & invocations, annexe F). Dans `Techniques` :
- bouton `+ Technique / sort / kata` → **`+ Technique / kata`** ;
- titre `Autres techniques, kata, sorts` → **`Autres techniques, kata`**.

Les fiches qui ont un sort noté en technique ne sont pas modifiées (pas de migration).

### J.4 Bonus de jet : modèle structuré, sans catalogue

**Décision.** Comme pour les sorts : **aucun catalogue nommé** dans l'outil. Le joueur saisit ses bonus **à la main** (formulaire structuré) ou **par le JSON** de sa fiche (champ `modifiers`, format de l'annexe B, inchangé).

**Retraits.**
- `NAMED_MODIFIERS` (`src/rules/l5r4e.ts`) et son groupe « Catalogue (livre de base 4e, à vérifier) » du menu ;
- les tests qui s'y rapportent (les lister dans la PR).

Les bonus déjà présents dans une fiche (créés depuis le catalogue) restent tels quels : ce sont des données du joueur.

**Modèle.** Le menu « Modèle de bonus » propose les **formes d'effet** possibles, regroupées par source. Chaque modèle préremplit `source`, `appliesTo`, `mode` et les valeurs, avec un **nom vide** et un placeholder qui dit quoi écrire (« Nom de l'avantage », etc.). Aucun nom ni texte du livre.

| Groupe (`source`) | Modèle | Champs préremplis |
|---|---|---|
| **Avantage** | Dés en plus sur une compétence | `skill`, `rolled: 1`, `kept: 1`, `always` |
| | Dés en plus sur un trait | `trait`, `rolled: 1`, `always` |
| | Augmentation gratuite sur une compétence | `skill`, `freeRaises: 1`, `always` |
| | Bonus sur les jets sociaux | `social`, `rolled: 1`, `always` |
| | Pénalité de blessure réduite | `wounds`, `flat: 3`, `always` |
| | Bonus au ND d'armure | `armor`, `flat: 5`, `always` |
| | Bonus situationnel (à cocher au jet) | `all`, `rolled: 1`, `kept: 1`, `optional` |
| **Désavantage** | Malus de dés sur une compétence | `skill`, `rolled: -1`, `always` |
| | Malus de dés sur un trait | `trait`, `rolled: -1`, `always` |
| | ND augmenté sur les jets sociaux | `social`, `tn: 5`, `always` |
| | ND augmenté sur une compétence | `skill`, `tn: 5`, `always` |
| | Pénalité de blessure aggravée | `wounds`, `flat: -5`, `always` |
| | Malus situationnel au total (à cocher) | `all`, `flat: -5`, `optional` |
| **Technique** | Dés en plus aux attaques | `attack`, `rolled: 1`, `always` |
| | Dés en plus aux dégâts | `damage`, `rolled: 1`, `always` |
| | Dés en plus à l'initiative | `initiative`, `rolled: 1`, `always` |
| | Bonus en posture (au choix de la posture) | `attack`, `rolled: 1`, `stance: "attack"`, `always` |
| **Autre** | Bonus libre | tout à 0, `appliesTo: "skill"`, `always` |

- Le menu est un `RichSelect` variante **Catalogue groupé** (comme les écoles) : `<optgroup>` par source, chaque option avec son nom (`.n`) et l'effet en clair (`.d`, `describeModifier` du modèle). « Bonus libre » en tête, choisi par défaut.
- `MODIFIER_TEMPLATES` est réécrit selon le tableau (identifiants stables `adv-skill-dice`, `dis-social-tn`…) ; le type `ModifierTemplate` gagne `placeholder: string`.
- Dans l'éditeur, le nom vide affiche le placeholder du modèle ; la case « Condition, précision » garde son placeholder.
- Texte d'aide en tête du panneau en Edit (une ligne de plus) : « Tu peux aussi les écrire dans le JSON de ta fiche (champ `modifiers`) : voir les modèles de fiche de la Bibliothèque. »

**Annexe B à mettre à jour** (section *Saisie*) : retirer le tableau du catalogue nommé, renvoyer à J.4. **README** : section Bonus de jet, remplacer la liste des modèles par « à la main, à partir d'une forme d'effet (avantage, désavantage, technique), ou dans le JSON » et retirer toute mention du catalogue.

### J.5 Modèles de fiche JSON : shugenja et courtisan

**Fichiers fournis** (validés contre le schéma v2 par `importCharacter`, joints au handoff) :

| Fichier | Personnage | Contenu notable |
|---|---|---|
| `reference/exemple-personnage.json` | Kakita Haruto, bushi Kakita R1 (existant) | inchangé |
| `reference/exemple-shugenja.json` | Tamori Ayane, shugenja Tamori R1 (Dragon) | 2 sorts : *Sentir* (universel, non mémorisé) et *Frappe de jade* (Terre, maîtrise 1, VD `2g2`, mémorisé) ; Sortilèges, Méditation, Artisanat : Forge |
| `reference/exemple-courtisan.json` | Doji Sayuri, courtisane Doji R1 (Grue) | compétences de l'école ; 2 bonus de jet : *Voix* (avantage, +1g1) et un désavantage-modèle vide à adapter |

Les deux fiches portent une note « Modèle … Remplace tout par ton personnage ». Les effets de sort sont des résumés d'une ligne, pas du texte du livre.

**Bibliothèque.** Le bouton « Télécharger un exemple de fiche (JSON) » devient un groupe de trois boutons `btn sm`, sur une ligne qui passe à la ligne sur mobile :
« **Exemple bushi** », « **Exemple shugenja** », « **Exemple courtisan** », précédés du libellé « Modèles de fiche (JSON) : ». Fichiers téléchargés : `exemple-bushi-l5r.json`, `exemple-shugenja-l5r.json`, `exemple-courtisan-l5r.json`.

**Code.** `src/rules/example.ts` exporte `EXAMPLES: { id, label, fileName, build(): Character }[]` (trois entrées, `migrate()` sur chaque JSON). `EXAMPLE_FILE_NAME` et `exampleCharacter()` disparaissent ; adapter leurs usages et tests.

**README** : la ligne « Exemple » cite les trois modèles.

### J.6 Panneau « Dépenser du Vide » comme le panneau Posture

**Constat.** `VoidPanel` affiche encore l'ancien motif des postures (grille de boutons `.stance` + bouton « i » qui déplie les descriptions), alors que le panneau Posture est passé au menu déroulant au lot 19 (I.3.4).

**Correctif : même structure que `StancePanel`.**
- **En-tête** : « Dépenser du Vide » à gauche ; à droite « Points de Vide **n** » (même style que « ND d'armure n ») puis les dépenses actives en étiquettes (`+2g2 au jet`, `+20 ND d'armure`, `Compétence au rang 1`). **Plus de bouton « i »** : `InfoPanel` perd `"void"`.
- **Menu** `RichSelect variant="effet"`, une option par dépense, avec nom (`.n`), étiquettes d'effet (`EffectTags`) et description (`.d`) :

  | Option | Étiquettes | Description | Effet |
  |---|---|---|---|
  | Au jet | `+{m}g{m}` | Dépensé au prochain jet lancé. | bascule `opts.voidPoint` |
  | ND d'armure | `+{10m}` | Jusqu'au prochain round. | bascule `voidArmor` |
  | Compétence au rang 1 | — | Jouer une compétence que tu n'as pas. | bascule `opts.voidSkill` |
  | Activer une capacité | `1 point` | Technique, kata ou avantage payé en Vide. | `voidTechnique` |
  | Initiative (escarmouche seulement) | `+{10m}` | Jusqu'à la fin de l'escarmouche. | `voidInitiative` |
  | Échanger l'Initiative (escarmouche seulement) | `1 point` | Avec un allié consentant ; échangez vos scores à la main. | `voidTechnique` |

  (`m` = `voidMultiplier(c)`.) Choisir une option **ne dépense rien**.
- **Sous le menu** : description de l'option choisie (`.posture-desc`, mêmes étiquettes), puis **un bouton** :
  - pour une bascule : « Dépenser 1 point de Vide » (`btn sm accent`) ou, si elle est active, « Annuler » (`btn sm`), `aria-pressed` ;
  - pour une action ponctuelle : « Dépenser 1 point de Vide » ;
  - désactivé sans point de Vide (sauf « Annuler »).
- Option choisie : nouvel état UI `voidChoice` (défaut « Au jet »), non mémorisé, remis au défaut quand on quitte l'escarmouche si l'option n'existe plus.
- Le message « Déjà un point de Vide dépensé ce round » reste au-dessus du menu.

E12 perd le panneau Vide (reste Déplacement et Rappels d'école).

### J.7 Lanceur de dés affiché par défaut

**Décision.** Le lanceur de dés est **affiché par défaut** (inverse de la v1.1, §3 et §6.2 à mettre à jour, E15 à réécrire). Le bouton d'en-tête et le choix mémorisé restent.

- `store.ts` : `showDiceRoller: true` à l'état initial ;
- `useLibrary.ts` : `dispatch({ type: "diceRoller", show: prefs.showDiceRoller ?? true })` (aujourd'hui seul `true` est relu) ;
- **préférence déjà enregistrée** : la v2.16.0 écrit `showDiceRoller: false` dans les préférences de tout le monde dès l'ouverture. Pour que le nouveau défaut s'applique, la préférence est **renommée** `diceRoller` (lecture : `prefs.diceRoller ?? true`, l'ancienne clé est ignorée puis supprimée à la première écriture). Conséquence assumée : un joueur qui avait masqué le lanceur le retrouve affiché une fois ;
- README : « Par défaut, l'outil lance les dés… Pour jouer avec tes vrais dés, appuie sur **Lanceur de dés** pour le masquer. »

### J.8 Shugenja en escarmouche : sorts avant les attaques

**Constat.** `buildActions`, cas `skirmish` : Initiative → armes → actions fixes → `skirmishSpellActions(c)` (« après les attaques », v2.12.0).

**Correctif** (shugenja seulement, les autres personnages ne changent pas) :
1. Initiative ;
2. **groupe « Sorts »** (`skirmishSpellActions`) ;
3. **groupe « Attaques »** : armes puis actions fixes (mains nues, lutte, Défense totale). Le titre de groupe n'est posé que si le personnage a des sorts, pour que le titre « Sorts » ne coiffe pas les armes.

Mettre à jour F.5 / F.11 (« groupe Sorts après les attaques » → avant) et les tests d'ordre (`core.slots.spec.ts`, `tests/ui/slots.spec.tsx`).

### J.9 Lanceur : retirer « Dés lancés ± »

**Constat.** Le champ « Dés lancés ± » (`opts.extraRolled`) fait doublon avec les bonus de jet et le bonus fixe. **Attention** : il sert aussi à transmettre les **augmentations de dégâts** de l'attaque au jet de dégâts (`store.ts`, `opts.extraRolled = pendingDamage.dice`, cas E7).

**Correctif.**
- retirer le champ de `.opts` dans `Roller.tsx` ; la grille garde ND, augmentations, augmentations gratuites et **Bonus fixe**, **libellés inchangés** (« Augm. libres » / « Augmentations », « Augm. gratuites », décision du 30/10/2026) (E13 : « Bonus fixe » seul sur sa ligne, sans case vide) ;
- **garder** `extraRolled` dans `RollOptions` et le moteur : il ne vient plus que de `pendingDamage` ;
- quand `extraRolled > 0`, l'afficher en lecture seule sous la réserve : « +n g0 · augmentations de l'attaque » (étiquette, comme les bonus) avec un bouton « Retirer » qui le remet à 0 ;
- la ligne « lancer à la main » (`Roller.tsx`, `extra`) garde son texte.

### J.10 Lanceur : Min · Moy. · Max centrés

**Constat.** Dans la ligne de statistiques du lanceur (`.statline`), quand les dégâts explosent sur 9 (Kenjutsu ou Armes lourdes 7), la case Max contient l'étiquette « 9+ ». Or la règle `.statline span` s'applique **aussi** à cette étiquette imbriquée (fond, `padding: 4px 9px`) : la case Max grandit, les cases voisines s'étirent à sa hauteur (`align-items: stretch` par défaut) et leur texte reste collé en haut. Min et Moy. ne sont donc plus centrés verticalement.

**Correctif** (`styles.css`) :
- restreindre la règle aux cases : `.statline > span { … }` au lieu de `.statline span`, pour que l'étiquette « 9+ » garde le style `.tag` ;
- centrer le contenu de chaque case : `.statline > span { display: inline-flex; align-items: center; gap: 4px }` ; les cases gardent la même hauteur.

Vaut pour tous les lanceurs (compétences, dégâts, sorts) et pour la case « Réussite ».

### J.11 Tests du lot 20

| ID | Cas | Attendu |
|---|---|---|
| Q1 | 390 px, bloc Armes en Edit, arme « Katana » | Une carte par arme ; Nom, Compétence, VD visibles en entier (largeur du texte ≤ largeur du champ) ; champs à 16 px ; pas de défilement horizontal |
| Q2 | 390 px, effacer le nom, le VD et les mots-clés d'une arme | Chaque champ se vide entièrement ; le VD vide est accepté pendant la saisie |
| Q3 | Arme sans mot-clé `arc` | Pas de champ « Force de l'arc » ; présent pour un Yumi |
| Q4 | Bloc Identité, lecture et Edit | Valeurs numériques en `--f-mono` au même corps que les autres blocs ; Initiative en `.pool` ; placeholder du Rang d'école en `--f-body` (style calculé) |
| Q5 | Bloc Techniques en Edit | Bouton « + Technique / kata » ; aucun texte « sort » dans le bloc |
| Q6 | Menu « Modèle de bonus » | 4 groupes (Avantage, Désavantage, Technique, Autre) ; aucune entrée nommée d'après le livre ; `NAMED_MODIFIERS` absent du code |
| Q7 | Ajouter le modèle « ND augmenté sur les jets sociaux » | Bonus `source: disadvantage`, `appliesTo: social`, `tn: 5`, nom vide avec placeholder ; un jet d'Étiquette a son ND +5 |
| Q8 | Import d'une fiche avec un bonus créé depuis l'ancien catalogue | Bonus conservé tel quel, toujours appliqué |
| Q9 | Bibliothèque : les 3 modèles | 3 boutons ; chaque fichier téléchargé se réimporte en « Nouvelle fiche » sans erreur ; le shugenja a 2 sorts et l'école Tamori, la courtisane l'école Doji et 2 bonus |
| Q10 | Panneau Vide | Menu déroulant (variante Avec effets), pas de « i » ; choisir une option ne dépense rien ; « Dépenser » sur « Au jet » coche le Vide du lanceur et l'étiquette apparaît dans l'en-tête ; « Annuler » la retire |
| Q11 | Panneau Vide hors escarmouche (duel) | Options Initiative et Échanger absentes |
| Q12 | Première ouverture (préférences vides) | Lanceur affiché : bouton « Lancer » présent |
| Q13 | Préférences v2.16.0 avec `showDiceRoller: false` | Lanceur affiché ; masqué puis rechargé : reste masqué |
| Q14 | Escarmouche, shugenja (fiche exemple) | Ordre : Initiative, titre « Sorts », sorts, titre « Attaques », armes, actions fixes |
| Q15 | Escarmouche, bushi | Ordre inchangé (Initiative, armes, actions fixes), aucun titre de groupe |
| Q16 | Lanceur sur une compétence | Pas de champ « Dés lancés ± » |
| Q17 | Attaque réussie avec 2 augmentations de dégâts, puis Dégâts (E7) | Réserve de dégâts +2g0 ; étiquette « +2g0 · augmentations de l'attaque » ; « Retirer » la ramène à la réserve de base |
| Q18 | Non-régression | `core.rules.spec.ts` inchangé et vert ; tests existants modifiés listés dans la PR (E12, E13, E15, ordre des sorts, catalogue de bonus, exemple de fiche) |
| Q19 | Lanceur sur Dégâts · Katana avec Kenjutsu 7 (étiquette « 9+ ») | Min, Moy., Max et Réussite de même hauteur ; le centre vertical du texte de chaque case est au centre de la case (± 1 px) ; « 9+ » a le style `.tag` |

### J.12 Documents à mettre à jour dans la même PR
- `HANDOFF.md` : §3 (préférence `diceRoller`, affichée par défaut), §6.2 (lanceur affiché par défaut), §10 (E12, E13, E15 réécrits), annexe B (*Saisie*), annexe F (ordre des sorts en escarmouche), §11 point 20 « livrée », J.14 écarts de mise en œuvre ;
- `README.md` : lanceur de dés, bonus de jet, modèles de fiche ;
- `CHANGELOG.md` : entrée `[2.17.0]` (Ajouté : modèles shugenja et courtisan, modèles de bonus par source ; Modifié : lanceur affiché par défaut, panneau Vide, sorts avant les attaques, bloc Armes en Edit ; Corrigé : Min et Moy. centrés dans le lanceur ; Retiré : catalogue nommé des bonus, champ « Dés lancés ± ») ;
- `CONTRIBUTING.md` : point 11 (traductions) non ajouté, la localisation étant reportée.

### J.14 Écarts de mise en œuvre (v2.17.0)
- **J.1** : chaque carte est un groupe « Arme : <nom> » (« Arme : sans nom » tant que le nom est vide) ; ses champs portent leur libellé visible (Nom, Compétence, VD, Force de l'arc, Mots-clés). « Force de l'arc » suit `isRanged(w)`, qui couvre déjà le mot-clé `arc`. `CatalogGap` reste aussi sous l'arme en lecture (mode modification), comme avant.
- **J.2** : relevé sur captures. Écarts trouvés : `.kv b` en mono **18 px** (contre 15 px pour `.cstats b`, les tableaux et `.pool`) ; Initiative en mono noir au lieu de `.pool` ; placeholder du Rang d'école en mono. Corrigé : `.kv b` passe à 15 px (même corps que `.cstats b`), Initiative en `.pool`, `input.in[type=number]::placeholder` en `--f-body`. Le titre du bloc était déjà un `h2` en `--f-display`.
- **J.4** : le groupe **« Autre »** (Bonus libre) est placé **en tête** du menu, puis Avantage, Désavantage, Technique. Le placeholder du nom vient de `MODIFIER_NAME_PLACEHOLDERS[source]` (le champ `placeholder` des modèles en est tiré) : il suit la source si le joueur la change. L'option d'un modèle situationnel ajoute « · au choix » à son effet. « Bonus libre » a la source `other` (auparavant `technique`).
- **J.5** : les trois boutons sont dans un groupe accessible « Modèles de fiche (JSON) ». `EXAMPLES[].build()` (au lieu de `exampleCharacter()`).
- **J.6** : le panneau est un groupe « Dépenser du Vide » ; le menu s'appelle « Dépense de Vide ». `voidChoice` revient à « Au jet » au changement de type de combat si l'option n'existe plus ; une option absente retombe aussi sur « Au jet » à l'affichage. `InfoPanel` perd `"void"`.
- **J.7** : `PrefsStore.set` supprime les clés passées à `undefined` (`mergePrefs`) : chaque écriture des préférences retire `showDiceRoller`.
- **J.8** : le titre « Attaques » est posé sur toutes les armes et actions fixes d'escarmouche (dégâts compris), seulement si le personnage a des sorts.
- **J.9** : l'étiquette « +n g0 · augmentations de l'attaque » et son bouton « Retirer » sont sous la réserve, avant les étiquettes de technique. Sans augmentations mais avec un ND, ND et Bonus fixe sont côte à côte (l'ancienne case d'alignement vide est retirée).
- **Tests existants modifiés** (Q18) : E12, E13 (×2), E15 (unitaires et e2e), M10 et M14 (e2e mobile), « Nouveau round » (repère du panneau Vide), ordre des sorts (`core.slots.spec.ts`), catalogue de bonus (`core.modifiers.spec.ts`, `core.lot12.spec.ts` L21 et Seuil de douleur bas avec des bonus saisis, `tests/ui/modifiers.spec.tsx`), exemple de fiche (`tests/ui/import.spec.tsx`), champs d'arme (E25, Mots-clés d'arme, parcours mobile), dépenses de Vide (F3, consultation, Shiba 5 via `tests/helpers/void.ts`), et les clics « Lanceur de dés : masqué » devenus inutiles (ou inversés pour les parcours aux vrais dés). `core.rules.spec.ts` inchangé.
- **Nouveaux tests** : `tests/ui/lot20.spec.tsx` (Q1 à Q5, Q14, Q15), `tests/e2e/lot20.spec.ts` (Q4, Q19), Q1 dans `tests/e2e/mobile.spec.ts`, Q6 à Q13, Q16, Q17 dans les suites existantes.

### J.13 Points ouverts (à trancher par Nelson)

| # | Point | Défaut si non tranché |
|---|---|---|
| P-J1 | Panneau Vide : dépense par menu + bouton (deux gestes) | Défaut retenu (J.6) : choisir ne dépense jamais par erreur. Alternative : menu seul, la dépense ponctuelle demandant une confirmation. |
| P-J2 | Police d'Identité : quel élément t'a gêné (lecture ou Edit, valeurs, Initiative, Rang d'école) ? | Règle de J.2 appliquée à tout le bloc |
| P-J3 | Lanceur réaffiché une fois pour ceux qui l'avaient masqué (J.7) | Accepté |
| P-J4 | Escarmouche d'un shugenja : titre « Attaques » sur les armes et actions fixes | « Attaques » |

---

### Note : localisation reportée
L'ancienne annexe J (lot 20, français + anglais, `src/i18n`, tests I1 à I13, points P-J1 à P-J4 sur les langues) est retirée du plan le 30/10/2026. Si elle revient, elle repart de `handoff/handoff-lots-15-17.md` (lot 17 d'origine, projet claude.ai) avec de nouveaux numéros de lot, d'identifiants de test et de points ouverts.

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

## Annexe L — Lots 22 et 23 : liens vers le portail de campagne (v2.19.0, v2.20.0)

Statut : **validé par Nelson le 30/10/2026**. Lots 22 et 23 **livrés** (v2.19.0, écarts en L.6 ; v2.20.0, écarts en L.10). Source : `handoff-outlinks.md` (30/10/2026), intitulé « lots 21 et 22 » en v2.18.0 et v2.19.0 : renuméroté **lots 22 et 23**, **v2.19.0 et v2.20.0** (le lot 21 est le calcul d'Insight, v2.18.0, annexe K). Prototype de référence : `reference/prototype-outlinks.html` (sélecteurs Écran, Personnage, Thème, Largeur). En cas d'écart, le prototype fait foi pour le rendu, cette annexe pour le comportement.

Une PR et une version mineure par lot. Pas de changement de format de fiche (`schemaVersion` reste 2). Captures « avant » et « après » des vues touchées (bureau 1280 px et 390 px, clair et sombre) à chaque PR.

### L.0 Objet

Le Carnet renvoie vers le **portail de la campagne** du MJ (site statique sur GitHub Pages) :

| Page | Adresse |
|---|---|
| Portail | `https://vincenzorpg.github.io/L5R/index.html` |
| Forge de personnage | `…/createcharacter.html` (exporte un JSON compatible avec le Carnet) |
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

Un seul module porte toutes les adresses, pour qu'un changement d'URL du portail ne touche qu'un fichier : `PORTAL_BASE`, `PORTAL` (`home`, `forge`, `grimoire`, `combat`, `bushido`, `etiquette`), `clanUrl(clanId)` et `spellUrl(name)`.

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

- Les étapes : trois cases en ligne sur bureau, empilées sur mobile (numéro kanji à gauche).

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

### L.5 Tests du lot 22

| ID | Cas | Attendu |
|---|---|---|
| O1 | `clanUrl` pour les 11 clans | 8 adresses `clans/<slug>.html` ; `null` pour Araignée, Impériales, non reconnu |
| O2 | `spellUrl("Frappe de jade")`, `spellUrl("  ")` | `…grimoire.html?q=Frappe%20de%20jade` ; `…grimoire.html` |
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
- Sur chaque ligne de sort, bouton-lien icône seule (zone 44 × 44 px, icône externe 18 px, `--accent-ink`, survol `--accent-pale`) → `spellUrl(nom du sort)`, `aria-label` « <nom> dans le grimoire (nouvel onglet) ».
- Note sous la liste (`--muted`, 12 px) : « Chaque lien ouvre le grimoire avec le nom du sort en recherche. »
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
