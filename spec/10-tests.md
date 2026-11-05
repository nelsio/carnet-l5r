## 10. Tests

« Terminé » = tests verts, `tsc --noEmit` sans erreur, lint propre, CI verte.

État en v2.8.0 : **509 tests Vitest** (moteur, stockage, interface) et **70 tests Playwright** (chromium, iPhone 13, Pixel 7), lignes de `src/core` couvertes à 100 %. En v2.28.1 : 922 tests Vitest, 173 tests Playwright. En v2.28.4 : 937 tests Vitest, 173 tests Playwright. En v2.28.5 : 945 tests Vitest, 173 tests Playwright.

### 10.0 Rangement des fichiers de test (annexe 47)
- Un fichier par fonctionnalité, jamais par lot ni par version.
- `tests/core.<domaine>.spec.ts` pour le moteur, `tests/ui/<fonctionnalité>.spec.tsx` pour l'interface, `tests/e2e/<fonctionnalité>.spec.ts` pour les parcours de bout en bout.
- La traçabilité vers la spécification passe par le titre du `describe` (« (annexe E.2) », « (46.1) »), pas par le nom du fichier.
- Un nouveau test va dans le fichier de sa fonctionnalité ; s'il n'existe pas, on le crée sous ce nom.
- Langue (annexe 50.3) : sans fournisseur, un composant s'affiche en français ; `renderApp(ui, { locale })` (`tests/helpers/render.tsx`) enveloppe le fournisseur de langue. Playwright force `locale: "fr-FR"`.

### 10.1 Moteur (`tests/core.rules.spec.ts`) — fourni, 80 tests
- C'est la **spécification exécutable** du moteur. Elle a été validée contre une implémentation de référence : 80 tests sur 80 passent (v1.1 : règle des dix dés du livre, maîtrise 7+).
- **Changement d'attendus en v1.1** : la règle des dix dés précédente était fausse. Les cas `12k5`, `14k9` et la réserve 14k7 du test « règle des dix dés en dernier » ont des valeurs corrigées, conformes au livre.
- L'agent implémente `src/core` jusqu'à ce que le fichier passe, **sans modifier les valeurs attendues**. Un désaccord se signale (§12), il ne se corrige pas.
- Couverture visée : 100 % des lignes de `src/core`.
- Personnage de référence : `reference/exemple-personnage.json` (Kakita Haruto).
- Depuis le lot 47, le fichier se termine par « Moteur : correctifs de règles (annexe E.2) » (15 tests, venus de `core.lot12.spec.ts`), après les 80 tests fournis, qui restent inchangés.

### 10.1 bis Bonus de jet (annexe B) — à écrire par l'agent
Ces cas complètent la spec fournie. L'agent les écrit dans `tests/core.modifiers.spec.ts` avec la signature réelle de son implémentation, sans changer les attendus.

| # | Scénario | Attendu |
|---|---|---|
| B1 | Bonus `skill` Kenjutsu +1g0, `always` | Attaque Kenjutsu 5g3 → 6g3 ; Investigation inchangée |
| B2 | Bonus `trait` Agilité +0g1 | Kenjutsu et Équitation gagnent +0g1 ; jet de Constitution inchangé |
| B3 | Bonus `social` +5 au ND | ND final de Courtoisie, Étiquette, Sincérité +5 ; Kenjutsu inchangé |
| B4 | Hiruma rang 1 : +1g0 aux attaques, `stance: "attack"` | +1g0 en Attaque ; rien en Assaut ni en Défense |
| B5 | Bonus `armor` +5 avec posture Défense | ND d'armure +5 en Défense seulement |
| B6 | Bonus `wounds` 3 (Force de la Terre), 11 blessures (Égratigné +3) puis 18 (Éraflé +5) | Pénalité 0, puis 2 ; jamais sous 0 |
| B7 | Malus −3g0 sur une réserve de 2g2 | 0g0 au minimum, jamais négatif |
| B8 | Ordre : bonus +6g0 sur 7g3 en Assaut avec Vide | 7+2 → 9g4, +6 → 15g4, +1g1 → 16g5, dix dés → 10g8 |
| B9 | Bonus `optional` | Absent des réserves de la fiche et des statistiques ; proposé décoché dans le lanceur |
| B10 | Augmentations gratuites +1 | Ajoutées à celles saisies, sans changer le ND |
| B11 | Fusion d'un JSON avec un `modifier` de même `id` | Mise à jour, pas de doublon |

### 10.2 Stockage (Vitest + `fake-indexeddb`)
| # | Scénario | Attendu |
|---|---|---|
| S1 | `put` puis `list` / `get` | Entrée relue à l'identique |
| S2 | IndexedDB indisponible | Le store bascule en mémoire et signale le mode dégradé |
| S3 | Fichier lié (API simulée) : `put` | Fichier écrit avec le JSON de la fiche |
| S4 | `lastModified` du fichier changé avant écriture | Pas d'écriture, conflit remonté |
| S5 | Permission refusée | La fiche reste sauvée dans le navigateur, état « non lié » exposé |

### 10.3 Interface (Vitest + Testing Library)
| # | Scénario | Attendu |
|---|---|---|
| U1 | Fiche en consultation | Aucun `input`, `textarea` ou `select` éditable ; pas de bouton « Modifier » ; pastilles inactives |
| U2 | Saisie d'un trait | Les réserves des compétences liées se mettent à jour |
| U3 | Clan « Scorpion » puis « crane » | Accent rouge, puis bleu ciel |
| U4 | Notes contenant `<img src=x onerror=alert(1)>` | Affichées telles quelles, aucun `img` créé |
| U5 | Aperçu d'import | Modifications, ajouts et avertissements listés ; « Annuler » ne change rien |
| U6 | Navigateur sans `showSaveFilePicker` | Pas de bouton « Lier à un fichier » |

