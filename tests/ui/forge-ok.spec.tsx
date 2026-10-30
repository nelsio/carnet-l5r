/**
 * Lot 27, v2.21.2 : affichage une fois l'export de la Forge compatible (`FORGE_JSON_OK` simulé à true).
 * Textes et étapes d'origine (annexe L.3, L.4), sans pastille ni encadré, ordre Fiche vierge puis Forge conservé.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

vi.mock("../../src/rules/portal", async (importOriginal) => ({ ...(await importOriginal<object>()), FORGE_JSON_OK: true }));

async function renderApp(character: Character | null) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
}

describe("Forge compatible (FORGE_JSON_OK = true)", () => {
  it("Bibliothèque vide : étapes Forger · Exporter · Importer, aucune pastille ni encadré", async () => {
    await renderApp(null);
    const start = screen.getByRole("region", { name: "Pas encore de personnage ?" });
    const options = within(start).getAllByRole("article");
    expect(options.map((o) => within(o).getByRole("heading").textContent)).toEqual(["Fiche vierge", "Forger sur le portail"]);
    const forge = options[1]!;
    expect(forge).not.toHaveClass("wait");
    expect(within(forge).getAllByRole("listitem").map((s) => s.querySelector(".step-s")!.textContent)).toEqual(["Forger", "Exporter", "Importer"]);
    expect(within(forge).queryByRole("note")).toBeNull();
    expect(screen.queryByText("JSON pas encore compatible")).toBeNull();
    expect(within(forge).getByRole("link", { name: "Ouvrir la Forge (nouvel onglet)" })).not.toHaveClass("accent");
    expect(within(options[0]!).getByRole("button", { name: "Nouvelle fiche vierge" })).toHaveClass("accent");
  });

  it("Bibliothèque avec fiches et menu Ressources : textes d'origine", async () => {
    await renderApp(structuredClone(kakita) as Character);
    fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));
    const card = await screen.findByRole("region", { name: "Un nouveau personnage ?" });
    const [blank, forge] = within(card).getAllByRole("article");
    expect(within(blank!).getByRole("heading").textContent).toBe("Fiche vierge");
    expect(forge).toHaveTextContent("Création guidée, puis export JSON à importer ici.");
    fireEvent.click(screen.getByRole("button", { name: "Ressources" }));
    const item = screen.getByRole("menuitem", { name: /^Forge de personnage/ });
    expect(item).toHaveAccessibleName("Forge de personnage : Exporte un JSON compatible avec le Carnet (nouvel onglet)");
    expect(screen.queryByText("JSON pas encore compatible")).toBeNull();
  });
});
