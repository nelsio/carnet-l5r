## Annexe 44 — Lot 44 : spécification découpée (v2.27.2)

Un seul lot, une PR, une version. **Documentation et un script de contrôle : aucun fichier de `src/` ne change.**

### Constat

- `HANDOFF.md` : 3 387 lignes, 359 Ko. Il contient §1 à §12 et 20 annexes (A à T). À chaque lot, Claude Code en relit une grande partie.
- L'en-tête accumule quatre lignes « État au … ». La ligne « Prochain lot (30/10/2026) » est périmée et l'annexe T manque dans la liste des annexes.
- 442 références « HANDOFF §… » / « annexe <X>… » dans 142 fichiers (`src/`, `tests/`, `scripts/`, configs).

**Principe : déplacer sans réécrire.** Le contenu de §1 à §12 et des annexes est déplacé tel quel. Les identifiants (§6.3, annexe E.9) ne changent pas, donc aucune référence du code ne bouge.

### 44.1 Arborescence

```
HANDOFF.md                     # point d'entrée, ≤ 150 lignes
CLAUDE.md                      # consignes pour Claude Code, ≤ 60 lignes
spec/
├─ 01-perimetre.md
├─ 02-architecture.md
├─ 03-donnees.md
├─ 04-moteur.md
├─ 05-stockage.md
├─ 06-interface.md
├─ 07-mobile.md
├─ 08-import-export.md
├─ 09-distribution.md
├─ 10-tests.md
├─ 11-lots.md
├─ 12-points-ouverts.md
└─ annexes/
   ├─ A-format-v0.md
   ├─ B-bonus-de-jet.md
   ├─ C-ecoles-bushi.md
   ├─ D-courtisans-shosuro.md
   ├─ E-lot-12.md
   ├─ F-lot-13-magie.md
   ├─ G-lot-14-nom.md
   ├─ H-lots-15-16.md
   ├─ I-lots-17-19.md
   ├─ J-lot-20.md
   ├─ K-lot-21-insight.md
   ├─ L-lots-22-23-portail.md
   ├─ M-lots-24-25-readme.md
   ├─ N-lots-30-31-grimoire.md
   ├─ O-lots-32-37-diffusion.md
   ├─ P-lot-38-seo.md
   ├─ Q-lots-39-40-forge.md
   ├─ R-lot-41-pied-de-page.md
   ├─ S-lot-42-import-photo.md
   ├─ T-lot-43-etapes.md
   └─ 44-spec-decoupee.md
```

- Chaque fichier reprend **à l'identique** le titre `## …` de sa section et tout son contenu jusqu'à la section suivante. Pas de reformulation, pas de renumérotation.
- E (≈ 325 lignes) et I (≈ 390 lignes) restent chacun en un seul fichier : pas de découpage interne dans ce lot.
- Liens internes `[…](#ancre)` vers une autre section : réécrits en `[…](04-moteur.md#ancre)` (ou `../`). Liens vers `reference/…` : chemins relatifs corrigés.

### 44.2 `HANDOFF.md` (point d'entrée)

Contenu, dans l'ordre :

1. Titre, présentation en deux lignes, bloc « Fait foi » (inchangés).
2. **État actuel** : une seule ligne (version, lot, annexe), remplacée à chaque lot. Les anciennes lignes « État au … » passent sans modification dans `spec/11-lots.md`, sous un titre « Historique des états ».
3. **Index**, deux tableaux :
   - Sections : `§ | Titre | Fichier`.
   - Annexes : `Annexe | Sujet | Lots | Versions | Fichier`, de A à T puis 44.
4. **Lire pour un lot** : `HANDOFF.md`, §2 Architecture, §10 Tests, puis uniquement les sections et annexes citées par le handoff du lot ou dans les fichiers qu'il modifie. Ne pas charger tout `spec/`.
5. **Mettre à jour à chaque lot** :
   - la ligne « État actuel » ;
   - les § dont une règle change (la règle en vigueur vit dans le §, l'annexe garde l'historique) ;
   - une nouvelle annexe `spec/annexes/<lot>-<sujet>.md` (livré / écarts), ajoutée à l'index ;
   - `spec/11-lots.md`.
6. **Nommage des annexes** : A à T sont figées. À partir du lot 44, l'annexe porte le numéro du lot (« annexe 44 », sous-sections « 44.1 »…). Avec des lettres, on atteindrait Z dans six lots.

### 44.3 `CLAUDE.md`

Fichier lu automatiquement par Claude Code. Contenu :

