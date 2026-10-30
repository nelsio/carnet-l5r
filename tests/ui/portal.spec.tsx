/**
 * Lot 22, v2.19.0 (HANDOFF annexe L.2 à L.4) : menu Ressources et Bibliothèque, cas O3, O4, O5, O7, O8, O9.
 * O5 au clavier réel (Entrée, Espace), O6, O7 en largeur et O10 : tests/e2e/portal.spec.ts.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const PORTAL = "https://vincenzorpg.github.io/L5R/";
const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

let ids = 0;
async function renderApp(character: Character | null = base()) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} newId={() => `id-${++ids}`} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return storage;
}
const resources = () => screen.getByRole("button", { name: "Ressources" });
function openMenu() {
  fireEvent.click(resources());
  return screen.getByRole("menu", { name: "Ressources de la campagne" });
}
const showLibrary = () => fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));

/** O3 : nouvel onglet, sans référent, icône externe. */
function expectExternal(a: Element) {
  expect(a).toHaveAttribute("target", "_blank");
  expect(a.getAttribute("rel")?.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  expect(a.getAttribute("href")!.startsWith(PORTAL)).toBe(true);
  expect(a.querySelector("svg.ext")).not.toBeNull();
}

afterEach(() => vi.restoreAllMocks());

describe("O4 : menu Ressources", () => {
  it("bouton après Thème, fermé par défaut", async () => {
    await renderApp();
    const b = resources();
    expect(b).toHaveAttribute("aria-haspopup", "menu");
    expect(b).toHaveAttribute("aria-expanded", "false");
    const labels = [...document.querySelectorAll("header.top .theme-btn")].map((x) => x.getAttribute("title"));
    expect(labels.at(-1)).toBe("Ressources");
    expect(labels.at(-2)).toMatch(/^Thème/);
  });

  it("fiche Crabe : 7 entrées dont la page du clan", async () => {
    await renderApp(base({ clan: "Crabe" }));
    const menu = openMenu();
    expect(resources()).toHaveAttribute("aria-expanded", "true");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(7);
    const clan = within(menu).getByRole("menuitem", { name: /^Clan du Crabe/ });
    expect(clan).toHaveAttribute("href", `${PORTAL}clans/crabe.html`);
    expect(clan).toHaveTextContent("土");
    expect(items.map((a) => a.getAttribute("href"))).toEqual([
      `${PORTAL}index.html`, `${PORTAL}clans/crabe.html`, `${PORTAL}createcharacter.html`, `${PORTAL}grimoire.html`,
      `${PORTAL}aides/combat-memento.html`, `${PORTAL}aides/bushido-honneur.html`, `${PORTAL}aides/etiquette-coutumes.html`,
    ]);
    expect(within(menu).getAllByRole("group").map((g) => g.getAttribute("aria-label"))).toEqual(["Campagne", "Créer", "Références"]);
    expect(menu).toHaveTextContent("Site de la campagne. S'ouvre dans un nouvel onglet.");
  });

  it("fiche Araignée : 6 entrées, pas de page de clan", async () => {
    await renderApp(base({ clan: "Araignée" }));
    expect(within(openMenu()).getAllByRole("menuitem")).toHaveLength(6);
  });

  it("Bibliothèque vide : présent, 6 entrées", async () => {
    await renderApp(null);
    expect(within(openMenu()).getAllByRole("menuitem")).toHaveLength(6);
  });

  it("Bibliothèque avec fiches : présent, sans page de clan", async () => {
    await renderApp(base({ clan: "Crabe" }));
    showLibrary();
    await screen.findByRole("heading", { name: "Bibliothèque" });
    expect(within(openMenu()).getAllByRole("menuitem")).toHaveLength(6);
  });

  it("O3 : chaque entrée est un lien externe", async () => {
    await renderApp();
    for (const a of within(openMenu()).getAllByRole("menuitem")) expectExternal(a);
  });

  it("choisir un lien ferme le menu ; clic hors du menu aussi", async () => {
    await renderApp();
    fireEvent.click(within(openMenu()).getByRole("menuitem", { name: /^Grimoire/ }));
    expect(screen.queryByRole("menu")).toBeNull();
    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    openMenu();
    fireEvent.click(screen.getByTestId("res-scrim"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("reste disponible en consultation", async () => {
    const storage = memoryStorage();
    await storage.library.put({ id: "r", character: base({ clan: "Crabe" }), mode: "readonly", updatedAt: "2026-10-30T10:00:00.000Z" });
    render(<App storage={storage} rng={() => 5} />);
    await screen.findByText("Consultation");
    expect(within(openMenu()).getAllByRole("menuitem")).toHaveLength(7);
  });
});

describe("O5 : menu Ressources au clavier", () => {
  it("focus sur la 1re entrée, flèches, Échap ferme et rend le focus", async () => {
    await renderApp();
    const menu = openMenu();
    const items = within(menu).getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0]!, { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1]!, { key: "ArrowUp" });
    fireEvent.keyDown(items[0]!, { key: "ArrowUp" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0]!, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(resources()).toHaveFocus();
    expect(resources()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("O7 : Bibliothèque vide", () => {
  it("deux options, trois étapes chacune, import en lien", async () => {
    await renderApp(null);
    const start = screen.getByRole("region", { name: "Pas encore de personnage ?" });
    expect(within(start).getByRole("button", { name: "Importer un JSON" })).toHaveClass("linkbtn");
    const options = within(start).getAllByRole("article");
    expect(options.map((o) => within(o).getByRole("heading").textContent)).toEqual(["Forger sur le portail", "Fiche vierge"]);
    for (const o of options) expect(within(o).getAllByRole("listitem")).toHaveLength(3);
    const forge = within(options[0]!).getByRole("link", { name: "Ouvrir la Forge (nouvel onglet)" });
    expect(forge).toHaveAttribute("href", `${PORTAL}createcharacter.html`);
    expect(forge).toHaveClass("btn", "accent");
    expectExternal(forge);
    const discover = screen.getByRole("link", { name: "Découvrir la campagne" });
    expect(discover).toHaveAttribute("href", `${PORTAL}index.html`);
    expectExternal(discover);
  });

  it("« Nouvelle fiche vierge » crée une fiche", async () => {
    const storage = await renderApp(null);
    fireEvent.click(screen.getByRole("button", { name: "Nouvelle fiche vierge" }));
    expect(await screen.findByRole("button", { name: "Terminer : Identité & réputation" })).toBeInTheDocument();
    expect(await storage.library.list()).toHaveLength(1);
  });
});

describe("O8 : modèles de personnage", () => {
  it("3 cartes : type, nom, clan et Rang lus dans la fiche", async () => {
    await renderApp(null);
    const section = screen.getByRole("region", { name: "Modèles de personnage" });
    const cards = within(section).getAllByRole("article");
    expect(cards.map((c) => c.textContent)).toEqual([
      expect.stringContaining("BushiKakita HarutoClan de la Grue · Rang 1"),
      expect.stringContaining("ShugenjaTamori AyaneClan du Dragon · Rang 1"),
      expect.stringContaining("CourtisanDoji SayuriClan de la Grue · Rang 1"),
    ]);
    for (const c of cards) {
      expect(within(c).getByRole("button", { name: /^Utiliser le modèle/ })).toHaveTextContent("Utiliser");
      expect(within(c).getByRole("button", { name: /^JSON du modèle/ })).toHaveTextContent("JSON");
    }
  });

  it("« Utiliser » crée une fiche locale et l'ouvre", async () => {
    const storage = await renderApp(null);
    fireEvent.click(screen.getByRole("button", { name: "Utiliser le modèle Shugenja" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Tamori Ayane" })).toBeInTheDocument();
    const list = await storage.library.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ mode: "edit", character: { name: "Tamori Ayane" } });
  });

  it("« JSON » télécharge le bon fichier", async () => {
    await renderApp(null);
    const names: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:exemple");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    for (const t of ["Bushi", "Shugenja", "Courtisan"]) fireEvent.click(screen.getByRole("button", { name: `JSON du modèle ${t}` }));
    expect(names).toEqual(["exemple-bushi-l5r.json", "exemple-shugenja-l5r.json", "exemple-courtisan-l5r.json"]);
  });
});

describe("O9 : Bibliothèque avec fiches", () => {
  it("plus de « Nouvelle fiche » en tête de liste ; carte « Un nouveau personnage ? »", async () => {
    await renderApp();
    showLibrary();
    await screen.findByRole("heading", { name: "Bibliothèque" });
    const head = document.querySelector(".panel-head")!;
    expect(within(head as HTMLElement).getAllByRole("button").map((b) => b.textContent)).toEqual(["Importer un JSON…"]);
    const card = screen.getByRole("region", { name: "Un nouveau personnage ?" });
    expectExternal(within(card).getByRole("link", { name: "Ouvrir la Forge (nouvel onglet)" }));
    expect(within(card).getByRole("button", { name: "Nouvelle fiche" })).toBeInTheDocument();
    expect(within(card).getAllByRole("button", { name: /^Partir du modèle/ }).map((b) => b.textContent)).toEqual(["Bushi", "Shugenja", "Courtisan"]);
  });

  it("un modèle du pied de carte crée et ouvre une fiche", async () => {
    const storage = await renderApp();
    showLibrary();
    fireEvent.click(await screen.findByRole("button", { name: "Partir du modèle Courtisan" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Doji Sayuri" })).toBeInTheDocument();
    expect(await storage.library.list()).toHaveLength(2);
  });
});
