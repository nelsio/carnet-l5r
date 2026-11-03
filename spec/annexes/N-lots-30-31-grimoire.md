## Annexe N — Lots 30 et 31 : sorts depuis le grimoire du portail (v2.22.0, v2.23.0)

Statut : reçu le 30/10/2026, **accord de l'auteur du portail obtenu** (son dépôt n'a pas de licence : le Carnet lit ses données de sorts avec son accord, sans les inclure). Lots 30 et 31 **livrés** (v2.22.0, écarts en N.7 ; v2.23.0, écarts en N.10). Base `main` au commit `2d07fb6` (v2.21.4). Source : `handoff-sorts-grimoire.md` (30/10/2026), intitulé « lots 29 et 30 » : renuméroté **lots 30 et 31** (le lot 29 est le filtre d'élément des liens de sort, L.13) ; versions inchangées. Prototype : `reference/prototype-sorts-grimoire.html` (sélecteurs Grimoire au départ, Thème, Largeur ; 162 sorts réels sans descriptions, chargement simulé). En cas d'écart, le prototype fait foi pour le rendu, cette annexe pour le comportement.

| Lot | Version | Contenu |
|---|---|---|
| **30** | v2.22.0 | Chargement à la demande du grimoire, cache, conversion des sorts (N.1 à N.4) ; panneau **« Ajouter depuis le grimoire »** (N.5) |
| **31** | v2.23.0 | **Autocomplétion du champ Nom** d'un sort et remplissage, avec confirmation avant de remplacer des valeurs saisies (N.8) |

Pas de changement de format de fiche (`schemaVersion` reste 2) : les sorts ajoutés sont des sorts ordinaires.

### Lot 30 (v2.22.0)

#### N.1 Règle réseau

§1, ligne « Forme », passe de « aucune requête réseau » à :

> Aucune requête **automatique**. Une seule exception, **déclenchée par le joueur** : le chargement de la liste des sorts du grimoire du portail (bouton « Charger le grimoire » ou « Actualiser »). Rien n'est envoyé : lecture seule, sans cookie ni référent.

Le Carnet marche toujours hors ligne et en `file://` : sans grimoire chargé, on saisit les sorts à la main, comme aujourd'hui.

#### N.2 Source des données

Le grimoire n'expose pas de JSON. Ses sorts sont dans des fichiers JavaScript statiques, un par élément, de la forme :

```js
const SORTS_TERRE = [
  { id: "earth-1-armor-earth", name: "Armure de Terre (Armor of Earth)", element: "Terre", mastery: 1,
    keywords: ["Bataille", "Défense"], range: "Personnelle", area: "Le lanceur", duration: "10 Rounds",
    raises: "Durée (+2 rounds par Augmentation)", desc: "…" },
  // …
];
if (typeof window !== "undefined") { window.SORTS_TERRE = SORTS_TERRE; }
```

Dans `src/rules/portal.ts` :

```ts
/** Fichiers de sorts du grimoire lus par le Carnet. Jamais Mahō ni Kihō. */
export const GRIMOIRE_FILES = ["universels", "air", "terre", "feu", "eau", "vide"]
  .map((k) => `${PORTAL_BASE}data/sorts/sorts-${k}.js`);
```

**On ne charge jamais `sorts-maho.js` ni `sorts-kiho.js`** : le Mahō est protégé par le MJ sur le portail, et le Carnet ne gère pas les Kihō.

#### N.3 `src/core/grimoire.ts` (pur, testé, sans DOM ni réseau)

**Lecture sans exécution.** Le fichier est lu comme du **texte** et jamais exécuté : pas de `eval`, pas de `new Function`, pas de `<script>` injecté. On extrait le tableau littéral et on le lit avec **JSON5** :

```ts
import JSON5 from "json5"; // dépendance « json5 » 2.2.3 (MIT), testée sur les 6 fichiers

/** Tableau de sorts d'un fichier du grimoire ; lève GrimoireFormatError si introuvable ou illisible. */
export function parseGrimoireFile(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("];");
  if (start < 0 || end < start) throw new GrimoireFormatError("tableau introuvable");
  const data = JSON5.parse(text.slice(start, end + 1));
  if (!Array.isArray(data)) throw new GrimoireFormatError("pas un tableau");
  return data;
}
```

**Validation** (zod) de chaque entrée, champ par champ :

| Champ grimoire | Règle | Entrée rejetée si… |
|---|---|---|
| `id` | texte 1 à 80 | absent |
| `name` | texte 1 à 160 | absent |
| `element` | après normalisation (sans accents, minuscules) : `universel`, `air`, `terre`, `feu`, `eau`, `vide` | autre valeur (dont `maho`, `kiho`), ou `isMaho: true` |
| `mastery` | entier 1 à 6, ou `"Universel"` | hors bornes |
| `keywords` | liste de textes, facultative | — (textes > 40 car. ignorés) |
| `range`, `area`, `duration`, `raises` | textes facultatifs | — |
| `damage` | facultatif ; retenu seulement s'il respecte `^\s*\d+\s*[gk]\s*\d+\s*$` | — (ignoré sinon) |
| `damageNote` | texte facultatif ≤ 120 car. | — (ignoré sinon) |

Une entrée rejetée est ignorée, sans faire échouer le fichier. On ignore aussi les champs inconnus, dont `desc` : **la description du grimoire n'est jamais conservée**.

**Conversion** vers un sort du Carnet (`GrimoireSpell` = données prêtes à copier + infos d'affichage) :

```ts
export interface GrimoireSpell {
  gid: string;          // id du grimoire
  name: string;         // nom français
  nameAlt: string;      // nom anglais (affichage seulement), "" si absent
  element: SpellElement;
  mastery: number;      // 1 à 6
  keywords: string[];
  range: string; area: string; duration: string;
  raises: string;       // une augmentation par ligne
  damage?: string;      // « 2g2 », format du Carnet
  damageNote?: string;
}
```

| Champ du Carnet | Valeur |
|---|---|
| `name` | `name` du grimoire **sans** le nom anglais final entre parenthèses : « Frappe de Jade (Jade Strike) » → « Frappe de Jade » ; la parenthèse va dans `nameAlt` |
| `element` | `universel` → `all`, `air` → `air`, `terre` → `earth`, `feu` → `fire`, `eau` → `water`, `vide` → `void` (réciproque de `GRIMOIRE_ELEMENT`) |
| `mastery` | `"Universel"` → **1** ; sinon l'entier |
| `keywords` | tels quels |
| `range`, `area`, `duration` | tels quels, coupés aux limites du schéma (80, 120, 80) |
| `raises` | découpé sur les virgules **hors parenthèses** (`/,\s*(?![^()]*\))/`), une augmentation par ligne ; « Aucune » / « Aucun » → vide |
| `damage` | `formatDR(damage)` si présent et valide, sinon absent |
| `effect`, `memorized` | **jamais remplis** par le grimoire |

Exemple : `raises: "Durée (+2 rounds), Portée (+3 m / +10'), Cibles (+1, max 4 cibles au total)"` → trois lignes, la virgule entre parenthèses est gardée.

Fonctions exportées :
- `toCarnetSpell(g: GrimoireSpell): Spell` : `createSpell()` + champs ci-dessus. Si `damageNote` est présent et `damage` absent, l'effet vaut « VD : <damageNote> ».
- `searchGrimoire(list, query, element | "all-elements", limit?)` : filtre sur nom français **et** anglais, sans accents ni casse. Tri : nom français qui **commence** par la requête d'abord, puis maîtrise croissante, puis ordre alphabétique `fr`. Sans requête : ordre universels, Air, Terre, Feu, Eau, Vide, puis maîtrise, puis nom.
- `sameSpell(spell, g)` : vrai si les noms normalisés sont égaux, pour l'étiquette « déjà noté ».

#### N.4 Chargement et cache (`src/storage/grimoire.ts`)

**Chargement** : `loadGrimoire(): Promise<GrimoireCache>`.
- Les 6 fichiers sont chargés **en parallèle** avec `fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-cache" })`.
- Délai maximal de 15 s pour l'ensemble (`AbortController`). Un fichier de plus de 1 Mo est refusé.
- `res.ok` est obligatoire. Erreur réseau ou délai dépassé → `GrimoireOfflineError`.
- Chaque fichier passe par `parseGrimoireFile`, puis par la validation et la conversion.
- **Échec partiel** : si au moins un fichier est lu, le cache est gardé et l'interface signale « Grimoire incomplet (n fichiers sur 6) ». Si aucun fichier n'est lu, c'est une erreur.
- Taille actuelle : environ 110 Ko pour les 6 fichiers, 162 sorts.

**Cache** dans IndexedDB, store `prefs` existant, clé `grimoireCache` (pas de changement de `DB_VERSION`) :

```ts
interface GrimoireCache { v: 1; fetchedAt: string /* ISO */; source: string /* PORTAL_BASE */; files: number; spells: GrimoireSpell[] }
```

- Relu et revalidé au démarrage. S'il est invalide, ou si `source` diffère de `PORTAL_BASE`, il est ignoré.
- **Aucun rechargement automatique** : seul « Actualiser » recharge. Si l'actualisation échoue, l'ancien cache est gardé et un message le dit.
- Sans IndexedDB (mode mémoire, §5.1), le catalogue vit en mémoire pour la session.

**État dans l'interface** (contexte React ou store existant) : `status: "none" | "loading" | "ready" | "error"`, avec `fetchedAt`, `count`, `files` et `error`.

#### N.5 Panneau « Ajouter depuis le grimoire »

Visible seulement dans le bloc **Rouleaux & invocations en édition**, jamais en consultation.

**Barre d'outils du bloc** (sous la liste des sorts, là où sont aujourd'hui « + Sort » et « Ajouter les sorts universels ») :
1. « + Sort » (inchangé) ;
2. **nouveau** : « Ajouter depuis le grimoire », avec une icône de rouleau. Style `btn sm pri` quand il est fermé ; une fois ouvert, fond `--accent-pale` et bordure `--accent`. `aria-expanded` ;
3. « Ajouter les sorts universels » (inchangé). Quand le grimoire est prêt, les trois universels ajoutés sont **remplis** depuis le catalogue (Sentir, Communier, Invoquer : correspondance par début de nom). Sinon, comportement actuel ;
4. **à droite**, l'état du grimoire (12 px, `--muted`, point de couleur, `role="status"`) :

| État | Texte | Point |
|---|---|---|
| `none` | « Grimoire non chargé » | `--muted` |
| `loading` | « Chargement du grimoire… » + petit spinner | — |
| `ready` | « Grimoire du 30/10/2026 · 162 sorts · **Actualiser** » | `--ok` |
| `ready` partiel | « Grimoire incomplet (5 fichiers sur 6) · **Actualiser** » | `--warn` |
| `error` | « Grimoire injoignable · **Réessayer** » | `--danger` |

« Actualiser » et « Réessayer » sont des boutons-liens (`--accent-ink`, soulignés). Sur mobile, l'état passe sur sa propre ligne.

**Panneau** : `--surface-2`, bordure `--line`, ombre `--shadow` (élévation, annexe I.1 §7). Il est placé sous la barre d'outils sur bureau, et en **panneau glissant depuis le bas** sur mobile, comme le lanceur : poignée, voile `--scrim`, 88 % de hauteur maximum, × et Échap pour fermer. En-tête : pastille kanji 巻 (fond `--accent-pale`), titre « Ajouter depuis le grimoire », bouton × (`aria-label` « Fermer »).

Contenu selon l'état :
- **`none`** : texte « Pour proposer les sorts, le Carnet télécharge la liste du **grimoire de la campagne** (environ 110 Ko). Rien n'est envoyé, ta fiche reste dans ce navigateur. », bouton `pri` « Charger le grimoire », puis en petit : « La liste est gardée dans ce navigateur : elle reste disponible hors ligne. « Actualiser » la recharge. »
- **`loading`** : spinner et « Chargement du grimoire… ».
- **`error`** : encadré `role="alert"`, fond `--warn-pale`, kanji 待 en `--warn` : « **Le grimoire ne répond pas.** Vérifie ta connexion, puis réessaie. Tu peux toujours saisir le sort à la main avec « + Sort ». » et un bouton « Réessayer ».
- **`ready`** :
  - champ de recherche « Nom du sort » (`type="search"`, placeholder « ex. armure, éteindre, jade »), qui reçoit le focus à l'ouverture et après le chargement ;
  - pastilles d'élément (Tous, Universels, Air, Terre, Feu, Eau, Vide) avec un point à la couleur de l'Anneau (`--ring-*`, `--ring-all` pour les universels), `aria-pressed` ;
  - compteur `aria-live="polite"` : « 36 sorts », suivi de « · Ajouté : **Armure de Terre** » après un ajout ;
  - liste (`role="listbox"`, défilement interne de 320 px sur bureau), une ligne par sort (`role="option"`, ≥ 48 px) :
    - barre de 4 px à la couleur de l'élément ;
    - nom français en gras, nom anglais en petit `--muted` ;
    - sous le nom : « Terre · Maîtrise 1 · ND 10 · Bataille, Défense » ;
    - à droite : « + Ajouter » (`--accent-ink`) ou « déjà noté » (`--muted`, ligne `aria-disabled`, non cliquable) ;
  - **clavier** : ↑ ↓ déplacent l'option active (`aria-activedescendant`), Entrée ajoute, Échap ferme et rend le focus au bouton.

**Ajout** : `toCarnetSpell(g)` est ajouté **en fin de liste**, comme « + Sort ».
- **Bureau** : le panneau reste ouvert et le focus revient au champ de recherche, pour ajouter plusieurs sorts à la suite.
- **Mobile** : le panneau se ferme, et la page défile jusqu'au sort ajouté.
- Le sort ajouté porte, **jusqu'à la sortie du mode édition** (état d'interface, non sauvegardé) :
  - l'étiquette « ✓ Rempli depuis le grimoire » (`--ok` sur `--ok-pale`) ;
  - en `--muted` : « Résume l'effet ; ajoute la VD si le sort en a une. » (seulement si `damage` est absent) ;
  - un bref halo `--accent` (désactivé avec `prefers-reduced-motion`).

