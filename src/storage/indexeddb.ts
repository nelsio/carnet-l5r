import { wrap, type DBSchema, type IDBPDatabase } from "idb";
import { migrate, upgrade, type Character } from "@carnet/core";
import type { LibraryEntry, LibraryStore, Prefs, PrefsStore, SaveReport } from "./types";

export const DB_NAME = "carnet-l5r";
export const DB_VERSION = 1;
const PREFS_KEY = "prefs";

interface CarnetDB extends DBSchema {
  entries: { key: string; value: LibraryEntry };
  prefs: { key: string; value: Prefs };
}

/** Ouvre la base ; la fabrique est injectable (tests, navigateurs sans IndexedDB). */
export async function openDatabase(factory: IDBFactory): Promise<IDBPDatabase<CarnetDB>> {
  const request = factory.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("entries")) db.createObjectStore("entries", { keyPath: "id" });
    if (!db.objectStoreNames.contains("prefs")) db.createObjectStore("prefs");
  };
  return (await wrap(request)) as unknown as IDBPDatabase<CarnetDB>;
}

/**
 * Ramène une fiche enregistrée au format courant (HANDOFF §9.2).
 * Une fiche en cours de saisie peut être incomplète (nom vide…) : elle est alors gardée telle quelle
 * plutôt que perdue ; seul un format plus récent que l'outil la rend illisible.
 */
export function readCharacter(raw: unknown): Character {
  try {
    return migrate(raw);
  } catch {
    return upgrade(raw as Record<string, unknown>) as unknown as Character;
  }
}

function readEntry(raw: LibraryEntry): LibraryEntry | undefined {
  try {
    return { ...raw, character: readCharacter(raw.character) };
  } catch (e) {
    console.warn(`Fiche ${raw.id} illisible par cette version de l'outil`, e);
    return undefined;
  }
}

export class IndexedDbLibrary implements LibraryStore {
  constructor(private readonly db: IDBPDatabase<CarnetDB>) {}

  async list(): Promise<LibraryEntry[]> {
    const raw = await this.db.getAll("entries");
    return raw.map(readEntry).filter((e): e is LibraryEntry => e !== undefined);
  }
  async get(id: string): Promise<LibraryEntry | undefined> {
    const raw = await this.db.get("entries", id);
    return raw && readEntry(raw);
  }
  async put(entry: LibraryEntry): Promise<SaveReport> {
    // La poignée du fichier lié se range telle quelle dans IndexedDB (elle est sérialisable).
    await this.db.put("entries", entry);
    return {};
  }
  async remove(id: string): Promise<void> {
    await this.db.delete("entries", id);
  }
}

export class IndexedDbPrefs implements PrefsStore {
  constructor(private readonly db: IDBPDatabase<CarnetDB>) {}

  async get(): Promise<Prefs> {
    return (await this.db.get("prefs", PREFS_KEY)) ?? {};
  }
  async set(patch: Partial<Prefs>): Promise<void> {
    const tx = this.db.transaction("prefs", "readwrite");
    const current = (await tx.store.get(PREFS_KEY)) ?? {};
    await tx.store.put({ ...current, ...patch }, PREFS_KEY);
    await tx.done;
  }
}
