/**
 * Grimoire du portail (lot 30, HANDOFF annexe N.4) : chargement à la demande des fichiers de sorts, et cache.
 * Seule requête réseau du Carnet, et seulement sur un clic du joueur : lecture seule, sans cookie ni référent.
 */
import { z } from "zod";
import { GrimoireSpellSchema, readGrimoireFile, type GrimoireSpell } from "@carnet/core";
import { GRIMOIRE_FILES, PORTAL_BASE } from "../rules/portal";

/** Liste des sorts gardée dans le navigateur ; seul « Actualiser » la recharge. */
export interface GrimoireCache {
  v: 1;
  /** Date ISO du chargement. */
  fetchedAt: string;
  /** PORTAL_BASE au moment du chargement : un autre portail invalide le cache. */
  source: string;
  /** Fichiers lus sur GRIMOIRE_FILES.length. */
  files: number;
  spells: GrimoireSpell[];
}

/** Grimoire injoignable : réseau coupé, délai dépassé, ou aucun fichier lisible. */
export class GrimoireOfflineError extends Error {
  constructor(readonly reason: "network" | "timeout" | "unreadable", message: string) {
    super(message);
    this.name = "GrimoireOfflineError";
  }
}

export const GRIMOIRE_TIMEOUT_MS = 15_000;
/** Un fichier de plus de 1 Mo est refusé (les six font environ 110 Ko). */
export const GRIMOIRE_MAX_BYTES = 1_000_000;

export interface LoadOptions {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  now?: () => Date;
}

async function readFile(url: string, fetchFn: typeof globalThis.fetch, signal: AbortSignal): Promise<GrimoireSpell[]> {
  const res = await fetchFn(url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-cache", signal });
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
  const declared = Number(res.headers.get("content-length"));
  if (declared > GRIMOIRE_MAX_BYTES) throw new Error(`${url} : fichier trop gros`);
  const text = await res.text();
  if (new TextEncoder().encode(text).length > GRIMOIRE_MAX_BYTES) throw new Error(`${url} : fichier trop gros`);
  return readGrimoireFile(text);
}

/**
 * Charge les fichiers de sorts en parallèle (15 s au plus pour l'ensemble).
 * Échec partiel : le cache garde les fichiers lus (`files` < 6). Aucun fichier lu : GrimoireOfflineError.
 */
export async function loadGrimoire({ fetch: fetchFn = globalThis.fetch.bind(globalThis), timeoutMs = GRIMOIRE_TIMEOUT_MS, now = () => new Date() }: LoadOptions = {}): Promise<GrimoireCache> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
      reject(new GrimoireOfflineError("timeout", "Le grimoire ne répond pas (délai dépassé)"));
    }, timeoutMs);
    ctrl.signal.addEventListener("abort", () => clearTimeout(id));
  });
  timeout.catch(() => {});
  const all = Promise.allSettled(GRIMOIRE_FILES.map((url) => readFile(url, fetchFn, ctrl.signal)));
  let results: PromiseSettledResult<GrimoireSpell[]>[];
  try {
    results = await Promise.race([all, timeout]);
  } finally {
    if (!timedOut) ctrl.abort();
  }
  const read = results.filter((r): r is PromiseFulfilledResult<GrimoireSpell[]> => r.status === "fulfilled");
  if (!read.length) {
    const network = results.some((r) => r.status === "rejected" && r.reason instanceof TypeError);
    throw new GrimoireOfflineError(network ? "network" : "unreadable", "Le grimoire ne répond pas");
  }
  return { v: 1, fetchedAt: now().toISOString(), source: PORTAL_BASE, files: read.length, spells: read.flatMap((r) => r.value) };
}

const GrimoireCacheSchema = z.object({
  v: z.literal(1),
  fetchedAt: z.iso.datetime(),
  source: z.string(),
  files: z.number().int().min(1).max(GRIMOIRE_FILES.length),
  spells: z.array(GrimoireSpellSchema),
});

/** Cache relu au démarrage, revalidé ; ignoré s'il est invalide ou vient d'un autre portail. */
export function readGrimoireCache(raw: unknown): GrimoireCache | undefined {
  const r = GrimoireCacheSchema.safeParse(raw);
  return r.success && r.data.source === PORTAL_BASE ? (r.data as GrimoireCache) : undefined;
}
