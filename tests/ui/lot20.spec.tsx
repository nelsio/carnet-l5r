/** Lot 20, v2.17.0 (HANDOFF annexe J) : bloc Armes en cartes, bloc Identité, Techniques, sorts avant les attaques. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { EXAMPLES } from "../../src/rules/example";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;

async function renderApp(character: Character = base()) {
  const storage = memoryStorage();
  await storage.library.put({ id: "c", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const block = (id: string) => within(screen.getByTestId(`block-${id}`));
const weapon = (name: string) => within(screen.getByRole("group", { name: `Arme : ${name}` }));

describe("Bloc Armes en Edit (J.1)", () => {
  it("Q1 : une carte par arme, champs nommés par leur libellé, plus de tableau", async () => {
    await renderApp();
    click("Edit : Armes");
    expect(block("weapons").queryByRole("table")).toBeNull();
    const katana = weapon("Katana");
    expect(katana.getByRole("textbox", { name: "Nom" })).toHaveValue("Katana");
    expect(katana.getByRole("textbox", { name: "Compétence" })).toHaveValue("Kenjutsu");
    expect(katana.getByRole("textbox", { name: "VD" })).toHaveAttribute("enterkeyhint", "next");
    expect(katana.getByRole("textbox", { name: "VD" })).toHaveAttribute("autocapitalize", "off");
    expect(katana.getByRole("textbox", { name: "Mots-clés" })).toBeInTheDocument();
  });

  it("Q2 : le nom, le VD et les mots-clés se vident entièrement ; le VD vide est accepté pendant la saisie", async () => {
    await renderApp();
    click("Edit : Armes");
    const katana = weapon("Katana");
    const dr = katana.getByRole("textbox", { name: "VD" });
    const keywords = katana.getByRole("textbox", { name: "Mots-clés" });
    fireEvent.change(dr, { target: { value: "" } });
    expect(dr).toHaveValue("");
    fireEvent.change(keywords, { target: { value: "" } });
    expect(keywords).toHaveValue("");
    fireEvent.change(katana.getByRole("textbox", { name: "Nom" }), { target: { value: "" } });
    expect(screen.getByRole("group", { name: "Arme : sans nom" })).toBeInTheDocument();
  });

  it("Q3 : « Force de l'arc » seulement pour une arme à distance", async () => {
    const c = base();
    c.weapons.push({ name: "Yumi", skill: "Kyujutsu", dr: "2g2", bowStrength: 3, keywords: ["arc"] });
    await renderApp(c);
    click("Edit : Armes");
    expect(weapon("Katana").queryByRole("spinbutton", { name: "Force de l'arc" })).toBeNull();
    expect(weapon("Yumi").getByRole("spinbutton", { name: "Force de l'arc" })).toHaveValue(3);
  });
});

describe("Identité et Techniques (J.2, J.3)", () => {
  it("Q4 : Initiative en réserve (.pool) ; valeurs en mono", async () => {
    await renderApp();
    expect(screen.getByTestId("sheet-initiative")).toHaveClass("pool");
  });

  it("Q5 : bouton « + Technique / kata », aucun « sort » dans le bloc Techniques", async () => {
    await renderApp();
    click("Edit : Techniques d'école");
    expect(block("techniques").getByRole("button", { name: "+ Technique / kata" })).toBeInTheDocument();
    expect(screen.getByTestId("block-techniques")).not.toHaveTextContent(/\bsorts?\b/i);
  });
});

describe("Shugenja en escarmouche (J.8)", () => {
  it("Q14 : Initiative, titre « Sorts », sorts, titre « Attaques », armes, actions fixes", async () => {
    await renderApp(EXAMPLES.find((x) => x.id === "shugenja")!.build());
    click(VIEW.aid);
    click("Combat");
    const actions = screen.getByText("Sorts", { selector: "h3" }).closest(".actions")!;
    const items = [...actions.children].map((el) => (el.tagName === "H3" ? `# ${el.textContent}` : el.querySelector(".t")?.textContent ?? ""));
    expect(items[0]).toBe("# Sorts");
    const attacks = items.indexOf("# Attaques");
    expect(attacks).toBeGreaterThan(1);
    expect(items.slice(1, attacks).every((t) => !t.startsWith("#"))).toBe(true);
    expect(items[attacks + 1]).toMatch(/^Attaque · Wakizashi/);
    expect(items.at(-1)).toMatch(/^Défense totale/);
  });

  it("Q15 : bushi, aucun titre de groupe en escarmouche", async () => {
    await renderApp();
    click(VIEW.aid);
    click("Combat");
    expect(screen.queryByText("Attaques", { selector: "h3" })).toBeNull();
    expect(screen.queryByText("Sorts", { selector: "h3" })).toBeNull();
  });
});
