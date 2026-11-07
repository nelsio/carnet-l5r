## 7. Version mobile (validée sur téléphone)

Point de rupture : **largeur ≤ 720 px**. Au-dessus, mise en page bureau inchangée.

| Élément | Comportement mobile |
|---|---|
| En-tête | Sceau de 52 px à gauche du nom ; Bibliothèque, Lanceur de dés, Thème et Ressources en **boutons ronds de 40 px, icône seule**, **sous** le bloc sceau + nom, alignés à gauche (annexe G) ; au bout de la rangée, calée à droite, la bascule **FR | EN**, 40 px de haut, sans globe (annexe 58). Lanceur affiché = fond d'accent pâle. Ressources ouvre un **panneau glissant depuis le bas**, comme le lanceur : poignée, voile, hauteur max 88 vh (annexe L.2). |
| Navigation | Onglets Fiche / Aide de jeu / Statistiques dans une **barre fixe en bas**, trois boutons de même largeur. Marge basse = hauteur de la barre + `env(safe-area-inset-bottom)`. Onglet actif sur fond d'accent pâle. Les quatre onglets de situation de l'aide de jeu tiennent sur **une ligne, sans défilement** (360 px compris). |
| Barre d'état | Les quatre tuiles Dépl. / ND armure / Réduction / Pénalité occupent **toute la largeur sur 4 colonnes égales**, texte centré. **Résumé sur une ligne** (niveau de blessure, pénalité, `blessures / seuil max`), cliquable, bordure rouge si le personnage est blessé. Un appui déplie la piste complète en **2 rangées de 4**. En dessous : compteur −/+ (boutons 40 px) et pastilles de Vide (26 px). |
| Lanceur | **Panneau glissant depuis le bas**, ouvert au choix d'une action (pas à l'ouverture de l'écran). Hauteur max 88 vh, défilement interne, fond assombri derrière. Poignée et bouton × en haut ; fermeture par ×, appui sur le fond ou Échap. Bouton « Lancer » **collé en bas** du panneau. Après un lancer, le résultat est amené à l'écran et le panneau reste ouvert. Changer une option ne remet pas le défilement du panneau à zéro. Le défilement de la page est bloqué pendant l'ouverture. |
| Situations | Rangées Enquête / Déplacement / Combat et sous-types en **défilement horizontal**, sans retour à la ligne. |
| Vide | Grille de 2 colonnes, titres seuls ; un « i » de 26 px dans l'en-tête du panneau, zone de toucher ≥ 40 px. (Posture : menu déroulant pleine largeur en 16 px, annexe I.3.4.) |
| Saisie | Champs en **16 px** (pas de zoom automatique sur iOS). Cibles tactiles d'au moins 40 px. |
| Anneaux | 2 colonnes, le Vide sur toute la largeur. |
| Encoches | Gouttières latérales `max(16px, env(safe-area-inset-left/right))`. Barre du bas et panneau respectent les zones sûres. |

---

