import { serializeCharacter } from "@carnet/core";
import { writeLinkedFile } from "./linkedFile";
import type { LibraryEntry, LibraryStore, SaveReport } from "./types";

/**
 * Bibliothèque qui écrit aussi dans le fichier lié (HANDOFF §5, §5.2).
 * La fiche est toujours enregistrée dans le navigateur d'abord : un conflit, une permission
 * absente ou une erreur d'écriture ne font jamais perdre la saisie.
 */
export class LinkedLibrary implements LibraryStore {
  constructor(private readonly base: LibraryStore) {}

  list() {
    return this.base.list();
  }
  get(id: string) {
    return this.base.get(id);
  }
  remove(id: string) {
    return this.base.remove(id);
  }

  async put(entry: LibraryEntry, opts: { force?: boolean } = {}): Promise<SaveReport> {
    await this.base.put(entry);
    if (!entry.linkedFile) return {};
    const file = await writeLinkedFile(entry.linkedFile, serializeCharacter(entry.character), opts);
    if (file.state === "written") {
      await this.base.put({ ...entry, linkedFile: { ...entry.linkedFile, lastModified: file.lastModified } });
    }
    return { file };
  }
}
