import type { LibraryEntry, LibraryStore, Prefs, PrefsStore, Storage } from "./types";

/** Bibliothèque en mémoire : mode dégradé, et tests. */
export class MemoryLibrary implements LibraryStore {
  private readonly entries = new Map<string, LibraryEntry>();

  async list(): Promise<LibraryEntry[]> {
    return [...this.entries.values()].map((e) => structuredClone(e));
  }
  async get(id: string): Promise<LibraryEntry | undefined> {
    const e = this.entries.get(id);
    return e && structuredClone(e);
  }
  async put(entry: LibraryEntry): Promise<void> {
    this.entries.set(entry.id, structuredClone(entry));
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
  return { library: new MemoryLibrary(), prefs: new MemoryPrefs(), degraded };
}
