## 9. Distribution GitHub

### 9.1 Workflows (`.github/workflows/`)
| Workflow | Déclencheur | Étapes |
|---|---|---|
| `ci.yml` | push, pull request | install → lint → `tsc --noEmit` → Vitest → build → Playwright |
| `pages.yml` | push sur `main` | build → publication de `dist/carnet-l5r.html` comme `index.html` sur GitHub Pages ; lance `scripts/pages-pwa.mjs` (manifeste, service worker, sitemap et image de partage, annexes O.3 et P), `scripts/pages-seo.mjs` (présentation statique, annexe P) puis `scripts/pages-compteur.mjs` (compteur de visites, annexe O.5) |
| `release.yml` | tag `v*` | build → release GitHub avec `carnet-l5r.html` en pièce jointe et notes générées ; marquée « Latest » seulement si le tag est la plus haute version (un tag oublié posé en retard ne la remplace pas) |

### 9.2 Versionnement
- SemVer. La version de l'outil est affichée en pied de page (lien vers les nouveautés, annexe M.3) et dans la section « Le Carnet » du menu Ressources.
- Toute évolution du format de fiche incrémente `schemaVersion` et ajoute une migration testée.
- Une ancienne fiche s'ouvre toujours dans une version plus récente de l'outil.

### 9.3 README et guide joueur (en français)
Depuis v2.20.2 (annexe M.1), le guide joueur est **`docs/GUIDE.md`**. Le **README** reste une vitrine : présentation, captures, démarrage, développement. Les licences et crédits sont dans `docs/CREDITS.md`.

Règle pour chaque lot : **mettre à jour `docs/GUIDE.md`**. Ne toucher au README que si une fonction listée dans « Ce que fait le Carnet » change ; relancer `npm run build && npm run screenshots` (hors CI) et committer `docs/img/` si un écran capturé change visiblement.

Contenu du guide :
1. **Utiliser en ligne** : l'adresse GitHub Pages. Les fiches restent dans ton navigateur et ne sont jamais envoyées ; seule la visite est comptée (annexe O.5).
2. **Utiliser hors-ligne** : télécharger `carnet-l5r.html` depuis la dernière release et l'ouvrir dans le navigateur.
3. **Sauvegarder et partager** :
   - exporter sa fiche en JSON et la ranger dans le dossier Drive de la campagne ;
   - sur Chrome ou Edge, la lier à un fichier du dossier Drive synchronisé.
4. **Pour le MJ** : importer les JSON des joueurs en mode Consultation.
5. **Changer d'appareil** : exporter, puis importer en « Nouvelle fiche ».
6. Licences des polices et mention « L5R est une marque de son éditeur ; outil de fan non officiel » : dans `docs/CREDITS.md`, résumées en une ligne dans le README.

---

