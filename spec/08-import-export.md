## 8. Import et export JSON

### Export
« Exporter la fiche » télécharge `<nom-normalisé>-l5r.json` : JSON indenté, `schemaVersion` inclus. Disponible pour toutes les fiches, y compris en consultation.

### Import
Depuis un fichier (bouton ou glisser-déposer), ou depuis une **fiche papier** (« Depuis une photo… », annexe S) : l'IA du joueur lit ses photos avec le prompt du Carnet, il colle la réponse, `extractPhotoReply` en tire le JSON, qui suit ensuite le même chemin qu'un fichier. Trois destinations :

| Destination | Effet |
|---|---|
| **Nouvelle fiche** | Crée une entrée modifiable (fichier complet requis, validé par le schéma complet) |
| **Consultation** (MJ) | Crée une entrée en lecture seule |
| **Fusionner dans la fiche ouverte** | Fusion ci-dessous, avec aperçu |

### Règles de fusion (`mergeCharacter`)
1. Lecture, analyse JSON, `migrate()`.
2. **Validation des champs présents** (types, bornes). Un seul champ invalide bloque tout l'import, avec un message par champ (« traits.agility : doit être un entier entre 1 et 10 »).
3. Les **clés inconnues** sont ignorées et listées en avertissement.
4. Règles par type de champ :
   - **Champs simples** : la valeur du fichier remplace. `null` est ignoré ; `""` vide un texte.
   - **Objets** (`traits`, `armor`, `xp`) : fusion clé par clé.
   - **Listes avec clé** (ajout ou mise à jour, **jamais de suppression**) :
     - `skills`, `weapons`, `techniques` : par nom normalisé ;
     - `maneuvers` : par `id`, sinon par nom normalisé.

     Un élément correspondant est fusionné champ par champ **en gardant son nom d'origine**. Un nouvel élément est ajouté en fin de liste. Une liste vide ne change rien.
   - Un `schemaVersion` plus récent que l'outil est rejeté : « Fichier créé par une version plus récente de l'outil ».
5. **Aperçu** avant application : modifications (`champ : avant → après`), ajouts, avertissements. Boutons « Appliquer » et « Annuler ». Un import refusé n'écrit rien.

---

