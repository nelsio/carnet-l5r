## Annexe H — Lots 15 et 16 : dépôt GitHub et correctifs (v2.13.2, v2.13.3)

Statut : lot 15 **livré** (écarts en H.11), lot 16 **livré** (écarts en H.12). Source : `handoff-lots-15-17.md` (29/10/2026), audit fait sur `main` au commit `dfaac10` (v2.13.1) ; les numéros de ligne cités peuvent avoir bougé, se fier aux extraits. Ordre des lots tranché le 29/10/2026 : **15 → 16 → 17 → 18 → 19 → 20** (visuel avant, annexe I ; langues ensuite, **reportées** le 30/10/2026, §11 point 22). Une PR par lot, CI verte, tag posé après merge (procédure du README).

| Lot | Version | Contenu | Code applicatif touché |
|---|---|---|---|
| **15** | v2.13.2 | Fichiers classiques d'un dépôt GitHub (licence, contribution, modèles…) | Non (sauf `package.json`) |
| **16** | v2.13.3 | Correctifs : notation `XkY` → `XgY`, boutons en trop, incohérences | Oui |

### H.1 Lot 15 — fichiers à créer
| Fichier | Contenu |
|---|---|
| `LICENSE` | Licence **MIT** (P-H1), titulaire « Nelson » (ou le pseudo GitHub `nelsio`), année 2026. Texte MIT standard, en anglais (c'est le texte qui fait foi). |
| `CONTRIBUTING.md` | En français. Plan en H.2. |
| `CODE_OF_CONDUCT.md` | **Contributor Covenant 2.1**, traduction française officielle (récupérée sur contributor-covenant.org, pas réécrite). Contact : signalement privé via GitHub (pas d'adresse e-mail publiée). |
| `SECURITY.md` | Court : l'outil n'a ni serveur ni compte ; une faille possible = injection de contenu via un JSON importé, ou fuite de données. Signalement par **« Report a vulnerability »** (signalement privé GitHub, à activer dans Settings → Security). Seule la dernière version est corrigée. |
| `CHANGELOG.md` | Format *Keep a Changelog*. Une entrée par version publiée, reconstruite depuis le §11 et les releases GitHub (v1.0.0 → v2.13.2). Résumé en 1 à 4 puces par version, pas de copie des annexes. Section `[Non publié]` en tête. |
| `.github/ISSUE_TEMPLATE/bug.yml` | Formulaire : version (pied de page), navigateur et appareil, bureau ou mobile, étapes, attendu, obtenu, fiche JSON jointe facultative (avec rappel : retirer ce qu'on ne veut pas partager). |
| `.github/ISSUE_TEMPLATE/regle.yml` | « Règle à vérifier » : règle concernée, page du livre 4e (édition française ou anglaise), ce que fait l'outil, ce que dit le livre. **Pas de recopie de texte du livre** (rappel dans le formulaire). |
| `.github/ISSUE_TEMPLATE/idee.yml` | Idée d'évolution : besoin en jeu, situation (enquête, escarmouche…), proposition. |
| `.github/ISSUE_TEMPLATE/config.yml` | `blank_issues_enabled: false`. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Lot / version, résumé, cases à cocher : lint, typecheck, Vitest, Playwright, captures bureau + 390 px (si interface), `CHANGELOG.md` à jour, `HANDOFF.md` à jour (écarts de mise en œuvre). |
| `.github/dependabot.yml` | `npm` et `github-actions`, **mensuel**, regroupement des mises à jour mineures et correctives (`groups`), 5 PR ouvertes au plus. |
| `.editorconfig` | UTF-8, LF, indentation 2 espaces, retour à la ligne final ; `*.md` sans suppression des espaces de fin. |

### H.2 `CONTRIBUTING.md` (plan)
1. **Esprit du projet** : outil de fan, un seul fichier HTML, aucune requête automatique, aucune donnée de fiche envoyée. Toute contribution respecte ces contraintes.
2. **Signaler un bug ou une règle** : passer par les modèles d'issue.
3. **Proposer une évolution** : ouvrir une issue avant de coder. Les évolutions importantes passent par une annexe de `HANDOFF.md` (spécification avant code).
4. **Développer** : renvoi à la section Développement du README (Node 24, commandes). Ne pas dupliquer les commandes.
5. **Règles du code** : TypeScript strict ; logique de jeu dans `src/core` (pur, sans DOM, couvert à 100 %) ; règles en données dans `src/rules` ; couleurs uniquement en jetons CSS (vérifié par le lint N8 à partir du lot 17, annexe I.1) ; aucun `dangerouslySetInnerHTML` ; aucune dépendance chargée depuis un CDN.
6. **Tests attendus** : la spécification `tests/core.rules.spec.ts` ne se modifie pas pour faire passer du code ; un désaccord avec le livre se signale en issue « Règle à vérifier ».
7. **Branches et commits** : une branche par lot ou correctif (`lot-16-correctifs`, `fix-…`) ; messages en français, à l'impératif ; PR vers `main`.
8. **Versions** : SemVer, procédure de publication du README. Un changement du format de fiche incrémente `schemaVersion` et ajoute une migration testée.
9. **Textes du livre** : ne jamais recopier les textes des livres L5R (techniques, sorts, descriptions). Résumés courts et références de page seulement.
10. **Traductions** : prévues avec la localisation, reportée (§11, point 22).

### H.3 Lot 15 — fichiers modifiés
- `package.json` : `"license": "MIT"`, `"repository": { "type": "git", "url": "https://github.com/nelsio/carnet-l5r" }`, `"homepage": "https://nelsio.github.io/carnet-l5r/"`. Garder `"private": true` (empêche une publication npm par erreur).
- `README.md` :
  - sous le titre, trois badges : CI, dernière release, licence ;
  - §12 Licences et mentions : ajouter « Code sous licence MIT (voir `LICENSE`) » avant les polices ;
  - nouvelle section **Contribuer** après Développement : 3 lignes, liens vers `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- Réglages GitHub (**à faire par Nelson**, pas par l'agent) : activer le signalement privé de vulnérabilités ; renseigner la description et l'URL du dépôt ; sujets `l5r`, `legend-of-the-five-rings`, `rpg`, `character-sheet`.

### H.4 Tests du lot 15
| ID | Vérification | Attendu |
|---|---|---|
| R1 | Onglet « Insights → Community standards » du dépôt | Toutes les cases cochées (description, README, code de conduite, contribution, licence, sécurité, modèles d'issue et de PR) |
| R2 | « New issue » | Les 3 formulaires proposés, pas d'issue vierge |
| R3 | CI | Verte ; aucun changement dans `dist/carnet-l5r.html` hors numéro de version |
| R4 | `dependabot.yml` | Validé par GitHub (pas d'erreur dans l'onglet Dependabot) |

### H.5 Lot 16 — notation des dés : `XkY` affiché à la place de `XgY`
**Problème.** La règle (§4) est : `XgY` à l'affichage, `XkY` accepté en saisie. Plusieurs endroits affichent la VD **brute**, telle que stockée. Or le catalogue d'armes est écrit en `k` : une arme ajoutée depuis le catalogue (bouton « Associer ») ou une ancienne fiche s'affiche « VD 3k3 ».

**Correctif en deux parties.**
1. **Un seul formateur**, dans `src/core` (pur, testé), à côté de `parseDR` (`src/core/engine.ts`) :
   ```ts
   /** VD pour l'affichage : « 3k3 », « 3 K 3 », « 3g3 » → « 3g3 » ; texte invalide rendu tel quel, rogné. */
   export function formatDR(s: string, letter = "g"): string {
     const m = /^\s*(\d+)\s*[kg]\s*(\d+)\s*$/i.exec(s);
     return m ? `${Number(m[1])}${letter}${Number(m[2])}` : s.trim();
   }
   ```
   Le second paramètre servira à la localisation (`g` en français, `k` en anglais), reportée (§11, point 22).
2. **Appliquer `formatDR` à chaque affichage** d'une VD. Relevé de l'audit :

   | Fichier | Endroit |
   |---|---|
   | `src/ui/components/Sheet.tsx` | Ligne d'arme en lecture : `VD {w.dr}` |
   | `src/ui/components/Sheet.tsx` | Suggestion du catalogue (écart avec le livre) : `gap.dr` affiché |
   | `src/ui/components/Sheet.tsx` | Étiquette de sort : `VD {s.damage}` |
   | `src/ui/components/Roller.tsx` | Détail de la réserve de dégâts : `+ VD ${a.dr}` et `VD ${a.spell?.damage}` |
   | `src/core/actions.ts` | Descriptions des actions de dégâts (`VD de la flèche ${w.dr}`, `Force + VD ${w.dr}`) |
   | `src/core/spells.ts` | Description « Dégâts · sort » (`VD ${spell.damage}`) |

   Puis chercher les autres occurrences : `grep -rnE 'VD \$\{|\.dr\}|damage\}' src`.

**Données.** Normaliser en `g` les sources livrées avec l'outil :
- `src/rules/ecoles-bushi.json` : les 16 `"dr"` du catalogue d'armes (`"3k2"` → `"3g2"`, etc.) ;
- `src/rules/l5r4e.ts` : `DISARM_DAMAGE = "2k1"` → `"2g1"` ;
- `src/core/schema.ts` : message « doit être au format 2g2 » et commentaire ;
- `reference/` : ne pas toucher.

**Ce qu'on ne fait pas.** On ne réécrit pas les VD déjà enregistrées dans les fiches : `parseDR` accepte les deux lettres et l'affichage passe par `formatDR`. Dans les champs de saisie (mode Edit), on laisse la valeur tapée par le joueur. Pas de changement de `schemaVersion`. `src/core/schools.ts` compare les VD en ramenant `g` à `k` : comportement correct, ne pas modifier.

### H.6 Lot 16 — boutons en trop et incohérences
L'audit a été fait sur le code, sans capture d'écran. **Avant de coder**, l'agent :
1. génère les captures Playwright de chaque vue (Bibliothèque vide et pleine, Fiche en lecture, Fiche avec tous les blocs en Edit, Aide de jeu × chaque situation, Statistiques, Consultation), en bureau et en 390 px, thèmes clair et sombre ;
2. complète le relevé H.7 avec ce qu'il voit, en appliquant la définition ci-dessous ;
3. joint les captures « avant » et « après » à la PR.

**Définition d'un bouton en trop :**
- deux contrôles **visibles en même temps sur le même écran** qui font la même chose, sans raison de contexte ;
- un bouton **désactivé en permanence** dans l'état courant (exemple : consultation) : on le masque ;
- un bouton **qui reste affiché** alors que l'action est déjà engagée (confirmation sans « Annuler », bouton d'origine toujours visible).

Ne sont **pas** en trop (décisions de Nelson, à garder) :
- le bouton Bibliothèque **et** le sceau 帳 (G.6, v2.13.1) ;
- les boutons « Edit » / « Terminer » par bloc (E.9 S2) ;
- « Importer un JSON… » dans la Bibliothèque **et** dans le panneau Fichier de la fiche : contextes différents (nouvelle fiche ou fusion).

### H.7 Relevé
| # | Endroit | Constat | Correctif |
|---|---|---|---|
| X1 | `Sheet.tsx`, `DeleteCharacter` (bloc Identité en Edit) | « Supprimer ce personnage… » reste affiché à côté de « Confirmer la suppression » ; pas de bouton Annuler ; couleur en style inline (`style={{ color: "var(--bad)" }}`). Diffère du motif de la Bibliothèque. | Même motif que la Bibliothèque : au clic, remplacer le bouton par « Supprimer « Nom » ? » + **« Supprimer définitivement »** (`btn sm danger`) + **« Annuler »**. Plus de style inline. |
| X2 | `Roller.tsx`, `SpellCastLine` en consultation | « Réussi » et « Raté » affichés mais `disabled` : sans effet en consultation. | En consultation, ne pas les afficher. Garder le libellé « Jet aux vrais dés » seulement si un résultat est montré. |
| X3 | `FileActions.tsx` | `<ImportButton label="Importer un JSON…" />` répète la valeur par défaut. | Retirer la prop (nettoyage). |
| X4 | `Library.tsx` et `Stats.tsx` | `"fr-FR"` en dur (`Intl.DateTimeFormat`, `toLocaleString`). | Sans effet visible au lot 16. Passera par la langue courante avec la localisation, reportée (§11, point 22). Le noter ici, ne rien changer. |
| X5 | `Sheet.tsx`, Identité | Libellé « Rang (Insight) » et indication « = Insight (n) » : terme anglais isolé dans l'interface française. | Point P-H4 : défaut « Rang d'Insight » partout (déjà utilisé dans `l5r4e.ts`). |
| X6 | `Roller.tsx`, `MeditationSuccess` en consultation | « Réussi : +n point de Vide » affiché mais `disabled` : sans effet en consultation (même cas que X2). | En consultation, ne pas l'afficher ; le rappel « Vide n/max. » reste. |
| X7… | *À compléter par Nelson* | | |

> **Nelson** : ajoute ici les boutons en trop que tu as repérés en jeu (écran, bureau ou mobile, libellé du bouton). L'agent les traite en priorité.

### H.8 Tests du lot 16
| ID | Cas | Attendu |
|---|---|---|
| K1 | `formatDR` : `"3k3"`, `"3K3"`, `" 3 k 3 "`, `"3g3"`, `"0k4"`, `"abc"`, `""` | `3g3`, `3g3`, `3g3`, `3g3`, `0g4`, `abc`, `""` |
| K2 | Fiche avec une arme en `"3k3"` et un sort `damage: "2k2"`, vues Fiche, Aide de jeu (Escarmouche, Duel), Statistiques, lanceur ouvert sur les dégâts | `document.body.textContent` ne contient aucune correspondance de `/\b\d+k\d+\b/` ; « 3g3 » et « 2g2 » présents |
| K3 | Données livrées | Aucun `"dr"` de `src/rules/*.json` ni constante de `l5r4e.ts` ne contient `k` (test sur les données) |
| K4 | « Associer » une arme du catalogue | La VD enregistrée et affichée est en `g` |
| K5 | Export puis import d'une fiche ancienne (`"3k2"`) | Fusion sans changement signalé sur la VD ; affichage en `3g2` |
| K6 | X1 : suppression depuis le bloc Identité | Un clic : confirmation + Annuler, bouton d'origine masqué ; Annuler revient à l'état initial ; confirmer supprime et ramène à la Bibliothèque |
| K7 | X2 : sort en consultation | Aucun bouton « Réussi » / « Raté » dans le DOM |
| K8 | Non-régression | `core.rules.spec.ts` et toutes les suites existantes vertes sans modifier les valeurs attendues (sauf libellés touchés par X5, à lister dans la PR) |

### H.9 Points ouverts (à trancher par Nelson)
| # | Point | Défaut si non tranché |
|---|---|---|
| P-H1 | Licence du code | **MIT**. Alternative : GPL-3.0 si tu veux que les forks restent libres. |
| P-H4 | « Insight » dans l'interface française | « Rang d'Insight » partout (X5). Alternative : un terme français de ton choix. |

Les points P-H2, P-H3, P-H5 et P-H6 du handoff d'origine portent sur les langues : ils suivent la localisation, reportée (§11, point 22).

### H.10 Corrections du handoff d'origine
- **Numéros de lot** : le handoff prévoyait les langues au lot 17 (v2.14.0). Le visuel (couleurs, Anneaux, sélecteurs, annexe I) passe avant : les langues devenaient le lot 20 (v2.17.0) ; elles sont **reportées** le 30/10/2026 (§11, point 22) et le lot 20 devient correctifs et retouches (annexe J).
- **Identifiants** : relevé B1 à B6 renommé **X1 à X6** (B1 à B11 existent déjà, §10.1 bis) ; tests de langue L1 à L13 renommés **I1 à I13** (L1 à L28 existent, E.10). R1 à R4 et K1 à K8 sont gardés.
- **« lint C8 »** dans `CONTRIBUTING.md` : C8 est ici le catalogue d'armes (E.2) ; le lint des couleurs s'appelle **N8** (annexe I.1) et n'existe qu'à partir du lot 17.
- `DISARM_DAMAGE` vaut aujourd'hui `"2k1"` (le handoff donnait directement la valeur cible). `formatDR` reçoit dès le lot 16 son paramètre `letter`.

### H.11 Écarts de mise en œuvre (v2.13.2)
- **Code de conduite** : texte officiel `content/version/2/1/code_of_conduct.fr.md` du dépôt `EthicalSource/contributor_covenant`, en-tête TOML retiré ; seul le contact `[INSÉRER UNE ADRESSE EMAIL]` est remplacé par la fonction « Report content » de GitHub (« Report to repository admins »).
- **Étiquettes** : `bug.yml` → `bug`, `idee.yml` → `enhancement` (étiquettes existantes) ; `regle.yml` → `règle`, **étiquette à créer par Nelson** (sans elle, GitHub n'en pose aucune).
- **CHANGELOG** : à la livraison, v2.9.0 à v2.13.1 étaient sur `main` sans tag ni release ; leurs entrées sont datées du merge. Tags et releases créés le 29/10/2026 ; liens ajoutés au lot 17.
- **CONTRIBUTING** : point 10 = renvoi au code de conduite ; les traductions prendront le point 11 quand la localisation reviendra. Le README gagne aussi, à l'étape 1 de « Publier une version », la mise à jour de `CHANGELOG.md`.
- **R3** vérifié en local : `dist/carnet-l5r.html` ne diffère de la v2.13.1 que par le numéro de version (1 octet).

### H.12 Écarts de mise en œuvre (v2.13.3)
- **Captures** (H.6) : 56 vues « avant » et « après » (14 vues × bureau 1280 px et 390 px × clair et sombre), hors dépôt, jointes à la PR pour les vues touchées. Seul ajout au relevé : **X6** (bouton de méditation en consultation). Les points de Vide et la tuile « Sorts » de la barre d'état, désactivés en consultation, restent affichés : ils montrent l'état de la fiche.
- **X1** : la question reprend le nom du personnage (« Supprimer « Kuni Taeko » ? ») ; mise en page par une classe `.confirm-line` (alignée à gauche, contrairement à `.entry-actions`).
- **X2** : en consultation, la ligne « Jet aux vrais dés » disparaît entièrement tant qu'aucun résultat n'est montré.
- **X5** : « Rang d'Insight » pour le libellé **et** l'indication du Rang d'école, chiffre en tête pour rester lisible dans un champ étroit (« n (Rang d'Insight) »). Libellés de test touchés : `tests/ui/schools.spec.tsx`, `tests/e2e/schools.spec.ts`.
- **K4** : il n'y a pas de bouton « Associer » pour les armes (c'est celui de l'école, E19) ; l'arme du catalogue passe par « Mettre à jour » (écart avec le livre, E.2 C8). Testé sur le Cimeterre `3k2` → `2g3`.
- **K5** : testé au niveau du cœur (`mergeCharacter` sur l'export d'une fiche `3k2`) ; l'affichage en `g` est couvert par K2.
- **Tests existants modifiés** (valeurs attendues, pas de règle) : libellés `VD 2k2` / `3k2` / `2k3` → `g` (`core.lot12`, `core.magic`, `ui/lot12`, `ui/magic`, `ui/spells`, `e2e/import-export`) ; « Confirmer la suppression » → « Supprimer définitivement » (`ui/library`) ; boutons désactivés → absents en consultation (`ui/slots`, `ui/recovery`). `core.rules.spec.ts` inchangé.

---

