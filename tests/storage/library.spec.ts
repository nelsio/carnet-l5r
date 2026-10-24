/** Stockage (HANDOFF §10.2), sur fake-indexeddb. */
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { migrate, type Character } from "@carnet/core";
import { openStorage, readCharacter, requestPersistence, type LibraryEntry } from "../../src/storage";
import { DB_NAME, DB_VERSION } from "../../src/storage/indexeddb";
import kakita from "../fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
/** La même fiche au format courant (v2), telle que relue. */
const v2 = () => migrate(base());
const entry = (id = "a", patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id, character: v2(), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", ...patch,
});

describe("Bibliothèque IndexedDB", () => {
  it("S1 : put puis list / get relit l'entrée à l'identique", async () => {
    const { library, degraded } = await openStorage({ indexedDB: new IDBFactory() });
    expect(degraded).toBe(false);
    const e = entry("a", { mode: "readonly" });
    await library.put(e);
    expect(await library.get("a")).toEqual(e);
    expect(await library.list()).toEqual([e]);
  });

  it("met à jour, supprime, et conserve entre deux ouvertures", async () => {
    const factory = new IDBFactory();
    const first = await openStorage({ indexedDB: factory });
    await first.library.put(entry("a"));
    await first.library.put(entry("b"));
    await first.library.put({ ...entry("a"), updatedAt: "2026-10-19T00:00:00.000Z" });
    await first.library.remove("b");
    const second = await openStorage({ indexedDB: factory });
    expect(await second.library.list()).toEqual([{ ...entry("a"), updatedAt: "2026-10-19T00:00:00.000Z" }]);
    expect(await second.library.get("b")).toBeUndefined();
  });

  it("préférences : magasin séparé, fusion clé par clé", async () => {
    const factory = new IDBFactory();
    const { prefs } = await openStorage({ indexedDB: factory });
    expect(await prefs.get()).toEqual({});
    await prefs.set({ theme: "dark" });
    await prefs.set({ lastOpenedId: "a" });
    expect(await (await openStorage({ indexedDB: factory })).prefs.get()).toEqual({ theme: "dark", lastOpenedId: "a" });
  });

  it("migre une fiche du prototype (v0) à la relecture", async () => {
    const factory = new IDBFactory();
    const { library } = await openStorage({ indexedDB: factory });
    const { insightRank, ...v1 } = base();
    const v0 = { ...v1, insight: insightRank } as unknown as Character;
    delete (v0 as Partial<Character>).schemaVersion;
    await library.put(entry("old", { character: v0 }));
    expect((await library.get("old"))?.character).toEqual(v2());
  });

  it("garde une fiche incomplète telle quelle, et ignore une fiche d'une version plus récente", async () => {
    const factory = new IDBFactory();
    const { library } = await openStorage({ indexedDB: factory });
    const draft = { ...base(), name: "" };
    await library.put(entry("draft", { character: draft }));
    await library.put(entry("future", { character: { ...base(), schemaVersion: 99 } as unknown as Character }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await library.list()).map((e) => e.id)).toEqual(["draft"]);
    expect((await library.get("draft"))?.character.name).toBe("");
    expect(await library.get("future")).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("crée les magasins à la première ouverture seulement", async () => {
    const factory = new IDBFactory();
    await openStorage({ indexedDB: factory });
    const req = factory.open(DB_NAME, DB_VERSION);
    const db = await new Promise<IDBDatabase>((res) => { req.onsuccess = () => res(req.result); });
    expect([...db.objectStoreNames].sort()).toEqual(["entries", "prefs"]);
    db.close();
  });
});

describe("Mode dégradé", () => {
  const quiet = () => vi.spyOn(console, "warn").mockImplementation(() => {});

  it("S2 : IndexedDB indisponible → bascule en mémoire et le signale", async () => {
    const warn = quiet();
    const broken = { open: () => { throw new DOMException("Refusé", "SecurityError"); } } as unknown as IDBFactory;
    const s = await openStorage({ indexedDB: broken });
    expect(s.degraded).toBe(true);
    await s.library.put(entry("a"));
    expect(await s.library.list()).toEqual([entry("a")]);
    await s.prefs.set({ theme: "light" });
    expect(await s.prefs.get()).toEqual({ theme: "light" });
    await s.library.remove("a");
    expect(await s.library.get("a")).toBeUndefined();
    warn.mockRestore();
  });

  it("S2 : IndexedDB absent ou bloqué → mémoire", async () => {
    const warn = quiet();
    expect((await openStorage({ indexedDB: null })).degraded).toBe(true);
    // Requête d'ouverture qui ne répond jamais (base bloquée par un autre onglet, par exemple).
    const hanging = { open: () => new (IDBRequest as unknown as new () => IDBOpenDBRequest)() } as unknown as IDBFactory;
    expect((await openStorage({ indexedDB: hanging, timeoutMs: 10 })).degraded).toBe(true);
    warn.mockRestore();
  });
});

describe("Persistance du stockage", () => {
  it("demande navigator.storage.persist() une seule fois, refus silencieux", async () => {
    const s = await openStorage({ indexedDB: new IDBFactory() });
    const persist = vi.fn().mockRejectedValue(new Error("refus"));
    await requestPersistence(s, { storage: { persist } as unknown as StorageManager });
    await requestPersistence(s, { storage: { persist } as unknown as StorageManager });
    expect(persist).toHaveBeenCalledTimes(1);
    expect((await s.prefs.get()).persistRequested).toBe(true);
  });
  it("ne demande rien en mode dégradé", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = await openStorage({ indexedDB: null });
    const persist = vi.fn();
    await requestPersistence(s, { storage: { persist } as unknown as StorageManager });
    expect(persist).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("readCharacter", () => {
  it("valide et migre, sinon garde tel quel", () => {
    expect(readCharacter(base())).toEqual(v2());
    expect(readCharacter({ ...base(), traits: { ...base().traits, agility: 0 } }).traits.agility).toBe(0);
  });
});
