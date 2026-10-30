/**
 * Lot 23, v2.20.0 (HANDOFF annexe L.7, L.8) : liens vers le portail dans la Fiche et l'Aide de jeu, cas O12 à O15 et O17.
 * O16 (Aide de jeu à 390 px) : tests/e2e/portal.spec.ts.
 * Lot 29, v2.21.4 : liens de sort filtrés par élément (`&el=`).
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { migrate, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import tamori from "../../reference/exemple-shugenja.json";

const PORTAL = "https://vincenzorpg.github.io/L5R/";
const bushi = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });
const shugenja = () => migrate(structuredClone(tamori));

async function renderApp(character: Character, mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "a", character, mode, updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  await screen.findByRole("heading", { level: 1 });
}

function expectExternal(a: Element, href: string) {
  expect(a).toHaveAttribute("href", href);
  expect(a).toHaveAttribute("target", "_blank");
  expect(a.getAttribute("rel")?.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  expect(a.querySelector("svg.ext")).not.toBeNull();
}
const header = () => document.querySelector("header.top") as HTMLElement;
const view = (name: string) => fireEvent.click(within(screen.getByRole("group", { name: "Vue" })).getByRole("button", { name }));
const situation = (name: string) => fireEvent.click(within(screen.getByRole("group", { name: "Situation" })).getByRole("button", { name }));
const linksBox = () => screen.queryByRole("complementary", { name: "Liens vers le portail" });

describe("O12 : clan de l'en-tête", () => {
  it("fiche Crabe : lien vers la page du clan, avec icône", async () => {
    await renderApp(bushi({ clan: "Crabe" }));
    const link = within(header()).getByRole("link", { name: "Clan du Crabe : page du clan sur le portail (nouvel onglet)" });
    expectExternal(link, `${PORTAL}clans/crabe.html`);
    expect(link).toHaveClass("mon");
    expect(link).toHaveTextContent(/^Clan du Crabe$/);
  });

  it("fiche Araignée : texte simple", async () => {
    await renderApp(bushi({ clan: "Araignée" }));
    expect(within(header()).queryByRole("link")).toBeNull();
    expect(header().querySelector(".mon")).toHaveTextContent("Clan de l'Araignée");
  });

  it("clan non reconnu : texte simple", async () => {
    await renderApp(bushi({ clan: "Tortue" }));
    expect(within(header()).queryByRole("link")).toBeNull();
  });
});

describe("O13 : bloc Sorts d'un shugenja", () => {
  it("lien « Grimoire » dans le titre ; un lien par sort, recherche par nom et élément ; note sous la liste", async () => {
    await renderApp(shugenja());
    const block = within(screen.getByTestId("block-magic"));
    expectExternal(block.getByRole("link", { name: "Grimoire (nouvel onglet)" }), `${PORTAL}grimoire.html`);
    expectExternal(block.getByRole("link", { name: "Sentir dans le grimoire (nouvel onglet)" }), `${PORTAL}grimoire.html?q=Sentir&el=universel`);
    expectExternal(block.getByRole("link", { name: "Frappe de jade dans le grimoire (nouvel onglet)" }), `${PORTAL}grimoire.html?q=Frappe%20de%20jade&el=terre`);
    expect(block.getByText("Chaque lien ouvre le grimoire sur ce sort, filtré par son élément.")).toBeInTheDocument();
  });

  it("en édition, le lien suit l'élément choisi", async () => {
    await renderApp(shugenja());
    fireEvent.click(screen.getByRole("button", { name: "Edit : Rouleaux & invocations" }));
    const group = within(within(screen.getByTestId("block-magic")).getByRole("group", { name: "Sort : Frappe de jade" }));
    const link = () => group.getByRole("link", { name: "Frappe de jade dans le grimoire (nouvel onglet)" });
    expect(link()).toHaveAttribute("href", `${PORTAL}grimoire.html?q=Frappe%20de%20jade&el=terre`);
    fireEvent.change(group.getByRole("combobox", { name: "Élément" }), { target: { value: "fire" } });
    expect(link()).toHaveAttribute("href", `${PORTAL}grimoire.html?q=Frappe%20de%20jade&el=feu`);
  });

  it("en édition, les liens restent à côté des contrôles ; pas de lien pour un sort sans nom", async () => {
    await renderApp(shugenja());
    fireEvent.click(screen.getByRole("button", { name: "Edit : Rouleaux & invocations" }));
    const block = within(screen.getByTestId("block-magic"));
    expect(block.getByRole("link", { name: "Grimoire (nouvel onglet)" })).toBeInTheDocument();
    const group = within(block.getByRole("group", { name: "Sort : Sentir" }));
    expect(group.getByRole("link", { name: "Sentir dans le grimoire (nouvel onglet)" })).toBeInTheDocument();
    expect(group.getByRole("button", { name: "Supprimer Sentir" })).toBeInTheDocument();
    fireEvent.click(block.getByRole("button", { name: "+ Sort" }));
    const links = block.getAllByRole("link", { name: /dans le grimoire/ });
    expect(links).toHaveLength(2);
  });
});

describe("O14 : fiche bushi", () => {
  it("aucun lien de sort", async () => {
    await renderApp(bushi());
    expect(screen.queryByTestId("block-magic")).toBeNull();
    expect(screen.queryByRole("link", { name: /grimoire/i })).toBeNull();
  });
});

describe("O15 : encadré de l'Aide de jeu", () => {
  it("Combat : 1 lien ; Cour : 2 liens ; sans titre ; autre situation : pas d'encadré", async () => {
    await renderApp(bushi());
    view("Aide de jeu");
    situation("Combat");
    let box = linksBox()!;
    expect(within(box).getAllByRole("link")).toHaveLength(1);
    expectExternal(within(box).getByRole("link", { name: /^Mémento de combat/ }), `${PORTAL}aides/combat-memento.html`);
    expect(within(box).queryByRole("heading")).toBeNull();

    for (const sub of ["Duel iaijutsu", "Bataille"]) {
      fireEvent.click(within(screen.getByRole("group", { name: "Type de combat" })).getByRole("button", { name: sub }));
      expect(within(linksBox()!).getAllByRole("link")).toHaveLength(1);
    }

    situation("Cour");
    box = linksBox()!;
    expect(within(box).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      `${PORTAL}aides/etiquette-coutumes.html`, `${PORTAL}aides/bushido-honneur.html`,
    ]);
    expect(box).toHaveTextContent("Castes, cadeaux, cérémonie du thé");

    for (const other of ["Enquête", "Déplacement"]) {
      situation(other);
      expect(linksBox()).toBeNull();
    }
  });
});

describe("O17 : consultation", () => {
  it("tous les liens présents et actifs", async () => {
    await renderApp({ ...shugenja(), clan: "Dragon" }, "readonly");
    expect(within(header()).getByRole("link", { name: /^Clan du Dragon : page du clan/ })).toHaveAttribute("href", `${PORTAL}clans/dragon.html`);
    const block = within(screen.getByTestId("block-magic"));
    expect(block.getAllByRole("link")).toHaveLength(3);
    expect(block.getByRole("link", { name: "Sentir dans le grimoire (nouvel onglet)" })).toHaveAttribute("href", `${PORTAL}grimoire.html?q=Sentir&el=universel`);
    expect(block.getByRole("link", { name: "Frappe de jade dans le grimoire (nouvel onglet)" })).toHaveAttribute("href", `${PORTAL}grimoire.html?q=Frappe%20de%20jade&el=terre`);
    view("Aide de jeu");
    situation("Cour");
    expect(within(linksBox()!).getAllByRole("link")).toHaveLength(2);
    for (const a of screen.getAllByRole("link")) expect(a).not.toHaveAttribute("aria-disabled");
  });
});
