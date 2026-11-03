## Annexe O — Lots 32 à 37 : diffusion (v2.23.1, v2.23.2, v2.24.0, v2.24.1, v2.25.1)

Statut : reçu le 31/10/2026. Base `main` au commit `ee359dd` (v2.23.0). Source : `handoff-diffusion.md` (31/10/2026). Une PR et une version par lot, dans l'ordre. Le lot 32 ne dépend de rien. Le lot 33 attend **P11**, le lot 34 attend **P12** : sans réponse, ne pas les commencer. P13 (mesure de fréquentation, `handoff-tracking.md`) est ajouté au §12 en même temps ; tranché le 31/10/2026 : lot 35, annexe O.5.

### O.0 Constat

Déjà en place, **à ne pas refaire** : README vitrine avec captures, `docs/GUIDE.md`, licence MIT, mention « outil de fan non officiel », `CREDITS.md`, modèles d'issue, `CONTRIBUTING.md`, modèles de personnage, lien « Première visite ? Lire le guide », fichier hors ligne en release, pied de page et menu « Le Carnet ».

Ce qui freine encore un groupe qui ne connaît pas le Carnet :

1. **Le lien partagé est nu.** Collé sur Discord, WhatsApp ou un forum, `nelsio.github.io/carnet-l5r/` ne montre ni titre propre, ni description, ni image.
2. **Le vocabulaire suppose notre campagne.** « Découvrir la campagne », « Portail de la campagne », « grimoire de la campagne », « dossier Drive de la campagne » : un autre groupe croit que ce site est celui de son MJ.
3. **Hors ligne depuis l'adresse web.** À table avec un mauvais réseau, l'adresse Pages ne s'ouvre pas sans connexion. Seul le fichier de release marche hors ligne, et personne ne le télécharge.

### O.1 Lot 32 : aperçu de lien (v2.23.1)

Aucun changement d'interface, aucune requête ajoutée. Les balises `meta` ne sont jamais chargées par le navigateur : seuls les robots de Discord, WhatsApp, etc. lisent l'image.

1. **`index.html`**, dans `<head>`, après `<title>` :

   ```html
   <meta name="description" content="Fiche de personnage et jets Roll & Keep pour La Légende des Cinq Anneaux, 4e édition. Gratuit, sans compte, rien n'est envoyé." />
   <meta property="og:type" content="website" />
   <meta property="og:site_name" content="Carnet de Rokugan" />
   <meta property="og:title" content="Carnet de Rokugan · compagnon L5R 4e" />
   <meta property="og:description" content="Ta fiche de personnage et les jets Roll & Keep prêts à lancer selon la situation. Gratuit, sans compte, tes fiches restent dans ton navigateur." />
   <meta property="og:url" content="https://nelsio.github.io/carnet-l5r/" />
   <meta property="og:image" content="https://nelsio.github.io/carnet-l5r/og.png" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   <meta property="og:image:alt" content="Fiche de personnage du Carnet de Rokugan en thème sombre" />
   <meta property="og:locale" content="fr_FR" />
   <meta name="twitter:card" content="summary_large_image" />
   ```

   Adresses absolues : elles restent justes dans le fichier de release ouvert en `file://`.

2. **Image `docs/img/og.png`**, 1200 × 630, < 300 Ko :
   - générée par `scripts/screenshots.mjs` (quatrième capture), thème sombre, modèle intégré (Kakita Haruto), haut de la fiche ;
   - viewport 1200 × 630, `deviceScaleFactor: 1` (taille exacte attendue par les robots), PNG compressé avec `sharp` comme les autres ;
   - lisible en vignette : si le texte est trop petit, cadrer sur l'en-tête et les Anneaux plutôt que réduire.

3. **`pages.yml`** : après la copie de `index.html`, ajouter `cp docs/img/og.png site/og.png`. L'image n'entre pas dans le fichier unique.

4. `CHANGELOG.md` : entrée v2.23.1, rubrique « Modifié » : « Aperçu du lien (titre, description, image) quand on partage l'adresse du Carnet. »

