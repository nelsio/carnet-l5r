## 5. Stockage (`src/storage`)

```ts
interface LibraryStore {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | undefined>;
  put(entry: LibraryEntry): Promise<void>;        // enregistre + écrit dans le fichier lié s'il y en a un
  remove(id: string): Promise<void>;
}
```

### 5.1 IndexedDB (toujours actif)
- Sauvegarde automatique 500 ms après la dernière modification.
- Indicateur discret « Enregistré dans ce navigateur ».
- Si IndexedDB est indisponible (navigation privée stricte, stockage refusé) : l'outil fonctionne en mémoire, avec une bannière permanente « Sauvegarde impossible dans ce navigateur : exporte ta fiche avant de fermer ».
- Au premier lancement, la page demande `navigator.storage.persist()` pour éviter que le navigateur efface les données. Un refus est silencieux.

### 5.2 Fichier lié (File System Access API)
- Proposé seulement si `window.showSaveFilePicker` existe (Chrome et Edge desktop). Ailleurs, le bouton n'est pas affiché.
- « Lier à un fichier… » : l'utilisateur choisit ou crée un `.json`. La poignée (handle) est gardée dans l'entrée IndexedDB.
- Chaque sauvegarde écrit aussi le fichier.
- **Au rechargement**, la permission d'écriture doit être redemandée : bandeau « Reprendre l'enregistrement dans <fichier> » avec un bouton. Sans clic, la fiche continue d'être sauvée dans le navigateur.
- **Conflit** : avant d'écrire, comparer le `lastModified` du fichier avec la dernière valeur connue. S'il a changé (modifié ailleurs, par exemple par la synchro Drive) : bandeau « Le fichier a été modifié ailleurs » avec trois boutons :
  - « Charger la version du fichier » ;
  - « Écraser avec ma version » ;
  - « Fusionner » (ouvre l'aperçu de fusion §8).
- « Délier » retire le lien sans toucher au fichier.

---

