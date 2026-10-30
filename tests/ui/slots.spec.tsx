/** Lot 13, v2.12.0 (HANDOFF annexe F.5) : ligne Sorts, emplacements au lancer, sorts en escarmouche, Rester concentré. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance } from "../helpers/stance";

const kuni = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });

async function renderApp(character: Character, mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "perso", character, mode, updatedAt: "2026-10-28T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const slot = (k: string) => screen.getByTestId(`slot-${k}`);
const toMagic = () => {
  click("Aide de jeu");
  fireEvent.click(within(screen.getByRole("group", { name: "Situation" })).getByRole("button", { name: "Magie" }));
};
const card = (label: string) => screen.getAllByRole("button", { name: new RegExp(`^${label}`) })[0]!;
const saved = async (s: ReturnType<typeof memoryStorage>) => (await s.library.get("perso"))?.character.spellSlotsUsed;

describe("Ligne « Sorts » de la barre d'état (F.5)", () => {
  it("six mini-tuiles restants/max ; absente pour un bushi", async () => {
    await renderApp(kuni({ spellSlotsUsed: { earth: 1 } }));
    expect(["air", "earth", "fire", "water", "void", "free"].map((k) => slot(k).textContent))
      .toEqual(["Air2/2", "Terre2/3", "Feu2/2", "Eau2/2", "Vide2/2", "Libres2/2"]);
  });

  it("bushi : pas de ligne Sorts", async () => {
    await renderApp(structuredClone(kakita) as Character);
    expect(screen.queryByRole("button", { name: "Emplacements de sorts restants" })).toBeNull();
  });

  it("éditeur : − dépense, + rend, bornés ; enregistré", async () => {
    const storage = await renderApp(kuni());
    click("Emplacements de sorts restants");
    const editor = within(screen.getByRole("group", { name: "Emplacements de sorts" }));
    fireEvent.click(editor.getByRole("button", { name: "Dépenser un emplacement Feu" }));
    fireEvent.click(editor.getByRole("button", { name: "Dépenser un emplacement Feu" }));
    fireEvent.click(editor.getByRole("button", { name: "Dépenser un emplacement Feu" }));
    expect(slot("fire")).toHaveTextContent("0/2");
    expect(slot("fire")).toHaveClass("empty");
    fireEvent.click(editor.getByRole("button", { name: "Rendre un emplacement Libres" }));
    expect(slot("free")).toHaveTextContent("2/2");
    await vi.waitFor(async () => expect(await saved(storage)).toEqual({ fire: 2, free: 0 }));
  });

  it("consultation : tuiles affichées, sans éditeur", async () => {
    await renderApp(kuni(), "readonly");
    expect(screen.getByRole("button", { name: "Emplacements de sorts restants" })).toBeDisabled();
  });
});

describe("Emplacements au lancer (F.5)", () => {
  it("ligne « Emplacement » : Terre 3/3, puis « libre » quand la Terre est épuisée, puis « aucun emplacement » (G7)", async () => {
    await renderApp(kuni({ spellSlotsUsed: { earth: 3, free: 1 } }));
    toMagic();
    fireEvent.click(card("Lancer · Frappe de jade"));
    expect(roller().getByTestId("spell-slot")).toHaveTextContent("libre 1/2");
    fireEvent.click(roller().getByRole("button", { name: "Réussi" }));
    expect(roller().getByTestId("spell-slot")).toHaveTextContent("aucun emplacement");
    expect(slot("free")).toHaveTextContent("0/2");
    fireEvent.click(card("Lancer · Feux intérieurs"));
    expect(roller().getByTestId("spell-slot")).toHaveTextContent("Feu 2/2");
  });

  it("G8 aux vrais dés : Raté dépense l'emplacement ; Réussi puis « Annuler (interrompu) » le rend", async () => {
    const storage = await renderApp(kuni());
    toMagic();
    fireEvent.click(card("Lancer · Frappe de jade"));
    expect(roller().getByTestId("spell-slot")).toHaveTextContent("Terre 3/3");
    click("Raté");
    expect(roller().getByTestId("spell-spent")).toHaveTextContent("Raté : emplacement Terre dépensé.");
    expect(roller().queryByRole("button", { name: "Annuler (interrompu)" })).toBeNull();
    expect(slot("earth")).toHaveTextContent("2/3");
    click("Réussi");
    expect(roller().getByTestId("spell-spent")).toHaveTextContent("Lancé : emplacement Terre dépensé.");
    expect(slot("earth")).toHaveTextContent("1/3");
    click("Annuler (interrompu)");
    expect(slot("earth")).toHaveTextContent("2/3");
    expect(roller().queryByTestId("spell-spent")).toBeNull();
    await vi.waitFor(async () => expect(await saved(storage)).toEqual({ earth: 1 }));
  });

  it("G8 avec le lanceur de dés : emplacement dépensé au lancer, réussite annulable, échec non", async () => {
    await renderApp(kuni());
    toMagic();
    click("Lanceur de dés : masqué");
    fireEvent.click(card("Lancer · Frappe de jade"));
    expect(roller().queryByRole("button", { name: "Réussi" })).toBeNull();
    click("Lancer 5g3");
    expect(roller().getByTestId("spell-spent")).toHaveTextContent("Emplacement dépensé : Terre");
    expect(slot("earth")).toHaveTextContent("2/3");
    click("Annuler (interrompu)");
    expect(slot("earth")).toHaveTextContent("3/3");
    // 3 augmentations : ND 25, les dés (tous à 5) font 15 : échec.
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augmentations" }), { target: { value: "3" } });
    click("Lancer 5g3");
    expect(roller().getByTestId("spell-spent")).toHaveTextContent("Emplacement dépensé : Terre (raté)");
    expect(roller().queryByRole("button", { name: "Annuler (interrompu)" })).toBeNull();
    expect(slot("earth")).toHaveTextContent("2/3");
  });

  it("K7 : consultation : ni « Réussi » ni « Raté » dans le DOM (annexe H.7 X2)", async () => {
    await renderApp(kuni(), "readonly");
    toMagic();
    fireEvent.click(card("Lancer · Frappe de jade"));
    expect(roller().queryByRole("button", { name: "Réussi" })).toBeNull();
    expect(roller().queryByRole("button", { name: "Raté" })).toBeNull();
    expect(roller().queryByTestId("spell-cast")).toBeNull();
  });

  it("G14 : Nouvelle journée : aperçu « emplacements de sorts rechargés », emplacements pleins", async () => {
    await renderApp(kuni({ spellSlotsUsed: { earth: 3, free: 2 } }));
    click("Nouvelle journée…");
    expect(screen.getByTestId("new-day-preview")).toHaveTextContent("emplacements de sorts rechargés");
    click("Confirmer la nouvelle journée");
    expect(slot("earth")).toHaveTextContent("3/3");
    expect(slot("free")).toHaveTextContent("2/2");
  });
});

describe("Sorts en escarmouche et Rester concentré (F.5)", () => {
  it("G16 : groupe « Sorts » ; Assaut et Défense totale grisent les sorts, Défense non", async () => {
    await renderApp(kuni());
    click("Aide de jeu");
    click("Combat");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toContain("Sorts");
    expect(card("Lancer · Frappe de jade")).toHaveTextContent("5g3");
    chooseStance("Assaut");
    expect(screen.getByTestId("blocked-sk-spell-jade-strike")).toHaveTextContent("Assaut : attaques seulement, pas de sort.");
    chooseStance("Défense totale");
    expect(screen.getByTestId("blocked-sk-spell-jade-strike")).toHaveTextContent("Défense totale : actions gratuites seulement, pas de sort.");
    click("Lancer quand même : Lancer · Frappe de jade");
    expect(roller().getByTestId("stance-restriction")).toHaveTextContent("actions gratuites seulement");
    chooseStance("Défense");
    expect(screen.queryByTestId("blocked-sk-spell-jade-strike")).toBeNull();
    // La déficience grise aussi en escarmouche.
    expect(screen.getByTestId("blocked-sk-spell-air-1")).toHaveTextContent("Déficience : impossible au rang 1.");
  });

  it("G17 : au round après le Centre, le bonus de Centre vaut pour un jet de sort : 6g4 +2", async () => {
    await renderApp(kuni());
    click("Aide de jeu");
    click("Combat");
    chooseStance("Centre");
    click("Nouveau round");
    chooseStance("Attaque");
    fireEvent.click(card("Lancer · Frappe de jade"));
    fireEvent.click(roller().getByRole("checkbox", { name: /Bonus de Centre/ }));
    expect(roller().getByTestId("pool")).toHaveTextContent("6g4");
    expect(roller().getByText(/\+2 au total/)).toBeInTheDocument();
    fireEvent.click(card("Dégâts · Feux intérieurs"));
    expect(roller().queryByRole("checkbox", { name: /Bonus de Centre/ })).toBeNull();
  });

  it("Rester concentré : Volonté, ND 10, puis 5 + dégâts subis", async () => {
    await renderApp(kuni());
    toMagic();
    fireEvent.click(card("Rester concentré"));
    expect(roller().getByTestId("pool")).toHaveTextContent("3g3");
    expect(roller().getByTestId("final-tn")).toHaveTextContent("10");
    fireEvent.change(roller().getByRole("spinbutton", { name: /Dégâts subis/ }), { target: { value: "7" } });
    expect(roller().getByTestId("final-tn")).toHaveTextContent("12");
  });
});
