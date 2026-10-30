import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadGrimoire, readGrimoireCache, type GrimoireCache, type LoadOptions, type Storage } from "../storage";
import type { GrimoireApi } from "./store";

/**
 * Grimoire du portail (lot 30, annexe N.4) : cache relu au démarrage, chargement seulement sur un clic.
 * Aucun rechargement automatique ; une actualisation ratée garde l'ancien cache.
 */
export function useGrimoire(storage: Storage, opts: LoadOptions = {}): GrimoireApi {
  const [cache, setCache] = useState<GrimoireCache | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const options = useRef(opts);

  useEffect(() => {
    let live = true;
    void storage.grimoire.get().then((raw) => {
      const read = readGrimoireCache(raw);
      if (live && read) setCache((current) => current ?? read);
    }, () => {});
    return () => {
      live = false;
    };
  }, [storage]);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const next = await loadGrimoire(options.current);
      setCache(next);
      await storage.grimoire.set(next).catch(() => {});
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [storage]);

  const status: GrimoireApi["status"] = loading ? "loading" : cache ? "ready" : failed ? "error" : "none";
  const refreshFailed = !!cache && failed;
  return useMemo(() => ({ status, cache, refreshFailed, load }), [status, cache, refreshFailed, load]);
}
