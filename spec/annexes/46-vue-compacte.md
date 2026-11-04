## Annexe 46 — Lot 46 : vue compacte de l'Assistant L5R (v2.28.0)

Un seul lot, une PR, une version. Préférence, bouton « i », CSS, tests.

Maquette : `reference/prototype-vue-compacte.html`, proposition 2 (bouton « i » sur un titre « Actions »), retenue par Nelson le 02/11/2026.

### Constat

Dans l'Assistant, chaque carte d'action affiche sa description. Pour les attaques, elle se répète à chaque arme, et de même pour les dégâts : en escarmouche avec trois armes, la moitié de la colonne est du texte que le joueur connaît déjà.

Décision : une préférence « vue compacte » (explications masquées), désactivée par défaut. Les nouveaux joueurs gardent les explications.

### 46.1 Comportement

`ActionCard` (`src/ui/components/Aid.tsx`), en vue compacte :

| Carte | Vue compacte |
|---|---|
| Jet non choisi | titre, réserve, étiquettes, sans description |
| Jet choisi (`aria-pressed="true"`) | description affichée |
| Bloquée (posture, sort hors rang) | inchangée : raison et « Lancer quand même » |
| Info (`kind: "info"`) | inchangée |
| Déplacement (`MovePanel`) | inchangé |

- La description n'est pas rendue (pas de masquage CSS).
- « Attaque : Action simple » remonte sur la ligne du titre (dans `.t`, `margin-left: 6px`) ; « +Ng0 en attente » reste dans le titre.
- Cartes non choisies : `padding-block: 7px` (`.actions.compact`), au lieu de 10 px (12 px sur mobile).
- Hors périmètre : descriptions des postures, du panneau Vide et de « Nouveau round » (46.6).

### 46.2 Préférence

- `UiState.compactActions`, `false` dans `initialUi` ; action `{ type: "compactActions"; value: boolean }`.
- Conservée au changement de fiche et au retour à la Bibliothèque (`kept()`, `store.ts`).
- `Prefs.compactActions` (§3) : lue au démarrage (absente → `false`), écrite à chaque changement (`useLibrary.ts`), comme `woundMultiplier`. Les fiches ne changent pas.

### 46.3 Commande

- Au-dessus de `.actions`, une ligne `.listhead` : titre « Actions » (`.panel-title`, `.label`) et bouton `ActionsInfoButton`, dans toutes les situations.
- Même rendu que le « i » des panneaux (`.ib`, zone de toucher de 40 px) ; composant distinct, car `InfoButton` est lié à `ui.info`.
- `.ib.on` = explications affichées (défaut). `aria-pressed` = explications affichées ; nom et `title` « Explications des actions ».
- Vue compacte : mention `.ibhint` « explications masquées » (12,5 px, `--muted`) à droite du « i ».

### 46.4 Tests

- `tests/ui/compact-actions.spec.tsx` : bascule du reducer, conservation au changement de fiche, relecture et écriture de la préférence (`memoryStorage`) ; titre « Actions » en Enquête, Cour, Déplacement et Combat ; bouton nommé, `aria-pressed`, mention présente seulement en compact ; description absente des cartes non choisies et présente sur la carte choisie ; « Action simple » dans `.d` en détaillé, dans `.t` en compact ; carte bloquée (Centre) avec sa raison et « Lancer quand même ».
- `tests/e2e/compact-actions.spec.ts` : à 1280 et 390 px, carte « Attaque · Katana » non choisie à moins de 60 % de sa hauteur détaillée ; à 1280 px, « Attaque · Katana » en Action simple (Kakita R4) sur une ligne, étiquette comprise ; vue compacte conservée après rechargement.

### 46.5 Livré

- Préférence, bouton, CSS (`.listhead`, `.ibhint`, `.actions.compact`, `.act .t .tag`).
- §3 (préférences), §6.2 (vue compacte des actions), `docs/GUIDE.md` (section 4, « Masquer les explications des actions »).
- Captures inchangées : `docs/img/combat.png` reste en vue détaillée.

### 46.6 Point ouvert

Étendre la vue compacte aux descriptions de posture, du panneau Vide et de « Nouveau round », si les joueurs le demandent.

### 46.7 Écarts

- **Préférences décrites en §3, pas en §5.** Le handoff citait `spec/05-stockage.md` ; la liste des préférences est au §3 (modèle de données), complétée là.
- **Carte info non testée.** Aucune action `kind: "info"` n'existe dans les catalogues actuels : le cas reste couvert par le code (branche inchangée), sans test UI.
- **Katana au lieu du Wakizashi (E2E « une ligne »).** La fiche de test n'a pas de mot-clé sur son wakizashi : aucune école ne le rend Action simple. Le test utilise le katana avec l'École de bushi Kakita, rang 4.
- **Rechargement.** L'E2E attend l'écriture de la préférence dans IndexedDB avant de recharger la page, sinon le rechargement peut la devancer.
