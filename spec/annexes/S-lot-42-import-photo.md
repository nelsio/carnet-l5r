## Annexe S — Lot 42 : import depuis une fiche papier (v2.27.0)

Source : `handoff-import-photo.md`, reçu le 02/11/2026. Maquette `reference/prototype-import-photo.html`, option **C** retenue par Nelson : le Carnet fournit un prompt, le joueur l'envoie avec ses photos à l'IA qu'il utilise déjà, puis colle la réponse. Pas d'OCR local, pas d'appel d'API, pas d'envoi de photo depuis le Carnet : aucune requête nouvelle, aucune dépendance ajoutée. Livré en une PR (pas de découpage 42a / 42b).

### S.1 Livré

- **`src/core/photo.ts`** (exporté par `src/core/index.ts`) :
  - `buildPhotoPrompt()` : rôle, règles, squelette commenté de la fiche v2. Les lignes des Traits viennent de `TRAIT_KEYS`, `TRAIT_LABELS` et `RINGS` (« `"awareness": 2  // Vigilance (Air) (Intuition sur certaines fiches)` ») ; les valeurs de `skills[].trait` et `spells[].element` de `ROLL_TRAITS` et `SPELL_ELEMENTS`.
  - `PHOTO_PROMPT_FIELDS` / `PHOTO_PROMPT_SKIPPED` : garde-fou contre la dérive du schéma (P1).
  - `extractPhotoReply(text)` : du premier `{` au dernier `}`, puis `parseCharacterFile` (limite de taille inchangée). Trois messages : pas de JSON, JSON incomplet ou abîmé (avec la phrase à redemander à l'IA), pas une fiche. `_aVerifier` est **toujours retiré** du JSON ; `review` n'en garde que les textes, sans doublons, désignant une valeur présente, 50 au plus.
  - `reviewLabel(path, json)` et `valueAtPath(json, path)` : libellé et valeur de chaque ligne de l'encadré.
- **`src/ui/components/ImportReview.tsx`** : `Modal` (fond, Échap) et `ImportReview` (destination, aperçu ou modifications et ajouts, erreurs, Annuler / Importer / Appliquer), extraits d'`ImportDialog`, qui garde son comportement. `show` passe dans `src/ui/format.ts`.
- **`src/ui/components/PhotoImportDialog.tsx`** : « Importer depuis une fiche papier », trois étapes 一 二 三 (pastille pleine : prompt copié, réponse lue), copie avec repli (prompt déplié et sélectionné), conseils photo, encadré de confidentialité, champ « Réponse de l'IA », « Vérifier » ; puis `ImportReview` avec l'encadré **À vérifier sur ta fiche (n)** au-dessus de l'aperçu. Modifier le texte collé efface le résultat. Aucun lien vers un service d'IA.
- **Points d'entrée** (`startPhotoImport` dans le `Store`, bouton `PhotoImportButton`) : troisième carte 写 de la Bibliothèque avec fiches (grille à trois colonnes) ; troisième `StartOption` de la Bibliothèque vide (Photographier · Demander · Coller, « Trois façons de commencer ») ; bloc **Fichier** d'une fiche ouverte, après « Importer un JSON… », masqué en consultation, fusion par défaut, phrase d'aide « un fichier ou une fiche papier ».
- **Styles** : `.psteps`, `details.prompt`, `.tips`, `.privacy`, `textarea.paste`, `.verify` (`--warn` sur `--warn-pale`) ; boutons des étapes à 44 px à 720 px et moins.
- **Docs** : guide § 3 (« Depuis une fiche papier »), README (une ligne), CHANGELOG 2.27.0, §8.
- **Tests** : `tests/core.photo.spec.ts` (P1 à P7), `tests/ui/photo-import.spec.tsx` (trois points d'entrée, copie et refus, « Vérifier » désactivé, encadré, nouvelle fiche, fusion, consultation, Échap et fond), `tests/e2e/import-export.spec.ts` (réponse collée dans la Bibliothèque vide sans aucune requête ; 390 px : feuille du bas, boutons ≥ 44 px, pas de défilement horizontal), `tests/e2e/portal.spec.ts` (O7 : trois cartes alignées, neuf étapes). Fixture `tests/fixtures/photo-reponse.txt` (Hiruma Daisuke, fictif).

| Cas | Vérifie |
|---|---|
| P1 | Chaque clé de `characterShape` est dans `PHOTO_PROMPT_FIELDS` ou `PHOTO_PROMPT_SKIPPED`, jamais les deux ; idem pour les sous-champs de `xp`, `armor`, `skills`, `weapons`, `techniques`, `spells` |
| P2 | Le prompt cite chaque Trait avec son libellé et son Anneau, `schemaVersion: 2`, `3g2`, `_aVerifier`, les éléments de sort |
| P3 | JSON seul, entouré de texte, en bloc ```` ```json ```` : même `json` |
| P4 | Réponse coupée, sans accolade, tableau à la racine, fichier trop gros : refusés |
| P5 | `_aVerifier` retiré ; `review` sans doublons, 50 au plus, sans chemin absent ; ignoré s'il n'est pas une liste de textes |
| P6 | `importCharacter` et `mergeCharacter` sur le JSON extrait : `ok`, aucun avertissement |
| P7 | `reviewLabel` : Trait, Anneau de Vide, Gloire, XP, compétence (avec élision « Rang d'Athlétisme »), arme, chemin inconnu |

### S.2 Prompt

Le prompt ne demande pas `schoolId`, `insightBonus`, `maneuvers`, `modifiers`, `affinity`, `spellSlotsUsed`, `armor.catalogId`, `weapons[].keywords`, ni, dans `spells`, autre chose que `id`, `name`, `element` et `mastery` : l'import les remplit (école « aucune », manœuvres par défaut, mots-clés d'arme déduits par `migrate()`).

### S.3 Écarts avec le handoff

- **Règle ajoutée au prompt** : « sans les commentaires // du modèle ». Le squelette est commenté ; une IA qui les recopierait produirait un JSON illisible pour `JSON.parse`.
- **`PHOTO_PROMPT_SKIPPED`** contient aussi les sous-champs ignorés, sous forme de chemins (`armor.catalogId`, `weapons[].keywords`, `spells[].range`…), et P1 les vérifie : un nouveau sous-champ du schéma fait aussi échouer le test.
- **Tableau à la racine** : avec la règle « premier `{`, dernier `}` », `[{…}]` donnerait l'objet intérieur. Une réponse qui commence par `[` (après un éventuel ```` ``` ````) est donc refusée d'emblée (« pas une fiche »). La vérification de l'objet après analyse reste, par sécurité. Un `{` sans `}` derrière donne le message « incomplet ou abîmé », pas « pas de JSON ».
- **`valueAtPath`** exporté en plus : l'encadré affiche la valeur lue dans le JSON collé.
- **Pastilles des étapes** : la 1re se remplit après une copie réussie (pas en cas de repli), la 3e quand la réponse est lue, même si la validation refuse ensuite une valeur ; la 2e reste vide (comme la maquette).
- **Résumé nouvelle fiche** : la ligne actuelle d'`ImportDialog` ; le bloc Anneaux et compteurs de la maquette (facultatif) n'est pas fait.
- **Grille des options** : `repeat(auto-fit, minmax(260px, 1fr))` avec subgrid. Un `row-gap` sur la grille se reportait dans chaque carte (le subgrid le compense par des marges) : les rangées sont espacées par une marge sous chaque carte, rattrapée par une marge négative de la grille. À 768 px, deux cartes puis une. Les titres d'étape passent en césure (`hyphens:auto`) : « Photographier » débordait de sa case à 1280 et 1024 px.
- **README** : il n'y a qu'un `README.md`, en français ; pas de `README-fr.md` ni de version anglaise, donc une seule ligne.
- **Couleurs** : le couple `--warn` / `--warn-pale` est déjà vérifié dans les deux thèmes (`tests/colors.spec.ts`, lot 27) : pas de nouveau cas.
- **Maquette** : versionnée dans `reference/` ; le handoff lui-même reste hors du dépôt, comme les précédents.

### S.4 Vérification manuelle (Nelson, après déploiement)

Copier le prompt depuis le Carnet, l'envoyer avec les photos de la fiche d'Okado Hiruma à deux IA différentes, coller chaque réponse. Noter les champs mal lus : ils serviront à ajuster le prompt dans un lot de suivi.

