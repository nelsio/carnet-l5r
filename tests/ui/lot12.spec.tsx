/** Lot 12, v2.2.0 (HANDOFF annexe E.2, E.9, E.10) : parcours d'interface E25, E26, E27, E28 et correctifs du lanceur. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";

const base = () => structuredClone(kakita) as Character;
const always = (v: number) => () => v;

async function renderApp(character: Character = base(), rng = always(5), mode: LibraryEntry["mode"] = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-24T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={rng} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const block = (id: string) => within(screen.getByTestId(`block-${id}`));
const toCombat = () => {
  click("Aide de jeu");
  click("Combat");
};

describe("Fiche : « Edit » par bloc (annexe E.9 S2)", () => {
  it("E25 : « Edit » sur Compétences puis sur Armes → deux blocs en édition ; « Terminer » n'en referme qu'un", async () => {
    await renderApp();
    expect(screen.queryByRole("button", { name: "Modifier la fiche" })).toBeNull();
    click("Edit : Compétences");
    click("Edit : Armes");
    expect(block("skills").getAllByRole("textbox", { name: "Nom de la compétence" }).length).toBeGreaterThan(0);
    expect(block("weapons").getAllByRole("textbox", { name: "Nom" })).toHaveLength(2);
    // Les autres blocs restent en lecture.
    expect(block("identity").queryByRole("textbox", { name: "Nom" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Agilité" })).toBeNull();
    click("Terminer : Compétences");
    expect(block("skills").queryByRole("textbox", { name: "Nom de la compétence" })).toBeNull();
    expect(block("weapons").getAllByRole("textbox", { name: "Nom" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Terminer : Armes" })).toHaveTextContent("Terminer");
    expect(screen.getByRole("button", { name: "Edit : Compétences" })).toHaveTextContent("Edit");
  });

  it("« Supprimer ce personnage » est dans le bloc Identité en édition", async () => {
    await renderApp();
    expect(screen.queryByRole("button", { name: "Supprimer ce personnage…" })).toBeNull();
    click("Edit : Identité & réputation");
    expect(block("identity").getByRole("button", { name: "Supprimer ce personnage…" })).toBeInTheDocument();
  });

  it("en consultation : aucun bouton « Edit », « Rendre modifiable » en tête de fiche", async () => {
    await renderApp(base(), always(5), "readonly");
    expect(screen.queryByRole("button", { name: /^Edit/ })).toBeNull();
    const make = screen.getByRole("button", { name: "Rendre modifiable" });
    const first = screen.getByTestId("block-rings");
    expect(!!(make.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });
});

describe("Fiche : armes du livre et bonus de jet (annexe E.2 C8, E.9 S1)", () => {
  it("une arme différente du livre est signalée ; « Mettre à jour » reprend VD et mots-clés", async () => {
    const c = base();
    c.weapons = [{ name: "Wakizashi", skill: "Kenjutsu", dr: "2k2", keywords: ["samourai", "petite"] }, { name: "Cimeterre", skill: "Kenjutsu", dr: "3k2", keywords: ["cimeterre", "moyenne"] }];
    await renderApp(c);
    const gap = screen.getByRole("group", { name: "Écart avec le livre : Wakizashi" });
    expect(gap).toHaveTextContent("Le livre indique Samouraï, Moyenne : mettre à jour ?");
    expect(screen.getByRole("group", { name: "Écart avec le livre : Cimeterre" })).toHaveTextContent("Le livre indique 2g3 : mettre à jour ?");
    fireEvent.click(within(gap).getByRole("button", { name: "Mettre à jour" }));
    expect(screen.queryByRole("group", { name: "Écart avec le livre : Wakizashi" })).toBeNull();
    expect(screen.getAllByRole("row").find((r) => r.textContent?.startsWith("Wakizashi"))).toHaveTextContent("Moyenne");
  });

  it("pas de signalement en consultation", async () => {
    const c = base();
    c.weapons = [{ name: "Wakizashi", skill: "Kenjutsu", dr: "2k2", keywords: ["samourai", "petite"] }];
    await renderApp(c, always(5), "readonly");
    expect(screen.queryByRole("group", { name: /Écart avec le livre/ })).toBeNull();
  });

  it("bonus de jet en lecture : nom et source, effet et application, cible et note", async () => {
    const c = base();
    c.modifiers = [{
      id: "voix", name: "Voix", source: "advantage", appliesTo: "skill", skill: "Courtoisie",
      rolled: 1, kept: 1, flat: 0, tn: 0, freeRaises: 0, mode: "always", note: "Voix qui porte",
    }];
    await renderApp(c);
    const row = within(screen.getByTestId("modifier-voix"));
    expect(row.getByText("Voix").closest(".mod-name")).toHaveTextContent("Voix Avantage");
    expect(row.getByText("+1g1").closest(".mod-effect")).toHaveTextContent("+1g1 · d'office");
    expect(row.getByText("Compétence : Courtoisie · Voix qui porte")).toHaveClass("mod-target");
  });
});

describe("Barre d'état : pénalités effectives et détail mobile (annexe E.9 S3, S5)", () => {
  const earth = {
    id: "fdt", name: "Force de la Terre", source: "advantage" as const, appliesTo: "wounds" as const,
    rolled: 0, kept: 0, flat: 3, tn: 0, freeRaises: 0, mode: "always" as const, note: "",
  };

  it("E26 : appui sur le résumé → 8 lignes (nom, intervalle, pénalité), niveau courant marqué", async () => {
    await renderApp({ ...base(), wounds: 12 });
    expect(screen.queryByTestId("wound-detail")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Égratigné/ }));
    const rows = within(screen.getByTestId("wound-detail")).getAllByRole("listitem");
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveTextContent("Indemne0–10+0");
    expect(rows[1]).toHaveTextContent("Égratigné11–14+3");
    expect(rows[1]).toHaveAttribute("aria-current", "step");
    expect(rows[0]).toHaveClass("past");
    expect(rows[7]).toHaveTextContent("Hors de combat35–38✕");
    fireEvent.click(screen.getByRole("button", { name: /Égratigné/ }));
    expect(screen.queryByTestId("wound-detail")).toBeNull();
  });

  it("E27 : Force de la Terre, 11 blessures → résumé, tuile et détail à +0", async () => {
    await renderApp({ ...base(), wounds: 11, modifiers: [earth] });
    const summary = screen.getByRole("button", { name: /Égratigné/ });
    expect(summary).toHaveTextContent("pénalité +0");
    expect(screen.getByText("Pénalité").nextSibling).toHaveTextContent("+0");
    const track = within(screen.getByLabelText("Niveaux de blessure"));
    expect(track.getByTitle("Égratigné jusqu'à 14 blessures")).toHaveTextContent("+0");
    expect(track.getByTitle("À terre jusqu'à 34 blessures")).toHaveTextContent("+37");
    fireEvent.click(summary);
    expect(within(screen.getByTestId("wound-detail")).getAllByRole("listitem")[1]).toHaveTextContent("+0");
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
    click("Aide de jeu");
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