- Le projet en une ligne, lien vers `HANDOFF.md`.
- Commandes : `npm run lint`, `typecheck`, `test`, `test:e2e`, `build`. Node 24 (`.nvmrc`).
- Workflow : un lot = une branche `lot-NN-sujet` = une PR = une version. `CHANGELOG.md` (sections Ajouté / Modifié / Corrigé / Technique / Documentation, comme l'existant), `package.json`, annexe du lot.
- Règles non négociables, avec leur référence : moteur et règles sans DOM (§2), pas de `dangerouslySetInnerHTML` (§6.3), couverture du moteur (§10.1), aucun texte reproduit des livres.
- La règle de lecture du point 44.2-4.
- Langue : code, commentaires et tests en français, comme l'existant.

### 44.4 Contrôle des références

`scripts/check-spec.mjs`, lancé par `npm run lint` après eslint :

- Parcourt `src/`, `tests/`, `scripts/`, `*.config.*`, `.github/` et `spec/`.
- Repère `§N` / `§N.M` (précédés ou non de « HANDOFF ») et `annexe <X>`, `annexe <X>.N`, `annexe <X> bis`, `annexe 44`, `annexe 44.2`.
- **Erreur** (code 1) si une section `§N` / `§N.M` ou une annexe (lettre ou numéro) n'existe pas dans `spec/` (titre `## N.` ou `### N.M`, fichier d'annexe).
- **Avertissement** seulement (liste en sortie, code 0) si une sous-section d'annexe (`E.9`) n'a pas de titre : plusieurs annexes ne numérotent pas leurs titres (`### Lot 30 (v2.22.0)`…).
- Les références courtes sans le mot « annexe » (`(H.5)`, `J.1`) ne sont pas contrôlées.

Tests (`tests/spec.spec.ts`, sur fixtures) :

| ID | Cas | Attendu |
|---|---|---|
| S1 | `HANDOFF §6.3` existant | OK |
| S2 | `§` suivi de 99 | erreur |
| S3 | `annexe` suivie de Z | erreur |
| S4 | `annexe` suivie de E.99 | avertissement, code 0 |
| S5 | `annexe Q bis` | reconnu, OK |
| S6 | `annexe 44.2` | reconnu, OK si `### 44.2` existe |

### 44.5 Preuve du déplacement

Dans la description de la PR : une commande (script jetable, non commité) montre que la concaténation de `spec/01` à `spec/12`, puis des annexes de A à T, est identique ligne pour ligne au `HANDOFF.md` d'origine privé de son en-tête (lignes 1 à 20), aux liens réécrits près. Joindre le diff, vide ou limité aux liens.

### 44.6 Autres fichiers

- `README.md`, section Développement : « Spécification : `HANDOFF.md` (index), détail dans `spec/`. »
- `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md` : chemins mis à jour s'ils citent `HANDOFF.md` par numéro de ligne ou par annexe.
- `spec/annexes/44-spec-decoupee.md` : livré / écarts.
- `CHANGELOG.md`, section 2.27.2, **Documentation** : « La spécification est découpée en fichiers par section (dossier `spec/`) ; `HANDOFF.md` devient un index. »
- `package.json` : 2.27.2.

### 44.7 Critères d'acceptation

- `HANDOFF.md` ≤ 150 lignes, index complet (12 sections, 21 annexes).
- Preuve 44.5 jointe à la PR.
- `npm run lint` vert, dont `check-spec` sans erreur ; avertissements listés dans la PR.
- Tests unitaires, UI et E2E verts. `dist/carnet-l5r.html` identique à la v2.27.1, hors numéro de version.

### 44.8 Livré et écarts (v2.27.2)

Livré :

- `spec/` : 12 sections et 20 annexes (A à T) déplacées par script sur les titres `## `, sans relecture du contenu. `HANDOFF.md` : 73 lignes ; `CLAUDE.md` : 44 lignes.
- `scripts/check-spec.mjs`, lancé par `npm run lint` après ESLint ; `tests/spec.spec.ts` (S1 à S6) sur un dépôt temporaire, comme `tests/seo.spec.ts`.
- Preuve 44.5 : la concaténation de `spec/01` à `spec/12` puis des annexes A à T est identique aux lignes 21 et suivantes de l'ancien `HANDOFF.md`, sauf dans `spec/11-lots.md` (lot 44 et lots planifiés ajoutés au plan, historique des états).
- `dist/carnet-l5r.html` : identique à la v2.27.1, sauf les 3 occurrences du numéro de version.

Écarts :

- **Aucun lien réécrit.** `HANDOFF.md` ne contenait aucun lien `[…](#ancre)` ni lien relatif vers `reference/`. Le seul lien relatif (`docs/GUIDE.md`, annexe O) cite une phrase à écrire dans le README : laissé tel quel.
- **Aucun avertissement** de `check-spec` : toutes les sous-sections d'annexe citées dans le dépôt ont un titre numéroté.
- `check-spec` parcourt aussi `HANDOFF.md` et `CLAUDE.md`, en plus des dossiers de 44.4.
- Les exemples de références fausses (S2 à S4) sont écrits de façon détournée, ici et dans `tests/spec.spec.ts`, pour ne pas être signalés par le contrôle lui-même.
- La ligne « Prochain lot (30/10/2026) », périmée, part dans l'historique des états avec les lignes « État au … ». Dans §11, la localisation quitte « À définir » pour les lots planifiés (point 40).
