## 11. Plan de livraison (lots)

Chaque lot fait l'objet d'une PR, livrée avec ses tests verts.

1. **Socle** : Vite + React + TypeScript strict, ESLint, Vitest, `vite-plugin-singlefile`, workflow `ci.yml`.
2. **Moteur** : schéma Zod, migrations, données de règles, moteur → `core.rules.spec.ts` vert.
3. **Interface bureau** : portage du prototype en composants, thème, clans. Revue visuelle par comparaison avec `reference/prototype.html`.
4. **Mobile** : §7 → tests M1 à M9 (M10 à M18 ajoutés ensuite).
5. **Stockage** : bibliothèque IndexedDB, écran Bibliothèque, mode consultation → S1, S2, U1.
6. **Import / export** : fusion avec aperçu, trois destinations → U5, E3 à E5.
7. **Fichier lié** : File System Access, reprise de permission, conflits → S3 à S5, U6.
8. **Distribution** : `pages.yml`, `release.yml`, README joueur, premier tag `v1.0.0`.
9. **v1.1 — règles et ergonomie** : règle des dix dés du livre (§4.7), maîtrise 7+ (§4.8), détails repliables « i » (§6.2), ligne « lancer à la main » et options alignées du lanceur, retrait de l'encadré Manœuvres de la fiche, éditeur d'armure depuis la barre d'état, option « Lanceur de dés » (masqué par défaut), boutons d'en-tête en icônes sur mobile, cas B1 à B11 → spec moteur verte (80 tests), E11 à E15, M10, M11 ; tag `v1.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 1).
10. **v2.0 — techniques d'école (bushi)** : annexe C. Format de fiche v2 et migration, moteur d'effets, catalogue `reference/ecoles-bushi.json` (14 écoles), choix d'école sur la fiche, effets automatiques et à cocher, mots-clés d'arme, rappels, badge « Action simple » → cas T1 à T24, E16 à E19 ; tag `v2.0.0`.
11. **v2.1 — techniques des courtisans et de Shosuro** : même moteur, nouvelles entrées de catalogue (compétences sociales, Connaissance, conditions d'Honneur, spécialisations). Annexe D (validée le 24/10/2026) : catalogue `src/rules/ecoles-courtisans.json` (12 écoles), situation Cour, spécialisation choisie au lanceur → cas T25 à T42, E20 à E23 ; tag `v2.1.0`. Aucun changement de format de fiche (`schemaVersion` reste 2).
   - **v2.1.1** (patch) : carte « Nouveau round » entre l'Initiative et la Posture, avec une description de deux lignes au plus sur mobile (§6.2, M12) ; test du fichier lié rendu robuste (lecture du fichier avant sa première écriture).
   - **v2.1.2** (patch) : Statistiques devient une vue à part (en-tête sur bureau, barre du bas sur mobile) ; les 4 onglets de situation tiennent sur une ligne à 360 px (§7, M13).
12. **v2.2 à v2.8 — règles du livre, combat complet, ergonomie** : annexe E (validée le 24/10/2026). Sept versions : correctifs de règles et retouches d'interface (v2.2.0, **livrée**, tag `v2.2.0`, écarts en E.12), combat complet (v2.3.0, **livrée**, tag `v2.3.0`, écarts en E.13), maîtrises et armures (v2.4.0, **livrée**, tag `v2.4.0`, écarts en E.14), récupération (v2.5.0, **livrée**, tag `v2.5.0`, écarts en E.15), vocabulaire français (v2.6.0, **livrée**, tag `v2.6.0`, écarts en E.16), bataille de masse (v2.7.0, **livrée**, tag `v2.7.0`, écarts en E.17), bloc Armure et retouches d'interface (v2.8.0, **livrée**, E.18 et E.19, écarts en E.20) → cas L1 à L28, E24 à E34, M16 à M18.
13. **v2.9 à v2.12 — shugenja et Magie** : annexe F (validée le 28/10/2026). Quatre versions : Rouleaux & invocations (v2.9.0, **livrée**, écarts en F.8), écoles de shugenja (v2.10.0, **livrée**, écarts en F.9), situation Magie et lanceur de sort (v2.11.0, **livrée**, écarts en F.10), emplacements et combat (v2.12.0, **livrée**, écarts en F.11) → cas G1 à G17, E36.
14. **v2.13.0 — nom de l'outil dans l'en-tête** : annexe G (maquette validée). Sceau 帳 qui ouvre la Bibliothèque, surtitre, titre d'onglet dynamique, favicon (**livrée**, écarts en G.6) → cas H1 à H12. **v2.13.1** (patch) : le bouton Bibliothèque est gardé à côté du sceau (G.6).
15. **v2.13.2 — fichiers du dépôt GitHub** : annexe H.1 à H.4 (**livrée**, écarts en H.11). Licence MIT, contribution, code de conduite, sécurité, `CHANGELOG.md`, modèles d'issue et de PR, Dependabot, `.editorconfig` → cas R1 à R4. Code applicatif inchangé (sauf `package.json`).
16. **v2.13.3 — correctifs** : annexe H.5 à H.8 (**livrée**, écarts en H.12). Notation `XgY` partout à l'affichage (`formatDR`, données en `g`), boutons en trop et incohérences (relevé X1 à X6, captures avant / après) → cas K1 à K8.
17. **v2.14.0 — couleurs** : annexe I.1, **remplace le §6.4**. Jetons `--surface-2`, `--accent-ink`, `--on-accent`, couleurs sémantiques `--danger` / `--ok` / `--warn`, jetons `--ring-*`, `theme-color` et thème sans flash (**livrée**, écarts en I.6) → cas N1 à N12.
18. **v2.15.0 — bloc Anneaux « Ensō »** : annexe I.2, CSS seul (`reference/anneaux-enso.css`) (**livrée**, écarts en I.7) → cas A1 à A8.
19. **v2.16.0 — sélecteurs** : annexe I.3. Sélecteurs `appearance: base-select` (`reference/selecteurs.css`), panneau Posture en menu déroulant sans « i » (**livrée**, écarts en I.8) → cas D1 à D10 ; E12 et M10 adaptés.
20. **v2.17.0 — correctifs et retouches** (**livrée**, écarts en J.14) : annexe J (retours de jeu du 30/10/2026). Bloc Armes en Edit lisible sur mobile, police du bloc Identité, bouton de technique sans « sort », bonus de jet sans catalogue (modèles par source), modèles de fiche shugenja et courtisan, panneau Vide en menu déroulant, lanceur de dés affiché par défaut, sorts avant les attaques en escarmouche, champ « Dés lancés ± » retiré, Min · Moy. · Max centrés dans le lanceur → cas Q1 à Q19.
21. **v2.18.0 — points d'Insight** (**livrée**, écarts en K.5) : annexe K. Points d'Insight calculés et Rang suggéré dans le bloc Identité, champ facultatif `insightBonus`, étiquette d'écart avec le rang saisi (qui fait foi) → cas I1 à I9, K1.
22. **v2.19.0 — portail de campagne : menu et Bibliothèque** (**livrée**, écarts en L.6) : annexe L.1 à L.5. Adresses dans `src/rules/portal.ts`, bouton et menu **Ressources** (panneau bas sur mobile), Bibliothèque vide (Forge ou fiche vierge, cartes de modèles) et avec fiches (« Un nouveau personnage ? ») → cas O1 à O11.
23. **v2.20.0 — portail de campagne : Fiche et Aide de jeu** (**livrée**, écarts en L.10) : annexe L.7 à L.9. Clan de l'en-tête en lien, liens de sort vers le grimoire, encadré de liens de l'Aide de jeu (Combat, Cour) → cas O12 à O17.
   - **v2.20.1** (patch, L.11) : options de la Bibliothèque vide alignées (étapes et boutons sur les mêmes lignes, cases de même taille) → O7 renforcé.
24. **v2.20.2 — README allégé** (**livrée**, écarts en M.2) : annexe M.1. README court (≈ 540 mots, trois captures en thème sombre), mode d'emploi dans `docs/GUIDE.md`, licences et crédits dans `docs/CREDITS.md`, script `npm run screenshots` (hors CI).
25. **v2.21.0 — liens vers le guide et le dépôt** (**livrée**, écarts en M.4) : annexe M.3. Section « Le Carnet » du menu Ressources, pied de page sur tous les écrans, lien « Lire le guide » dans la Bibliothèque vide.
   - **v2.21.1** (patch) : menus déroulants lisibles sous Safari (repli liste native).
   - **v2.21.2** (patch, L.12) : Forge en attente de compatibilité JSON. Fiche vierge proposée en premier, pastille « JSON pas encore compatible », interrupteur `FORGE_JSON_OK`.
   - **v2.21.3** (lot 28, M.5) : `sharp` 0.35.5 (alertes Dependabot), outil de captures seulement.
   - **v2.21.4** (lot 29, L.13) : liens des sorts filtrés par élément dans le grimoire (`&el=`, `GRIMOIRE_ELEMENT`).
26. **v2.22.0 — sorts depuis le grimoire** (**livrée**, écarts en N.7) : annexe N.1 à N.6. Lecture à la demande des 6 fichiers de sorts du portail (JSON5, sans exécution), cache IndexedDB, panneau « Ajouter depuis le grimoire », universels remplis → cas GR1 à GR22.
27. **v2.23.0 — autocomplétion du nom d'un sort** (**livrée**, écarts en N.10) : annexe N.8 et N.9. Champ Nom en combobox quand le grimoire est prêt, remplissage du sort, confirmation avant de remplacer des valeurs saisies → cas GR23 à GR32.
28. **v2.23.1 — aperçu de lien** (**livrée**, écarts en O.1 bis) : annexe O.1. Balises description et Open Graph, image `og.png` 1200 × 630 publiée par `pages.yml` → cas W1 à W4.
29. **v2.23.2 — nom du portail dans le menu Ressources** (**livrée**, remplacée par le point 32 ; P11) : l'entrée du menu a pris le nom alors affiché par le site, « L'Empire d'Émeraude ». Le lot 33 (annexe O.2) avait été mis de côté.
30. **v2.24.0 — installable et hors ligne** (**livrée**, écarts en O.3 bis ; P12) : annexe O.3. Manifeste et service worker ajoutés au déploiement Pages seulement → cas W6 à W11.
31. **v2.24.1 — mesure de fréquentation** (**livrée**, écarts en O.5 bis ; P13) : annexe O.5. Compteur GoatCounter ajouté au déploiement Pages seulement, titre fixe, script épinglé → cas W12 à W18.
32. **v2.25.1 — portail « Les chroniques de Rokugan »** (**livrée**, écarts en O.2 bis ; P11) : annexe O.2, lot 37 (ancien lot 33). Libellés du portail renommés et neutres (`PORTAL_NAME`), guide et crédits → cas W5.
33. **v2.25.2 — référencement** (**livrée**, écarts en P.2) : annexe P, lot 38. Balises, JSON-LD, sitemap, `og-image.png` et présentation statique sur l'adresse Pages.
34. **v2.26.0 — Forge compatible** (**livrée**, écarts en Q.2) : annexe Q, lot 39. `FORGE_JSON_OK` passe à `true`, fin des mentions « pas encore compatible ».
35. **v2.26.1 — nom de l'appli installée** (**livrée**, écarts en Q.4) : annexe Q bis, lot 40. `short_name` « Carnet L5R » et balise `apple-mobile-web-app-title`, au déploiement Pages seulement.
36. **v2.26.2 — note de règles dans le pied de page** (**livrée**, écarts en R.2) : annexe R, lot 41. La note « Règles de référence » quitte le bas de chaque écran pour la pastille repliable **Règles L5R 4e** du pied de page.
37. **v2.27.0 — import depuis une fiche papier** (**livrée**, écarts en S.3) : annexe S, lot 42. Prompt généré depuis le schéma, réponse de l'IA collée, extraite puis importée par le chemin habituel, encadré « À vérifier » → cas P1 à P7.
38. **v2.27.1 — étapes en liste, nouvel ordre** (**livrée**, écarts en T.2) : annexe T, lot 43. Étapes empilées dans chaque carte à toutes les largeurs ; ordre Fiche papier · Forge · Fiche vierge.
39. **v2.27.2 — spécification découpée** (**livrée**, écarts en 44.8) : annexe 44, lot 44. `HANDOFF.md` devient un index, détail dans `spec/`, `CLAUDE.md`, contrôle des références `check-spec`.
40. **v2.27.3 — barre d'état lisible** (**livrée**, écarts en 45.6) : annexe 45, lot 45. Trois niveaux abrégés dans la piste (Égrat., Grav., HdC), libellé complet pour les lecteurs d'écran ; entre 721 et 1179 px, la piste prend sa propre ligne.
41. **v2.28.0 — vue compacte de l'Assistant** (**livrée**, écarts en 46.7) : annexe 46, lot 46. Titre « Actions » et son « i » : explications des actions masquées sauf celle de l'action choisie, préférence d'appareil `compactActions`.
42. **v2.28.1 — tests rangés par fonctionnalité** (**livrée**, écarts en 47.6) : annexe 47, lot 47. Plus aucun fichier de test nommé d'après un lot ou une version ; mêmes tests, même couverture.
43. **v2.28.2 — fiche découpée par bloc** (**livrée**, écarts en 48.4) : annexe 48, lot 48. `Sheet.tsx` (904 lignes) devient le dossier `src/ui/components/sheet/`, un fichier par bloc ; déplacement pur, mêmes tests.
44. **v2.28.3 — état découpé par domaine** (**livrée**, écarts en 49.4) : annexe 49, lot 49. `store.ts` (681 lignes) devient le dossier `src/ui/store/` : types, état initial, reducer, logique des jets, contexte ; déplacement pur, mêmes tests.
45. **v2.28.4 — localisation, infrastructure** (**livrée**, écarts en 50.6) : annexe 50, lot 50. Dictionnaire typé `src/i18n`, messages de validation, fiche, lanceur, Assistant, barre d'état et en-tête migrés ; `check-i18n` en mode rapport ; rien ne change à l'écran.
46. **v2.28.5 — localisation, seconde moitié des textes** (**livrée**, écarts en 51.5) : annexe 51, lot 51. Bibliothèque, imports, grimoire, bonus de jet, statistiques, ressources et pied de page migrés ; dates et nombres selon la langue ; `check-i18n` bloquant ; rien ne change à l'écran.
47. **v2.29.0 — interface en anglais** (**livrée**, écarts en 52.6) : annexe 52, lot 52. Dictionnaire anglais complet, bouton FR/EN dans l'en-tête, langue du navigateur au premier lancement, réserves en `XkY` et distances en pieds en anglais ; grimoire et portail signalés en français.
48. **v2.30.0 — règles en anglais** (**livrée**, écarts en 53.5) : annexe 53, lot 53. Vocabulaire de règles dans le dictionnaire, textes du moteur en codes formatés par l'interface (option A), table des compétences française et anglaise : une fiche saisie en anglais reçoit ses techniques et maîtrises.
   - **v2.30.1** (patch, 53.6) : `minimatch` 11 forcé par `overrides` (alerte Dependabot), outils de développement seulement.
49. **Planifiés le 02/11/2026** : la fin de la localisation (lots 54 et 55, v2.31.0 et v2.31.1).
50. **À définir** : journal d'achats en XP (K.6), kata (évalués le 26/10/2026, reportés), voies alternatives et écoles avancées (exclues en D-a), catalogue de sorts hors grimoire du portail (fichier personnel importable, pas dans le dépôt ; le grimoire du portail est lu à la demande depuis la v2.22.0, annexe N), compteurs « N fois par séance » (D-g).

### Historique des états

Lignes d'état de l'ancien en-tête de `HANDOFF.md`, déplacées telles quelles au lot 44 (annexe 44.2).

**État au 05/11/2026 (lot 51) :** version **v2.28.5**, lot 51 : tous les textes de l'interface dans le dictionnaire (`src/i18n`), contrôle `check-i18n` bloquant, sans changement à l'écran (annexe 51).

**État au 05/11/2026 (lot 50) :** version **v2.28.4**, lot 50 : textes de l'interface regroupés dans un dictionnaire (`src/i18n`), première moitié des composants, sans changement à l'écran (annexe 50).

**État au 05/11/2026 (lot 49) :** version **v2.28.3**, lot 49 : état de l'application découpé par domaine dans `src/ui/store/`, sans changement à l'écran (annexe 49).

**État au 04/11/2026 (lot 48) :** version **v2.28.2**, lot 48 : fiche découpée en un fichier par bloc dans `src/ui/components/sheet/`, sans changement à l'écran (annexe 48).

**État au 04/11/2026 (lot 47) :** version **v2.28.1**, lot 47 : tests rangés par fonctionnalité, plus aucun fichier nommé d'après un lot ou une version (annexe 47).

**État au 04/11/2026 (lot 46) :** version **v2.28.0**, lot 46 : vue compacte de l'Assistant L5R, explications des actions masquables par le « i » du titre Actions (annexe 46).

**État au 03/11/2026 (lot 45) :** version **v2.27.3**, lot 45 : niveaux de blessure abrégés dans la barre d'état, plus de troncature (annexe 45).

**État au 03/11/2026 (lot 44) :** version **v2.27.2**, lot 44 : spécification découpée, `HANDOFF.md` devient un index (annexe 44).

**État au 02/11/2026 (lot 43) :** version **v2.27.1** : étapes en liste sur ordinateur, ordre Fiche papier · Forge · Fiche vierge (annexe T). v2.27.0 (lot 42) : import d'un personnage depuis une fiche papier, via l'IA du joueur (annexe S).

**État au 02/11/2026 :** version **v2.26.2** : l'export JSON de la Forge s'importe dans le Carnet (v2.26.0, annexe Q, lot 39) ; installé, le Carnet s'appelle « Carnet L5R » (v2.26.1, annexe Q bis, lot 40) ; la note de règles se déplie depuis le pied de page (v2.26.2, annexe R, lot 41). Lots 32 à 38 (annexes O et P) livrés en v2.23.1 à v2.25.2.

**État au 31/10/2026 :** version **v2.23.0** (sorts depuis le grimoire du portail et autocomplétion de leur nom, annexe N ; correctifs v2.21.1 Safari, v2.21.2 Forge en attente, L.12, v2.21.3 `sharp`, M.5, et v2.21.4 liens de sort filtrés par élément, L.13), lots 1 à 31 livrés (§11) dont le lot 13 shugenja et Magie (annexe F, v2.9.0 à v2.12.0) et le lot 14 nom de l'outil dans l'en-tête (annexe G, v2.13.0 et v2.13.1), format de fiche `schemaVersion: 2`. **Lot 12** (annexe E, validée le 24/10/2026) livré : v2.2.0 (correctifs de règles et retouches d'interface), v2.3.0 (combat complet), v2.4.0 (maîtrises et armures), v2.5.0 (récupération), v2.6.0 (vocabulaire français), v2.7.0 (bataille de masse) et v2.8.0 (bloc Armure et retouches d'interface, E.18 et E.19).

**Prochain lot (30/10/2026) :** à définir (§11, point 26). Les lots 24 et 25 (annexe M : README allégé, liens vers le guide et le dépôt) sont livrés ; la localisation est reportée.

---

