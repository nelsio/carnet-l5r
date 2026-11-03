## Annexe M — Lots 24 et 25 : README allégé, liens vers le guide et le dépôt (v2.20.2, v2.21.0)

Statut : reçu le 30/10/2026. Lot 24 **livré** (v2.20.2, écarts en M.2) ; lot 25 **livré** (v2.21.0, écarts en M.4). Base `main` au commit `58b4a19` (v2.20.1). Source : `handoff-readme-liens.md` (30/10/2026), intitulé « lot 1 » et « lot 2 » : renuméroté **lots 24 et 25**. Fichiers de référence déjà en place : `README.md` (nouveau README, tel quel), `docs/GUIDE.md`, `docs/CREDITS.md`, `scripts/screenshots.mjs` (testé sur le build v2.20.1). Prototype du lot 25 : `reference/prototype-liens.html` (éléments nouveaux entourés en pointillés rouges). En cas d'écart, le prototype fait foi pour le rendu, cette annexe pour le comportement.

Une PR et une version par lot, dans cet ordre (le lot 25 pointe vers `docs/GUIDE.md`, créé par le lot 24).

### M.1 Lot 24 : README court, guide et crédits dans `docs/` (v2.20.2)

L'ancien README faisait environ 4 000 mots : c'était un mode d'emploi complet. Il devient une page d'accueil courte (≈ 540 mots) avec trois captures en thème sombre ; le mode d'emploi passe dans `docs/GUIDE.md`.

1. `README.md` : remplacé par la référence.
2. `docs/GUIDE.md` : ancien README § 1 à 11, sans les marqueurs de version « (v2.x) » ni la phrase sur le réglage `× 3` à `× 5` masqué. Ancres internes inchangées.
3. `docs/CREDITS.md` : ancien README § 12 et 13 (licences, polices, crédits), chemins relatifs corrigés (`../LICENSE`, `../src/ui/fonts/LICENSES.md`).
4. Captures, reproductibles :
   - `scripts/screenshots.mjs` et le script npm `"screenshots": "node scripts/screenshots.mjs"` ;
   - `sharp` en devDependency (`0.33.5`, version testée) ;
   - `npm run build && npm run screenshots`, puis committer `docs/img/fiche.png`, `docs/img/combat.png`, `docs/img/mobile.png` (≈ 350 Ko au total) ;
   - données : modèles intégrés uniquement (Kakita Haruto, Tamori Ayane). Thème sombre partout ;
   - le script n'entre **pas** dans la CI : on le relance à la main quand l'interface change visiblement.
5. Renvois au README :
   - §9.3 : le guide joueur est `docs/GUIDE.md`. Le README reste une vitrine : présentation, captures, démarrage. Règle pour les lots suivants : **chaque lot met à jour `docs/GUIDE.md`**. Il ne touche au README que si une fonction listée dans « Ce que fait le Carnet » change, et relance les captures si l'écran capturé change ;
   - ligne des polices (« à citer dans le README ») → `docs/CREDITS.md` ;
   - `CONTRIBUTING.md` : aucun lien vers une ancre de l'ancien README (`README.md#…`) ; les rediriger vers `docs/GUIDE.md#…`.
6. `CHANGELOG.md` : entrée v2.20.2, « Documentation : README raccourci avec captures, guide détaillé dans docs/GUIDE.md, crédits dans docs/CREDITS.md ».

