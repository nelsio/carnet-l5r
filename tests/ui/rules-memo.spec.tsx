/**
 * Lot 41, v2.26.2 (HANDOFF annexe R) : la note de règles quitte le bas de chaque écran pour la pastille Règles L5R 4e du pied de page,
 * cas R1 à R4. R5 et R6 (vrai navigateur, 360 et 390 px, clavier) : tests/e2e/carnet-links.spec.ts.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { VIEW } from "../helpers/views";

async function renderApp(character: Character | null = structuredClone(kakita) as Character) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return view;
}

const footer = () => screen.getByRole("contentinfo");
const rulesBtn = () => within(footer()).getByRole("button", { name: "Règles L5R 4e" });
const LABELS = ["Système", "Explosion", "Augmentations", "Blessures", "Duel, bataille"];

describe("R1 : plus de note de règles au-dessus du pied de page", () => {
  it("Bibliothèque, Fiche, Assistant L5R et Statistiques", async () => {
    const { container } = await renderApp();
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    const check = () => {
      expect(container.querySelector(".note")).toBeNull();
      expect(screen.queryByText(/Règles de référence/)).toBeNull();
    };
    check();
    for (const view of [VIEW.aid, "Statistiques"]) {
      fireEvent.click(screen.getByRole("button", { name: view }));
      check();
    }
    fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));
    await screen.findByRole("heading", { name: "Bibliothèque" });
    check();
  });
});

describe("R2, R3 : pastille Règles L5R 4e", () => {
  it("repliée par défaut, reliée au panneau", async () => {
    await renderApp(null);
    expect(rulesBtn()).toHaveAttribute("aria-expanded", "false");
    expect(rulesBtn()).toHaveAttribute("aria-controls", "rules-memo");
    expect(document.getElementById("rules-memo")).toBeNull();
  });

  it("un clic déplie les cinq repères, un second les replie", async () => {
    await renderApp();
    fireEvent.click(rulesBtn());
    expect(rulesBtn()).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById("rules-memo")!;
    expect(footer()).toContainElement(panel);
    expect([...panel.querySelectorAll("li b")].map((b) => b.textContent)).toEqual(LABELS);
    fireEvent.click(rulesBtn());
    expect(rulesBtn()).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("rules-memo")).toBeNull();
  });
});

describe("R4 : le reste du pied de page ne bouge pas", () => {
  it("état d'enregistrement et trois liens présents, panneau ouvert", async () => {
    await renderApp();
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    fireEvent.click(screen.getByRole("button", { name: "Edit : Identité & réputation" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: "Kakita Haruto II" } });
    fireEvent.click(rulesBtn());
    expect(await within(footer()).findByText("Enregistré dans ce navigateur", {}, { timeout: 1500 })).toBeInTheDocument();
    const nav = within(footer()).getByRole("navigation", { name: "Liens du Carnet" });
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["Guide", "Signaler un bug", "Projet"]);
  });
});
