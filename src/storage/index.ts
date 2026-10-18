import { IndexedDbLibrary, IndexedDbPrefs, openDatabase } from "./indexeddb";
import { LinkedLibrary } from "./linkedLibrary";
import { memoryStorage } from "./memory";
import type { Storage } from "./types";

export * from "./types";
export { memoryStorage, MemoryLibrary, MemoryPrefs } from "./memory";
export { readCharacter } from "./indexeddb";
export { LinkedLibrary } from "./linkedLibrary";
export * from "./linkedFile";

export interface OpenOptions {
  /** Par défaut, l'IndexedDB du navigateur ; `null` = indisponible. */
  indexedDB?: IDBFactory | null;
  /** Délai au-delà duquel l'ouverture est considérée comme bloquée. */
  timeoutMs?: number;
}

/**
 * Ouvre le stockage du navigateur. Si IndexedDB est indisponible (navigation privée stricte,
 * stockage refusé), bascule en mémoire et le signale (HANDOFF §5.1).
 */
export async function openStorage({ indexedDB = globalThis.indexedDB, timeoutMs = 3000 }: OpenOptions = {}): Promise<Storage> {
  try {
    if (!indexedDB) throw new Error("IndexedDB absent");
    const db = await Promise.race([
      openDatabase(indexedDB),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("IndexedDB ne répond pas")), timeoutMs)),
    ]);
    return { library: new LinkedLibrary(new IndexedDbLibrary(db)), prefs: new IndexedDbPrefs(db), degraded: false };
  } catch (e) {
    console.warn("Stockage du navigateur indisponible : la fiche vit en mémoire", e);
    return memoryStorage(true);
  }
}

/**
 * Au premier lancement, demande au navigateur de ne pas effacer les données (HANDOFF §5.1).
 * Un refus ou une absence de l'API est silencieux.
 */
export async function requestPersistence(storage: Storage, nav: Pick<Navigator, "storage"> | undefined = globalThis.navigator): Promise<void> {
  const prefs = await storage.prefs.get();
  if (prefs.persistRequested || storage.degraded) return;
  try {
    await nav?.storage?.persist?.();
  } catch {
    // Refus silencieux.
  }
  await storage.prefs.set({ persistRequested: true });
}
