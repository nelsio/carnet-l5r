/** Lot 12, v2.5.0 (HANDOFF annexe E.6) : multiplicateur de blessures, « Nouvelle journée », méditation. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { VIEW } from "../helpers/views";

const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

async function renderApp(character: Character = base(), mode: "edit" | "readonly" = "edit", storage: Storage = memoryStorage()) {
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const woundSummary = () => screen.getByRole("button", { name: /pénalité|Indemne/ });

describe("Multiplicateur de blessures masqué (annexe E.19 S6)", () => {
  it("E31 : multiplicateur enregistré à × 3 : pas de bouton goutte ; seuils de blessures à × 2", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ woundMultiplier: 3 });
    await renderApp(base(), "edit", storage);
    expect(screen.queryByRole("button", { name: /Blessures : Terre/ })).toBeNull();
    expect(woundSummary()).toHaveTextContent("0 / 38");
    fireEvent.click(woundSummary());
    const rows = within(screen.getByTestId("wound-detail")).getAllByRole("listitem");
    expect(rows[1]).toHaveTextContent("Égratigné11–14");
  });

  it("la préférence enregistrée est gardée pour le retour du bouton", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ woundMultiplier: 4 });
    await renderApp(base(), "edit", storage);
    click("Thème : auto");
    await waitFor(async () => expect((await storage.prefs.get()).theme).toBe("light"));
    expect((await storage.prefs.get()).woundMultiplier).toBe(4);
  });
});

describe("Nouvelle journée", () => {
  it("L17 : confirmation avec aperçu, puis 15 blessures et Vide plein", async () => {
    await renderApp(base({ wounds: 20, voidPoints: 0 }));
    click("Nouvelle journée…");
    expect(screen.getByTestId("new-day-preview")).toHaveTextContent("Vide 0 → 2 ; blessures 20 → 15 (−5");
    click("Confirmer la nouvelle journée");
    expect(woundSummary()).toHaveTextContent("15 / 38");
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    expect(screen.queryByTestId("new-day-preview")).toBeNull();
  });

  it("Annuler ne change rien", async () => {
    await renderApp(base({ wounds: 20 }));
    click("Nouvelle journée…");
    click("Annuler");
    expect(woundSummary()).toHaveTextContent("20 / 38");
  });

  it("remet l'initiative à zéro", async () => {
    await renderApp();
    click(VIEW.aid);
    click("Combat");
    fireEvent.click(screen.getByRole("button", { name: /^Initiative/ }));
    fireEvent.click(roller().getByRole("button", { name: /^Lancer/ }));
    expect(screen.getByTestId("initiative")).not.toHaveTextContent("g");
    click("Fiche");
    click("Nouvelle journée…");
    click("Confirmer la nouvelle journée");
    click(VIEW.aid);
    click("Combat");
    expect(screen.getByTestId("initiative")).toHaveTextContent("g");
  });

  it("absente en consultation", async () => {
    await renderApp(base({ wounds: 20 }), "readonly");
    expect(screen.queryByRole("button", { name: "Nouvelle journée…" })).toBeNull();
  });
});

describe("Méditation (Enquête, groupe Repos)", () => {
  it("action « Méditer » sous le titre Repos, ND 20 ; « Réussi » rend 1 point de Vide (L18)", async () => {
    await renderApp(base({ voidPoints: 0 }));
    click(VIEW.aid);
    expect(screen.getByRole("heading", { level: 3, name: "Repos" })).toBeInTheDocument();
    click(/^Méditer \(récupérer du Vide\)/);
    expect(roller().getByTestId("final-tn")).toHaveTextContent(/^20$/);
    fireEvent.click(roller().getByRole("button", { name: "Réussi : +1 point de Vide" }));
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
    fireEvent.click(roller().getByRole("button", { name: "Réussi : +1 point de Vide" }));
    expect(roller().getByRole("button", { name: "Réussi : +1 point de Vide" })).toBeDisabled();
  });

  it("Méditation 3 : +2 points", async () => {
    const c = base({ voidPoints: 0 });
    c.skills.push({ name: "Méditation", rank: 3, trait: "void", emphases: [] });
    await renderApp(c);
    click(VIEW.aid);
    click(/^Méditer/);
    fireEvent.click(roller().getByRole("button", { name: "Réussi : +2 points de Vide" }));
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
  });

  it("en consultation : bouton masqué (annexe H.7 X6)", async () => {
    await renderApp(base({ voidPoints: 0 }), "readonly");
    click(VIEW.aid);
    click(/^Méditer/);
    expect(roller().getByText("Vide 0/2.")).toBeInTheDocument();
    expect(roller().queryByRole("button", { name: /^Réussi/ })).toBeNull();
  });
});