**Tests**
- `npm run lint` passe, script compris.
- Tous les liens relatifs des trois fichiers résolvent (vérification manuelle ou `markdown-link-check` en local, sans l'ajouter au projet).
- Rendu GitHub de la PR : les trois images s'affichent, le triptyque mobile a ses espaces transparents.
- Aucune modification de `src/`.

### M.2 Écarts de mise en œuvre (lot 24)

- **`CONTRIBUTING.md` inchangé** : son seul lien vers une ancre du README (`README.md#développement`) vise la section Développement, restée dans le nouveau README. Le renvoi à la procédure « Publier une version » reste juste (paragraphe de cette section).
- **Arborescence (§2)** : ajout de `docs/` et `scripts/` ; le README y devient la vitrine.
- **`sharp`** : `^0.33.5` (même convention `^` que les autres devDependencies). Son script d'installation n'est qu'une vérification : les binaires viennent des paquets `@img/sharp-*`.
- **Captures** : générées sur le build v2.20.2, ≈ 370 Ko au total (fiche 92 Ko, combat 97 Ko, mobile 182 Ko).

### M.3 Lot 25 : liens vers le guide et le dépôt dans l'application (v2.21.0)

**Adresses** (une seule constante, par ex. `src/ui/links.ts`, à côté des adresses du portail) :

```ts
const REPO = "https://github.com/nelsio/carnet-l5r";
export const CARNET_LINKS = {
  guide: `${REPO}/blob/main/docs/GUIDE.md`,
  releases: `${REPO}/releases`,
  bug: `${REPO}/issues/new`,
  code: REPO,
};
```

1. **Menu Ressources** (torii) : nouvelle section en dernier, titre « Le Carnet » suivi de la version (`v2.21.0`, lue dans la constante de version existante, pas de doublon). Quatre entrées au format des autres, avec un kanji sur fond sceau (`--seal` / `--seal-ink`) pour les distinguer des liens du portail :
   - 帳 **Guide d'utilisation** · « Import, fiches, lanceur de dés » → `guide`
   - 新 **Nouveautés** · « Ce qui a changé à chaque version » → `releases`
   - 報 **Signaler un problème** · « Formulaire GitHub (compte requis) » → `bug`
   - 源 **Page du projet** · « Présentation, captures, code source » → `code` (la page du dépôt affiche le README : pas de lien README séparé)

   Pied du menu : « Liens externes : s'ouvrent dans un nouvel onglet. »
2. **Pied de page** sur tous les écrans (Bibliothèque, Fiche, Aide de jeu, Statistiques), après le contenu :
   - à gauche : mini-sceau 帳, « Carnet de Rokugan », puis `v2.21.0` (lien → `releases`, souligné en pointillés, chiffres tabulaires) ;
   - à droite : Guide · Signaler un bug · Projet ;
   - **mobile (≤ 720 px)** : les liens passent sous le nom (les trois restent visibles), et le pied de page reste au-dessus de la barre d'onglets du bas (pas de chevauchement).
3. **Bibliothèque vide** : sous les deux options de départ, une ligne « Première visite ? Lire le guide » → `guide`.
4. Tous ces liens suivent les règles communes de L.0 : `target="_blank" rel="noopener noreferrer"`, icône de lien externe existante. Le Carnet ne fait toujours **aucun appel réseau** de lui-même.
5. `docs/GUIDE.md`, section « Portail de la campagne » : une phrase sur la section « Le Carnet » du menu et le pied de page.
6. `CHANGELOG.md` : entrée v2.21.0.

**Tests**
- Unitaires : `CARNET_LINKS` contient exactement les quatre adresses ci-dessus.
- E2E (`portal.spec.ts` ou nouveau `carnet-links.spec.ts`) :
  - le menu Ressources affiche la section « Le Carnet » avec la version de `package.json` et les quatre liens (bonnes `href`, `target="_blank"`, `rel` complet) ;
  - le pied de page est présent sur les quatre écrans ; sur mobile 390 px, pas de défilement horizontal, les trois liens visibles, pied de page non recouvert par la barre d'onglets ;
  - Bibliothèque vide : lien « Lire le guide » présent ;
  - le test « aucune requête réseau » du smoke reste vert.
- Thèmes clair et sombre : contraste des liens du pied de page et du badge de version (tests de couleurs existants).
- Si les captures du README changent visiblement (pied de page visible sur la capture bureau), relancer `npm run screenshots` et committer les images.

### M.4 Écarts de mise en œuvre (lot 25)

- **Adresses** : `src/rules/links.ts`, à côté de `src/rules/portal.ts` (les adresses du portail sont dans `src/rules`, pas `src/ui`).
- **Menu Ressources** : groupe `role="group"` « Le Carnet » (classe `.res-carnet`), version lue dans `__APP_VERSION__`. Le pied du menu (« Liens externes : s'ouvrent dans un nouvel onglet. ») remplace l'ancien « Site de la campagne. S'ouvre dans un nouvel onglet. », devenu inexact avec les liens GitHub. Le menu compte 11 entrées avec une fiche d'un Grand Clan, 10 sinon (O4 et O10 mis à jour).
- **Pied de page** : composant `AppFooter`, qui remplace l'ancien `footer.version` centré. L'état d'enregistrement (« Enregistré dans ce navigateur », échec d'enregistrement) y reste, entre la version et les liens. La note « Règles de référence » reste au-dessus (jusqu'à la v2.26.1 : depuis la v2.26.2, elle se déplie depuis la pastille **Règles L5R 4e**, placée entre la version et l'état d'enregistrement, annexe R).
- **Lien de version** : sans icône externe, comme dans le prototype (souligné en pointillés) ; son nom accessible le complète : « Version 2.21.0 : nouveautés (nouvel onglet) ». Les trois autres liens ont l'icône.
- **Mobile** : le pied de page reste au-dessus de la barre d'onglets grâce au `padding-bottom` existant du `body` (§7) ; pas de règle en plus.
- **Captures du README** : inchangées. La capture bureau montre le haut de la fiche, sans le pied de page.
- **Tests** : `tests/ui/carnet-links.spec.tsx` (V1 à V4), `tests/e2e/carnet-links.spec.ts` (V5 à V7), `tests/colors.spec.ts` (V8 : badge de version `--accent-ink` sur `--bg` dans les deux thèmes, pour chaque clan ; kanji du sceau). `tests/ui/app.spec.tsx` attend désormais le pied de page par son rôle (`contentinfo`).

| Cas | Vérifie |
|---|---|
| V1 | `CARNET_LINKS` contient exactement les quatre adresses |
| V2 | Section « Le Carnet » en dernier dans le menu : version de `package.json`, quatre liens sur fond sceau, `target`, `rel`, icône externe |
| V3 | Pied de page sur la Bibliothèque (vide et avec fiches), la Fiche, l'Aide de jeu et les Statistiques ; état d'enregistrement dans le pied |
| V4 | Bibliothèque vide : « Première visite ? Lire le guide » sous les deux options |
| V5 | Navigateur : section « Le Carnet », version de `package.json`, `href`, `target`, `rel` complet |
| V6 | Navigateur : pied de page sur les quatre écrans, lien « Lire le guide » |
| V7 | 390 px : pas de défilement horizontal, trois liens visibles sous le nom, pied non recouvert par la barre d'onglets |
| V8 | Contrastes ≥ 4,5:1 : badge de version sur fond (deux thèmes, tous les clans), kanji du sceau |

### M.5 Lot 28 : sécurité, `sharp` 0.35.5 (v2.21.3)

Trois alertes Dependabot hautes visaient `sharp` 0.33.5 (failles de libvips, libheif et librsvg, corrigées en 0.35.0, 0.35.4 et 0.35.5).

- **`sharp`** : `^0.33.5` → `^0.35.5` (devDependency, voir M.1 et M.2). Il ne sert qu'à `scripts/screenshots.mjs` et n'entre pas dans le build : aucun effet sur l'application livrée.
- **Vérification** : `npm run build && npm run screenshots` produit les trois captures sans erreur ; `npm run lint` passe ; `npm audit` ne signale plus rien.
- **Captures du README** : inchangées (le lot ne touche pas à l'interface).

