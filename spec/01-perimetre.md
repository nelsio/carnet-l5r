## 1. Périmètre

### Décisions validées
| Sujet | Décision |
|---|---|
| Forme | **Un seul fichier HTML autonome** (JS, CSS et polices inline). Aucun serveur, aucun compte. Le fichier ne fait aucune requête **automatique**. Une seule exception, **déclenchée par le joueur** : le chargement de la liste des sorts du grimoire du portail (bouton « Charger le grimoire » ou « Actualiser », annexe N). Rien n'est envoyé : lecture seule, sans cookie ni référent. Sans grimoire chargé, on saisit les sorts à la main ; le Carnet marche toujours hors ligne et en `file://`. Sur l'adresse GitHub Pages seulement, un service worker de même origine met le Carnet en cache pour l'usage hors ligne (annexe O.3). Il ne contacte aucun autre site. Sur cette même adresse seulement, `pages.yml` ajoute le compteur de visites GoatCounter (annexe O.5, P13) : à l'ouverture, une requête automatique transmet l'adresse de la page, le référent, le navigateur, la langue et la taille d'écran, sans cookie et sans aucune donnée de fiche, nom du personnage compris. Compteur bloqué ou indisponible, le Carnet marche à l'identique. Seul **envoi** de données, déclenché par le joueur : le formulaire **Contact** du pied de page transmet son message à Web3Forms, qui le relaie par mail à l'auteur (lot 56, annexe 56, P15) ; uniquement les champs saisis et la version, jamais une donnée de fiche. |
| Distribution | Dépôt **GitHub** : la page est servie par **GitHub Pages**, et le fichier `carnet-l5r.html` est joint à chaque release. Le même fichier marche en ligne et ouvert en local (`file://`). |
| Stockage | Les fiches vivent dans le **navigateur** (IndexedDB). On les échange et on les sauvegarde en **fichiers JSON**, rangés où l'on veut (le Google Drive de la campagne, par exemple). |
| Fichier lié | Sur Chrome et Edge desktop, une fiche peut être **liée à un fichier JSON** : chaque modification y est enregistrée automatiquement (utile avec un dossier Drive synchronisé sur le PC). Ailleurs, on passe par import et export. |
| MJ | Le MJ importe les JSON des joueurs **en consultation** : lecture seule, aucune modification possible. |
| Import | **Fusion** d'un JSON dans une fiche, avec aperçu des changements avant application. Export JSON complet. |
| Thèmes | Clair **écru**, sombre **anthracite**, mode auto. Accent de couleur selon le **clan**. |
| Mobile | Mise en page validée sur téléphone (§7). |
| Portail de campagne | Liens vers le portail de campagne du MJ (simples liens ouverts dans un nouvel onglet, **aucune requête**) : menu Ressources, Forge de personnage, pages de clan, grimoire (annexe L). Seule lecture de données, sur un clic : les sorts du grimoire (annexe N). |

### Hors périmètre
Serveur, comptes, synchronisation automatique entre appareils, édition par le MJ, jets partagés en temps réel, sorts de shugenja (le catalogue d'actions les permettra plus tard).

---

