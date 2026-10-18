/**
 * Fichier lié (File System Access API, Chrome et Edge desktop) : HANDOFF §5.2.
 * Chaque enregistrement de la fiche est aussi écrit dans un fichier JSON choisi par l'utilisateur.
 */

/** Poignée de fichier avec les méthodes de permission (absentes des types DOM de TypeScript). */
export interface LinkHandle {
  readonly name: string;
  getFile(): Promise<{ text(): Promise<string>; lastModified: number }>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission?(desc: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission?(desc: { mode: "readwrite" }): Promise<PermissionState>;
}

export interface LinkedFile {
  handle: LinkHandle;
  name: string;
  /** Dernière date de modification connue du fichier : sert à détecter une modification ailleurs. */
  lastModified: number;
}

/** Résultat de l'écriture dans le fichier lié. */
export type FileSync =
  | { state: "written"; lastModified: number }
  /** Le fichier a été modifié ailleurs (synchro Drive…) : rien n'est écrit. */
  | { state: "conflict"; lastModified: number }
  /** Permission d'écriture absente ou refusée : la fiche reste dans le navigateur. */
  | { state: "permission" }
  | { state: "error"; message: string };

type PickerWindow = {
  showSaveFilePicker?: (opts: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<LinkHandle>;
};

/** Le bouton « Lier à un fichier… » n'est proposé que si l'API existe (HANDOFF §5.2, U6). */
export function supportsLinkedFiles(w: unknown = globalThis): boolean {
  return typeof (w as PickerWindow | undefined)?.showSaveFilePicker === "function";
}

/** Fait choisir ou créer un fichier .json. Rejette si l'utilisateur annule. */
export async function pickLinkedFile(suggestedName: string, w: unknown = globalThis): Promise<LinkHandle> {
  const picker = (w as PickerWindow).showSaveFilePicker;
  if (!picker) throw new Error("Fichier lié non pris en charge par ce navigateur");
  return picker({ suggestedName, types: [{ description: "Fiche de personnage (JSON)", accept: { "application/json": [".json"] } }] });
}

/**
 * Permission d'écriture. Au rechargement, le navigateur la redemande : `request` ne doit être vrai
 * que dans un geste de l'utilisateur (clic sur « Reprendre l'enregistrement »).
 */
export async function hasWritePermission(handle: LinkHandle, request = false): Promise<boolean> {
  const desc = { mode: "readwrite" } as const;
  if (!handle.queryPermission) return true;
  if ((await handle.queryPermission(desc)) === "granted") return true;
  if (!request || !handle.requestPermission) return false;
  return (await handle.requestPermission(desc)) === "granted";
}

export async function readLinkedFile(link: LinkedFile): Promise<{ text: string; lastModified: number }> {
  const file = await link.handle.getFile();
  return { text: await file.text(), lastModified: file.lastModified };
}

/**
 * Écrit le texte dans le fichier lié. Avant d'écrire, compare la date du fichier à la dernière
 * connue : si elle a changé, rien n'est écrit et le conflit est signalé, sauf avec `force`.
 */
export async function writeLinkedFile(link: LinkedFile, text: string, { force = false } = {}): Promise<FileSync> {
  try {
    if (!(await hasWritePermission(link.handle))) return { state: "permission" };
    const before = await link.handle.getFile();
    if (!force && before.lastModified !== link.lastModified) return { state: "conflict", lastModified: before.lastModified };
    const writable = await link.handle.createWritable();
    await writable.write(text);
    await writable.close();
    return { state: "written", lastModified: (await link.handle.getFile()).lastModified };
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotAllowedError") return { state: "permission" };
    return { state: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
