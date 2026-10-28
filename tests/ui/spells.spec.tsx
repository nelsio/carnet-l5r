/** Lot 13, v2.9.0 (HANDOFF annexe F.5) : section « Rouleaux & invocations » de la fiche. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";

const shugenja = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });

async function renderApp(character: Character) {
  const storage = memoryStorage();
  await storage.library.put({ id: "perso", character, mode: "edit", updatedAt: "2026-10-28T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const magic = () => within(screen.getByTestId("block-magic"));
const saved = async (storage: ReturnType<typeof memoryStorage>) => (await storage.library.get("perso"))?.character.spells ?? [];

describe("Rouleaux & invocations (F.5)", () => {
  it("lecture : une carte par sort, triée par élément puis maîtrise, avec ND, mémorisé/parchemin, ligne Portée · Zone · Durée", async () => {
    await renderApp(shugenja());
    const cards = screen.getByTestId("block-magic").querySelectorAll(".spell");
    expect([...cards].map((x) => x.querySelector("b")?.textContent)).toEqual(["Sentir", "Vent favorable", "Frappe de jade", "Mur de terre", "Feux intérieurs"]);

    const jade = within(screen.getByTestId("spell-jade-strike"));
    expect(jade.getByText("Terre")).toHaveClass("tag", "el");
    expect(jade.getByText("Maîtrise 1 · ND 10")).toBeInTheDocument();
    expect(jade.getByText("mémorisé")).toBeInTheDocument();
    expect(jade.getByText("Portée 100 pieds · Zone Une cible · Durée Instantanée")).toBeInTheDocument();
    expect(jade.getByText("Jade")).toBeInTheDocument();
    expect(jade.getByText("VD 2k2")).toBeInTheDocument();
    expect(jade.getByText(/Portée \(\+10 pieds\) · Cibles \(\+1\)/)).toBeInTheDocument();
    expect(within(screen.getByTestId("spell-earth-2")).getByText("Maîtrise 2 · ND 15")).toBeInTheDocument();
    expect(within(screen.getByTestId("spell-earth-2")).getByText("parchemin")).toBeInTheDocument();
    expect(within(screen.getByTestId("spell-sentir")).getByText("Tous")).toBeInTheDocument();
  });

  it("absente pour un bushi ; présente, vide, si l'école affichée est de shugenja", async () => {
    await renderApp(structuredClone(kakita) as Character);
    expect(screen.queryByTestId("block-magic")).toBeNull();
    click("Edit : Identité & réputation");
    fireEvent.change(screen.getByRole("textbox", { name: "École (nom affiché)" }), { target: { value: "École de shugenja Isawa" } });
    expect(magic().getByText(/Aucun sort noté/)).toBeInTheDocument();
  });

  it("édition : sorts universels en un clic, « + Sort », mots-clés à cocher et libres, mémorisé ; enregistré", async () => {
    const storage = await renderApp(shugenja({ spells: [], school: "École de shugenja Kuni" }));
    click("Edit : Rouleaux & invocations");
    click("Ajouter les sorts universels");
    expect(magic().getAllByRole("group", { name: /^Sort : / }).map((g) => g.getAttribute("aria-label")))
      .toEqual(["Sort : Sentir", "Sort : Communier", "Sort : Invoquer"]);
    expect(magic().queryByRole("button", { name: "Ajouter les sorts universels" })).toBeNull();

    click("+ Sort");
    const card = within(magic().getByRole("group", { name: "Sort : ce sort" }));
    fireEvent.change(card.getByRole("textbox", { name: "Nom" }), { target: { value: "Feux intérieurs" } });
    const fire = within(magic().getByRole("group", { name: "Sort : Feux intérieurs" }));
    fireEvent.change(fire.getByRole("combobox", { name: "Élément" }), { target: { value: "fire" } });
    fireEvent.change(fire.getByRole("spinbutton", { name: "Maîtrise" }), { target: { value: "2" } });
    fireEvent.click(fire.getByRole("button", { name: "Bataille" }));
    expect(fire.getByRole("button", { name: "Bataille" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(fire.getByRole("textbox", { name: "Autres mots-clés de Feux intérieurs" }), { target: { value: "Feu sacré" } });
    fireEvent.change(fire.getByRole("textbox", { name: "VD (dégâts)" }), { target: { value: "3k2" } });
    fireEvent.change(fire.getByRole("textbox", { name: "Augmentations (une par ligne)" }), { target: { value: "Portée (+10 pieds)\nCibles (+1)" } });
    fireEvent.click(fire.getByRole("checkbox", { name: /Mémorisé/ }));
    expect(fire.getByText("· 2 XP")).toBeInTheDocument();

    await vi.waitFor(async () => expect((await saved(storage)).find((s) => s.name === "Feux intérieurs")).toMatchObject({
      element: "fire", mastery: 2, keywords: ["Bataille", "Feu sacré"], damage: "3k2", raises: "Portée (+10 pieds)\nCibles (+1)", memorized: true,
    }));
    expect((await saved(storage)).find((s) => s.name === "Sentir")).toMatchObject({ element: "all", mastery: 1 });

    click("Terminer : Rouleaux & invocations");
    expect(magic().getByText("Maîtrise 2 · ND 15")).toBeInTheDocument();
    expect(magic().getByText("Feu sacré")).toBeInTheDocument();
  });

  it("suppression d'un sort ; la section reste ouverte pendant l'édition", async () => {
    const storage = await renderApp(shugenja({ school: "", spells: shugenja().spells?.slice(0, 1) }));
    click("Edit : Rouleaux & invocations");
    click("Supprimer Sentir");
    expect(magic().getByRole("button", { name: "+ Sort" })).toBeInTheDocument();
    await vi.waitFor(async () => expect(await saved(storage)).toEqual([]));
    click("Terminer : Rouleaux & invocations");
    expect(screen.queryByTestId("block-magic")).toBeNull();
  });
});
