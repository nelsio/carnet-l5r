/** Lot 46, v2.28.0 (annexe 46) : vue compacte de l'Assistant L5R, bouton « i » du titre Actions. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import { initialState, initialUi, reducer } from "../../src/ui/store";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance } from "../helpers/stance";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;
const KATANA_DESC = /contre le ND d'armure de la cible/;

async function renderApp(storage: Storage = memoryStorage(), patch: Partial<Character> = {}) {
  const character = { ...base(), ...patch };
  await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-11-04T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const toSkirmish = () => {
  click(VIEW.aid);
  click("Combat");
};
const toggle = () => screen.getByRole("button", { name: "Explications des actions" });
const card = (name: RegExp) => screen.getByRole("button", { name });

describe("Préférence compactActions (annexe 46.2)", () => {
  it("désactivée par défaut ; l'action la bascule", () => {
    expect(initialUi.compactActions).toBe(false);
    const on = reducer(initialState(), { type: "compactActions", value: true });
    expect(on.ui.compactActions).toBe(true);
    expect(reducer(on, { type: "compactActions", value: false }).ui.compactActions).toBe(false);
  });

  it("conservée au changement de fiche et au retour à la Bibliothèque", () => {
    const on = reducer(initialState(), { type: "compactActions", value: true });
    const opened = reducer(on, { type: "open", id: "x", character: base(), mode: "edit" });
    expect(opened.ui.compactActions).toBe(true);
    expect(reducer(opened, { type: "library" }).ui.compactActions).toBe(true);
  });

  it("relue au démarrage et écrite à chaque changement", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ compactActions: true });
    await renderApp(storage);
    toSkirmish();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle());
    await expect.poll(async () => (await storage.prefs.get()).compactActions).toBe(false);
  });
});

describe("Vue compacte de l'Assistant (annexe 46.1, 46.3)", () => {
  it("titre « Actions » dans chaque situation, bouton nommé, explications affichées par défaut", async () => {
    await renderApp();
    click(VIEW.aid);
    for (const sit of ["Enquête", "Cour", "Déplacement", "Combat"]) {
      click(sit);
      expect(screen.getByText("Actions", { selector: ".label" })).toBeInTheDocument();
    }
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(toggle()).toHaveAttribute("title", "Explications des actions");
    expect(screen.queryByText("explications masquées")).toBeNull();
    expect(card(/^Attaque · Katana/)).toHaveTextContent(KATANA_DESC);
  });

  it("en compact : description absente des cartes non choisies, présente sur la carte choisie", async () => {
    await renderApp();
    toSkirmish();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("explications masquées")).toBeInTheDocument();
    expect(card(/^Attaque · Katana/)).not.toHaveTextContent(KATANA_DESC);
    expect(card(/^Attaque · Katana/).querySelector(".d")).toBeNull();
    click(/^Attaque · Katana/);
    expect(card(/^Attaque · Katana/)).toHaveAttribute("aria-pressed", "true");
    expect(card(/^Attaque · Katana/)).toHaveTextContent(KATANA_DESC);
    fireEvent.click(toggle());
    expect(screen.queryByText("explications masquées")).toBeNull();
  });

  it("l'étiquette « Action simple » reste visible, sur la ligne du titre", async () => {
    // Kakita R4 : attaque au katana en Action simple.
    await renderApp(memoryStorage(), { schoolId: "kakita-bushi", insightRank: 4 });
    toSkirmish();
    const tagOf = () => card(/^Attaque · Katana/).querySelector(".tag.sa");
    expect(tagOf()).toHaveTextContent("Attaque : Action simple");
    expect(tagOf()?.parentElement).toHaveClass("d");
    fireEvent.click(toggle());
    expect(tagOf()).toHaveTextContent("Attaque : Action simple");
    expect(tagOf()?.parentElement).toHaveClass("t");
  });

  it("une carte bloquée garde sa raison et « Lancer quand même »", async () => {
    await renderApp();
    toSkirmish();
    fireEvent.click(toggle());
    chooseStance("Centre");
    expect(screen.getByTestId("blocked-atk-skirmish-Katana")).toHaveTextContent("Posture Centre : aucune action ce round.");
    expect(screen.getByRole("button", { name: "Lancer quand même : Attaque · Katana" })).toBeInTheDocument();
  });
});
