import type { Character } from "@carnet/core";
import type { FileSync, LinkedFile } from "./linkedFile";

/** Une fiche de la bibliothèque locale (HANDOFF §3.2). */
export interface LibraryEntry {
  /** UUID local. */
  id: string;
  character: Character;
  /** `readonly` : fiche importée en consultation (MJ). */
  mode: "edit" | "readonly";
  /** Date ISO de la dernière modification. */
  updatedAt: string;
  /** Fichier lié (Chrome et Edge desktop uniquement). */
  linkedFile?: LinkedFile;
}

/** Compte rendu d'un enregistrement : écriture du fichier lié, s'il y en a un. */
export interface SaveReport {
  file?: FileSync;
}

/** Accès à la bibliothèque, indépendant de l'interface (HANDOFF §5). */
export interface LibraryStore {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | undefined>;
  /** Enregistre, puis écrit dans le fichier lié s'il y en a un (sauf conflit, sauf avec `force`). */
  put(entry: LibraryEntry, opts?: { force?: boolean }): Promise<SaveReport>;
  remove(id: string): Promise<void>;
}

/** Préférences, dans un magasin séparé : thème, lanceur de dés, multiplicateur de blessures, dernière fiche ouverte. */
export interface Prefs {
  theme?: "auto" | "light" | "dark";
  /** Bouton « Lancer » et résultats dans les lanceurs ; masqué par défaut (HANDOFF §6.2). */
  showDiceRoller?: boolean;
  /** Multiplicateur des niveaux de blessure après Indemne : Terre × 2 par défaut (annexe E-d). */
  woundMultiplier?: number;
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
