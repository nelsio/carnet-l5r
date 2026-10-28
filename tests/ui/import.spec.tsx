/** Import et export JSON (HANDOFF §8, U5). */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { importCharacter, migrate, serializeCharacter, type Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
const entry = (patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id: "kakita", character: base(), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", ...patch,
});
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const jsonFile = (data: unknown, name = "import.json") =>
  new File([typeof data === "string" ? data : JSON.stringify(data)], name, { type: "application/json" });
let ids = 0;

async function mount(entries: LibraryEntry[] = [entry()]) {
  const storage = memoryStorage();
  for (const e of entries) await storage.library.put(e);
  const view = render(<App storage={storage} newId={() => `new-${++ids}`} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return { storage, ...view };
}

async function chooseFile(file: File) {
  fireEvent.change(screen.getByLabelText("Fichier JSON à importer"), { target: { files: [file] } });
  return screen.findByRole("dialog", { name: `Importer « ${file.name} »` });
}

afterEach(() => vi.restoreAllMocks());

describe("Fusion dans la fiche ouverte", () => {
  const patch = {
    schemaVersion: 1,
    traits: { agility: 4 },
    skills: [{ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] }, { name: "kenjutsu", rank: 3 }],
    weapons: [{ name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3 }],
    foo: 1,
  };

  it("U5 : l'aperçu liste modifications, ajouts et avertissements ; « Annuler » ne change rien", async () => {
    const { storage } = await mount();
    const dialog = await chooseFile(jsonFile(patch));
    expect(within(dialog).getByRole("radio", { name: "Fusionner dans « Kakita Haruto »" })).toBeChecked();
    const updates = within(dialog).getByRole("region", { name: "Modifications" });
    expect(updates).toHaveTextContent("traits.agility : 3 → 4");
    expect(updates).toHaveTextContent("skills[Kenjutsu].rank : 2 → 3");
    const adds = within(dialog).getByRole("region", { name: "Ajouts" });
    expect(adds).toHaveTextContent("Compétence : Kyujutsu");
    expect(adds).toHaveTextContent("Arme : Yumi");
    expect(within(dialog).getByRole("region", { name: "Avertissements" })).toHaveTextContent("Clé inconnue ignorée : foo");

    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("5g3");
    expect(screen.queryByTestId("skill-pool-Kyujutsu")).toBeNull();
    await new Promise((r) => setTimeout(r, 600));
    expect((await storage.library.get("kakita"))?.character).toEqual(base());
  });

  it("« Appliquer » met à jour la fiche, qui est enregistrée", async () => {
    const { storage } = await mount();
    const dialog = await chooseFile(jsonFile(patch));
    fireEvent.click(within(dialog).getByRole("button", { name: "Appliquer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("7g4");
    expect(screen.getByTestId("skill-pool-Kyujutsu")).toHaveTextContent("4g3");
    await waitFor(async () => expect((await storage.library.get("kakita"))?.character.traits.agility).toBe(4), { timeout: 1500 });
  });

  it("un champ invalide refuse tout l'import, avec un message par champ", async () => {
    const { storage } = await mount();
    const dialog = await chooseFile(jsonFile({ schemaVersion: 1, traits: { agility: 11 }, name: "Autre" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("traits.agility : doit être un entier entre 1 et 10");
    expect(within(dialog).queryByRole("button", { name: "Appliquer" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(screen.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeInTheDocument();
    expect(await storage.library.list()).toHaveLength(1);
  });

  it("un fichier sans changement le dit ; Échap ferme la fenêtre", async () => {
    await mount();
    const dialog = await chooseFile(jsonFile(base()));
    expect(within(dialog).getByText(/Aucun changement/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Nouvelle fiche et consultation", () => {
  it("un JSON illisible est refusé", async () => {
    await mount([]);
    const dialog = await chooseFile(jsonFile("{ oups", "casse.json"));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Fichier illisible : ce n'est pas un JSON valide");
    expect(within(dialog).queryByRole("radio")).toBeNull();
  });

  it("depuis la Bibliothèque : « Nouvelle fiche » crée une entrée modifiable et l'ouvre", async () => {
    const { storage } = await mount([]);
    const dialog = await chooseFile(jsonFile(base(), "kakita-haruto-l5r.json"));
    expect(within(dialog).queryByRole("radio", { name: /Fusionner/ })).toBeNull();
    expect(within(dialog).getByRole("radio", { name: "Nouvelle fiche" })).toBeChecked();
    expect(dialog).toHaveTextContent("Kakita Haruto · Grue · École de duellistes Kakita · Rang 1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit : Compétences" })).toBeInTheDocument();
    expect((await storage.library.list()).map((e) => [e.mode, e.character])).toEqual([["edit", migrate(base())]]);
  });

  it("« Consultation » crée une entrée en lecture seule", async () => {
    const { storage } = await mount();
    const dialog = await chooseFile(jsonFile({ ...base(), name: "Bayushi Kaede" }));
    fireEvent.click(within(dialog).getByRole("radio", { name: "Consultation (MJ)" }));
    expect(dialog).toHaveTextContent(/en consultation : lecture seule/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(await screen.findByRole("heading", { level: 1, name: /Bayushi Kaede/ })).toHaveTextContent("Consultation");
    expect(screen.queryByRole("button", { name: "Edit : Compétences" })).toBeNull();
    expect((await storage.library.list()).find((e) => e.character.name === "Bayushi Kaede")?.mode).toBe("readonly");
  });

  it("une fiche complète invalide est refusée pour une nouvelle fiche", async () => {
    await mount([]);
    const dialog = await chooseFile(jsonFile({ name: "Incomplet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("traits");
    expect(within(dialog).queryByRole("button", { name: "Importer" })).toBeNull();
  });

  it("un fichier déposé sur la page ouvre la fenêtre d'import", async () => {
    const { container } = await mount([]);
    const file = jsonFile(base(), "depose.json");
    fireEvent.dragOver(container.querySelector(".wrap")!, { dataTransfer: { types: ["Files"], files: [file] } });
    fireEvent.drop(container.querySelector(".wrap")!, { dataTransfer: { types: ["Files"], files: [file] } });
    expect(await screen.findByRole("dialog", { name: "Importer « depose.json »" })).toBeInTheDocument();
  });
});

describe("Export", () => {
  function captureDownload() {
    const blobs: Blob[] = [];
    const names: string[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => {
      blobs.push(b);
      return "blob:fiche";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    return { blobs, names };
  }

  it("« Exporter la fiche » télécharge <nom>-l5r.json, JSON indenté avec schemaVersion", async () => {
    const { blobs, names } = captureDownload();
    await mount();
    click("Exporter la fiche");
    expect(names).toEqual(["kakita-haruto-l5r.json"]);
    expect(await blobs[0]!.text()).toBe(serializeCharacter(base()));
  });

  it("disponible en consultation, mais sans import", async () => {
    const { names } = captureDownload();
    await mount([entry({ mode: "readonly" })]);
    click("Exporter la fiche");
    expect(names).toEqual(["kakita-haruto-l5r.json"]);
    expect(screen.queryByRole("button", { name: /Importer/ })).toBeNull();
  });
});

describe("Exemple de fiche", () => {
  it("la Bibliothèque propose un exemple déjà rempli, valide et réimportable", async () => {
    const blobs: Blob[] = [];
    const names: string[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => { blobs.push(b); return "blob:exemple"; });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    const { storage } = await mount([]);
    click("Télécharger un exemple de fiche (JSON)");
    expect(names).toEqual(["exemple-fiche-l5r.json"]);
    const text = await blobs[0]!.text();
    const json = JSON.parse(text) as Character;
    expect(json).toMatchObject({ schemaVersion: 2, name: "Kakita Haruto" });
    expect(json.modifiers?.map((m) => m.name)).toEqual(["Voix"]);
    expect(importCharacter(json)).toEqual({ ok: true, character: json });

    const dialog = await chooseFile(new File([text], "exemple-fiche-l5r.json", { type: "application/json" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeInTheDocument();
    expect(screen.getByTestId("modifier-voix")).toHaveTextContent("+1g1 · d'office");
    expect(await storage.library.list()).toHaveLength(1);
  });

  it("aussi depuis une Bibliothèque déjà remplie", async () => {
    await mount();
    click("Carnet de Rokugan — ouvrir la bibliothèque");
    expect(await screen.findByRole("button", { name: "Télécharger un exemple de fiche (JSON)" })).toBeInTheDocument();
  });
});
