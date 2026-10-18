/** Fichier lié dans l'interface (HANDOFF §5.2, U6). */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { serializeCharacter, type Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../../reference/exemple-personnage.json";
import { FakeHandle } from "../helpers/fakeHandle";

const base = () => structuredClone(kakita) as Character;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const T = { timeout: 1500 };

async function mount(opts: { storage?: Storage; handle?: FakeHandle; win?: unknown; entry?: Partial<LibraryEntry> } = {}) {
  const storage = opts.storage ?? memoryStorage();
  if (!opts.storage) {
    await storage.library.put({ id: "a", character: base(), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", ...opts.entry });
  }
  const win = opts.win ?? { showSaveFilePicker: async () => opts.handle ?? new FakeHandle() };
  const view = render(<App storage={storage} win={win} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return { storage, ...view };
}

async function linked(handle = new FakeHandle("kakita-haruto-l5r.json")) {
  const r = await mount({ handle });
  click("Lier à un fichier…");
  await screen.findByText(/Lié à/);
  await waitFor(() => expect(handle.writes).toBe(1));
  return { ...r, handle };
}

describe("Proposition du fichier lié", () => {
  it("U6 : navigateur sans showSaveFilePicker → pas de bouton « Lier à un fichier »", async () => {
    await mount({ win: {} });
    expect(screen.getByRole("button", { name: "Exporter la fiche" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lier à un fichier/ })).toBeNull();
  });

  it("proposé quand le navigateur le permet (Chrome, Edge)", async () => {
    await mount();
    expect(screen.getByRole("button", { name: "Lier à un fichier…" })).toBeInTheDocument();
  });

  it("pas proposé pour une fiche en consultation", async () => {
    await mount({ entry: { mode: "readonly" } });
    expect(screen.queryByRole("button", { name: /Lier à un fichier/ })).toBeNull();
  });

  it("un choix annulé ne change rien", async () => {
    await mount({ win: { showSaveFilePicker: async () => { throw new DOMException("Annulé", "AbortError"); } } });
    click("Lier à un fichier…");
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/Lié à/)).toBeNull();
  });
});

describe("Fiche liée", () => {
  it("lier écrit aussitôt la fiche dans le fichier ; chaque modification y est enregistrée", async () => {
    const { handle, storage } = await linked();
    expect(handle.content).toBe(serializeCharacter(base()));
    expect(screen.getByText("kakita-haruto-l5r.json")).toBeInTheDocument();
    click("Ajouter 1 blessure");
    await waitFor(() => expect(JSON.parse(handle.content).wounds).toBe(1), T);
    expect((await storage.library.get("a"))?.linkedFile?.name).toBe("kakita-haruto-l5r.json");
  });

  it("« Délier » retire le lien sans toucher au fichier", async () => {
    const { handle, storage } = await linked();
    click("Délier");
    await waitFor(async () => expect((await storage.library.get("a"))?.linkedFile).toBeUndefined());
    const before = handle.content;
    click("Ajouter 1 blessure");
    await waitFor(async () => expect((await storage.library.get("a"))?.character.wounds).toBe(1), T);
    expect(handle.content).toBe(before);
    expect(screen.getByRole("button", { name: "Lier à un fichier…" })).toBeInTheDocument();
  });

  it("au rechargement, un bandeau propose de reprendre l'enregistrement ; sans clic, la fiche reste dans le navigateur", async () => {
    const { handle, storage, unmount } = await linked();
    unmount();
    handle.permission = "prompt";
    const writes = handle.writes;
    await mount({ storage, handle });
    const resume = screen.getByRole("button", { name: "Reprendre l'enregistrement dans kakita-haruto-l5r.json" });
    click("Ajouter 1 blessure");
    await waitFor(async () => expect((await storage.library.get("a"))?.character.wounds).toBe(1), T);
    expect(handle.writes).toBe(writes);

    fireEvent.click(resume);
    await waitFor(() => expect(JSON.parse(handle.content).wounds).toBe(1));
    expect(screen.queryByRole("button", { name: /Reprendre l'enregistrement/ })).toBeNull();
  });

  it("permission refusée : le bandeau le dit, la fiche reste dans le navigateur", async () => {
    const { handle, storage, unmount } = await linked();
    unmount();
    handle.permission = "prompt";
    handle.onRequest = "denied";
    await mount({ storage, handle });
    click("Reprendre l'enregistrement dans kakita-haruto-l5r.json");
    expect(await screen.findByText(/Permission refusée/)).toBeInTheDocument();
  });
});

describe("Conflit : fichier modifié ailleurs", () => {
  async function conflict() {
    const r = await linked();
    r.handle.touchElsewhere(serializeCharacter({ ...base(), honor: 8, notes: "Note ajoutée sur l'autre ordinateur" }));
    click("Ajouter 1 blessure");
    const banner = await screen.findByRole("alert", {}, T);
    expect(banner).toHaveTextContent("Le fichier a été modifié ailleurs");
    // Rien n'est écrit dans le fichier ; la fiche reste dans le navigateur.
    expect(JSON.parse(r.handle.content).honor).toBe(8);
    expect((await r.storage.library.get("a"))?.character.wounds).toBe(1);
    return { ...r, banner };
  }

  it("« Charger la version du fichier » remplace la fiche par celle du fichier", async () => {
    const { banner, handle, storage } = await conflict();
    fireEvent.click(within(banner).getByRole("button", { name: "Charger la version du fichier" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.getByText("Note ajoutée sur l'autre ordinateur")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Blessures subies" })).toHaveValue(0);
    await waitFor(async () => expect((await storage.library.get("a"))?.character.honor).toBe(8), T);
    expect(JSON.parse(handle.content).honor).toBe(8);
  });

  it("« Écraser avec ma version » écrit la fiche dans le fichier", async () => {
    const { banner, handle } = await conflict();
    fireEvent.click(within(banner).getByRole("button", { name: "Écraser avec ma version" }));
    await waitFor(() => expect(JSON.parse(handle.content).wounds).toBe(1));
    expect(JSON.parse(handle.content).honor).toBe(6.5);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("« Fusionner » ouvre l'aperçu ; après « Appliquer », la fiche fusionnée est écrite sans conflit", async () => {
    const { banner, handle } = await conflict();
    fireEvent.click(within(banner).getByRole("button", { name: "Fusionner" }));
    const dialog = await screen.findByRole("dialog", { name: "Fusionner « kakita-haruto-l5r.json »" });
    expect(within(dialog).queryByRole("radio")).toBeNull();
    const updates = within(dialog).getByRole("region", { name: "Modifications" });
    expect(updates).toHaveTextContent("honor : 6.5 → 8");
    expect(updates).toHaveTextContent("wounds : 1 → 0");
    fireEvent.click(within(dialog).getByRole("button", { name: "Appliquer" }));
    await waitFor(() => expect(handle.content).toContain("Note ajoutée"), T);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("« Fusionner » puis « Annuler » laisse le conflit en place", async () => {
    const { banner } = await conflict();
    fireEvent.click(within(banner).getByRole("button", { name: "Fusionner" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Le fichier a été modifié ailleurs");
  });

  it("un fichier lié qui ne contient pas une fiche valide est signalé", async () => {
    const r = await linked();
    r.handle.touchElsewhere("{ cassé");
    click("Ajouter 1 blessure");
    const banner = await screen.findByRole("alert", {}, T);
    fireEvent.click(within(banner).getByRole("button", { name: "Charger la version du fichier" }));
    expect(await screen.findByText(/ne contient pas une fiche valide/)).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Délier" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