5. §9.1 : ligne `pages.yml` complétée (« publie aussi `og.png` »). Pas de mise à jour du guide (rien de visible dans l'application).

**Tests**

| Cas | Vérifie |
|---|---|
| W1 | Unitaire (lecture de `dist/carnet-l5r.html` après build, ou de `index.html`) : les 12 balises ci-dessus présentes, `og:image` et `og:url` en `https://nelsio.github.io/carnet-l5r/` |
| W2 | `docs/img/og.png` existe, fait exactement 1200 × 630 (lu avec `sharp` dans un test Vitest, ou vérifié dans le script) |
| W3 | Smoke E2E « aucune requête réseau » : toujours vert, sans modification |
| W4 | Après déploiement, manuel : l'aperçu s'affiche sur le [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/) ou en collant le lien dans Discord |

### Hors code, à faire par Nelson (réglages du dépôt)

Pas dans la PR. Avec `gh` :

```sh
gh repo edit nelsio/carnet-l5r \
  --description "Compagnon de jeu pour La Légende des Cinq Anneaux 4e : fiche de personnage et jets Roll & Keep. Gratuit, sans compte." \
  --homepage "https://nelsio.github.io/carnet-l5r/" \
  --add-topic l5r --add-topic legend-of-the-five-rings --add-topic ttrpg \
  --add-topic jdr --add-topic character-sheet --add-topic dice-roller --add-topic french
```

Puis dans **Settings → General → Social preview** : téléverser `docs/img/og.png` (carte affichée quand on partage le lien du dépôt GitHub lui-même ; non réglable en ligne de commande).

#### O.1 bis Écarts de mise en œuvre (lot 32)

- **Capture** : `scripts/screenshots.mjs` ouvre un quatrième contexte 1200 × 630 à l'échelle 1, choisit Kakita Haruto puis remonte en haut de la page (le choix du modèle fait défiler). L'image montre l'en-tête, la barre d'état et les Anneaux, lisibles sans recadrage ; ≈ 36 Ko.
- **W2** : dimensions lues dans l'en-tête PNG (`tests/og.spec.ts`), sans charger `sharp` dans Vitest. W1 lit `index.html` (les balises passent telles quelles dans le build).
- **W4** : à faire après déploiement (Sharing Debugger ou Discord). Réglages du dépôt (description, sujets, Social preview) : hors PR, à faire par Nelson.

### O.2 Lot 37 (ancien lot 33) : portail sans « campagne » (v2.25.1)

**Repris le 01/11/2026 (P11)** : voir O.2 bis, qui fait foi pour le nom et les libellés. La v2.23.2 a servi au menu Ressources.

Le portail de Vincenzo sert de ressource commune, pas de site du MJ de chaque groupe. Le mot « campagne » reste là où il désigne **la campagne du joueur** (« Notes de campagne », « Compagnon de campagne »).

1. **Textes de l'interface** (libellé proposé ; nom exact selon P11) :

   | Fichier | Avant | Après |
   |---|---|---|
   | `Library.tsx` | Découvrir la campagne | Découvrir le jeu sur le portail L5R |
   | `ResourcesMenu.tsx` | groupe « Campagne » | groupe « Portail L5R » |
   | `ResourcesMenu.tsx` | Portail de la campagne · Clans, règles, aides de jeu | Portail L5R · Clans, règles, aides de jeu |
   | `ResourcesMenu.tsx` | `aria-label` « Ressources de la campagne » | « Ressources L5R » |
   | `Grimoire.tsx` | grimoire de la campagne | grimoire du portail L5R |
   | `FileActions.tsx` | le dossier Drive de la campagne, par exemple | le dossier partagé de ton groupe (Drive, Dropbox…), par exemple |

   Faire un `grep -rni "campagne" src docs README.md` et traiter chaque occurrence restante selon la règle ci-dessus. Les commentaires de code peuvent suivre, sans obligation.

2. **`docs/GUIDE.md`** :
   - section « Portail de la campagne » → « Portail L5R » ; mettre à jour toutes les ancres qui y pointent (`#portail-de-la-campagne`, guide et README) ;
   - en tête de cette section, une phrase : « Le portail L5R est un site de fan indépendant (catalogues, Forge de personnage, grimoire), utilisable par n'importe quel groupe. Ce n'est pas forcément le site de ton MJ. » ;
   - « dossier Drive de la campagne » → « dossier partagé de ton groupe ».
3. **`README.md`** : « dossier Drive de la campagne » → « dossier partagé de ton groupe ». Rien d'autre.
4. **`docs/CREDITS.md`** : une ligne « Portail L5R : [vincenzorpg.github.io/L5R](https://vincenzorpg.github.io/L5R/), site de fan, utilisé pour les liens et la lecture du grimoire. » (forme exacte selon P11).
5. `CHANGELOG.md` : entrée v2.23.2, « Modifié : le portail L5R n'est plus présenté comme le site de ta campagne. »

**Tests**
- Mettre à jour les tests qui cherchent les anciens libellés : `tests/ui/portal.spec.tsx` (menu, « Découvrir… »), `tests/ui/carnet-links.spec.tsx`, `tests/e2e/portal.spec.ts`, `tests/e2e/carnet-links.spec.ts`.
- W5 : aucun texte affiché par l'application ne contient « de la campagne » (test UI : rendu de la Bibliothèque vide, du menu Ressources et du panneau grimoire, recherche sur `textContent`). « Notes de campagne » et « Compagnon de campagne » restent autorisés.
- Les liens internes du guide et du README résolvent tous (vérification locale, comme en M.1).
- Captures du README : inchangées (aucun de ces textes n'y apparaît).

#### O.2 bis Écarts de mise en œuvre (lot 37)

Source : `handoff-diffusion.md`, mis à jour le 01/11/2026.

- **Numéros** : le handoff prévoyait lot 33 et v2.23.2, déjà prise par le menu Ressources. Le lot 36 étant livré, ce lot devient le 37, en v2.25.1.
- **Nom** : `PORTAL_NAME` et `PORTAL_NAME_OF` (`src/rules/portal.ts`), celui-ci pour « grimoire des Chroniques de Rokugan ». Le handoff impose « chroniques » en minuscule ; le site écrit « Les Chroniques de Rokugan ».
- **Menu Ressources** : le titre de l'entrée est `PORTAL_NAME`, sous-titre « Clans, règles, aides de jeu ». Le libellé de départ était celui de la v2.23.2 (« L'Empire d'Émeraude », « Portail de campagne · … »), pas celui du tableau O.2.
- **Guide** : l'ancienne phrase « site de la campagne du MJ : le portail L'Empire d'Émeraude » devient « ce portail : la page d'accueil », avec la phrase d'en-tête demandée. Le mot « portail » reste utilisé comme nom commun (« Forger sur le portail »).
- **`CREDITS.md`** : l'origine des données de sorts nomme aussi le grimoire des Chroniques de Rokugan.
- **W5** : Bibliothèque vide et menu dans `tests/ui/portal.spec.tsx`, panneau du grimoire dans `tests/ui/grimoire.spec.tsx`.

### O.3 Lot 34 : installable et hors ligne depuis l'adresse web (v2.24.0)

Objectif : un joueur ouvre l'adresse une fois, l'ajoute à son écran d'accueil, et le Carnet s'ouvre ensuite **sans réseau**. Le fichier de release et l'usage en `file://` ne changent pas.

**Principe : tout se passe dans `site/`, au déploiement.** Le build `dist/carnet-l5r.html` reste identique (pas de manifeste, pas de service worker). Les tests E2E existants tournent sur ce build et ne bougent pas.

1. **`public-pages/`** (nouveau dossier, hors `src`) :
   - `manifest.webmanifest` :
     ```json
     {
       "name": "Carnet de Rokugan",
       "short_name": "Carnet L5R",
       "description": "Compagnon de jeu L5R 4e : fiche et jets Roll & Keep.",
       "lang": "fr",
       "start_url": "./",
       "scope": "./",
       "display": "standalone",
       "background_color": "#26252a",
       "theme_color": "#26252a",
       "icons": [
         { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
         { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
         { "src": "icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
       ]
     }
     ```
     `short_name` « Carnet L5R » depuis la v2.26.1 (annexe Q bis), « Carnet » avant. `pages-pwa.mjs` ajoute aussi `<meta name="apple-mobile-web-app-title" content="Carnet L5R" />`, nom proposé par iOS pour l'écran d'accueil.
     Couleurs : reprendre celles des `theme-color` existants (sombre). Icônes : dérivées de `src/ui/favicon.svg` par un script `sharp` (`scripts/pwa-icons.mjs`, lancé à la main comme les captures, PNG committés) ; la version maskable garde le sceau dans les 80 % centraux.
   - `sw.js`, service worker minimal, **même origine uniquement** :
     - cache nommé avec la version (`carnet-v2.24.0`, injectée au déploiement) ;
     - `install` : met en cache `./`, `./index.html`, le manifeste et les icônes ;
     - `fetch` : pour les requêtes de navigation, **réseau d'abord** puis cache en repli (une nouvelle version arrive dès qu'il y a du réseau) ; pour les autres requêtes de même origine, cache d'abord ;
     - **ignore toute requête d'une autre origine** (`url.origin !== self.location.origin` → pas de `respondWith`) : le grimoire du portail garde son propre cache IndexedDB (annexe N) ;
     - `activate` : supprime les anciens caches `carnet-*`.
2. **`scripts/pages-pwa.mjs`**, lancé par `pages.yml` après la copie de `index.html` :
   - copie `public-pages/*` dans `site/` ;
   - remplace `__APP_VERSION__` dans `site/sw.js` par la version de `package.json` ;
   - insère dans `site/index.html`, avant `</head>` :
     ```html
     <link rel="manifest" href="manifest.webmanifest" />
     <script>
       if ('serviceWorker' in navigator && location.protocol === 'https:') {
         addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
       }
     </script>
     ```
   - échoue (code de sortie non nul) si `</head>` est introuvable.
3. **Guide** (`docs/GUIDE.md`, section « Utiliser hors ligne ») : ajouter « Installer sur ton téléphone ou ton ordinateur » : Chrome/Edge/Android → menu → **Installer l'application** ; iPhone/iPad (Safari) → **Partager** → **Sur l'écran d'accueil**. Une fois ouvert une première fois avec du réseau, le Carnet s'ouvre sans connexion. Le fichier de release reste l'autre solution.
4. **README**, section « Démarrer » : remplacer la phrase « Pour jouer hors ligne, télécharge… » par « Pour jouer hors ligne, **installe le Carnet** depuis ton navigateur (voir le [guide](docs/GUIDE.md#…)) ou télécharge `carnet-l5r.html`… ».
5. **HANDOFF §1**, ligne « Forme » : ajouter « Sur l'adresse GitHub Pages seulement, un service worker de même origine met le Carnet en cache pour l'usage hors ligne (annexe O.3). Il ne contacte aucun autre site. » §9.1 : `pages.yml` lance `scripts/pages-pwa.mjs`.
6. `CHANGELOG.md` : entrée v2.24.0, « Ajouté : le Carnet s'installe comme une application et s'ouvre hors ligne depuis son adresse web. »

**Tests**

| Cas | Vérifie |
|---|---|
| W6 | Unitaire sur `scripts/pages-pwa.mjs` (dossier temporaire) : `index.html` reçoit le lien du manifeste et le script d'enregistrement ; `sw.js` contient la version de `package.json` ; échec si `</head>` absent |
| W7 | Le manifeste est un JSON valide avec `name`, `start_url`, `display: standalone` et trois icônes existantes aux bonnes dimensions |
| W8 | E2E dédié `tests/e2e/pwa.spec.ts` : construit `site/` puis le sert en HTTP local (`npx serve` ou petit serveur Node, `localhost` compte comme contexte sûr). Il faut adapter la garde `location.protocol === 'https:'` pour accepter aussi `localhost`. Le service worker s'enregistre ; après `context.setOffline(true)` et rechargement, la Bibliothèque s'affiche |
| W9 | Même serveur : une requête vers `vincenzorpg.github.io` (chargement du grimoire simulé par `page.route`) n'est pas servie par le service worker |
| W10 | Smoke « aucune requête réseau » sur `dist/carnet-l5r.html` en `file://` : toujours vert, sans modification (le build ne contient ni manifeste ni service worker) |
| W11 | Manuel, après déploiement : installation sur Android (Chrome) et iPhone (Safari), ouverture en mode avion, puis mise à jour visible après le déploiement suivant |

#### O.3 bis Écarts de mise en œuvre (lot 34)

- **Service worker** : `skipWaiting` et `clients.claim` ajoutés, pour que la nouvelle version remplace l'ancienne sans attendre la fermeture de tous les onglets. La réponse d'une navigation réussie remplace la copie en cache : sans cela, le hors ligne resterait figé sur la version de l'installation. Seules les requêtes `GET` sont traitées.
- **Icône maskable** : sceau à 62 % du côté, pas 80 %. La zone sûre est un cercle de 80 % de diamètre : à 80 % du côté, les coins du cadre seraient coupés.
- **`scripts/pages-pwa.mjs`** : dossier en argument (`site` par défaut), pour W6 et W8. La garde accepte `localhost` (W8).
- **W8** : le serveur est démarré par `tests/e2e/pwa.spec.ts` sous `/carnet-l5r/`, comme Pages, sans dépendance. Il coupe aussi ses connexions pendant les étapes hors ligne, en plus de `setOffline`. Cas ajouté : une nouvelle version arrive avec du réseau et remplace la copie hors ligne. **W9** : `page.route` intercepte les six fichiers et `fromServiceWorker()` est faux. **W10** : le smoke n'a pas changé ; `tests/e2e/pwa.spec.ts` vérifie en plus que le build ne contient ni manifeste ni enregistrement.
- **Guide** : avertissement ajouté, sur iPhone et iPad l'application installée garde ses fiches à part de Safari. À confirmer pendant W11.
- **W11** : à faire après déploiement.

### O.4 Points ouverts à ajouter au §12

| # | Point | Défaut si non tranché |
|---|---|---|
| P11 | **Tranché le 01/11/2026** (remplace la décision du 31/10) : le site s'appelle désormais « Les chroniques de Rokugan », il sert de ressource commune et non de site du MJ de chaque groupe. Lot 33 repris en lot 37 (v2.25.1, annexe O.2), crédit tel qu'en O.2 §4. | Décision retenue |
| P12 | **Service worker sur GitHub Pages** (lot 34) : exception au principe « aucune requête automatique » (le navigateur charge `sw.js` et le manifeste, même origine, rien n'est envoyé). | Lot 34 non commencé ; le fichier de release reste la seule solution hors ligne |
| P13 | **Tranché le 31/10/2026 : accepté.** Mesure de fréquentation (GoatCounter) sur l'adresse GitHub Pages (`handoff-tracking.md`), exception au §1 : requête automatique vers un autre site, script injecté par `pages.yml` seulement (lot 35, annexe O.5). Le fichier de release et le smoke « aucune requête réseau » ne changent pas. | Décision retenue |

### O.5 Lot 35 : mesure de fréquentation (v2.24.1)

Source : `handoff-tracking.md`, P13 accepté le 31/10/2026. Tableau de bord : `https://carnet-l5r.goatcounter.com` (compte de Nelson).

1. **`scripts/pages-compteur.mjs`** : ajoute le script GoatCounter et son `<noscript>` avant le dernier `</body>` du dossier publié. `pages.yml` le lance après `pages-pwa.mjs`. Le build et le fichier de release ne changent pas. Le code du site n'apparaît qu'à un endroit (constante `COUNT`).
2. **Titre fixe** : `data-goatcounter-settings='{"title":"Carnet de Rokugan"}'`. Sans ce réglage, `count.js` envoie `document.title`, qui porte le nom du personnage (annexe G.3).
3. **Script épinglé** : `count.v5.js` avec `integrity` (empreinte publiée par GoatCounter) et `crossorigin="anonymous"`. Ce script tourne sur la même origine que les fiches : un fichier modifié est refusé par le navigateur et la visite n'est simplement pas comptée.
4. **Textes** : §1, README (section « Confidentialité », avant « En savoir plus »), guide §1, `CONTRIBUTING.md`, `docs/CREDITS.md`, `meta description` de `index.html`. Le `CHANGELOG` des versions passées et les mentions propres au grimoire (« Rien n'est envoyé », sur le clic « Charger ») ne changent pas.

**Hors périmètre** : événements (jets, import), cookies, `localStorage` ajouté, bannière. `count.js` lit `localStorage.skipgc` et ne l'écrit que si on ouvre l'adresse avec `#toggle-goatcounter` : c'est le moyen d'exclure ses propres visites.

**Tests**

| Cas | Vérifie |
|---|---|
| W12 | `tests/compteur.spec.ts` : injection avant le dernier `</body>`, titre fixe, script épinglé, empreinte égale à celle de `tests/fixtures/goatcounter/count.v5.js` |
| W13 | Le script échoue sans `</body>`, sans rien publier |
| W14 | `tests/e2e/compteur.spec.ts` : le build ne contient ni `goatcounter` ni `gc.zgo.at` ; le smoke « aucune requête réseau » n'a pas changé |
| W15 | Le dossier publié, servi à sa vraie adresse par `page.route`, avec le vrai script : une visite est comptée, le titre envoyé reste fixe alors qu'une fiche est ouverte, et aucun paramètre inattendu ne part |
| W16 | Compteur bloqué (uBlock) : aucune erreur, le Carnet marche à l'identique |
| W17 | Script modifié : refusé par le navigateur, rien n'est compté, le Carnet marche à l'identique |
| W18 | Après déploiement, manuel : requête `…goatcounter.com/count` en 200 ou 204, visite visible sur le tableau de bord, rendu mobile inchangé, aucune fiche ni aucun nom dans les données reçues |

#### O.5 bis Écarts de mise en œuvre (lot 35)

- **`handoff-tracking.md` non suivi à la lettre**, P13 prime : script injecté par `pages.yml` et non écrit dans `index.html`, sinon le fichier de release et le smoke changeraient. Critère 7 du handoff (`index.html` et `README.md` seuls modifiés) remplacé par la liste de l'étape 4. Critère 1 (`count.js` chargé en local) sans objet : le compteur n'existe que sur l'adresse publiée. Branche et commit suivent la convention des lots.
- **Snippet modifié** : titre fixe (étape 2), `count.v5.js` et intégrité au lieu de `//gc.zgo.at/count.js` (étape 3), `https:` explicite. Si GoatCounter change `count.v5.js`, le comptage s'arrête sans gêner le Carnet : l'empreinte est à reprendre sur sa page de versions, et W12 avec la copie de test.
- **Note de confidentialité** : complétée d'après `count.v5.js` et la page de confidentialité de GoatCounter (langue, pays déduit de l'adresse IP, qui n'est pas conservée). « Sans revente de données » et « sans identification personnelle » retirés : le Carnet ne peut pas le garantir par son code. P13 ne citait pas la langue ni l'adresse IP.
- **P13 citait `og:description`** : elle dit déjà « tes fiches restent dans ton navigateur », toujours vrai. La balise corrigée est `meta description`. `CONTRIBUTING.md` et H.2 ajoutés à la liste.
- **Hors ligne** : le service worker laisse passer les autres origines (W9). Sans réseau, le script ne se charge pas, la visite n'est pas comptée et le Carnet n'est pas gêné (W16).
- **`CHANGELOG`** : lien `[2.24.0]` manquant ajouté avec celui de la v2.24.1.
- **W18** : à faire après déploiement.

---

