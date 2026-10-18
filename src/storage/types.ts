import type { Character } from "@carnet/core";

/** Une fiche de la bibliothèque locale (HANDOFF §3.2). Le fichier lié arrive au lot 7. */
export interface LibraryEntry {
  /** UUID local. */
  id: string;
  character: Character;
  /** `readonly` : fiche importée en consultation (MJ). */
  mode: "edit" | "readonly";
  /** Date ISO de la dernière modification. */
  updatedAt: string;
}

/** Accès à la bibliothèque, indépendant de l'interface (HANDOFF §5). */
export interface LibraryStore {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | undefined>;
  put(entry: LibraryEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Préférences, dans un magasin séparé : thème, dernière fiche ouverte. */
export interface Prefs {
  theme?: "auto" | "light" | "dark";
  lastOpenedId?: string;
  persistRequested?: boolean;
}

export interface PrefsStore {
  get(): Promise<Prefs>;
  set(patch: Partial<Prefs>): Promise<void>;
}

export interface Storage {
  library: LibraryStore;
  prefs: PrefsStore;
  /** IndexedDB indisponible : tout vit en mémoire et sera perdu en fermant l'onglet. */
  degraded: boolean;
}
