/**
 * Lot 25, v2.21.0 (HANDOFF annexe M.3) : liens vers le guide et le dépôt du Carnet, cas V1 à V4.
 * V5 à V7 (vrai navigateur, mobile 390 px) : tests/e2e/carnet-links.spec.ts.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { CARNET_LINKS } from "../../src/rules/links";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import pkg from "../../package.json";
import kakita from "../fixtures/kakita-v1.json";
import { VIEW } from "../helpers/views";

const REPO = "https://github.com/nelsio/carnet-l5r";

async function renderApp(character: Character | null = structuredClone(kakita) as Character) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
}

function expectExternal(a: Element, href: string) {
  expect(a).toHaveAttribute("href", href);
  expect(a).toHaveAttribute("target", "_blank");
  expect(a.getAttribute("rel")?.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
}

const footer = () => screen.getByRole("contentinfo");

describe("V1 : adresses du dépôt", () => {
  it("exactement les quatre adresses de l'annexe M.3", () => {
    expect(CARNET_LINKS).toEqual({
      guide: `${REPO}/blob/main/docs/GUIDE.md`,
      releases: `${REPO}/releases`,
      bug: `${REPO}/issues/new`,
      code: REPO,
    });
  });
});

describe("V2 : section « Le Carnet » du menu Ressources", () => {
  it("en dernier, avec la version de package.json et quatre liens sur fond sceau", async () => {
    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Ressources" }));
    const menu = screen.getByRole("menu", { name: "Ressources de la campagne" });
    const groups = within(menu).getAllByRole("group");
    const carnet = groups.at(-1)!;
    expect(carnet).toHaveAttribute("aria-label", "Le Carnet");
    expect(carnet).toHaveTextContent(`Le Carnetv${pkg.version}`);
    const items = within(carnet).getAllByRole("menuitem");
    expect(items.map((a) => a.querySelector(".kj")?.textContent)).toEqual(["帳", "新", "報", "源"]);
    expect(items.map((a) => a.querySelector(".t")?.firstChild?.textContent)).toEqual([
      "Guide d'utilisation", "Nouveautés", "Signaler un problème", "Page du projet",
    ]);
    const hrefs = [CARNET_LINKS.guide, CARNET_LINKS.releases, CARNET_LINKS.bug, CARNET_LINKS.code];
    items.forEach((a, i) => {
      expectExternal(a, hrefs[i]!);
      expect(a.querySelector("svg.ext")).not.toBeNull();
    });
    expect(within(carnet).getByRole("menuitem", { name: /^Signaler un problème : Formulaire GitHub \(compte requis\) \(nouvel onglet\)$/ })).toBeInTheDocument();
    expect(menu.lastElementChild).toHaveTextContent("Liens externes : s'ouvrent dans un nouvel onglet.");
  });
});

describe("V3 : pied de page", () => {
  function expectFooter() {
    const f = within(footer());
    expect(footer()).toHaveTextContent("Carnet de Rokugan");
    const version = f.getByRole("link", { name: `Version ${pkg.version} : nouveautés (nouvel onglet)` });
    expect(version).toHaveTextContent(`v${pkg.version}`);
    expectExternal(version, CARNET_LINKS.releases);
    const nav = within(f.getByRole("navigation", { name: "Liens du Carnet" }));
    const links = nav.getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Guide", "Signaler un bug", "Projet"]);
    [CARNET_LINKS.guide, CARNET_LINKS.bug, CARNET_LINKS.code].forEach((href, i) => {
      expectExternal(links[i]!, href);
      expect(links[i]!.querySelector("svg.ext")).not.toBeNull();
    });
  }

  it("Bibliothèque vide", async () => {
    await renderApp(null);
    expectFooter();
  });

  it("Fiche, Assistant L5R, Statistiques et Bibliothèque avec fiches", async () => {
    await renderApp();
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    expectFooter();
    for (const view of [VIEW.aid, "Statistiques"]) {
      fireEvent.click(screen.getByRole("button", { name: view }));
      expectFooter();
    }
    fireEvent.click(screen.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }));
    await screen.findByRole("heading", { name: "Bibliothèque" });
    expectFooter();
  });

  it("l'état d'enregistrement reste dans le pied de page", async () => {
    await renderApp();
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    fireEvent.click(screen.getByRole("button", { name: "Edit : Identité & réputation" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: "Kakita Haruto II" } });
    expect(await within(footer()).findByText("Enregistré dans ce navigateur", {}, { timeout: 1500 })).toBeInTheDocument();
  });
});

describe("V4 : Bibliothèque vide", () => {
  it("« Première visite ? Lire le guide » sous les deux options de départ", async () => {
    await renderApp(null);
    const start = screen.getByRole("region", { name: "Pas encore de personnage ?" });
    const link = within(start).getByRole("link", { name: "Lire le guide" });
    expectExternal(link, CARNET_LINKS.guide);
    expect(link.closest("p")).toHaveTextContent("Première visite ? Lire le guide");
    // Après les options : dernier élément de la section.
    expect(start.lastElementChild).toBe(link.closest("p"));
  });
});
