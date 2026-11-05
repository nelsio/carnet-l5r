# Carnet de Rokugan — Handoff pour implémentation

Compagnon de campagne pour joueurs de **L5R 4e édition** : fiche de personnage + aide aux jets Roll & Keep par situation.

Fait foi :
- pour l'UX, le rendu et la version mobile : le prototype validé `reference/prototype.html` ;
- pour l'architecture, les données et les règles : ce document et le dossier `spec/` qu'il indexe.

**État actuel :** version **v2.28.5**, lot 51 : tous les textes de l'interface dans le dictionnaire (`src/i18n`), contrôle `check-i18n` bloquant, sans changement à l'écran (annexe 51).

---

## Index des sections

| § | Titre | Fichier |
|---|---|---|
| 1 | Périmètre | [`spec/01-perimetre.md`](spec/01-perimetre.md) |
| 2 | Architecture | [`spec/02-architecture.md`](spec/02-architecture.md) |
| 3 | Modèle de données | [`spec/03-donnees.md`](spec/03-donnees.md) |
| 4 | Moteur de règles (`src/core`) | [`spec/04-moteur.md`](spec/04-moteur.md) |
| 5 | Stockage (`src/storage`) | [`spec/05-stockage.md`](spec/05-stockage.md) |
| 6 | Interface (`src/ui`) | [`spec/06-interface.md`](spec/06-interface.md) |
| 7 | Version mobile | [`spec/07-mobile.md`](spec/07-mobile.md) |
| 8 | Import et export JSON | [`spec/08-import-export.md`](spec/08-import-export.md) |
| 9 | Distribution GitHub | [`spec/09-distribution.md`](spec/09-distribution.md) |
| 10 | Tests | [`spec/10-tests.md`](spec/10-tests.md) |
| 11 | Plan de livraison (lots), historique des états | [`spec/11-lots.md`](spec/11-lots.md) |
| 12 | Points ouverts | [`spec/12-points-ouverts.md`](spec/12-points-ouverts.md) |

## Index des annexes

