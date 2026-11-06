## Annexe 56 — Lot 56 : formulaire de contact (v2.32.0)

Un lot, une PR, une version (`HANDOFF-contact.md`). Les visiteurs peuvent écrire en privé à l'auteur depuis le Carnet, sans que son adresse mail apparaisse et sans serveur. Les bugs restent sur les Issues GitHub. Décision P15 (§12) : exception au §1, seul envoi de données du Carnet, toujours sur un clic du joueur.

### 56.1 Point d'entrée

- Bouton **Contact** dans la navigation du pied de page, entre Guide et Signaler un bug (`AppFooter.tsx`), sur tous les écrans, sur ordinateur, sur mobile et dans la PWA installée. C'est un `button` (`aria-haspopup="dialog"`), pas un lien : les trois liens du pied de page et leurs tests (annexe M.3) ne changent pas.
- Même apparence que les liens voisins, zone de 32 px de haut comme eux.

### 56.2 Fenêtre

- Composant `ContactDialog.tsx`, dans le cadre commun `Modal` des imports (`ImportReview.tsx`) : Échap, clic sur le fond, croix « Fermer » dans le titre.
- `Modal` gagne pour toutes les fenêtres : focus placé dans la fenêtre à l'ouverture (premier élément focalisable, sauf si un `autoFocus` l'a déjà fait), Tab et Maj+Tab bouclent dans la fenêtre, focus rendu à l'élément d'origine à la fermeture. Règle en vigueur au §6.3.
- Sur mobile, la fenêtre s'ouvre en feuille depuis le bas, comme les imports ; champs à 16 px (M7).

### 56.3 Contenu et comportement

- Titre « Contacter l'auteur ». Champs : `name` (facultatif, 80 caractères), `email` (facultatif, `type="email"`, mention « Sans email, je ne pourrai pas te répondre. »), `subject` (Question, Idée/suggestion, Retour d'expérience, Autre), `message` (obligatoire, 10 à 3000 caractères après suppression des espaces de bord, compteur `n / 3000`).
- Piège à robots : `input type="checkbox" name="botcheck" class="visually-hidden" tabindex="-1" autocomplete="off"`, masqué par la classe CSS (pas `display:none`), `aria-hidden` pour les lecteurs d'écran. Coché : rien n'est envoyé, le remerciement s'affiche.
- Sous **Envoyer** : « Un bug ? → Signaler sur GitHub » (`CARNET_LINKS.bug`, nouvel onglet) ; puis la mention « Ton message est transmis par mail via le service Web3Forms. Rien n'est stocké dans le Carnet. »
- Validation au clic sur Envoyer (`validateContact`, `src/ui/contact.ts`) : erreur sous chaque champ, `aria-live="polite"`, `aria-invalid` et `aria-describedby` ; focus sur le premier champ en erreur. Corriger un champ efface son erreur.
- Envoi : `POST https://api.web3forms.com/submit` en JSON, `credentials: "omit"`, `referrerPolicy: "no-referrer"`. Corps (`contactPayload`) : `access_key`, `from_name` « Carnet de Rokugan », `subject` « [Carnet] » + catégorie dans la langue affichée, `name`, `email`, `message`, `app_version` (`__APP_VERSION__`). Rien d'autre : ni fiche, ni stockage local, ni langue.
- Pendant l'envoi, bouton désactivé « Envoi… ». Succès (`success: true`) : « Merci ! Message envoyé. » et un bouton Fermer qui prend le focus ; formulaire vidé. Échec (réseau, réponse illisible, `success: false`) : « Échec de l'envoi, réessaie plus tard. » (`role="alert"`), texte conservé.
- Hors ligne (`navigator.onLine === false`, suivi par les évènements `online` et `offline`) : « Hors ligne : l'envoi sera possible une fois reconnecté. », bouton désactivé.
- Délais (`sendGate`) : 3 s minimum entre l'ouverture de la fenêtre et l'envoi ; 60 s entre deux envois réussis, horodatage `carnet-contact-last` en `sessionStorage` (indisponible : pas de délai, sans erreur). Un envoi refusé affiche un message et n'appelle pas `fetch`.
- Brouillon : les champs vivent dans l'état du pied de page, monté une seule fois par `App`. Fermer puis rouvrir garde le texte ; un rechargement ou un envoi réussi le vide.
- Textes : section `contact` des dictionnaires `fr.ts` et `en.ts`, `footer.contact` pour le bouton ; tutoiement.

