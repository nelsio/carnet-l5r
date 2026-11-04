/** Lanceur de dés : notation XgY, Vide aux dégâts, manœuvres, Défense totale, tir monté, terrain. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";
import { VIEW } from "../helpers/views";

const DICE_K = /\b\d+k\d+\b/;

const base = () => structuredClone(kakita) as Character;
const always = (v: number) => () => v;

/** Shugenja de test avec une arme et des sorts stockés en « k » (Frappe de jade 2k2, Feux intérieurs 3k2). */
function kuni(): Character {
  const c = CharacterSchema.parse(structuredClone(perso));
  c.weapons = [{ name: "Katana", skill: "Kenjutsu", dr: "3k3" }];
  return c;
}

async function renderApp(character: Character = base(), rng = always(5)) {
  const storage = memoryStorage();
  await storage.library.put({ id: "perso", character, mode: "edit", updatedAt: "2026-10-29T10:00:00.000Z" });
  render(<App storage={storage} rng={rng} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const situation = (name: string) => fireEvent.click(within(screen.getByRole("group", { name: "Situation" })).getByRole("button", { name }));
const body = () => document.body.textContent ?? "";
const toCombat = () => {
  click(VIEW.aid);
  click("Combat");
};

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

describe("Lanceur : correctifs de règles (annexe E.2)", () => {
  it("E28 : dégâts au wakizashi sans case de Vide ; au katana « Vide : +1g1 aux dégâts (katana) »", async () => {
    await renderApp();
    toCombat();
    click(/^Dégâts · Wakizashi/);
    expect(roller().queryByRole("checkbox", { name: /Vide/ })).toBeNull();
    click(/^Dégâts · Katana/);
    const box = roller().getByRole("checkbox", { name: /Vide : \+1g1 aux dégâts \(katana\)/ });
    fireEvent.click(box);
    expect(screen.getByTestId("pool")).toHaveTextContent("6g3");
    // L'attaque garde la case habituelle.
    click(/^Attaque · Wakizashi/);
    expect(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ })).toBeInTheDocument();
  });

  it("L13 : Coup ciblé « Tête » sur un ND de 20 → ND final 35 ; Renversement d'un quadrupède → 4 augmentations", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "20" } });
    click(/^Coup ciblé/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("25");
    fireEvent.change(roller().getByRole("combobox", { name: "Coup ciblé · zone" }), { target: { value: "head" } });
    expect(screen.getByTestId("final-tn")).toHaveTextContent("35");
    expect(roller().getByRole("button", { name: /^Coup ciblé/ })).toHaveTextContent("Coup ciblé 3");
    click(/^Coup ciblé/);
    click(/^Renversement/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("30");
    fireEvent.click(roller().getByRole("checkbox", { name: /Renverser un quadrupède/ }));
    expect(screen.getByTestId("final-tn")).toHaveTextContent("40");
  });

  it("L12 : Désarmement réussi → dégâts liés 2g1 sans la Force, note dans le lanceur", async () => {
    await renderApp(base(), always(9));
    toCombat();
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "10" } });
    click(/^Désarmement/);
    click("Lancer 5g3");
    expect(roller().getByTestId("disarm-note")).toHaveTextContent("2g1 sans la Force");
    click(/^Dégâts · Katana/);
    expect(screen.getByTestId("pool")).toHaveTextContent("2g1");
    expect(roller().getByText(/^Désarmement : 2g1 sans la Force/)).toBeInTheDocument();
  });

  it("L6 : Défense totale, jet de 15 → ND d'armure 28 (moitié arrondie au supérieur)", async () => {
    await renderApp(base(), always(5));
    toCombat();
    click(/^Défense totale.*moitié du résultat/);
    click("Lancer 4g3");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("28");
    expect(roller().getByText(/^\+8 au ND d'armure ce round/)).toBeInTheDocument();
  });

  it("L27 : tir au yumi monté → ND +10 dans le détail du ND final", async () => {
    const c = base();
    c.weapons.push({ name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3, keywords: ["arc", "distance", "grande"] });
    c.skills.push({ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] });
    await renderApp(c);
    toCombat();
    click(/^Tir · Yumi/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "20" } });
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
    // La case « Monté » est dans le panneau Posture, même sans école (annexe E.3 F2).
    fireEvent.click(screen.getByRole("checkbox", { name: /^Monté/ }));
    expect(screen.getByTestId("final-tn")).toHaveTextContent("30");
    expect(roller().getByText(/\+ 10 arc/)).toBeInTheDocument();
  });


  it("L8 : terrain modéré puis difficile, Eau 2 → distances de l'Anneau 1", async () => {
    await renderApp();
    click(VIEW.aid);
    click("Déplacement");
    const terrain = within(screen.getByRole("group", { name: "Terrain" }));
    expect(terrain.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("10 pi")).toBeInTheDocument();
    fireEvent.click(terrain.getByRole("button", { name: "Modéré" }));
    expect(screen.getByTestId("move-water")).toHaveTextContent("Anneau d'Eau 2 → 1");
    expect(screen.getByText("5 pi")).toBeInTheDocument();
    expect(screen.getByText("20 pi")).toBeInTheDocument();
    // La tuile de la barre d'état reste en terrain normal.
    expect(screen.getByText("Dépl.").nextSibling).toHaveTextContent("10/20");
  });
});
