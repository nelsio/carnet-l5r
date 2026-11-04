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

