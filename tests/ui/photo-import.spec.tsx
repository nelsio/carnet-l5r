/** Import depuis une fiche papier : fenêtre et points d'entrée (lot 42, annexe S). */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPhotoPrompt, migrate, type Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const reply = readFileSync(resolve("tests/fixtures/photo-reponse.txt"), "utf8");
const TITLE = "Importer depuis une fiche papier";
const entry = (patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id: "kakita", character: migrate(structuredClone(kakita) as Character), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", ...patch,
});
let ids = 0;

async function mount(entries: LibraryEntry[] = []) {
  const storage = memoryStorage();
  for (const e of entries) await storage.library.put(e);
  const view = render(<App storage={storage} newId={() => `new-${++ids}`} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return { storage, ...view };
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Depuis une photo…" }));
  return screen.getByRole("dialog", { name: TITLE });
}

function paste(dialog: HTMLElement, text: string) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Réponse de l'IA" }), { target: { value: text } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Vérifier" }));
}

afterEach(() => vi.restoreAllMocks());

describe("Points d'entrée", () => {
  it("Bibliothèque vide : troisième façon de commencer, étapes Photographier · Demander · Coller", async () => {
    await mount();
    const start = screen.getByRole("region", { name: "Pas encore de personnage ?" });
    expect(start).toHaveTextContent("Trois façons de commencer.");
    const photo = within(start).getAllByRole("article")[2]!;
    expect(within(photo).getByRole("heading")).toHaveTextContent("Depuis une fiche papier");
    expect(within(photo).getAllByRole("listitem").map((li) => li.querySelector(".step-s")?.textContent)).toEqual(["Photographier", "Demander", "Coller"]);
    const button = within(photo).getByRole("button", { name: "Depuis une photo…" });
    expect(button).not.toHaveClass("accent");
    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: TITLE })).toBeInTheDocument();
  });

  it("Bibliothèque avec fiches : troisième carte compacte, kanji 写", async () => {
    await mount([entry()]);
    fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));
    const newchar = await screen.findByRole("region", { name: "Un nouveau personnage ?" });
    const photo = within(newchar).getAllByRole("article")[2]!;
    expect(photo).toHaveClass("start-opt", "compact");
    expect(photo).toHaveTextContent("写");
    expect(photo).toHaveTextContent("Photos de ta fiche, lues par l'IA de ton choix, puis vérifiées ici.");
    fireEvent.click(within(photo).getByRole("button", { name: "Depuis une photo…" }));
    expect(screen.getByRole("dialog", { name: TITLE })).toBeInTheDocument();
  });

  it("Fiche ouverte : bouton après « Importer un JSON… », phrase d'aide ; fusion par défaut", async () => {
    await mount([entry()]);
    const buttons = within(screen.getByRole("heading", { name: "Fichier" }).parentElement!).getAllByRole("button").map((b) => b.textContent);
    expect(buttons.indexOf("Depuis une photo…")).toBe(buttons.indexOf("Importer un JSON…") + 1);
    expect(screen.getByText(/L'import peut aussi fusionner un fichier ou une fiche papier dans cette fiche/)).toBeInTheDocument();
    paste(openDialog(), reply);
    expect(screen.getByRole("radio", { name: "Fusionner dans « Kakita Haruto »" })).toBeChecked();
  });

  it("Consultation : pas de bouton « Depuis une photo… »", async () => {
    await mount([entry({ mode: "readonly" })]);
    expect(screen.getByRole("button", { name: "Exporter la fiche" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Depuis une photo…" })).toBeNull();
  });
});

describe("Fenêtre", () => {
  it("copie le prompt : « Copié » puis pastille pleine", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await mount();
    const dialog = openDialog();
    expect(within(dialog).getByText("L'IA lit tes photos et renvoie ta fiche au format du Carnet. Tu vérifies avant d'importer.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Copier le prompt" }));
    expect(await within(dialog).findByRole("status")).toHaveTextContent("Copié");
    expect(writeText).toHaveBeenCalledWith(buildPhotoPrompt());
    expect(dialog.querySelector(".pstep")).toHaveClass("done");
    vi.unstubAllGlobals();
  });

  it("presse-papiers refusé : le prompt est déplié et sélectionné", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn().mockRejectedValue(new Error("refusé")) } });
    await mount();
    const dialog = openDialog();
    const details = dialog.querySelector("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(within(dialog).getByRole("button", { name: "Copier le prompt" }));
    await waitFor(() => expect(details.open).toBe(true));
    expect(window.getSelection()?.toString()).toBe(buildPhotoPrompt());
    expect(within(dialog).queryByRole("status")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("« Vérifier » désactivé tant que le champ est vide ; une réponse sans JSON est refusée", async () => {
    await mount();
    const dialog = openDialog();
    const check = within(dialog).getByRole("button", { name: "Vérifier" });
    expect(check).toBeDisabled();
    const box = within(dialog).getByRole("textbox", { name: "Réponse de l'IA" });
    expect(box).toHaveAttribute("spellcheck", "false");
    fireEvent.change(box, { target: { value: "   " } });
    expect(check).toBeDisabled();
    paste(dialog, "Je n'arrive pas à lire la photo.");
    expect(within(dialog).getByRole("alert")).toHaveTextContent("La réponse ne contient pas de JSON.");
    expect(within(dialog).queryByRole("button", { name: "Importer" })).toBeNull();
  });

  it("encadré « À vérifier », puis import en nouvelle fiche, qui s'ouvre", async () => {
    const { storage } = await mount();
    const dialog = openDialog();
    paste(dialog, reply);
    const verify = within(dialog).getByRole("region", { name: "À vérifier sur ta fiche (3)" });
    const lines = within(verify).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual([
      "Intelligence : 2 (traits.intelligence)",
      "Rang de Connaissance : Outremonde : 2 (skills[6].rank)",
      "Gloire : 2.1 (glory)",
    ]);
    expect(verify).toHaveTextContent("L'IA a eu du mal à lire ces valeurs.");
    expect(within(dialog).getByRole("radio", { name: "Nouvelle fiche" })).toBeChecked();
    expect(dialog).toHaveTextContent("Hiruma Daisuke · Crabe · École de bushi Hiruma · Rang 3");
    expect(dialog.querySelectorAll(".pstep")[2]).toHaveClass("done");

    fireEvent.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Hiruma Daisuke" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    const [saved] = await storage.library.list();
    expect(saved!.character).not.toHaveProperty("_aVerifier");
    expect(saved!.character.weapons.map((w) => w.name)).toEqual(["Katana", "Wakizashi", "Daikyu"]);
  });

  it("modifier le texte collé efface le résultat", async () => {
    await mount();
    const dialog = openDialog();
    paste(dialog, reply);
    expect(within(dialog).getByRole("button", { name: "Importer" })).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Réponse de l'IA" }), { target: { value: `${reply} ` } });
    expect(within(dialog).queryByRole("button", { name: "Importer" })).toBeNull();
    expect(within(dialog).queryByRole("region", { name: /À vérifier/ })).toBeNull();
    expect(within(dialog).queryByRole("radio")).toBeNull();
  });

  it("fusion sur la fiche ouverte : aperçu sans avertissement _aVerifier, puis Appliquer", async () => {
    const { storage } = await mount([entry()]);
    const dialog = openDialog();
    paste(dialog, reply);
    expect(within(dialog).getByRole("region", { name: "Modifications" })).toHaveTextContent("traits.agility : 3 → 4");
    expect(within(dialog).queryByRole("region", { name: "Avertissements" })).toBeNull();
    expect(dialog).not.toHaveTextContent("Clé inconnue");
    fireEvent.click(within(dialog).getByRole("button", { name: "Appliquer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(async () => expect((await storage.library.get("kakita"))?.character.traits.agility).toBe(4), { timeout: 1500 });
    expect((await storage.library.get("kakita"))?.character).not.toHaveProperty("_aVerifier");
  });

  it("Échap et clic sur le fond ferment la fenêtre", async () => {
    await mount();
    openDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    const dialog = openDialog();
    fireEvent.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
