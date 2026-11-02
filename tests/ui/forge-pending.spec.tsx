/**
 * Lot 27, v2.21.2 : affichage tant que l'export de la Forge n'est pas compatible (`FORGE_JSON_OK` simulé à false).
 * La constante vaut true depuis la v2.26.0 (lot 39) ; ces cas gardent les branches `false` testées tant qu'elles existent.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

vi.mock("../../src/rules/portal", async (importOriginal) => ({ ...(await importOriginal<object>()), FORGE_JSON_OK: false }));

async function renderApp(character: Character | null) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
}

describe("Forge pas encore compatible (FORGE_JSON_OK = false)", () => {
  it("Bibliothèque vide : pastille, encadré, étape « Recopier », import à venir", async () => {
    await renderApp(null);
    const start = screen.getByRole("region", { name: "Pas encore de personnage ?" });
    const options = within(start).getAllByRole("article");
    expect(options.map((o) => within(o).getByRole("heading").textContent)).toEqual(["Fiche vierge", "Forger sur le portail JSON pas encore compatible", "Depuis une fiche papier"]);
    const forge = options[1]!;
    expect(forge).toHaveClass("start-opt", "wait");
    const pend = within(forge).getByText("JSON pas encore compatible");
    expect(pend).toHaveClass("pend");
    expect(pend).toHaveAttribute("title", "L'export JSON de la Forge ne s'importe pas encore dans le Carnet");
    expect(within(forge).getByRole("note")).toHaveTextContent(
      "L'import direct arrive bientôt. Le fichier JSON de la Forge ne s'ouvre pas encore dans le Carnet. Crée ton personnage sur la Forge, puis recopie-le dans une fiche vierge.",
    );
    const steps = within(forge).getAllByRole("listitem");
    expect(steps.map((s) => s.textContent)).toEqual([
      "一ForgerClan, école, anneaux, compétences", "二RecopierDans une fiche vierge du Carnet", "三ImporterBientôt : import direct du JSON",
    ]);
    expect(steps[2]).toHaveClass("off");
    expect(within(options[0]!).getByRole("button", { name: "Nouvelle fiche vierge" })).toHaveClass("accent");
  });

  it("Bibliothèque avec fiches et menu Ressources : texte « à recopier » et pastille", async () => {
    await renderApp(structuredClone(kakita) as Character);
    fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));
    const card = await screen.findByRole("region", { name: "Un nouveau personnage ?" });
    const [blank, forge] = within(card).getAllByRole("article");
    expect(within(blank!).getByRole("heading").textContent).toBe("Fiche vierge");
    expect(forge).toHaveClass("wait");
    expect(within(forge!).getByText("JSON pas encore compatible")).toHaveClass("pend");
    expect(forge).toHaveTextContent("Création guidée, à recopier ensuite dans une fiche vierge. L'import direct arrive bientôt.");
    fireEvent.click(screen.getByRole("button", { name: "Ressources" }));
    const item = screen.getByRole("menuitem", { name: /^Forge de personnage/ });
    expect(item).toHaveAccessibleName("Forge de personnage, JSON pas encore compatible : Création guidée. Pour l'instant, recopie le résultat dans une fiche vierge. (nouvel onglet)");
    expect(within(item).getByText("JSON pas encore compatible")).toHaveClass("pend");
  });
});
