/** Lot 13, v2.11.0 (HANDOFF annexe F.5) : situation « Magie », lanceur de sort, statistiques. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterSchema, type Character, type Spell } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";

const kuni = (patch: Partial<Character> = {}): Character => ({ ...CharacterSchema.parse(structuredClone(perso)), ...patch });

async function renderApp(character: Character) {
  const storage = memoryStorage();
  await storage.library.put({ id: "perso", character, mode: "edit", updatedAt: "2026-10-28T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const situations = () => within(screen.getByRole("group", { name: "Situation" }));
const toMagic = () => {
  click("Aide de jeu");
  fireEvent.click(situations().getByRole("button", { name: "Magie" }));
};
const card = (label: string) => screen.getAllByRole("button", { name: new RegExp(`^${label}`) })[0]!;

describe("Situation « Magie » (F.5)", () => {
  it("onglet réservé aux shugenja : 5 situations pour un Kuni, 4 pour un bushi", async () => {
    await renderApp(structuredClone(kakita) as Character);
    click("Aide de jeu");
    expect(situations().queryByRole("button", { name: "Magie" })).toBeNull();
  });

  it("cartes groupées par élément ; G2 et G3 grisées avec leur raison ; dégâts rattachés", async () => {
    await renderApp(kuni());
    toMagic();
    expect(situations().getAllByRole("button").map((b) => b.textContent)).toEqual(["Enquête", "Cour", "Déplacement", "Combat", "Magie"]);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Tous", "Air", "Terre", "Feu"]);
    expect(card("Lancer · Frappe de jade")).toHaveTextContent("5g3");
    expect(card("Lancer · Frappe de jade")).toHaveTextContent("ND 10 · 1 action complexe · Jade · mémorisé");
    expect(screen.getByTestId("blocked-spell-air-1")).toHaveTextContent("2g2");
    expect(screen.getByTestId("blocked-spell-air-1")).toHaveTextContent("Déficience : impossible au rang 1.");
    expect(screen.getByTestId("blocked-spell-earth-2")).toHaveTextContent("Maîtrise 2 > rang 1.");
    expect(card("Dégâts · Feux intérieurs")).toHaveClass("child");
    expect(card("Dégâts · Feux intérieurs")).toHaveTextContent("3g2");

    click("Lancer quand même : Lancer · Mur de terre");
    expect(roller().getByTestId("spell-restriction")).toHaveTextContent("Maîtrise 2 > rang 1. Tu peux lancer quand même");
    expect(roller().getByTestId("spell-scroll")).toHaveTextContent("parchemin en main (le mémoriser coûte 2 XP)");
  });

  it("lanceur : réserve, origine, ND fixe, augmentation gratuite Jade (G4), augmentations du sort, effet", async () => {
    await renderApp(kuni());
    toMagic();
    fireEvent.click(card("Lancer · Frappe de jade"));
    expect(roller().getByTestId("pool")).toHaveTextContent("5g3");
    expect(roller().getByText("Terre 3 + rang 1 + affinité 1")).toBeInTheDocument();
    expect(roller().getByTestId("spell-tn")).toHaveTextContent("10");
    expect(roller().getByTestId("final-tn")).toHaveTextContent("10");
    expect(roller().getByTestId("spell-free-raises")).toHaveTextContent("1 augmentation gratuite de l'école : mot-clé Jade.");
    expect(roller().getByText("Augm. gratuites (+1 bonus)")).toBeInTheDocument();
    expect(within(roller().getByTestId("spell-raises")).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Portée (+10 pieds)", "Cibles (+1)"]);
    expect(roller().getByTestId("spell-effect")).toHaveTextContent("Projectile de jade");
    expect(roller().queryByTestId("spell-scroll")).toBeNull();
    // Case de l'école : cible non humaine, +1g0.
    fireEvent.click(roller().getByRole("checkbox", { name: /Cible non humaine/ }));
    expect(roller().getByTestId("pool")).toHaveTextContent("6g3");
    expect(roller().getByText("Terre 3 + rang 1 + affinité 1 + 1 (école)")).toBeInTheDocument();
  });

  it("G6 : maîtrise 3, 2 augmentations pour le temps : ND 20 + 10, 1 action complexe", async () => {
    const big: Spell = { id: "earth-3", name: "Tremblement", element: "earth", mastery: 3, keywords: [], range: "", area: "", duration: "", raises: "", memorized: true, effect: "" };
    await renderApp(kuni({ schoolRank: 3, spells: [big] }));
    toMagic();
    fireEvent.click(card("Lancer · Tremblement"));
    expect(roller().getByTestId("cast-time")).toHaveTextContent("3 actions complexes");
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augm. pour le temps d'incantation" }), { target: { value: "2" } });
    expect(roller().getByTestId("final-tn")).toHaveTextContent("30");
    expect(roller().getByText("= 20 + 10 augm.")).toBeInTheDocument();
    expect(roller().getByTestId("cast-time")).toHaveTextContent("1 action complexe");
    // Les augmentations pour le temps comptent dans le plafond du Vide.
    expect(roller().getByText(/max 2/)).toBeInTheDocument();
  });

  it("G9 : sort universel lancé en Feu : 3g2", async () => {
    await renderApp(kuni());
    toMagic();
    fireEvent.click(card("Lancer · Sentir"));
    const element = roller().getByRole("combobox", { name: "Élément (sort universel)" });
    expect(element).toHaveValue("earth");
    expect(roller().getByTestId("pool")).toHaveTextContent("5g3");
    fireEvent.change(element, { target: { value: "fire" } });
    expect(roller().getByTestId("pool")).toHaveTextContent("3g2");
    expect(roller().getByText("Feu 2 + rang 1")).toBeInTheDocument();
  });

  it("G12 : Agasha, sort de Feu lancé avec l'Anneau d'Eau : réserve sur l'Eau, 1 point de Vide dépensé au lancer", async () => {
    const storage = await renderApp(kuni({ schoolId: "agasha-shugenja" }));
    toMagic();
    click("Lanceur de dés : masqué");
    fireEvent.click(card("Lancer · Feux intérieurs"));
    expect(roller().getByTestId("pool")).toHaveTextContent("4g2");
    fireEvent.click(roller().getByRole("checkbox", { name: /lancer avec un autre Anneau/ }));
    fireEvent.change(roller().getByRole("combobox", { name: "Anneau du jet" }), { target: { value: "water" } });
    expect(roller().getByText("Eau 2 + rang 1 + affinité 1")).toBeInTheDocument();
    click("Lancer 4g2");
    await vi.waitFor(async () => expect((await storage.library.get("perso"))?.character.voidPoints).toBe(1));
    expect(roller().getByRole("checkbox", { name: /lancer avec un autre Anneau/ })).not.toBeChecked();
  });

  it("G11 : Moshi, case « Il fait jour » sur un sort de Feu : rang +1", async () => {
    await renderApp(kuni({ schoolId: "moshi-shugenja" }));
    toMagic();
    fireEvent.click(card("Lancer · Feux intérieurs"));
    expect(roller().getByTestId("pool")).toHaveTextContent("3g2");
    fireEvent.click(roller().getByRole("checkbox", { name: /Il fait jour/ }));
    expect(roller().getByTestId("pool")).toHaveTextContent("4g2");
    expect(roller().getByText("Feu 2 + rang 1 + affinité 1")).toBeInTheDocument();
  });

  it("G13 : dégâts d'un sort : 3g2, sans case Vide ; case « Cible souillée » de Kuni +1g1", async () => {
    await renderApp(kuni());
    toMagic();
    fireEvent.click(card("Dégâts · Feux intérieurs"));
    expect(roller().getByTestId("pool")).toHaveTextContent("3g2");
    expect(roller().getByText("VD 3k2")).toBeInTheDocument();
    expect(roller().queryByRole("checkbox", { name: /point de Vide/ })).toBeNull();
    fireEvent.click(roller().getByRole("checkbox", { name: /Cible souillée/ }));
    expect(roller().getByTestId("pool")).toHaveTextContent("4g3");
  });

  it("Statistiques : une ligne par sort, et ses dégâts", async () => {
    await renderApp(kuni());
    click("Statistiques");
    const row = screen.getByText("Sort · Frappe de jade (Terre)").closest("tr")!;
    expect(within(row).getByText("5g3")).toBeInTheDocument();
    expect(screen.getByText("Sort · Sentir (Terre)")).toBeInTheDocument();
    expect(within(screen.getAllByText(/Dégâts · Feux intérieurs/)[0]!.closest("tr")!).getByText("sans ND")).toBeInTheDocument();
  });
});