### 10.4 Bout en bout (Playwright, sur le build `dist/carnet-l5r.html`)
| # | Parcours | Attendu |
|---|---|---|
| E1 | Ouvrir en `file://`, réseau coupé | Aucune requête sortante ; création d'une fiche ; données conservées après rechargement |
| E2 | Même fichier servi en HTTP (comme sur Pages) | Comportement identique |
| E3 | Export, puis import en « Nouvelle fiche » | Fiche identique |
| E4 | Import en « Consultation » | Badge visible, lecture seule, jet de dés possible sans dépense de Vide |
| E5 | Import par fusion ajoutant Kyujutsu et un arc | Aperçu correct ; après application, tir sur Réflexes et dégâts sur la force de l'arc |
| E6 | Escarmouche | Initiative en tête ; Assaut fait passer le ND d'armure de 20 à 10 ; « Nouveau round » garde l'initiative |
| E7 | Attaque réussie avec 2 « Augmentation des dégâts » | Dégâts pré-remplis à +2 dés |
| E8 | Thème forcé, puis rechargement | Le choix est conservé ; en auto, la page suit le système |
| E9 | Statistiques | Une ligne par compétence, attaque, dégâts et initiative ; cocher « point de Vide » augmente les réserves de +1g1 et les pourcentages |
| E10 | Lanceur : ajouter une augmentation | Le ND final monte de 5 et la chance de réussite baisse |
| E11 | Kenjutsu passé à 7 (dés forcés : 9, 4…) | Les dégâts du katana affichent la note de maîtrise ; le 9 est relancé et le dé affiche « 13 » avec « 9+4 » ; la compétence de l'arme est trouvée même écrite « kenjutsu » ou avec des espaces |
| E12 | Boutons « i » de Déplacement et Rappels d'école (Posture retirée au lot 19, remplacée par D3, I.3.7 ; Vide retiré au lot 20, remplacé par Q10, J.6) | Descriptions masquées par défaut ; un clic sur le « i » d'un panneau déplie toutes ses descriptions, un second les replie ; aucun effet sur la posture, le Vide ni l'autre panneau |
| E13 | Lanceur sur Dégâts · Katana | « Bonus fixe » seul sur sa ligne, sans case vide (« Dés lancés ± » retiré, J.9) ; ligne « Les 10 explosent… » sans phrase « Lance… » ; avec Kenjutsu 7, « Les 9 et 10 explosent… » |
| E14 | Appui sur la tuile ND armure | L'éditeur d'armure s'ouvre ; bonus 5 avec Réflexes 2 → tuile ND 20 ; réduction 3 → tuile Réduction 3 ; valeurs conservées au rechargement |
| E15 | Option « Lanceur de dés » | Par défaut « affiché » (J.7) : le bouton « Lancer » apparaît partout ; « masqué » : aucun bouton « Lancer » ni historique dans les lanceurs ; le choix survit au rechargement |

### 10.5 Mobile (Playwright, appareils « iPhone 13 » et « Pixel 7 »)
| # | Scénario | Attendu |
|---|---|---|
| M1 | Toutes les vues | Aucun défilement horizontal de la page |
| M2 | Barre de navigation | Fixe en bas, visible sur Fiche comme sur Aide de jeu |
| M3 | Résumé de blessures | Un appui déplie la piste (2 × 4), un second la replie |
| M4 | Choisir une action | Le panneau s'ouvre ; « Lancer » est visible sans faire défiler |
| M5 | Lancer | Résultat visible, panneau toujours ouvert ; modifier une option ne ramène pas le panneau en haut |
| M6 | Fermeture du panneau | Par ×, par appui sur le fond et par Échap |
| M7 | Champs en mode modification | Taille de police calculée ≥ 16 px |
| M8 | Cibles tactiles (boutons −/+, pastilles, onglets) | Au moins 40 × 40 px |
| M9 | Tuiles de la barre d'état à 360 px de large | Les 4 libellés et valeurs sont entièrement visibles, sans troncature ni retour à la ligne |
| M10 | Boutons « i » (reformulé au lot 19, I.3.7) | Zone de toucher ≥ 40 × 40 px ; le panneau Vide tient sur moins d'un écran détails fermés ; le panneau Posture tient sur moins d'un écran avec sa description |
| M11 | En-tête à 360 px de large | Sceau de 52 px ; Bibliothèque, Lanceur de dés et Thème en icônes de 40 px sous le nom, alignés à gauche ; libellé accessible avec l'état courant (annexe G, H7) |
| M12 | Combat sur mobile, et à 360 px de large | Carte « Nouveau round » entre l'Initiative et la Posture ; sa description tient sur 2 lignes au plus |
| M13 | Aide de jeu sur mobile, et à 360 px de large | Les 4 onglets de situation (Enquête, Cour, Déplacement, Combat) sur une ligne, sans défilement ni texte tronqué, zones de 40 px de haut ; Statistiques est dans la barre du bas |
| M14 | Bonus de jet sur mobile, et à 360 px de large (E24) | Chaque bonus sur 3 lignes (nom et source, effet, cible et note), aucun texte tronqué |
| M15 | Bataille de masse sur mobile, et à 360 px de large (E.8) | Panneau rempli (jet, résultat, dés de blessures, Encaisser) sans défilement horizontal ; boutons d'état et d'engagement de 40 px de haut, sans texte tronqué |
| M16 à M18 | Bloc Armure, bloc Vide et tuile Blessures à 360 et 390 px (E.18, E.19) | Voir les tableaux de tests des annexes E.18 et E.19 |

---

