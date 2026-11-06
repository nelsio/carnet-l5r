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
Depuis v2.20.2 (annexe M.1), le guide joueur est **`docs/GUIDE.md`**, en français. Le **README** reste une vitrine : présentation, captures, démarrage, développement. Les licences et crédits sont dans `docs/CREDITS.md`.

Depuis v2.31.1 (annexe 55.1), la vitrine existe en deux langues : **`README.md` en anglais** (page d'accueil du dépôt, captures `docs/img/en/`) et **`README-fr.md` en français** (captures `docs/img/`), reliés par une ligne `English · Français` sous les badges. Les documents en français (`CONTRIBUTING.md`, guide, crédits) pointent vers `README-fr.md`.

Règle pour chaque lot : **mettre à jour `docs/GUIDE.md`**. Ne toucher aux README que si une fonction listée dans « Ce que fait le Carnet » change, et alors **toujours dans les deux README** ; relancer `npm run build && npm run screenshots && npm run screenshots -- en` (hors CI) et committer `docs/img/` si un écran capturé change visiblement.

Contenu du guide :
1. **Utiliser en ligne** : l'adresse GitHub Pages. Les fiches restent dans ton navigateur et ne sont jamais envoyées ; seule la visite est comptée (annexe O.5).
2. **Utiliser hors-ligne** : télécharger `carnet-l5r.html` depuis la dernière release et l'ouvrir dans le navigateur.
3. **Sauvegarder et partager** :
   - exporter sa fiche en JSON et la ranger dans le dossier Drive de la campagne ;
   - sur Chrome ou Edge, la lier à un fichier du dossier Drive synchronisé.
4. **Pour le MJ** : importer les JSON des joueurs en mode Consultation.
5. **Changer d'appareil** : exporter, puis importer en « Nouvelle fiche ».
6. Licences des polices et mention « L5R est une marque de son éditeur ; outil de fan non officiel » : dans `docs/CREDITS.md`, résumées en une ligne dans chaque README.

---

