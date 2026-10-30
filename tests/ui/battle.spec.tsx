/** Lot 12, v2.7.0 (HANDOFF annexe E.8) : panneau Bataille de masse de l'aide de jeu. Kakita : Eau 2, Bataille 1. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { woundsField } from "../helpers/wounds";

const base = () => structuredClone(kakita) as Character;

async function renderApp(character: Character = base(), mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const toBattle = () => {
  click("Aide de jeu");
  click("Combat");
  click("Bataille");
};
const panel = () => within(screen.getByRole("group", { name: "Bataille de masse" }));
const pick = (group: string, name: string) => fireEvent.click(within(panel().getByRole("group", { name: group })).getByRole("button", { name }));
const total = (value: string) => fireEvent.change(panel().getByRole("spinbutton", { name: "Total du jet de bataille" }), { target: { value } });
const outcome = () => panel().getByTestId("battle-outcome");

describe("Bataille de masse (E.8)", () => {
  it("panneau en Bataille seulement, plus de carte « Niveau d'engagement »", async () => {
    await renderApp();
    click("Aide de jeu");
    click("Combat");
    expect(screen.queryByRole("group", { name: "Bataille de masse" })).not.toBeInTheDocument();
    click("Bataille");
    expect(panel().getByTestId("battle-roll")).toHaveTextContent("1d10 (sans explosion) + Eau 2 + Bataille 1");
    expect(screen.queryByText("Niveau d'engagement")).not.toBeInTheDocument();
  });

  it("L19 : total 8, Engagé, armée gagnante ; égalité ; total 31, Fortement engagé, perdante", async () => {
    await renderApp();
    toBattle();
    total("8");
    pick("État de l'armée", "Gagne");
    expect(outcome()).toHaveTextContent("2 dés de blessures, 1 Gloire");
    expect(outcome()).not.toHaveTextContent("Duel");
    pick("État de l'armée", "Égalité");
    expect(outcome()).toHaveTextContent("3 dés de blessures, 1 Gloire, Duel");
    total("31");
    pick("Engagement", "Fortement engagé");
    pick("État de l'armée", "Perd");
    expect(outcome()).toHaveTextContent("3 dés de blessures, 5 Gloire, Occasion héroïque");
  });

  it("Réserve, total 10 : aucun dé de blessures, rien à encaisser", async () => {
    await renderApp();
    toBattle();
    total("10");
    pick("Engagement", "Réserve");
    pick("État de l'armée", "Gagne");
    expect(outcome()).toHaveTextContent("Aucun dé de blessures, 0 Gloire");
    expect(panel().queryByRole("button", { name: "Encaisser" })).not.toBeInTheDocument();
  });

  it("commandement : l'écart donne l'état de l'armée (5 d'écart)", async () => {
    await renderApp();
    toBattle();
    fireEvent.click(panel().getByRole("checkbox", { name: "Je commande l'armée" }));
    expect(panel().queryByRole("group", { name: "État de l'armée" })).not.toBeInTheDocument();
    const gap = panel().getByRole("spinbutton", { name: "Écart de Commandement" });
    fireEvent.change(gap, { target: { value: "6" } });
    expect(panel().getByTestId("army-status")).toHaveTextContent("Ton armée gagne");
    fireEvent.change(gap, { target: { value: "-5" } });
    expect(panel().getByTestId("army-status")).toHaveTextContent("Ton armée perd");
    fireEvent.change(gap, { target: { value: "4" } });
    expect(panel().getByTestId("army-status")).toHaveTextContent("Égalité");
    total("8");
    expect(outcome()).toHaveTextContent("3 dés de blessures, 1 Gloire, Duel");
  });

  it("vrais dés : saisie du total, encaisser le total des dés de blessures (Réduction 3)", async () => {
    await renderApp({ ...base(), armor: { name: "Armure légère", bonus: 5, reduction: 3 } });
    fireEvent.click(screen.getByRole("button", { name: "Lanceur de dés : affiché" }));
    toBattle();
    expect(panel().queryByRole("button", { name: "Lancer 1d10" })).not.toBeInTheDocument();
    total("8");
    expect(panel().getByText("Lance 3d10 et additionne-les, puis encaisse le total.")).toBeInTheDocument();
    const box = within(panel().getByRole("group", { name: "Encaisser des dégâts" }));
    fireEvent.change(box.getByRole("spinbutton", { name: "Total des dés de blessures" }), { target: { value: "14" } });
    expect(box.getByTestId("damage-preview")).toHaveTextContent("Réduction 3 → +11 blessure(s)");
    fireEvent.click(box.getByRole("button", { name: "Encaisser" }));
    expect(woundsField()).toHaveValue(11);
    expect(panel().getByTestId("battle-wounds-taken")).toBeInTheDocument();
  });

  it("lanceur affiché : 1d10 tiré, Tacticien ±5, dés de blessures tirés et pré-remplis", async () => {
    await renderApp();
    toBattle();
    click("Lancer 1d10");
    expect(panel().getByTestId("battle-roll")).toHaveTextContent("d10 : 5");
    expect(panel().getByRole("spinbutton", { name: "Total du jet de bataille" })).toHaveValue(8);
    expect(outcome()).toHaveTextContent("3 dés de blessures, 1 Gloire, Duel");
    fireEvent.click(panel().getByRole("checkbox", { name: "Tacticien" }));
    expect(outcome()).toHaveTextContent("2 dés de blessures, 1 Gloire, Duel");
    fireEvent.click(within(panel().getByRole("group", { name: "Tacticien" })).getByRole("button", { name: "−5" }));
    expect(outcome()).toHaveTextContent("4 dés de blessures, 1 Gloire");
    click("Lancer les dés de blessures (4d10)");
    expect(within(panel().getByTestId("battle-wound-dice")).getAllByText("5")).toHaveLength(4);
    const box = within(panel().getByRole("group", { name: "Encaisser des dégâts" }));
    expect(box.getByRole("spinbutton", { name: "Total des dés de blessures" })).toHaveValue(20);
    fireEvent.click(box.getByRole("button", { name: "Encaisser" }));
    expect(woundsField()).toHaveValue(20);
  });

  it("« Nouveau round » efface le jet, garde l'engagement", async () => {
    await renderApp();
    toBattle();
    pick("Engagement", "Désengagé");
    total("8");
    click("Nouveau round");
    expect(panel().getByRole("spinbutton", { name: "Total du jet de bataille" })).toHaveValue(null);
    expect(panel().queryByTestId("battle-outcome")).not.toBeInTheDocument();
    expect(within(panel().getByRole("group", { name: "Engagement" })).getByRole("button", { name: "Désengagé" })).toHaveAttribute("aria-pressed", "true");
  });

  it("consultation : résultat affiché, rien à encaisser", async () => {
    await renderApp(base(), "readonly");
    toBattle();
    total("8");
    expect(outcome()).toHaveTextContent("3 dés de blessures");
    expect(panel().queryByRole("group", { name: "Encaisser des dégâts" })).not.toBeInTheDocument();
  });
});
