import { createContext, useContext, type Dispatch } from "react";
import type { Character } from "@carnet/core";
import type { GrimoireCache, LibraryEntry } from "../../storage";
import type { AppAction, AppState, EntryMode } from "./types";

/** État du fichier lié de la fiche ouverte (HANDOFF §5.2). */
export interface FileLinkState {
  /** none : pas de fichier lié ; permission : à reprendre par un clic ; conflict : modifié ailleurs. */
  state: "none" | "linked" | "permission" | "conflict" | "error";
  name: string | null;
  message?: string;
}

/** Opérations sur la bibliothèque locale, asynchrones (HANDOFF §5, §6.1). */
export interface LibraryApi {
  entries: LibraryEntry[];
  /** IndexedDB indisponible : rien ne survivra à la fermeture de l'onglet. */
  degraded: boolean;
  saveStatus: "idle" | "saved" | "error";
  create(): Promise<void>;
  open(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  showLibrary(): Promise<void>;
  /** Fiche en consultation → copie modifiable, ouverte aussitôt. */
  makeEditableCopy(): Promise<void>;
  /** Import « Nouvelle fiche » ou « Consultation » : nouvelle entrée, ouverte aussitôt. */
  importEntry(character: Character, mode: EntryMode): Promise<void>;
  /** Fichier lié : proposé seulement si le navigateur le permet (Chrome, Edge desktop). */
  file: FileLinkState & { supported: boolean };
  linkFile(): Promise<void>;
  /** Retire le lien sans toucher au fichier. */
  unlinkFile(): Promise<void>;
  /** Redemande la permission d'écriture (après un rechargement). */
  resumeFile(): Promise<void>;
  /** Conflit : « Charger la version du fichier ». */
  loadFileVersion(): Promise<void>;
  /** Conflit : « Écraser avec ma version ». */
  overwriteFile(): Promise<void>;
  /** Conflit : « Fusionner » (aperçu de fusion). */
  mergeFileVersion(): Promise<void>;
}

/** Import en cours : fichier choisi ou déposé, en attente d'une destination. */
export interface PendingImport {
  fileName: string;
  text: string;
  /** Fusion seulement (conflit avec le fichier lié). */
  mergeOnly?: boolean;
  /** Appelé après « Appliquer ». */
  onApplied?: () => void;
}

/** Grimoire du portail (lot 30, annexe N.4) : catalogue de sorts chargé à la demande. */
export interface GrimoireApi {
  status: "none" | "loading" | "ready" | "error";
  /** Dernier catalogue chargé (gardé si une actualisation échoue). */
  cache?: GrimoireCache;
  /** « Actualiser » a échoué : l'ancien catalogue est gardé. */
  refreshFailed: boolean;
  /** Charge ou actualise ; seul appel réseau du Carnet, toujours sur un clic. */
  load(): Promise<void>;
}

export interface Store {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  /** Tirage d'un d10 (1..10), injectable pour les tests. */
  rng: () => number;
  library: LibraryApi;
  grimoire: GrimoireApi;
  /** Ouvre la fenêtre d'import pour un fichier choisi ou déposé. */
  startImport(file: File): void;
  /** Ouvre la fenêtre « Importer depuis une fiche papier » (lot 42). */
  startPhotoImport(): void;
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore hors de StoreContext");
  return store;
}

/** La fiche ouverte (les composants qui l'utilisent ne sont rendus que s'il y en a une). */
export function useCharacter(): Character {
  const { state } = useStore();
  if (!state.character) throw new Error("Aucune fiche ouverte");
  return state.character;
}
