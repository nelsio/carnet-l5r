import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { createCharacter, exportFileName, importCharacter, parseCharacterFile, type Character } from "@carnet/core";
import {
  hasWritePermission, pickLinkedFile, readLinkedFile, requestPersistence, supportsLinkedFiles,
  type LibraryEntry, type LinkedFile, type SaveReport, type Storage,
} from "../storage";
import type { AppAction, AppState, FileLinkState, LibraryApi, PendingImport } from "./store";

/** Délai de la sauvegarde automatique après la dernière modification (HANDOFF §5.1). */
export const SAVE_DELAY_MS = 500;

const byDate = (a: LibraryEntry, b: LibraryEntry) => b.updatedAt.localeCompare(a.updatedAt);

export interface LibraryOptions {
  now?: () => Date;
  newId?: () => string;
  /** Fenêtre globale (sélecteur de fichier), injectable pour les tests. */
  win?: unknown;
}

const NO_FILE: FileLinkState = { state: "none", name: null };

/**
 * Relie l'état de l'application à la bibliothèque : ouverture au démarrage,
 * sauvegarde automatique, préférences, et actions de l'écran Bibliothèque.
 */
export function useLibrary(
  storage: Storage,
  state: AppState,
  dispatch: Dispatch<AppAction>,
  onMergeRequest: (pending: PendingImport) => void,
  opts: LibraryOptions = {},
) {
  const { now = () => new Date(), newId = () => crypto.randomUUID(), win = globalThis } = opts;
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<LibraryApi["saveStatus"]>("idle");
  /** Dernière version enregistrée de la fiche ouverte. */
  const saved = useRef<{ id: string; character: Character } | null>(null);
  /** Fichier lié de la fiche ouverte (HANDOFF §5.2). */
  const link = useRef<LinkedFile | undefined>(undefined);
  const [file, setFile] = useState<FileLinkState>(NO_FILE);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  const refresh = useCallback(async () => {
    setEntries((await storage.library.list()).sort(byDate));
  }, [storage]);

  const openEntry = useCallback(async (entry: LibraryEntry, edit = false) => {
    saved.current = { id: entry.id, character: entry.character };
    link.current = entry.linkedFile;
    setFile(NO_FILE);
    // Au rechargement, la permission d'écriture doit être redemandée par un clic.
    if (entry.linkedFile) {
      const granted = await hasWritePermission(entry.linkedFile.handle).catch(() => false);
      setFile({ state: granted ? "linked" : "permission", name: entry.linkedFile.name });
    }
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
      // IndexedDB fait foi face au cache de localStorage (annexe I.1.8).
      dispatch({ type: "theme", theme: prefs.theme ?? "auto" });
      if (prefs.showDiceRoller) dispatch({ type: "diceRoller", show: true });
      if (prefs.woundMultiplier) dispatch({ type: "woundMultiplier", value: prefs.woundMultiplier });
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

  // Thème, lanceur de dés et multiplicateur de blessures mémorisés dans les préférences.
  const { theme, showDiceRoller, woundMultiplier } = state.ui;
  useEffect(() => {
    if (ready) void storage.prefs.set({ theme, showDiceRoller, woundMultiplier });
  }, [ready, theme, showDiceRoller, woundMultiplier, storage]);

  /** Bilan de l'écriture du fichier lié. */
  const applyReport = useCallback((report: SaveReport) => {
    const l = link.current;
    if (!l || !report.file) return;
    const f = report.file;
    if (f.state === "written") l.lastModified = f.lastModified;
    setFile(f.state === "written" ? { state: "linked", name: l.name }
      : f.state === "error" ? { state: "error", name: l.name, message: f.message }
        : { state: f.state, name: l.name });
  }, []);

  /**
   * Enregistre la fiche ouverte (et son fichier lié). `always` : même sans modification ;
   * `force` : écrase le fichier même s'il a été modifié ailleurs.
   */
  const save = useCallback(async ({ always = false, force = false } = {}) => {
    const { entryId, character, mode } = latest.current;
    if (!entryId || !character || mode !== "edit") return;
    if (!always && saved.current?.id === entryId && saved.current.character === character) return;
    const entry: LibraryEntry = { id: entryId, character, mode, updatedAt: now().toISOString(), linkedFile: link.current };
    try {
      applyReport(await storage.library.put(entry, { force }));
      saved.current = { id: entryId, character };
      setSaveStatus("saved");
      setEntries((list) => [entry, ...list.filter((e) => e.id !== entryId)]);
    } catch (e) {
      console.error("Échec de l'enregistrement", e);
      setSaveStatus("error");
    }
  }, [storage, now, applyReport]);

  // Sauvegarde automatique, 500 ms après la dernière modification.
  useEffect(() => {
    if (!ready || !state.character || state.mode !== "edit") return;
    const t = setTimeout(() => void save(), SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready, state.character, state.mode, save]);

  // Onglet masqué, fermé ou rechargé : la modification en attente est enregistrée sans attendre.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") void save();
    };
    const onPageHide = () => void save();
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [save]);

  const api: LibraryApi = {
    entries,
    degraded: storage.degraded,
    saveStatus,
    file: { ...file, supported: supportsLinkedFiles(win) },
    async linkFile() {
      const c = latest.current.character;
      if (!c) return;
      let handle;
      try {
        handle = await pickLinkedFile(exportFileName(c), win);
      } catch {
        return; // Choix annulé.
      }
      const current = await handle.getFile();
      link.current = { handle, name: handle.name, lastModified: current.lastModified };
      setFile({ state: "linked", name: handle.name });
      await save({ always: true, force: true });
    },
    async unlinkFile() {
      link.current = undefined;
      setFile(NO_FILE);
      await save({ always: true });
    },
    async resumeFile() {
      const l = link.current;
      if (!l) return;
      if (await hasWritePermission(l.handle, true)) await save({ always: true });
      else setFile({ state: "permission", name: l.name, message: "Permission refusée : la fiche reste enregistrée dans ce navigateur." });
    },
    async loadFileVersion() {
      const l = link.current;
      if (!l) return;
      const { text, lastModified } = await readLinkedFile(l);
      const parsed = parseCharacterFile(text);
      const result = parsed.ok ? importCharacter(parsed.json) : parsed;
      if (!result.ok) {
        const detail = result.errors.map((e) => (e.path ? `${e.path} : ${e.message}` : e.message)).join(" ; ");
        setFile({ state: "error", name: l.name, message: `Le fichier ne contient pas une fiche valide (${detail}).` });
        return;
      }
      l.lastModified = lastModified;
      setFile({ state: "linked", name: l.name });
      dispatch({ type: "replaceCharacter", character: result.character });
    },
    async overwriteFile() {
      await save({ always: true, force: true });
    },
    async mergeFileVersion() {
      const l = link.current;
      if (!l) return;
      const { text, lastModified } = await readLinkedFile(l);
      onMergeRequest({
        fileName: l.name, text, mergeOnly: true,
        // La version du fichier devient la référence : la fiche fusionnée l'écrasera sans conflit.
        onApplied: () => {
          l.lastModified = lastModified;
          setFile({ state: "linked", name: l.name });
        },
      });
    },
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