| Annexe | Sujet | Lots | Versions | Fichier |
|---|---|---|---|---|
| A | Format du prototype (v0) → v1 | — | v1.0.0 | [`A-format-v0.md`](spec/annexes/A-format-v0.md) |
| B | Bonus de jet (techniques, avantages, désavantages) | — | v1.0.0 | [`B-bonus-de-jet.md`](spec/annexes/B-bonus-de-jet.md) |
| C | Techniques d'école (bushi) | 10 | v2.0 | [`C-ecoles-bushi.md`](spec/annexes/C-ecoles-bushi.md) |
| D | Techniques des courtisans et de Shosuro | 11 | v2.1 | [`D-courtisans-shosuro.md`](spec/annexes/D-courtisans-shosuro.md) |
| E | Règles du livre, combat complet, ergonomie | 12 | v2.2 à v2.8 | [`E-lot-12.md`](spec/annexes/E-lot-12.md) |
| F | Shugenja et Magie | 13 | v2.9.0 à v2.12.0 | [`F-lot-13-magie.md`](spec/annexes/F-lot-13-magie.md) |
| G | Nom de l'outil dans l'en-tête | 14 | v2.13.0 | [`G-lot-14-nom.md`](spec/annexes/G-lot-14-nom.md) |
| H | Dépôt GitHub et correctifs | 15, 16 | v2.13.2, v2.13.3 | [`H-lots-15-16.md`](spec/annexes/H-lots-15-16.md) |
| I | Couleurs, Anneaux, sélecteurs | 17 à 19 | v2.14.0 à v2.16.0 | [`I-lots-17-19.md`](spec/annexes/I-lots-17-19.md) |
| J | Correctifs et retouches | 20 | v2.17.0 | [`J-lot-20.md`](spec/annexes/J-lot-20.md) |
| K | Points d'Insight calculés | 21 | v2.18.0 | [`K-lot-21-insight.md`](spec/annexes/K-lot-21-insight.md) |
| L | Liens vers le portail de campagne | 22, 23, 27, 29 | v2.19.0 à v2.21.4 | [`L-lots-22-23-portail.md`](spec/annexes/L-lots-22-23-portail.md) |
| M | README allégé, liens vers le guide et le dépôt | 24, 25, 28 | v2.20.2 à v2.21.3 | [`M-lots-24-25-readme.md`](spec/annexes/M-lots-24-25-readme.md) |
| N | Sorts depuis le grimoire du portail | 30, 31 | v2.22.0, v2.23.0 | [`N-lots-30-31-grimoire.md`](spec/annexes/N-lots-30-31-grimoire.md) |
| O | Diffusion | 32 à 37 | v2.23.1 à v2.25.1 | [`O-lots-32-37-diffusion.md`](spec/annexes/O-lots-32-37-diffusion.md) |
| P | Référencement | 38 | v2.25.2 | [`P-lot-38-seo.md`](spec/annexes/P-lot-38-seo.md) |
| Q | Forge compatible ; Q bis : nom de l'appli installée | 39, 40 | v2.26.0, v2.26.1 | [`Q-lots-39-40-forge.md`](spec/annexes/Q-lots-39-40-forge.md) |
| R | Note de règles dans le pied de page | 41 | v2.26.2 | [`R-lot-41-pied-de-page.md`](spec/annexes/R-lot-41-pied-de-page.md) |
| S | Import depuis une fiche papier | 42 | v2.27.0 | [`S-lot-42-import-photo.md`](spec/annexes/S-lot-42-import-photo.md) |
| T | Étapes en liste, nouvel ordre des options | 43 | v2.27.1 | [`T-lot-43-etapes.md`](spec/annexes/T-lot-43-etapes.md) |
| 44 | Spécification découpée | 44 | v2.27.2 | [`44-spec-decoupee.md`](spec/annexes/44-spec-decoupee.md) |
| 45 | Barre d'état : niveaux de blessure abrégés | 45 | v2.27.3 | [`45-barre-etat.md`](spec/annexes/45-barre-etat.md) |
| 46 | Assistant L5R : vue compacte | 46 | v2.28.0 | [`46-vue-compacte.md`](spec/annexes/46-vue-compacte.md) |
| 47 | Tests rangés par fonctionnalité | 47 | v2.28.1 | [`47-tests-renommes.md`](spec/annexes/47-tests-renommes.md) |
| 48 | Fiche découpée par bloc | 48 | v2.28.2 | [`48-sheet-decoupe.md`](spec/annexes/48-sheet-decoupe.md) |
| 49 | État de l'application découpé par domaine | 49 | v2.28.3 | [`49-store-decoupe.md`](spec/annexes/49-store-decoupe.md) |
| 50 | Localisation : infrastructure, première moitié des textes | 50 | v2.28.4 | [`50-i18n-infra.md`](spec/annexes/50-i18n-infra.md) |
| 51 | Localisation : seconde moitié des textes, contrôle bloquant | 51 | v2.28.5 | [`51-i18n-extraction.md`](spec/annexes/51-i18n-extraction.md) |

## Lire pour un lot

1. Ce fichier, puis §2 Architecture et §10 Tests.
2. Uniquement les sections et annexes citées par le handoff du lot, ou dans les fichiers qu'il modifie (commentaires « HANDOFF §… », « annexe … »).
3. Ne pas charger tout `spec/`.

## Mettre à jour à chaque lot

- La ligne **État actuel** ci-dessus (remplacée, pas empilée).
- Les § dont une règle change : la règle en vigueur vit dans le §, l'annexe garde l'historique.
- Une nouvelle annexe `spec/annexes/<lot>-<sujet>.md` (livré / écarts), ajoutée à l'index des annexes.
- `spec/11-lots.md` : le lot livré dans le plan de livraison.

## Nommage des annexes

Les annexes A à T sont figées. À partir du lot 44, une annexe porte le numéro de son lot : « annexe 44 », sous-sections « ### 44.1 », citées « annexe 44.1 ». Avec des lettres, on atteindrait Z en six lots.

`npm run lint` lance `scripts/check-spec.mjs` : toute référence à un § ou à une annexe absents de `spec/` fait échouer le lint (annexe 44.4).