### 56.4 Clé Web3Forms

La clé d'accès est **publique par conception** : elle permet seulement d'envoyer vers l'adresse associée, qui n'apparaît jamais dans le code. Elle vit dans `CONTACT_CONFIG.accessKey` (`src/ui/contact.ts`). Valeur livrée : `"A_REMPLACER"` ; tant qu'elle est là (ou vide), le formulaire est désactivé avec « Le formulaire de contact n'est pas encore disponible. ».

Procédure :
1. Sur [web3forms.com](https://web3forms.com), créer une clé avec l'adresse de réception.
2. Renseigner `CONTACT_CONFIG.accessKey` avec cette clé, dans un lot (PR, version de correctif).
3. Après le déploiement, faire un envoi de test depuis le Carnet et vérifier sa réception (sujet « [Carnet] … », expéditeur « Carnet de Rokugan »).

### 56.5 Tests

- `tests/ui/contact.spec.tsx`, cas C1 à C11 : point d'entrée et clé non renseignée (C1), validation (C2), piège (C3), délais de 3 s et 60 s, `sessionStorage` refusé (C4), succès et « Envoi… » (C5), trois échecs (C6), hors ligne (C7), contenu exact envoyé sans donnée de fiche, avec Kakita ouverte (C8), libellés, focus piégé et rendu, Échap, croix, fond (C9), brouillon (C10), lien GitHub et mentions (C11).
- `fetch` est toujours simulé par `vi.stubGlobal` ; une clé de test est posée dans `CONTACT_CONFIG` et remise à « A_REMPLACER » après chaque test ; l'horloge passe par `Date.now` simulé.
- `tests/e2e/contact.spec.ts`, C12 : sur le build, fenêtre désactivée (clé non renseignée), focus piégé et rendu, aucune requête ; aucune adresse mail ni `mailto:` dans `dist/carnet-l5r.html` ; à 360 px, Contact visible dans le pied de page, pas de défilement horizontal, champs à 16 px, Envoyer atteignable.

### 56.6 Écarts

- Point d'entrée dans le pied de page seulement, pas dans le menu Ressources : le handoff laissait le choix, le pied de page est présent sur tous les écrans, mobile compris.
- Le brouillon garde tous les champs (nom, email, sujet, message), pas seulement le message.
- Envoi avant 3 s ou dans les 60 s : un message explique le refus (« Un instant… », « Message déjà envoyé… ») au lieu d'un refus muet ; aucun appel `fetch`.
- Le piège à robots porte aussi `aria-hidden="true"` : un lecteur d'écran ne doit pas le proposer.
- Le focus piégé et le retour du focus s'appliquent aussi aux fenêtres d'import (cadre `Modal` commun) ; leurs tests passent sans changement.
- Critère « un message de test arrive » : non vérifiable dans ce lot, la clé n'est pas encore créée ; procédure en 56.4.

### 56.7 v2.32.1 : clé renseignée

- `CONTACT_CONFIG.accessKey` reçoit la clé Web3Forms créée par l'auteur (étapes 1 et 2 de 56.4) : le formulaire est actif, dans le fichier de release comme sur Pages.
- Tests : C1 garde le cas « A_REMPLACER » en le posant lui-même et vérifie que la clé livrée est renseignée ; chaque test remet la clé livrée. C12 (Playwright) ne teste plus la fenêtre désactivée : il envoie un message vers Web3Forms simulé par `page.route` (horloge avancée de 3 s), et vérifie la clé, le sujet et le remerciement. Aucun envoi réel.
- Étape 3 de 56.4 (envoi de test réel, réception dans la boîte mail) : faite par l'auteur après le déploiement.
