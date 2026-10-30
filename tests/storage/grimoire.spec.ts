/** Lot 30, v2.22.0 (HANDOFF annexe N.4) : chargement du grimoire et cache, cas GR11 à GR13. */
import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GrimoireOfflineError, loadGrimoire, openStorage, readGrimoireCache, type GrimoireCache,
} from "../../src/storage";
import { GRIMOIRE_FILES, PORTAL_BASE } from "../../src/rules/portal";
import { fakeResponse, fixtureFetch } from "../helpers/grimoire";

const now = () => new Date("2026-10-30T20:00:00.000Z");

afterEach(() => vi.useRealTimers());

describe("GR11 : chargement", () => {
  it("6 réponses OK : 162 sorts, 6 fichiers", async () => {
    const cache = await loadGrimoire({ fetch: fixtureFetch(), now });
    expect(cache).toMatchObject({ v: 1, fetchedAt: "2026-10-30T20:00:00.000Z", source: PORTAL_BASE, files: 6 });
    expect(cache.spells).toHaveLength(162);
  });

  it("un fichier en 404 : incomplet, 5 fichiers", async () => {
    const cache = await loadGrimoire({ fetch: fixtureFetch({ eau: async () => fakeResponse("Not found", 404) }), now });
    expect(cache.files).toBe(5);
    expect(cache.spells).toHaveLength(162 - 25);
  });

  it("un fichier illisible compte comme non lu", async () => {
    const cache = await loadGrimoire({ fetch: fixtureFetch({ vide: async () => fakeResponse("<!doctype html>") }), now });
    expect(cache.files).toBe(5);
  });

  it("toutes en erreur réseau : GrimoireOfflineError", async () => {
    const fail = () => Promise.reject(new TypeError("Failed to fetch"));
    const err = await loadGrimoire({ fetch: fail, now }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GrimoireOfflineError);
    expect((err as GrimoireOfflineError).reason).toBe("network");
  });

  it("toutes en 404 : GrimoireOfflineError", async () => {
    await expect(loadGrimoire({ fetch: async () => fakeResponse("", 404), now })).rejects.toBeInstanceOf(GrimoireOfflineError);
  });

  it("délai dépassé (15 s pour l'ensemble) : erreur de délai, requêtes annulées", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const hang = (_: RequestInfo | URL, init?: RequestInit) => {
      signals.push(init!.signal!);
      return new Promise<Response>(() => {});
    };
    const p = loadGrimoire({ fetch: hang, now }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(15_000);
    const err = await p;
    expect(err).toBeInstanceOf(GrimoireOfflineError);
    expect((err as GrimoireOfflineError).reason).toBe("timeout");
    expect(signals.every((s) => s.aborted)).toBe(true);
  });

  it("réponse de 2 Mo : fichier refusé", async () => {
    const big = async () => fakeResponse(`const X = [${'"x",'.repeat(500_000)}];`);
    const cache = await loadGrimoire({ fetch: fixtureFetch({ feu: big }), now });
    expect(cache.files).toBe(5);
    const declared = async () => ({ ...fakeResponse("[];"), headers: new Headers({ "content-length": "2000000" }) }) as Response;
    expect((await loadGrimoire({ fetch: fixtureFetch({ air: declared }), now })).files).toBe(5);
  });
});

describe("GR12 : requêtes", () => {
  it("sans cookie ni référent, uniquement les 6 fichiers, jamais Mahō ni Kihō", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const base = fixtureFetch();
    await loadGrimoire({ fetch: (input, init) => { calls.push([String(input), init]); return base(input); }, now });
    expect(calls.map(([u]) => u).sort()).toEqual([...GRIMOIRE_FILES].sort());
    expect(GRIMOIRE_FILES).toHaveLength(6);
    for (const [url, init] of calls) {
      expect(url).not.toMatch(/maho|kiho/);
      expect(init).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer", cache: "no-cache" });
      expect(init?.method ?? "GET").toBe("GET");
      expect(init?.body).toBeUndefined();
    }
  });
});

describe("GR13 : cache", () => {
  it("écrit après chargement, relu après réouverture de la base (clé grimoireCache du store prefs)", async () => {
    const factory = new IDBFactory();
    const first = await openStorage({ indexedDB: factory });
    const cache = await loadGrimoire({ fetch: fixtureFetch(), now });
    await first.grimoire.set(cache);
    await first.prefs.set({ theme: "dark" });
    const second = await openStorage({ indexedDB: factory });
    expect(readGrimoireCache(await second.grimoire.get())).toEqual(cache);
    expect(await second.prefs.get()).toEqual({ theme: "dark" });
  });

  it("description jamais en cache (GR9)", async () => {
    const cache = await loadGrimoire({ fetch: fixtureFetch(), now });
    expect(cache.spells.some((g) => "desc" in g)).toBe(false);
    expect(JSON.stringify(cache)).not.toContain("\"desc\"");
  });

  it("cache corrompu ou d'une autre source : ignoré", async () => {
    const cache = await loadGrimoire({ fetch: fixtureFetch(), now });
    expect(readGrimoireCache(undefined)).toBeUndefined();
    expect(readGrimoireCache({ ...cache, v: 2 })).toBeUndefined();
    expect(readGrimoireCache({ ...cache, spells: [{ ...cache.spells[0], mastery: 9 }] })).toBeUndefined();
    expect(readGrimoireCache({ ...cache, source: "https://autre.exemple/" } satisfies GrimoireCache)).toBeUndefined();
    expect(readGrimoireCache("{}")).toBeUndefined();
  });
});
