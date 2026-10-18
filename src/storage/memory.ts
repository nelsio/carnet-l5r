import { LinkedLibrary } from "./linkedLibrary";
import type { LibraryEntry, LibraryStore, Prefs, PrefsStore, SaveReport, Storage } from "./types";

/** Copie profonde, sauf la poignée du fichier lié, gardée telle quelle. */
export function cloneEntry(e: LibraryEntry): LibraryEntry {
  const { linkedFile, ...rest } = e;
  const copy = structuredClone(rest) as LibraryEntry;
  return linkedFile ? { ...copy, linkedFile: { ...linkedFile } } : copy;
}

/** Bibliothèque en mémoire : mode dégradé, et tests. */
export class MemoryLibrary implements LibraryStore {
  private readonly entries = new Map<string, LibraryEntry>();

  async list(): Promise<LibraryEntry[]> {
    return [...this.entries.values()].map(cloneEntry);
  }
  async get(id: string): Promise<LibraryEntry | undefined> {
    const e = this.entries.get(id);
    return e && cloneEntry(e);
  }
  async put(entry: LibraryEntry): Promise<SaveReport> {
    this.entries.set(entry.id, cloneEntry(entry));
    return {};
  }
  async remove(id: string): Promise<void> {
    this.entries.delete(id);
  }
}

export class MemoryPrefs implements PrefsStore {
  private prefs: Prefs = {};
  async get(): Promise<Prefs> {
    return { ...this.prefs };
  }
  async set(patch: Partial<Prefs>): Promise<void> {
    this.prefs = { ...this.prefs, ...patch };
  }
}

export function memoryStorage(degraded = false): Storage {
  return { library: new LinkedLibrary(new MemoryLibrary()), prefs: new MemoryPrefs(), degraded };
}
