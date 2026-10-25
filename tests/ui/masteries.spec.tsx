/** Lot 12, v2.4.0 (HANDOFF annexe E.4, E.5) : badge « Maîtrise » du lanceur, armure du livre, terrain et rappels. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
const rank = (c: Character, name: string, r: number) => {
  c.skills.find((s) => s.name === name)!.rank = r;
  return c;
};

async function renderApp(character: Character = base()) {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const toCombat = () => {
  click("Aide de jeu");
  click("Combat");
};

describe("Maîtrises au lanceur (annexe E.4)", () => {
  it("Kenjutsu 3 : dégâts au katana 6g2, badge « Maîtrise · +1g0 · Kenjutsu 3 » ; Kenjutsu 2 : aucun badge", async () => {
    await renderApp(rank(base(), "Kenjutsu", 3));
    toCombat();
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("6g2");
    const chip = within(roller().getByTestId("tech-chips")).getByTitle("Maîtrise Kenjutsu 3");
    expect(chip).toHaveTextContent("Maîtrise+1g0 · Kenjutsu 3");
    expect(chip).toHaveClass("mastery");
  });

  it("sans maîtrise atteinte : pas de badge", async () => {
    await renderApp();
    toCombat();
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("5g2");
    expect(roller().queryByTestId("tech-chips")).toBeNull();
  });

  it("Défense 7 : panneau « Rappels de maîtrise » en escarmouche", async () => {
    await renderApp(rank(base(), "Défense", 7));
    toCombat();
    click("Afficher le détail : Rappels de maîtrise");
    expect(screen.getByText("Défense : une action simple permise en Défense totale.")).toBeInTheDocument();
  });

  it("Athlétisme 3 : terrain modéré sans pénalité, note de maîtrise", async () => {
    await renderApp(rank(base(), "Athlétisme", 3));
    click("Aide de jeu");
    click("Déplacement");
    fireEvent.click(within(screen.getByRole("group", { name: "Terrain" })).getByRole("button", { name: "Modéré" }));
    expect(screen.getByTestId("move-water")).toHaveTextContent(/^Anneau d'Eau 2$/);
    expect(screen.getByTestId("terrain-waiver")).toHaveTextContent("Maîtrise Athlétisme 3 : terrain modéré sans pénalité.");
    fireEvent.click(within(screen.getByRole("group", { name: "Terrain" })).getByRole("button", { name: "Difficile" }));
    expect(screen.getByTestId("move-water")).toHaveTextContent("Anneau d'Eau 2 → 1");
    expect(screen.queryByTestId("terrain-waiver")).toBeNull();
  });
});

describe("Armure du livre (annexe E.5)", () => {
  it("la liste remplit nom, bonus et réduction (modifiables) ; l'effet s'affiche ; catalogId enregistré", async () => {
    const { storage } = await renderApp();
    fireEvent.click(screen.getByTestId("armor-tn").closest("button")!);
    const editor = within(screen.getByRole("group", { name: "Armure" }));
    expect(editor.getByRole("combobox", { name: "Armure du livre" })).toHaveValue("");
    fireEvent.change(editor.getByRole("combobox", { name: "Armure du livre" }), { target: { value: "heavy" } });
    expect(editor.getByRole("textbox", { name: "Armure" })).toHaveValue("Armure lourde");
    expect(editor.getByRole("spinbutton", { name: "Bonus au ND" })).toHaveValue(10);
    expect(editor.getByRole("spinbutton", { name: "Réduction" })).toHaveValue(5);
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("30");
    expect(editor.getByTestId("armor-effect")).toHaveTextContent("Armure lourde : +5 au ND des jets d'Agilité et de Réflexes.");
    // Modifiable ensuite : l'armure reste celle du livre.
    fireEvent.change(editor.getByRole("spinbutton", { name: "Bonus au ND" }), { target: { value: "8" } });
    expect(editor.getByRole("combobox", { name: "Armure du livre" })).toHaveValue("heavy");
    await vi.waitFor(async () => expect((await storage.library.get("kakita"))?.character.armor)
      .toEqual({ name: "Armure lourde", bonus: 8, reduction: 5, catalogId: "heavy" }));
    // « Personnalisée » retire l'armure du livre, garde les valeurs.
    fireEvent.change(editor.getByRole("combobox", { name: "Armure du livre" }), { target: { value: "" } });
    expect(editor.queryByTestId("armor-effect")).toBeNull();
    expect(editor.getByRole("spinbutton", { name: "Bonus au ND" })).toHaveValue(8);
  });

  it("armure lourde : ND final de l'attaque « + 5 armure » et note dans le lanceur", async () => {
    const c = base();
    c.armor = { name: "Armure lourde", bonus: 10, reduction: 5, catalogId: "heavy" };
    await renderApp(c);
    toCombat();
    click(/^Attaque · Katana/);
    expect(roller().getByTestId("final-tn").parentElement).toHaveTextContent("+ 5 armure");
    expect(roller().getByTestId("armor-note")).toHaveTextContent("Armure lourde : +5 au ND (Agilité, Réflexes).");
  });

  it("fiche, bloc Identité : la liste en édition, l'effet en lecture", async () => {
    const c = base();
    c.armor = { name: "Armure légère", bonus: 5, reduction: 3, catalogId: "light" };
    await renderApp(c);
    expect(within(screen.getByTestId("block-identity")).getByTestId("armor-effect"))
      .toHaveTextContent("Armure légère : +5 au ND des jets d'Athlétisme et de Discrétion.");
    click("Edit : Identité & réputation");
    expect(within(screen.getByTestId("block-identity")).getByRole("combobox", { name: "Armure du livre" })).toHaveValue("light");
  });
});
