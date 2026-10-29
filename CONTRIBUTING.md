# Contribuer au Carnet de Rokugan

Merci de ton intérêt ! Ce guide résume comment signaler un problème, proposer une évolution et soumettre du code.

## 1. Esprit du projet

Le Carnet de Rokugan est un **outil de fan**, non officiel. Il tient dans **un seul fichier HTML**, ne fait **aucune requête réseau** et **n'envoie rien** : les fiches restent chez chaque joueur. Toute contribution doit respecter ces trois contraintes.

## 2. Signaler un bug ou une règle

Passe par les [modèles d'issue](https://github.com/nelsio/carnet-l5r/issues/new/choose) :

- **Bug** : quelque chose ne marche pas comme prévu ;
- **Règle à vérifier** : l'outil applique une règle différemment du livre de base 4e.

Une faille de sécurité ne se signale pas en issue publique : voir [`SECURITY.md`](SECURITY.md).

## 3. Proposer une évolution

Ouvre une issue **Idée d'évolution** avant de coder. Les évolutions importantes passent par une annexe de [`HANDOFF.md`](HANDOFF.md) : la spécification est écrite et validée avant le code.

## 4. Développer

Prérequis et commandes : section [Développement du README](README.md#développement).

## 5. Règles du code

- TypeScript **strict**.
- Logique de jeu dans `src/core` : pure, sans DOM, **couverte à 100 %**.
- Règles du jeu sous forme de données dans `src/rules`.
- Couleurs uniquement en **jetons CSS** (vérifié par le lint N8 à partir du lot 17, annexe I.1 de `HANDOFF.md`).
- Aucun `dangerouslySetInnerHTML`.
- Aucune dépendance chargée depuis un CDN : tout est embarqué dans le fichier HTML.

## 6. Tests attendus

- Chaque PR arrive avec ses tests verts (lint, types, Vitest, Playwright).
- La spécification `tests/core.rules.spec.ts` **ne se modifie pas pour faire passer du code**. Un désaccord avec le livre se signale par une issue **Règle à vérifier**.

## 7. Branches et commits

- Une branche par lot ou correctif : `lot-16-correctifs`, `fix-…`.
- Messages de commit en français, à l'impératif.
- PR vers `main`, avec le modèle de PR rempli.

## 8. Versions

- [SemVer](https://semver.org/lang/fr/), procédure « Publier une version » du README.
- Chaque version a son entrée dans [`CHANGELOG.md`](CHANGELOG.md).
- Un changement du format de fiche incrémente `schemaVersion` et ajoute une migration testée.

## 9. Textes du livre

Ne recopie **jamais** les textes des livres L5R (techniques, sorts, descriptions). Résumés courts et références de page seulement.

## 10. Code de conduite

Les échanges suivent le [code de conduite](CODE_OF_CONDUCT.md).
