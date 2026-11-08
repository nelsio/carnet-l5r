## 9. Distribution GitHub

### 9.1 Workflows (`.github/workflows/`)
| Workflow | Déclencheur | Étapes |
|---|---|---|
| `ci.yml` | pull request ; push sur `main` et tags `v*` (annexe 51.6) | install → lint → `tsc --noEmit` → Vitest → build → Playwright ; 20 min au plus |
| `pages.yml` | push sur `main` | build → publication de `dist/carnet-l5r.html` comme `index.html` sur GitHub Pages ; lance `scripts/pages-pwa.mjs` (manifeste, service worker, sitemap et image de partage, annexes O.3 et P), `scripts/pages-seo.mjs` (présentation statique, annexe P) puis `scripts/pages-compteur.mjs` (compteur de visites, annexe O.5) |
| `release.yml` | tag `v*` | build → release GitHub avec `carnet-l5r.html` en pièce jointe et notes générées ; marquée « Latest » seulement si le tag est la plus haute version (un tag oublié posé en retard ne la remplace pas) |

### 9.2 Versionnement
- SemVer. La version de l'outil est affichée en pied de page (lien vers les nouveautés, annexe M.3) et dans la section « Le Carnet » du menu Ressources.
- Pied de page : Guide · **Contact** · Signaler un bug · Projet. Contact ouvre le formulaire « Contacter l'auteur » (annexe 56) ; les bugs restent sur les Issues GitHub. Clé Web3Forms : `CONTACT_CONFIG.accessKey` dans `src/ui/contact.ts`, procédure en annexe 56.4.
- Toute évolution du format de fiche incrémente `schemaVersion` et ajoute une migration testée.
- Une ancienne fiche s'ouvre toujours dans une version plus récente de l'outil.

### 9.3 README et guide joueur
Depuis v2.20.2 (annexe M.1), le guide joueur est **`docs/GUIDE.md`**, en français ; depuis v2.32.4 (annexe 59.2), il existe aussi en anglais, **`docs/GUIDE-en.md`**, même plan et mêmes captures en anglais (`docs/img/guide/en/`). En anglais, l'application ouvre le guide anglais (annexe 59.3). Le **README** reste une vitrine : présentation, captures, démarrage, développement. Les licences et crédits sont dans `docs/CREDITS.md`.

Depuis v2.31.1 (annexe 55.1), la vitrine existe en deux langues, reliées par une ligne `English · Français` sous les badges. Depuis v2.32.2 (annexe 57.1), **`README.md` est en français** (page d'accueil du dépôt, captures `docs/img/`) et **`README-en.md` en anglais** (captures `docs/img/en/`). Les documents en français (`CONTRIBUTING.md`, guide, crédits) pointent vers `README.md`.

Règle pour chaque lot : **chaque lot qui change un écran met à jour `docs/GUIDE.md` et `docs/GUIDE-en.md`** ; `check-guides` (lint) vérifie la parité des deux guides, leurs liens et leurs images (annexe 59.6). Ne toucher aux README que si une fonction listée dans « Ce que fait le Carnet » change, et alors **toujours dans les deux README** ; relancer `npm run build && npm run screenshots && npm run screenshots -- en` (hors CI) et committer `docs/img/` si un écran capturé change visiblement. Si un écran montré dans le guide change : `npm run guide-shots` et `npm run guide-shots -- en` (hors CI, annexes 57.6 et 59.5), puis committer `docs/img/guide/`.

Forme du guide depuis v2.32.2 (annexe 57.2) : un parcours **« Le Carnet en 5 minutes »** en tête, puis une section par tâche qui commence par l'essentiel (listes courtes, tableaux) ; le détail des règles est replié dans des blocs `<details>` « En détail ». Toute la magie est regroupée dans une section **Shugenja**. Une nouvelle fonction s'ajoute à la section de sa tâche : l'essentiel visible, le détail replié. Les ancres citées par les README (`#installer-sur-ton-téléphone-ou-ton-ordinateur`, `#11-pour-le-mj` ; en anglais `#install-on-your-phone-or-computer`, `#11-for-the-gm`) ne changent pas.

Style « rouleau de Rokugan » (annexe 57.8) : titres de section `## 四 · Titre évocateur : tâche en clair`, précédés d'un `<a id="…">` qui garde l'ancre d'origine ; une épigraphe en italique par section, écrite pour l'outil ; sommaire en trois parties 天 · Le seuil, 地 · La voie, 人 · La mémoire ; blocs repliés « 詳 · Pour aller plus loin ». Les sections clés portent une capture annotée de `docs/img/guide/` (sceaux numérotés en kanji, cadre washi ; en clair et en sombre depuis v2.32.4, insérée en `<picture>` avec sa largeur d'affichage, annexe 59.5), suivie d'une liste qui explique chaque sceau : `- **一** (1) **Libellé exact de l'écran** : à quoi il sert.` Au plus six sceaux par capture.

Contenu du guide :
1. **Le Carnet en 5 minutes** : ouvrir, créer, remplir, jouer, lancer, exporter.
2. **Ouvrir le Carnet** : en ligne (l'adresse GitHub Pages), installé, ou fichier `carnet-l5r.html` de la dernière release. Les fiches restent dans ton navigateur et ne sont jamais envoyées ; seule la visite est comptée (annexe O.5).
3. **Créer ta fiche**, **Remplir et suivre ta fiche**, **L'Assistant L5R**, **Le lanceur**, **Shugenja**, **Écoles, maîtrises et bonus**, **Statistiques**.
4. **Sauvegarder et changer d'appareil** : exporter sa fiche en JSON (dossier partagé du groupe), sur Chrome ou Edge la lier à un fichier, importer en « Nouvelle fiche ».
5. **Pour le MJ** : importer les JSON des joueurs en mode Consultation.
6. **Langue, portail et confidentialité**.
7. Licences des polices et mention « L5R est une marque de son éditeur ; outil de fan non officiel » : dans `docs/CREDITS.md`, résumées en une ligne dans chaque README.

---

