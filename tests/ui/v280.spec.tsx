/** Lot 12, v2.8.0 (HANDOFF annexe E.18, E.19) : bloc Armure, en-tête, tuile Blessures. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import { exampleCharacter } from "../../src/rules/example";
import kakita from "../fixtures/kakita-v1.json";
import { openWounds, WOUNDS_TILE } from "../helpers/wounds";

const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

async function renderApp(character: Character = base(), mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const armorBlock = () => within(screen.getByTestId("block-armor"));

describe("Bloc Armure (E.18)", () => {
  it("lecture : armure du livre, ND détaillé, Réduction, règle spéciale, posture de référence", async () => {
    await renderApp(exampleCharacter());
    const block = armorBlock();
    expect(block.getByText("armure du livre")).toBeInTheDocument();
    expect(block.getByTestId("armor-block-tn")).toHaveTextContent("25");
    expect(block.getByText("5 × Réflexes 3 + 5 + armure 5 = 25")).toBeInTheDocument();
    expect(block.getByTestId("armor-block-reduction")).toHaveTextContent("3");
    expect(block.getByTestId("armor-rule")).toHaveTextContent("Règle spéciale : +5 au ND des jets d'Athlétisme et de Discrétion.");
    expect(block.getByText("Posture de référence : Attaque.")).toBeInTheDocument();
  });

  it("E29 : Edit, « Armure lourde » puis bonus à 8 : ND +10 / Réduction 5, puis armure personnalisée ; barre d'état à jour", async () => {
    const { storage } = await renderApp(base({ armor: { name: "", bonus: 0, reduction: 0 } }));
    click("Edit : Armure");
    fireEvent.change(armorBlock().getByRole("combobox", { name: "Armure du livre" }), { target: { value: "heavy" } });
    expect(armorBlock().getByRole("spinbutton", { name: "Bonus au ND" })).toHaveValue(10);
    expect(armorBlock().getByRole("spinbutton", { name: "Réduction" })).toHaveValue(5);
    expect(screen.getByTestId("armor-reduction")).toHaveTextContent("5");
    fireEvent.change(armorBlock().getByRole("spinbutton", { name: "Bonus au ND" }), { target: { value: "8" } });
    click("Terminer : Armure");
    expect(armorBlock().getByText("armure personnalisée")).toBeInTheDocument();
    expect(armorBlock().queryByTestId("armor-rule")).toBeNull();
    // Kakita, Réflexes 3 : 5 × 3 + 5 + 8.
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("28");
    expect(armorBlock().getByTestId("armor-block-tn")).toHaveTextContent("28");
    await vi.waitFor(async () => expect((await storage.library.get("kakita"))?.character.armor).toEqual({ name: "Armure lourde", bonus: 8, reduction: 5 }));
  });

  it("bloc et éditeur de la barre d'état restent synchronisés", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("armor-tn").closest("button")!);
    const editor = within(screen.getByRole("group", { name: "Armure" }));
    fireEvent.change(editor.getByRole("spinbutton", { name: "Réduction" }), { target: { value: "4" } });
    expect(armorBlock().getByTestId("armor-block-reduction")).toHaveTextContent("4");
  });

  it("E30 : Identité en édition : plus de champs d'armure", async () => {
    await renderApp();
    click("Edit : Identité & réputation");
    const identity = within(screen.getByTestId("block-identity"));
    expect(identity.queryByRole("combobox", { name: "Armure du livre" })).toBeNull();
    expect(identity.queryByRole("textbox", { name: /Armure/ })).toBeNull();
    expect(identity.queryByRole("spinbutton", { name: /armure|Réduction/i })).toBeNull();
  });

  it("consultation : bloc en lecture, sans bouton Edit", async () => {
    await renderApp(exampleCharacter(), "readonly");
    expect(armorBlock().getByTestId("armor-block-tn")).toHaveTextContent("25");
    expect(armorBlock().queryByRole("button")).toBeNull();
  });
});

describe("En-tête (E.19 S8, S9)", () => {
  it("E33 : fiche d'exemple : sous-titre « École de bushi Kakita · Rang 1 »", async () => {
    await renderApp(exampleCharacter());
    expect(screen.getByText("École de bushi Kakita · Rang 1")).toBeInTheDocument();
  });

  it("sans école affichée : « Rang N » (rang d'école saisi)", async () => {
    await renderApp(base({ school: "", schoolRank: 2 }));
    expect(document.querySelector(".who .sub")).toHaveTextContent(/^Rang 2$/);
  });

  it("E34 : choisir Hiruma, renommer, puis choisir Kakita : nom Hiruma, texte saisi gardé, nom Kakita", async () => {
    await renderApp(base({ school: "", schoolId: "" }));
    click("Edit : Identité & réputation");
    const identity = within(screen.getByTestId("block-identity"));
    const schoolName = () => identity.getByRole("textbox", { name: "École (nom affiché)" });
    const techniques = () => identity.getByRole("combobox", { name: "Techniques d'école" });
    fireEvent.change(techniques(), { target: { value: "hiruma-bushi" } });
    expect(schoolName()).toHaveValue("École de bushi Hiruma");
    fireEvent.change(schoolName(), { target: { value: "École Hiruma (variante)" } });
    expect(schoolName()).toHaveValue("École Hiruma (variante)");
    fireEvent.change(techniques(), { target: { value: "kakita-bushi" } });
    expect(schoolName()).toHaveValue("École de bushi Kakita");
    // « — Aucune » ne vide pas le champ.
    fireEvent.change(techniques(), { target: { value: "" } });
    expect(schoolName()).toHaveValue("École de bushi Kakita");
  });

  it("le bouton « Associer » remplit aussi le nom affiché", async () => {
    await renderApp(base({ school: "bushi Hiruma", schoolId: "" }));
    click("Associer");
    expect(screen.getByText("École de bushi Hiruma · Rang 1")).toBeInTheDocument();
  });
});

describe("Tuile Blessures (E.19 S11, S14)", () => {
  it("total « N/max », panneau Ajuster puis Dégâts de l'attaque ; reste ouvert après + ; « Encaisser » le referme", async () => {
    await renderApp(exampleCharacter());
    const tile = screen.getByRole("button", { name: WOUNDS_TILE });
    expect(tile).toHaveTextContent("0/38");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Blessures", { selector: ".status-in > div > .label" })).toBeNull();
    openWounds();
    click("Ajouter 1 blessure");
    click("Ajouter 1 blessure");
    expect(tile).toHaveTextContent("2/38");
    const box = within(screen.getByRole("group", { name: "Encaisser des dégâts" }));
    expect(box.getByText("Ajuster")).toBeInTheDocument();
    fireEvent.change(box.getByRole("spinbutton", { name: "Dégâts de l'attaque" }), { target: { value: "12" } });
    fireEvent.click(box.getByRole("button", { name: "Encaisser" }));
    // 12 dégâts − Réduction 3 de l'armure légère = 9 ; 2 + 9 = 11.
    expect(tile).toHaveTextContent("11/38");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Encaisser des dégâts" })).toBeNull();
  });

  it("consultation : nombre affiché, pas de tuile", async () => {
    await renderApp(base({ wounds: 4 }), "readonly");
    expect(screen.queryByRole("button", { name: WOUNDS_TILE })).toBeNull();
    expect(screen.getByLabelText("Blessures subies")).toHaveTextContent("4");
  });
});
