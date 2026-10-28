/** En-tête v2.13.0 (HANDOFF annexe G) : sceau de l'outil, surtitre, titre d'onglet. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const SEAL = "Carnet de Rokugan — ouvrir la bibliothèque";
const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

async function renderApp(character: Character | null = base(), mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-28T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  if (character) await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  else await screen.findByRole("heading", { name: "Aucun personnage dans ce carnet" });
  return view;
}
const header = () => document.querySelector("header.top")!;

describe("Sceau et surtitre (G.3)", () => {
  it("H1 : fiche ouverte : sceau 帳 cliquable, surtitre « Carnet de Rokugan | Clan », plus de bouton Bibliothèque", async () => {
    await renderApp();
    const seal = screen.getByRole("button", { name: SEAL });
    expect(seal).toHaveTextContent("帳");
    expect(seal).toHaveAttribute("title", "Carnet de Rokugan — Bibliothèque");
    expect(header().querySelector(".eyebrow")).toHaveTextContent(/^Carnet de RokuganClan de la Grue$/);
    expect(header().querySelector(".eyebrow .sep")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button", { name: "Bibliothèque" })).toBeNull();
    expect(header().querySelectorAll(".theme-btn")).toHaveLength(2);
  });

  it("H2 : le sceau ouvre la Bibliothèque", async () => {
    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: SEAL }));
    expect(await screen.findByRole("heading", { name: "Bibliothèque" })).toBeInTheDocument();
  });

  it("H3 : sans personnage : sceau décoratif, titre et sous-titre de l'outil, pas de surtitre", async () => {
    await renderApp(null);
    const seal = header().querySelector(".seal")!;
    expect(seal.tagName).toBe("SPAN");
    expect(seal).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Carnet de Rokugan");
    expect(screen.getByText("Compagnon de campagne · L5R 4e")).toBeInTheDocument();
    expect(header().querySelector(".eyebrow")).toBeNull();
  });

  it("H6 : clan inconnu ou vide : surtitre « Carnet de Rokugan » seul, sans séparateur", async () => {
    await renderApp(base({ clan: "" }));
    expect(header().querySelector(".eyebrow")).toHaveTextContent(/^Carnet de Rokugan$/);
    expect(header().querySelector(".eyebrow .sep")).toBeNull();
  });

  it("H11 : consultation : sceau cliquable, badge « Consultation » inchangé", async () => {
    await renderApp(base(), "readonly");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Consultation");
    fireEvent.click(screen.getByRole("button", { name: SEAL }));
    expect(await screen.findByRole("heading", { name: "Bibliothèque" })).toBeInTheDocument();
  });
});

describe("Titre d'onglet (G.3)", () => {
  it("H8 : « Nom · Carnet de Rokugan », suit un renommage, « Carnet de Rokugan » après fermeture", async () => {
    await renderApp();
    expect(document.title).toBe("Kakita Haruto · Carnet de Rokugan");
    fireEvent.click(screen.getByRole("button", { name: "Edit : Identité & réputation" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: "Kakita Ryoku" } });
    expect(document.title).toBe("Kakita Ryoku · Carnet de Rokugan");
    fireEvent.click(screen.getByRole("button", { name: SEAL }));
    await screen.findByRole("heading", { name: "Bibliothèque" });
    expect(document.title).toBe("Carnet de Rokugan");
  });
});