L'étiquette disparaît si le joueur modifie le nom.

#### N.5 bis Documentation du lot 30

- `docs/GUIDE.md`, « Rouleaux & invocations » : nouveau paragraphe « Ajouter depuis le grimoire » (chargement à la demande, cache, Actualiser, ce qui est rempli et ce qui reste à faire : effet, mémorisé, souvent la VD).
- `docs/CREDITS.md` : « Les caractéristiques des sorts proposées dans le Carnet viennent du grimoire du portail de la campagne (avec l'accord de son auteur) ; elles sont téléchargées par le joueur, pas incluses dans le Carnet. »
- `HANDOFF.md` : §1 (règle réseau, N.1), §6.1, annexe N, §11.
- `CHANGELOG.md` : v2.22.0.

#### N.6 Tests du lot 30

Préfixe **GR**.

| ID | Cas | Attendu |
|---|---|---|
| GR1 | `parseGrimoireFile` sur les 6 fichiers réels (copie figée dans `tests/fixtures/grimoire/`, descriptions remplacées par « … », N.7) | 162 sorts au total (3, 35, 36, 36, 25, 27) |
| GR2 | `parseGrimoireFile` sur un texte sans tableau, sur du JSON5 invalide | `GrimoireFormatError` |
| GR3 | Fichier contenant `alert(1)`, `fetch(…)` hors du tableau, ou une valeur `"</script><img onerror=…>"` dans un champ | aucun code exécuté (espion sur `window.alert`), valeur conservée comme texte et rendue comme texte |
| GR4 | Validation : `element: "Maho"`, `isMaho: true`, `element: "Kiho"`, `mastery: 7`, `name` absent | entrées ignorées, les autres gardées |
| GR5 | `toCarnetSpell` « Frappe de Jade (Jade Strike) », Terre, 1 | `name` « Frappe de Jade », `nameAlt` « Jade Strike », `element` `earth`, `mastery` 1 ; `effect` vide ; `memorized` faux |
| GR6 | Universel « Sentir les Kami (Sense) » | `element` `all`, `mastery` **1** |
| GR7 | `raises` avec virgule entre parenthèses ; `raises: "Aucune"` | 3 lignes, parenthèse intacte ; vide |
| GR8 | `damage: "3 k 3"`, `"3g3"`, `"Anneau g Anneau"` ; `damageNote` seul | `3g3`, `3g3`, ignoré ; effet « VD : … » |
| GR9 | `desc` présent dans la source | absent de `GrimoireSpell` et du cache |
| GR10 | `searchGrimoire("arm")` ; `("jade strike")` ; `("eteindre")` ; filtre Terre | « Armure de Terre » en tête ; trouvé par le nom anglais ; accents ignorés ; seulement des sorts `earth` |
| GR11 | `loadGrimoire` avec `fetch` simulé : 6 réponses OK ; 1 en 404 ; toutes en erreur ; délai > 15 s ; réponse de 2 Mo | 162 sorts, `files` 6 ; incomplet `files` 5 ; `GrimoireOfflineError` ; erreur de délai ; fichier refusé |
| GR12 | `fetch` appelé avec `credentials: "omit"`, `referrerPolicy: "no-referrer"`, et uniquement les 6 URL de `GRIMOIRE_FILES` | jamais `sorts-maho.js` ni `sorts-kiho.js` |
| GR13 | Cache : écrit après chargement, relu au démarrage ; cache corrompu ; `source` différente ; actualisation en échec | état `ready` sans réseau ; ignoré ; ignoré ; ancien cache gardé + message |
| GR14 | E2E, smoke « aucune requête réseau » | **toujours vert** : aucune requête au chargement, à l'ouverture du bloc ou du panneau tant qu'on ne clique pas sur « Charger » |
| GR15 | E2E (réseau intercepté par `page.route`, fixtures GR1) : ouvrir le panneau, Charger, chercher « armure », Entrée | sort ajouté en fin de liste, rempli (portée « Personnelle », zone « Le lanceur », durée « 10 Rounds », mots-clés, 1 augmentation), effet vide, étiquette « Rempli depuis le grimoire » |
| GR16 | Pastille « Universels » ; sort déjà noté | 3 résultats ; ligne `aria-disabled`, clic sans effet |
| GR17 | Clavier dans le panneau | ↑ ↓ Entrée ajoutent, Échap ferme, focus rendu au bouton |
| GR18 | Mobile 390 px | panneau en bas avec voile, fermeture après ajout, défilement vers le sort ; pas de défilement horizontal |
| GR19 | Hors ligne (`page.route` → `abort`) | état `error`, encadré `role="alert"`, « + Sort » utilisable |
| GR20 | « Ajouter les sorts universels » avec grimoire prêt | 3 sorts remplis (`element` `all`, maîtrise 1, portée et durée du grimoire) |
| GR21 | Consultation | ni bouton, ni panneau, ni état du grimoire |
| GR22 | **Manuel, avant merge** : build ouvert depuis GitHub Pages **et** en `file://`, clic sur « Charger » contre le vrai portail | 162 sorts chargés dans les deux cas (vérifie les en-têtes CORS de GitHub Pages) |

Contrastes : `--ok`, `--warn` et `--danger` sur `--surface-2` et sur les fonds pâles, vérifiés dans `tests/colors.spec.ts` (le handoff les disait couverts par « C5 » : ici, C5 est le Coup ciblé, annexe E). Le lint N8 doit rester vert.

#### N.7 Écarts de mise en œuvre (lot 30)

- **Fixtures** (`tests/fixtures/grimoire/`, GR1) : copie des 6 fichiers du 30/10/2026, mais chaque `desc` est remplacée par « … » : le texte de l'auteur n'entre pas dans le dépôt. GR9 s'appuie sur une entrée de test avec description.
- **Lecture** : `readGrimoireFile(text)` enchaîne `parseGrimoireFile`, la validation et la conversion (`toGrimoireSpell`, une entrée à la fois). Une expression JavaScript dans le tableau (`name: alert(1)`) rend le fichier illisible au lieu d'être évaluée (GR3). Nom coupé à 120 caractères (limite du schéma de fiche, le grimoire en permet 160).
- **Chargement** : `GrimoireOfflineError.reason` vaut `network`, `timeout` ou `unreadable` (aucun fichier en `res.ok` ou lisible). La limite de 1 Mo est vérifiée sur `content-length` puis sur le texte reçu. `json5` est en version exacte (`2.2.3`) dans `dependencies`.
- **Cache** : `Storage.grimoire` (`GrimoireCacheStore`, `get` et `set` du cache brut) ; IndexedDB : clé `grimoireCache` du store `prefs`, `DB_VERSION` inchangée ; mode mémoire : `MemoryGrimoireCache`. `readGrimoireCache(raw)` revalide (zod) et vérifie `source`. L'état d'interface vit dans `useGrimoire` (`src/ui/useGrimoire.ts`), exposé par le store (`Store.grimoire`).
- **Actualisation ratée** : l'état reste `ready` avec l'ancien catalogue ; la ligne d'état affiche « Actualisation impossible, grimoire du JJ/MM/AAAA gardé · **Réessayer** » (point `--warn`). Pendant une actualisation, l'état passe à `loading` (spinner dans le panneau), puis la liste revient.
- **Classes** : `btn sm pri` devient `btn sm accent` (bouton principal du Carnet) ; nouvelle classe `.btn.on` (fond `--accent-pale`, bordure `--accent`). Nouveau jeton **`--ring-all`** (clair `#7a6a3a`, sombre `#cdb67a`, valeurs du prototype) : il n'existait pas.
- **« Ajouter les sorts universels »** avec le grimoire prêt : les sorts prennent le nom du grimoire (« Sentir les Kami », « Communier avec les Kami », « Invoquer les Kami »), comme dans le prototype. Le bouton disparaît dès qu'un sort de la fiche **commence** par Sentir, Communier ou Invoquer (avant : nom identique).
- **Halo** : classe `fresh` sur le dernier sort rempli, jusqu'au prochain ajout ou la sortie du mode édition (l'animation ne joue qu'une fois).
- **Mobile** : même composant, en panneau fixe par CSS sous 720 px (`.g-scrim`, `.gpanel`, poignée), comme le menu Ressources ; `body.menu-open` bloque le défilement dessous.
- **GR22** : vérifié le 30/10/2026 contre le vrai portail, build ouvert en `file://` et servi en HTTP local (`vite preview`) : 162 sorts, requêtes sans cookie ni référent ; le portail répond `access-control-allow-origin: *`. Reste un clic de contrôle sur la page GitHub Pages publiée.
- **Tests** : `tests/core.grimoire.spec.ts` (GR1 à GR10), `tests/storage/grimoire.spec.ts` (GR11 à GR13), `tests/ui/grimoire.spec.tsx` (GR3 au rendu, GR13, GR15 à GR17, GR19 à GR21, étiquette retirée au changement de nom), `tests/e2e/grimoire.spec.ts` (GR14, GR15 avec rechargement, GR18, GR19). Le smoke « aucune requête réseau » et O10 restent verts sans modification. `tests/colors.spec.ts` : `--ok` sur `--ok-pale`, `--ok`, `--warn`, `--danger` et `--muted` sur `--surface-2` (≥ 4,5:1, n'étaient pas testés), `--ring-all` sur les surfaces (≥ 3:1).

### Lot 31 (v2.23.0)

#### N.8 Autocomplétion du champ Nom

Dans l'éditeur d'un sort (bloc en édition), le champ **Nom** devient une **liste déroulante d'autocomplétion** quand le grimoire est prêt.

**Grimoire non prêt** : sous la ligne Nom / Élément / Maîtrise, une ligne `--muted` en 12 px : « Autocomplétion depuis le grimoire : **charger le grimoire** » (ou « **réessayer** » en état `error`). Le lien lance `loadGrimoire()` sans ouvrir le panneau. En `loading`, la ligne affiche « Chargement… ».

**Grimoire prêt** :
- `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` ;
- placeholder « Tape pour chercher dans le grimoire » si le nom est vide ; icône loupe 18 px à droite du champ (décorative) ;
- **à partir de 2 caractères**, liste de **8 suggestions au plus** sous le champ (`--surface-2`, `--shadow`, 280 px max, défilement interne) avec `searchGrimoire(valeur, tous éléments, 8)` ;
- une ligne par suggestion, comme dans le panneau (barre de couleur, nom FR + EN, élément · maîtrise · ND · mots-clés), sans « + Ajouter » ;
- pied de liste : « Entrée ou clic : remplit le sort (sauf effet et mémorisé) » ;
- ↑ ↓ pour choisir, Entrée ou clic pour sélectionner, Échap ou perte du focus pour fermer. Taper ferme la liste quand il n'y a plus de résultat ;
- la saisie libre reste possible : un nom qui n'est pas dans le grimoire est accepté tel quel.

**Sélection d'une suggestion `g`** pour le sort `s` :

1. **Toujours remplacés** : `name`, `element`, `mastery` (ils définissent le sort choisi).
2. **Champs comparés** : `range`, `area`, `duration`, `raises`, `keywords` (comparaison sans accents ni casse, liste jointe pour les mots-clés), et `damage` si le grimoire en fournit un.
   - Si aucun de ces champs n'est **déjà rempli avec une valeur différente**, tout est rempli directement.
   - Sinon, une **confirmation intégrée** s'affiche en haut du sort (`role="alertdialog"`, `--surface-2`, bordure `--accent`) :
     - « **« Frappe de Jade »** : des valeurs déjà saisies seraient remplacées. » ;
     - la liste des différences, une par ligne : « Portée : « 30 m » → « 30 mètres (100') » » (les retours à la ligne des augmentations sont affichés comme « · ») ;
     - trois boutons : **« Remplacer »** (`pri`, focus initial) remplit tout ; **« Compléter les vides »** remplit seulement les champs vides (plus nom, élément et maîtrise) ; **« Annuler »** ne change rien, nom compris.
3. **Jamais touchés** : `effect`, `memorized`. Exception : `damageNote` remplit l'effet **seulement s'il est vide** (« VD : … »).
4. Le sort reçoit l'étiquette « ✓ Rempli depuis le grimoire » (N.5) et le halo.

Le lien vers le grimoire du sort (lot 29, L.13) suit immédiatement le nouveau nom et le nouvel élément.

#### N.8 bis Documentation du lot 31

- `docs/GUIDE.md` : l'autocomplétion du nom, et la confirmation avant remplacement.
- `CHANGELOG.md` : v2.23.0.

#### N.9 Tests du lot 31

| ID | Cas | Attendu |
|---|---|---|
| GR23 | Grimoire non chargé, éditeur d'un sort | ligne « charger le grimoire » ; le clic charge sans ouvrir le panneau ; puis le champ devient un combobox |
| GR24 | Taper « f » puis « fr » | rien à 1 caractère ; 8 suggestions au plus à 2 caractères, `aria-expanded` vrai |
| GR25 | Nouveau sort (« + Sort »), taper « armu », Entrée | sort rempli comme GR15, sans confirmation |
| GR26 | Sort « Frappe de jade » (portée « 30 m », VD 2g2, effet, mémorisé), choisir « Frappe de Jade » | confirmation listant Portée (et VD si le grimoire en fournit une) |
| GR27 | GR26 puis « Remplacer » / « Compléter les vides » / « Annuler » | portée remplacée / portée gardée, zone et augmentations remplies / rien changé ; dans les trois cas, effet et mémorisé intacts |
| GR28 | Clavier : ↑ ↓ Entrée Échap ; clic hors du champ | sélection et fermeture correctes ; liste fermée |
| GR29 | Nom libre absent du grimoire | accepté, aucune suggestion, aucune confirmation |
| GR30 | Après remplissage | lien du sort vers `grimoire.html?q=Frappe%20de%20Jade&el=terre` |
| GR31 | Mobile 390 px | suggestions lisibles, pas de défilement horizontal, cibles ≥ 44 px |
| GR32 | Consultation | champ Nom non éditable, pas d'autocomplétion |

#### N.10 Écarts de mise en œuvre (lot 31)

- **Moteur** (`src/core/grimoire.ts`) : `grimoireConflicts(spell, g)` rend les différences (`GrimoireDiff` : champ, valeur saisie, valeur du grimoire, sur une ligne) ; `fillFromGrimoire(spell, g, "all" | "empty")` rend le sort rempli. Comparaison avec `normalize` (sans accents ni casse, espaces réduits) ; VD comparée au format du Carnet (`formatDR` : « 2k2 » = « 2g2 »).
- **Champ vide dans le grimoire** (pas d'augmentation, pas de mot-clé, pas de VD) : ni comparé ni rempli, même avec « Remplacer ». Le prototype proposait de remplacer la valeur saisie par « vide » ; le Carnet n'efface jamais une saisie avec un blanc.
- **« VD : … »** dans l'effet vide : seulement si le grimoire n'a pas de VD au format `2g2`, comme `toCarnetSpell` (N.3).
- **Disposition** : Nom, Élément et Maîtrise passent sur leur propre ligne (`.spellhead`, colonnes `2fr 1fr 110px` comme le prototype ; sur mobile, Nom sur toute la largeur, Élément et Maîtrise côte à côte), puis la ligne « Autocomplétion depuis le grimoire », puis VD, Portée, Zone et Durée. Avant, les sept champs partageaient une seule grille.
- **Liste** : `z-index` 4, sous la barre d'état collante (5) et les onglets mobiles. Sur bureau, la liste fait au moins 420 px de large (le champ Nom est plus étroit) ; sur mobile, la largeur du champ. Le pied « Entrée ou clic : remplit le sort (sauf effet et mémorisé) » est hors du `listbox`. ↓ sur un nom déjà saisi ouvre la liste sans retaper ; Entrée sans liste ouverte ne fait rien.
- **Chargement** : la ligne affiche « Chargement… » ; « réessayer » en état `error`. Le bouton « Remplacer » est `btn sm accent` (bouton principal du Carnet, N.7).
- **Confirmation** : Échap vaut « Annuler » ; après un choix, le focus revient au champ Nom. Sortir du mode édition ferme la confirmation.
- **Tests** : `tests/core.grimoire.spec.ts` (comparaison et remplissage, GR26 et GR27 côté moteur), `tests/ui/grimoire-name.spec.tsx` (GR23 à GR30, GR32), `tests/e2e/grimoire.spec.ts` (GR25 dans le build, GR31). GR26 avec la Frappe de jade de Tamori : la confirmation liste aussi les mots-clés (« Jade » → « Jade, Tonnerre ») ; le grimoire ne donne pas de VD pour ce sort.

---

