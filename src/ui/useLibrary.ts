import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { createCharacter, type Character } from "@carnet/core";
import { requestPersistence, type LibraryEntry, type Storage } from "../storage";
import type { AppAction, AppState, LibraryApi } from "./store";

/** Délai de la sauvegarde automatique après la dernière modification (HANDOFF §5.1). */
export const SAVE_DELAY_MS = 500;

const byDate = (a: LibraryEntry, b: LibraryEntry) => b.updatedAt.localeCompare(a.updatedAt);

export interface LibraryOptions {
  now?: () => Date;
  newId?: () => string;
}

/**
 * Relie l'état de l'application à la bibliothèque : ouverture au démarrage,
 * sauvegarde automatique, préférences, et actions de l'écran Bibliothèque.
 */
export function useLibrary(storage: Storage, state: AppState, dispatch: Dispatch<AppAction>, opts: LibraryOptions = {}) {
  const { now = () => new Date(), newId = () => crypto.randomUUID() } = opts;
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<LibraryApi["saveStatus"]>("idle");
  /** Dernière version enregistrée de la fiche ouverte. */
  const saved = useRef<{ id: string; character: Character } | null>(null);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  const refresh = useCallback(async () => {
    setEntries((await storage.library.list()).sort(byDate));
  }, [storage]);

  const openEntry = useCallback(async (entry: LibraryEntry, edit = false) => {
    saved.current = { id: entry.id, character: entry.character };
    dispatch({ type: "open", id: entry.id, character: entry.character, mode: entry.mode, edit });
    setSaveStatus("idle");
    await storage.prefs.set({ lastOpenedId: entry.id });
  }, [storage, dispatch]);

  // Démarrage : thème mémorisé, puis dernière fiche ouverte (ou la plus récente) ; sinon la Bibliothèque.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const prefs = await storage.prefs.get();
      const list = (await storage.library.list()).sort(byDate);
      if (cancelled) return;
      if (prefs.theme) dispatch({ type: "theme", theme: prefs.theme });
      setEntries(list);
      const last = list.find((e) => e.id === prefs.lastOpenedId) ?? list[0];
      if (last) await openEntry(last);
      setReady(true);
      await requestPersistence(storage);
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, dispatch, openEntry]);

  // Thème mémorisé dans les préférences.
  const theme = state.ui.theme;
  useEffect(() => {
    if (ready) void storage.prefs.set({ theme });
  }, [ready, theme, storage]);

  const save = useCallback(async () => {
    const { entryId, character, mode } = latest.current;
    if (!entryId || !character || mode !== "edit") return;
    if (saved.current?.id === entryId && saved.current.character === character) return;
    const entry: LibraryEntry = { id: entryId, character, mode, updatedAt: now().toISOString() };
    try {
      await storage.library.put(entry);
      saved.current = { id: entryId, character };
      setSaveStatus("saved");
      setEntries((list) => [entry, ...list.filter((e) => e.id !== entryId)]);
    } catch (e) {
      console.error("Échec de l'enregistrement", e);
      setSaveStatus("error");
    }
  }, [storage, now]);

  // Sauvegarde automatique, 500 ms après la dernière modification.
  useEffect(() => {
    if (!ready || !state.character || state.mode !== "edit") return;
    const t = setTimeout(() => void save(), SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready, state.character, state.mode, save]);

  const api: LibraryApi = {
    entries,
    degraded: storage.degraded,
    saveStatus,
    async create() {
      await save();
      const entry: LibraryEntry = { id: newId(), character: createCharacter(), mode: "edit", updatedAt: now().toISOString() };
      await storage.library.put(entry);
      await openEntry(entry, true);
      await refresh();
    },
    async open(id) {
      await save();
      const entry = await storage.library.get(id);
      if (entry) await openEntry(entry);
    },
    async remove(id) {
      await storage.library.remove(id);
      if (latest.current.entryId === id) {
        saved.current = null;
        dispatch({ type: "library" });
        await storage.prefs.set({ lastOpenedId: undefined });
      }
      await refresh();
    },
    async showLibrary() {
      await save();
      dispatch({ type: "library" });
      await refresh();
    },
    async makeEditableCopy() {
      const { character } = latest.current;
      if (character) await api.importEntry(structuredClone(character), "edit");
    },
    async importEntry(character, mode) {
      await save();
      const entry: LibraryEntry = { id: newId(), character, mode, updatedAt: now().toISOString() };
      await storage.library.put(entry);
      await openEntry(entry);
      await refresh();
    },
  };
  return { ready, api };
}
