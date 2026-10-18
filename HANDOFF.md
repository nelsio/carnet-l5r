# Carnet de Rokugan — Handoff pour implémentation

Compagnon de campagne pour joueurs de **L5R 4e édition** : fiche de personnage + aide aux jets Roll & Keep par situation.

Fait foi :
- pour l'UX, le rendu et la version mobile : le prototype validé `reference/prototype.html` ;
- pour l'architecture, les données et les règles : ce document.

**Ordre de lecture :** §1 Périmètre → §2 Architecture → §3 Données → §4 Moteur de règles → §5 Stockage → §6 Interface → §7 Mobile → §8 Import/export → §9 Distribution GitHub → §10 Tests → §11 Lots → §12 Points ouverts.

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
│  ├─ storage/    # LibraryStore : IndexedDB, fichiers, fichier lié
│  ├─ ui/         # composants React, thème CSS, hooks
│  └─ main.tsx
├─ tests/
│  ├─ core.rules.spec.ts      # fourni : spécification exécutable du moteur
│  ├─ ui/                     # Vitest + Testing Library
│  └─ e2e/                    # Playwright
├─ reference/     # prototype.html, exemple-personnage.json (ne pas modifier)
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

```ts
type TraitKey = "stamina"|"willpower"|"strength"|"perception"|"agility"|"intelligence"|"reflexes"|"awareness";
type RollTrait = TraitKey | "void";

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
- `maneuvers` vide ⇒ manœuvres par défaut des données de règles.
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
Préférences, dans un magasin séparé : thème, dernière fiche ouverte.

### 3.3 État non persisté
Restent en mémoire de l'onglet :
- l'historique des jets ;
- la posture ;
- les effets du round (Vide en armure, défense totale) ;
- le score d'initiative ;
- les manœuvres sélectionnées ;
- l'ouverture du panneau mobile.

---

## 4. Moteur de règles (`src/core`)

Toutes les fonctions sont pures. Le hasard est **injecté** (`rng: () => number`, entier 1..10) pour des tests déterministes. Notation : `XgY` à l'affichage, `XkY` accepté en saisie.

### 4.1 Fonctions exposées
| Fonction | Contrat |
|---|---|
| `rings(c)` | Terre = min(Constitution, Volonté) ; Eau = min(Force, Perception) ; Feu = min(Agilité, Intelligence) ; Air = min(Réflexes, Intuition) ; Vide = `voidRing`. |
| `findSkill(c, name)` | Comparaison normalisée : minuscules, sans accents, espaces rognés. |
| `parseDR(s)` | `"3k2"`/`"3g2"` → `{rolled:3, kept:2}` ; invalide → `{0,0}`. |
| `applyTenDiceRule(r, k)` | Si r > 10 : k += r − 10, r = 10. Puis si k > 10 : bonus = 2 × (k − 10), k = 10. Enfin k = min(k, r). Renvoie `{rolled, kept, bonus}`. |
| `computePool(c, action, mods)` | `{rolled, kept, bonus, explodes, canRaise, notes[]}` (§4.2). |
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
| `damage` | Force (ou `bowStrength` à distance) + VD lancés / VD gardés | oui | non |
| `initiative` | Rang + Réflexes / Réflexes | oui | non |

Modificateurs, appliqués dans cet ordre :
1. attaque en posture **Attaque totale** : +2g1 ;
2. dés lancés ± (saisis par le joueur, ou pré-remplis par les augmentations de dégâts) ;
3. **point de Vide** : +1g1 ;
4. règle des dix dés.

Le bonus fixe s'ajoute au total.

### 4.3 Lancer
Pour chaque dé :
1. tirer une valeur v ;
2. si la **spécialisation** est active, que la réserve est qualifiée et que v = 1 : retirer **une seule fois** ;
3. si la réserve explose : tant que le dernier tirage vaut 10, tirer à nouveau et additionner.

Ensuite : trier les dés par total décroissant et garder les `kept` premiers. Total = somme des dés gardés + bonus de la règle des dix dés + bonus fixe. Chaque dé expose `faces[]`, `total`, `rerolledOne` et `kept` ; `faces` ne contient pas le 1 écarté.

### 4.4 Blessures
- Seuils cumulés : Indemne jusqu'à Terre × 5, puis Terre × 2 de plus par niveau.
- Niveaux et pénalités : Indemne +0, Égratigné +3, Éraflé +5, Blessé +10, Gravement blessé +15, Estropié +20, À terre +40, Hors de combat (aucune action) ; au-delà du dernier seuil : **Mort**.
- Exemple Terre 2 : seuils `[10,14,18,22,26,30,34,38]`. 11 blessures → Égratigné ; 35 → Hors de combat ; 39 → Mort.

### 4.5 ND d'armure
- Base : 5 × Réflexes + 5 + bonus d'armure.
- Postures :
  - Attaque totale −10 ;
  - Défense + Air + rang de Défense ;
  - Défense totale + moitié (arrondie en dessous) du jet Défense (Réflexes) ;
  - Attaque et Centre +0.
- Vide en armure : +10 jusqu'au round suivant.

### 4.6 Points de Vide
Dépenses possibles : +1g1 à un jet ; +10 au ND d'armure pour le round ; compétence non maîtrisée jouée au rang 1 ; activation d'une capacité.

Chaque dépense décrémente `voidPoints` (jamais sous 0). Une seconde dépense dans le même round est permise, avec avertissement. « Nouveau round » efface les effets du round, mais pas l'initiative.

### 4.7 Données de règles (`src/rules/l5r4e.ts`)
Contenu initial = prototype :
- **Échelle des ND** : 5 Trivial, 10 Facile, 15 Moyen, 20 Difficile, 25 Très difficile, 30 Ardu, 40 Héroïque, 50 Légendaire.
- **Postures**.
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
| **Aide de jeu** | Comme le prototype (§6.2). |

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
  - onglets Fiche et Aide de jeu.
- **Barre d'état collante** :
  - piste des 8 niveaux de blessure, avec le niveau courant ;
  - compteur −/+ ;
  - pastilles de Vide cliquables ;
  - quatre **tuiles compactes** (petit libellé au-dessus, valeur en chiffres) : **Dépl.** (action libre / action simple, ex. « 10/20 pi »), **ND armure**, **Réduction**, **Pénalité** (bordure et chiffre rouges dès que la pénalité dépasse 0). Jamais une ligne de texte unique : elle serait tronquée sur mobile.
- **Fiche** :
  - Anneaux et Traits ;
  - identité et réputation ;
  - compétences avec leur réserve ;
  - armes avec les réserves d'attaque et de dégâts ;
  - techniques ;
  - manœuvres (coûts éditables) ;
  - avantages, désavantages, notes.

  Le bouton « Modifier la fiche » bascule en mode édition.
- **Aide de jeu** :
  - Enquête / Déplacement / Combat / **Statistiques**, avec en Combat les sous-types Escarmouche, Duel iaijutsu et Bataille ;
  - en Déplacement, un **encart « Se déplacer en combat »** en tête de liste : trois tuiles (action libre, action simple, maximum par round) en pieds et en mètres, calculées depuis l'Anneau d'Eau, avec un rappel « terrain difficile : distances divisées par deux » ;
  - en Escarmouche : carte **Initiative** en premier (elle affiche le score, et « Nouveau round » ne la réinitialise pas), puis Posture (sauf en Duel), puis le panneau Vide, puis les actions.
- **Lanceur** :
  - réserve en grand, et juste dessous la ligne **Min · Moy. · Max** (« Max 30+ » si la réserve explose) et la **chance de réussite** contre le ND final quand il y en a un. Elle se recalcule à chaque option (augmentations, Vide, spécialisation, bonus fixe) ;
  - ND de base selon l'action ;
  - augmentations libres et gratuites ;
  - dés ± et bonus fixe ;
  - cases Vide, Spécialisation (cochée automatiquement si elle correspond) et Vide-compétence ;
  - manœuvres, sur les attaques ;
  - nombre d'augmentations annoncées / maximum ;
  - ND final détaillé ;
  - dés obtenus (gardés mis en évidence, explosions marquées) ;
  - verdict, marge, augmentations possibles ;
  - historique des 6 derniers jets.
- **Statistiques** (écran pleine largeur, sans lanceur) : tableau de tous les jets du personnage. Colonnes : Jet, Réserve, Min, Moy., Max, puis chance de réussite contre ND 10, 15, 20, 25, 30 et 40.
  - Lignes : Initiative ; pour chaque arme, l'attaque puis les dégâts en sous-ligne (└) ; puis les compétences triées par nom.
  - Les jets sans ND (dégâts, initiative) affichent « sans ND » à la place des pourcentages.
  - Cellules teintées en vert proportionnellement à la chance de réussite.
  - Trois cases à cocher : « Avec un point de Vide », « Spécialisations appliquées » (cochée par défaut), « Pénalité de blessure actuelle » (cochée par défaut).
  - Mention : chaque augmentation ajoute +5 au ND, il suffit de lire une colonne plus à droite. Sur mobile, le tableau défile horizontalement dans son cadre.
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
| Navigation | Onglets Fiche / Aide de jeu dans une **barre fixe en bas**, deux boutons pleine largeur. Marge basse = hauteur de la barre + `env(safe-area-inset-bottom)`. Onglet actif sur fond d'accent pâle. |
| Barre d'état | Les quatre tuiles Dépl. / ND armure / Réduction / Pénalité occupent **toute la largeur sur 4 colonnes égales**, texte centré. **Résumé sur une ligne** (niveau de blessure, pénalité, `blessures / seuil max`), cliquable. Un appui déplie la piste complète en **2 rangées de 4**. En dessous : compteur −/+ (boutons 40 px) et pastilles de Vide (26 px), ND d'armure et pénalité. Bordure rouge si le personnage est blessé. |
| Lanceur | **Panneau glissant depuis le bas**, ouvert au choix d'une action (pas à l'ouverture de l'écran). Hauteur max 88 vh, défilement interne, fond assombri derrière. Poignée et bouton × en haut ; fermeture par ×, appui sur le fond ou Échap. Bouton « Lancer » **collé en bas** du panneau. Après un lancer, le résultat est amené à l'écran et le panneau reste ouvert. Changer une option ne remet pas le défilement du panneau à zéro. Le défilement de la page est bloqué pendant l'ouverture. |
| Situations | Rangées Enquête / Déplacement / Combat et sous-types en **défilement horizontal**, sans retour à la ligne. |
| Postures et Vide | Grille de 2 colonnes. |
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

### 10.1 Moteur (`tests/core.rules.spec.ts`) — fourni, 69 tests
- C'est la **spécification exécutable** du moteur. Elle a été validée contre une implémentation de référence : 69 tests sur 69 passent.
- L'agent implémente `src/core` jusqu'à ce que le fichier passe, **sans modifier les valeurs attendues**. Un désaccord se signale (§12), il ne se corrige pas.
- Couverture visée : 100 % des lignes de `src/core`.
- Personnage de référence : `reference/exemple-personnage.json` (Kakita Haruto).

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
| E6 | Escarmouche | Initiative en tête ; Attaque totale fait passer le ND d'armure de 20 à 10 ; « Nouveau round » garde l'initiative |
| E7 | Attaque réussie avec 2 « Augmentation des dégâts » | Dégâts pré-remplis à +2 dés |
| E8 | Thème forcé, puis rechargement | Le choix est conservé ; en auto, la page suit le système |
| E9 | Statistiques | Une ligne par compétence, attaque, dégâts et initiative ; cocher « point de Vide » augmente les réserves de +1g1 et les pourcentages |
| E10 | Lanceur : ajouter une augmentation | Le ND final monte de 5 et la chance de réussite baisse |

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

---

## 11. Plan de livraison (lots)

Chaque lot fait l'objet d'une PR, livrée avec ses tests verts.

1. **Socle** : Vite + React + TypeScript strict, ESLint, Vitest, `vite-plugin-singlefile`, workflow `ci.yml`.
2. **Moteur** : schéma Zod, migrations, données de règles, moteur → `core.rules.spec.ts` vert.
3. **Interface bureau** : portage du prototype en composants, thème, clans. Revue visuelle par comparaison avec `reference/prototype.html`.
4. **Mobile** : §7 → tests M1 à M8.
5. **Stockage** : bibliothèque IndexedDB, écran Bibliothèque, mode consultation → S1, S2, U1.
6. **Import / export** : fusion avec aperçu, trois destinations → U5, E3 à E5.
7. **Fichier lié** : File System Access, reprise de permission, conflits → S3 à S5, U6.
8. **Distribution** : `pages.yml`, `release.yml`, README joueur, premier tag `v1.0.0`.

---

## 12. Points ouverts

À trancher par Nelson. L'agent ne décide pas seul.

| # | Point | Défaut si non tranché |
|---|---|---|
| P1 | Dépôt **public ou privé** ? GitHub Pages est gratuit pour un dépôt public ; pour un dépôt privé, il faut un compte payant. Sans Pages, on peut distribuer uniquement le fichier de release. | Dépôt public (l'outil est public, les fiches restent chez chacun) |
| P2 | Règles à vérifier dans le livre 4e : coûts des manœuvres, effet de la Feinte, posture du Centre, limite d'un point de Vide par round, Concentration → augmentations en duel, table de bataille de masse, règle des dix dés, Hors de combat ou Mort | Valeurs du §4, éditables dans `src/rules/l5r4e.ts` |
| P3 | Récupération des points de Vide (repos, Méditation) | Saisie manuelle |
| P5 | Déplacement 4e : Eau × 5 (libre) / × 10 (simple) / × 20 (max par round), unité pieds ou mètres selon l'édition française | Valeurs actuelles, pieds + conversion en mètres |
| P4 | Nom du dépôt et de la page | `carnet-l5r` |
| P6 | **Tranché le 18/10/2026 (v1.0.0)** : les bonus de jet (annexe B) sont un champ **facultatif** du format v1 (`modifiers?`), sans incrémenter `schemaVersion`, la spécification fournie attendant `schemaVersion: 1`. Rétrocompatible : une fiche sans bonus est inchangée. | Décision retenue. Toute évolution du format **après** la v1.0.0 suit le §9.2 : `schemaVersion` 2, migration testée, et mise à jour de la spécification du moteur. |

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

Ajout demandé après le lot 7 : certaines techniques d'école, certains avantages et désavantages modifient les jets.

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
- **Portée** : `all` = jets de compétence et de trait ; `skill` = cette compétence ; `trait` = jets sur ce trait (compétence ou trait pur) ; `social` = compétences sociales (`SOCIAL_SKILLS` : Comédie, Courtoisie, Étiquette, Sincérité, Intimidation, Tentation, Représentation et ses spécialités) ; `attack` = attaques ; `damage` = dégâts ; `initiative` ; `armor` = ND d'armure ; `wounds` = pénalité de blessure (réduite de `flat`, jamais sous 0, toujours appliquée). Ni `armor` ni `wounds` ne concernent un jet.
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

