# Sécurité

## Ce qui est concerné

Le Carnet de Rokugan n'a **ni serveur, ni compte**, et n'envoie rien sur internet : les fiches restent dans le navigateur (IndexedDB) ou dans un fichier choisi par le joueur. Les failles possibles sont donc surtout :

- une **injection de contenu** par un fichier JSON importé (fiche partagée par un autre joueur, par exemple) ;
- une **fuite de données** : une fiche lue ou envoyée hors du navigateur sans action du joueur.

## Versions corrigées

Seule la **dernière version** (release la plus récente et version en ligne) reçoit les correctifs.

| Version | Corrigée |
|---|---|
| Dernière release | Oui |
| Versions antérieures | Non |

## Signaler une faille

Ne pas ouvrir d'issue publique. Utiliser le signalement privé de GitHub : onglet **Security** du dépôt, bouton **« Report a vulnerability »**.

Indiquer la version (affichée dans le pied de page), le navigateur, les étapes pour reproduire et, si besoin, un fichier JSON d'exemple **sans données personnelles**.
