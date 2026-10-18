/** Fichier lié, API simulée (HANDOFF §5.2, §10.2 : S3, S4, S5). */
import { describe, expect, it } from "vitest";
import { serializeCharacter, type Character } from "@carnet/core";
import {
  hasWritePermission, LinkedLibrary, MemoryLibrary, pickLinkedFile, readLinkedFile, supportsLinkedFiles, writeLinkedFile,
  type LibraryEntry, type LinkHandle, type LinkedFile,
} from "../../src/storage";
import kakita from "../../reference/exemple-personnage.json";
import { FakeHandle } from "../helpers/fakeHandle";

const base = () => structuredClone(kakita) as Character;

const link = (handle: FakeHandle): LinkedFile => ({ handle, name: handle.name, lastModified: handle.lastModified });
const entry = (linkedFile?: LinkedFile, character = base()): LibraryEntry => ({
  id: "a", character, mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", linkedFile,
});

describe("Bibliothèque avec fichier lié", () => {
  it("S3 : put écrit le fichier avec le JSON de la fiche, et retient sa nouvelle date", async () => {
    const handle = new FakeHandle();
    const lib = new LinkedLibrary(new MemoryLibrary());
    const report = await lib.put(entry(link(handle)));
    expect(report.file).toEqual({ state: "written", lastModified: 1001 });
    expect(handle.content).toBe(serializeCharacter(base()));
    expect((await lib.get("a"))?.linkedFile?.lastModified).toBe(1001);

    // Écritures suivantes : la date connue suit, pas de faux conflit.
    const next = (await lib.get("a"))!;
    const report2 = await lib.put({ ...next, character: { ...base(), wounds: 3 } });
    expect(report2.file?.state).toBe("written");
    expect(JSON.parse(handle.content).wounds).toBe(3);
  });

  it("S4 : fichier modifié ailleurs avant l'écriture → pas d'écriture, conflit remonté", async () => {
    const handle = new FakeHandle();
    const lib = new LinkedLibrary(new MemoryLibrary());
    const linked = link(handle);
    handle.touchElsewhere('{"name":"version Drive"}');
    const report = await lib.put(entry(linked, { ...base(), wounds: 5 }));
    expect(report.file).toEqual({ state: "conflict", lastModified: 1100 });
    expect(handle.content).toBe('{"name":"version Drive"}');
    expect(handle.writes).toBe(0);
    // La fiche reste enregistrée dans le navigateur.
    expect((await lib.get("a"))?.character.wounds).toBe(5);

    // « Écraser avec ma version »
    const forced = await lib.put(entry(linked, { ...base(), wounds: 5 }), { force: true });
    expect(forced.file?.state).toBe("written");
    expect(JSON.parse(handle.content).wounds).toBe(5);
  });

  it("S5 : permission refusée → fiche sauvée dans le navigateur, état « non lié » exposé", async () => {
    const handle = new FakeHandle("kakita.json", "prompt", "denied");
    const lib = new LinkedLibrary(new MemoryLibrary());
    const report = await lib.put(entry(link(handle), { ...base(), wounds: 2 }));
    expect(report.file).toEqual({ state: "permission" });
    expect(handle.writes).toBe(0);
    expect((await lib.get("a"))?.character.wounds).toBe(2);
    expect(await hasWritePermission(handle, true)).toBe(false);
  });

  it("sans fichier lié, put n'écrit que dans le navigateur", async () => {
    const lib = new LinkedLibrary(new MemoryLibrary());
    expect(await lib.put(entry())).toEqual({});
    expect(await lib.list()).toHaveLength(1);
    await lib.remove("a");
    expect(await lib.list()).toHaveLength(0);
  });
});

describe("API du fichier lié", () => {
  it("permission : déjà accordée, accordée sur demande, ou API sans permission", async () => {
    expect(await hasWritePermission(new FakeHandle())).toBe(true);
    const prompt = new FakeHandle("f.json", "prompt", "granted");
    expect(await hasWritePermission(prompt)).toBe(false);
    expect(await hasWritePermission(prompt, true)).toBe(true);
    const bare: LinkHandle = { name: "f.json", getFile: async () => ({ text: async () => "", lastModified: 0 }), createWritable: async () => ({ write: async () => {}, close: async () => {} }) };
    expect(await hasWritePermission(bare)).toBe(true);
    const noRequest = { ...bare, queryPermission: async () => "prompt" as PermissionState };
    expect(await hasWritePermission(noRequest, true)).toBe(false);
  });

  it("une permission retirée pendant l'écriture est signalée comme permission", async () => {
    const handle = new FakeHandle();
    handle.queryPermission = async () => "granted";
    handle.permission = "denied";
    expect(await writeLinkedFile(link(handle), "{}")).toEqual({ state: "permission" });
  });

  it("une autre erreur d'écriture est signalée", async () => {
    const handle = new FakeHandle();
    handle.createWritable = async () => { throw new Error("disque plein"); };
    expect(await writeLinkedFile(link(handle), "{}")).toEqual({ state: "error", message: "disque plein" });
    handle.createWritable = async () => { throw "bizarre"; };
    expect(await writeLinkedFile(link(handle), "{}")).toEqual({ state: "error", message: "bizarre" });
  });

  it("lit le contenu et la date du fichier", async () => {
    const handle = new FakeHandle();
    handle.touchElsewhere("{}");
    expect(await readLinkedFile(link(handle))).toEqual({ text: "{}", lastModified: 1100 });
  });

  it("U6 (moteur) : proposé seulement si showSaveFilePicker existe", async () => {
    expect(supportsLinkedFiles({})).toBe(false);
    expect(supportsLinkedFiles(undefined)).toBe(false);
    const handle = new FakeHandle();
    const calls: unknown[] = [];
    const w = { showSaveFilePicker: async (o: unknown) => { calls.push(o); return handle; } };
    expect(supportsLinkedFiles(w)).toBe(true);
    expect(await pickLinkedFile("kakita-haruto-l5r.json", w)).toBe(handle);
    expect(calls[0]).toMatchObject({ suggestedName: "kakita-haruto-l5r.json", types: [{ accept: { "application/json": [".json"] } }] });
    await expect(pickLinkedFile("x.json", {})).rejects.toThrow(/non pris en charge/);
  });
});
