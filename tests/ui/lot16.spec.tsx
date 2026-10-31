/** Lot 16, v2.13.3 (HANDOFF annexe H.7, H.8) : VD en XgY dans toutes les vues, suppression depuis la fiche. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import { VIEW } from "../helpers/views";

const DICE_K = /\b\d+k\d+\b/;

/** Shugenja de test avec une arme et des sorts stockés en « k » (Frappe de jade 2k2, Feux intérieurs 3k2). */
function kuni(): Character {
  const c = CharacterSchema.parse(structuredClone(perso));
  c.weapons = [{ name: "Katana", skill: "Kenjutsu", dr: "3k3" }];
  return c;
}

async function renderApp(character: Character) {
  const storage = memoryStorage();
  await storage.library.put({ id: "perso", character, mode: "edit", updatedAt: "2026-10-29T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const situation = (name: string) => fireEvent.click(within(screen.getByRole("group", { name: "Situation" })).getByRole("button", { name }));
const body = () => document.body.textContent ?? "";

describe("Notation des dés (H.5)", () => {
  it("K2 : aucune VD en « k » dans la Fiche, l'Assistant L5R, les Statistiques et le lanceur", async () => {
    await renderApp(kuni());
    expect(body()).not.toMatch(DICE_K);
    expect(body()).toContain("VD 3g3");
    expect(body()).toContain("VD 2g2");

    click(VIEW.aid);
    situation("Combat");
    expect(body()).not.toMatch(DICE_K);
    fireEvent.click(screen.getAllByRole("button", { name: /^Dégâts · Katana/ })[0]!);
    expect(within(screen.getByRole("dialog", { name: "Lanceur de dés" })).getByText(/\+ VD 3g3/)).toBeInTheDocument();
    expect(body()).not.toMatch(DICE_K);
    click("Duel iaijutsu");
    expect(body()).not.toMatch(DICE_K);

    situation("Magie");
    fireEvent.click(screen.getAllByRole("button", { name: /^Dégâts · Frappe de jade/ })[0]!);
    expect(within(screen.getByRole("dialog", { name: "Lanceur de dés" })).getByText("VD 2g2")).toBeInTheDocument();
    expect(body()).not.toMatch(DICE_K);

    click("Statistiques");
    expect(body()).not.toMatch(DICE_K);
  });

  it("K4 : « Mettre à jour » depuis le catalogue enregistre et affiche la VD en « g »", async () => {
    const c = kuni();
    c.weapons = [{ name: "Cimeterre", skill: "Kenjutsu", dr: "3k2", keywords: ["cimeterre", "moyenne"] }];
    const storage = await renderApp(c);
    const gap = screen.getByRole("group", { name: "Écart avec le livre : Cimeterre" });
    expect(gap).toHaveTextContent("Le livre indique 2g3");
    fireEvent.click(within(gap).getByRole("button", { name: "Mettre à jour" }));
    expect(body()).toContain("VD 2g3");
    await waitFor(async () => expect((await storage.library.get("perso"))?.character.weapons[0]?.dr).toBe("2g3"), { timeout: 1500 });
  });
});

describe("Suppression depuis le bloc Identité (H.7 X1)", () => {
  it("K6 : confirmation et Annuler, bouton d'origine masqué ; Annuler revient ; confirmer ramène à la Bibliothèque", async () => {
    const storage = await renderApp(kuni());
    click("Edit : Identité & réputation");
    click("Supprimer ce personnage…");
    expect(screen.queryByRole("button", { name: "Supprimer ce personnage…" })).toBeNull();
    expect(screen.getByText("Supprimer « Kuni Taeko » ?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer définitivement" })).toHaveClass("btn", "sm", "danger");
    click("Annuler");
    expect(screen.queryByRole("button", { name: "Supprimer définitivement" })).toBeNull();
    click("Supprimer ce personnage…");
    click("Supprimer définitivement");
    expect(await screen.findByRole("heading", { name: "Pas encore de personnage ?" })).toBeInTheDocument();
    expect(await storage.library.list()).toEqual([]);
  });
});
