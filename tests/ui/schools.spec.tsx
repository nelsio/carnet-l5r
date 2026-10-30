/** Techniques d'école dans l'interface (HANDOFF annexe C.5, C.7). */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { migrate, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance } from "../helpers/stance";
import { chooseVoid, voidPanel } from "../helpers/void";

const base = () => structuredClone(kakita) as Character;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));

async function mount(patch: Partial<Character> = {}, rng = () => 5) {
  const storage = memoryStorage();
  // Comme à la relecture d'IndexedDB : la fiche v1 de l'exemple est migrée en v2.
  await storage.library.put({ id: "a", character: migrate({ ...base(), ...patch }), mode: "edit", updatedAt: "2026-10-21T10:00:00.000Z" });
  render(<App storage={storage} rng={rng} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return { storage };
}

function skirmish() {
  click("Aide de jeu");
  click("Combat");
}

describe("Techniques d'école : parcours E16 à E19", () => {
  it("E16 : École de bushi Hiruma, Rang d'Insight 2 → R1 et R2 actifs, R3 à R5 grisés ; attaque katana 6g3", async () => {
    const { storage } = await mount();
    click("Edit : Identité & réputation");
    const select = screen.getByRole("combobox", { name: "Techniques d'école" });
    expect(within(select).getByRole("group", { name: "Crabe" })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "hiruma-bushi" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Rang d'Insight" }), { target: { value: "2" } });
    expect(screen.getByRole("spinbutton", { name: "Rang d'école" })).toHaveAttribute("placeholder", "2 (Rang d'Insight)");
    click("Terminer : Identité & réputation");

    const block = screen.getByTestId("school-techniques");
    expect(block).toHaveTextContent("École de bushi Hiruma · Crabe · Rang d'école 2");
    expect(screen.getByTestId("school-rank-1")).toHaveTextContent("La Flamme de la torche vacille");
    expect(screen.getByTestId("school-rank-1")).toHaveTextContent("auto");
    expect(screen.getByTestId("school-rank-2")).toHaveTextContent("à cocher");
    for (const r of [3, 4, 5]) {
      expect(screen.getByTestId(`school-rank-${r}`)).toHaveClass("locked");
      expect(screen.getByTestId(`school-rank-${r}`)).toHaveTextContent(`rang ${r}`);
    }
    expect(screen.getByTestId("school-rank-1")).not.toHaveClass("locked");
    expect(screen.getByTestId("attack-pool-Katana")).toHaveTextContent("6g3");
    expect(screen.getByText("Autres techniques, kata")).toBeInTheDocument();
    await waitFor(async () => expect((await storage.library.get("a"))?.character).toMatchObject({ schoolId: "hiruma-bushi", insightRank: 2 }), { timeout: 1500 });
  });

  it("E17 : Hiruma 2, compteur « Touches » à 2 → ND d'armure +10 ; en Assaut le bonus disparaît", async () => {
    await mount({ schoolId: "hiruma-bushi", insightRank: 2 });
    skirmish();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    click("Ajouter : Touches au corps à corps");
    click("Ajouter : Touches au corps à corps");
    expect(screen.getByRole("button", { name: "Ajouter : Touches au corps à corps" })).toBeDisabled();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("30");
    chooseStance("Assaut");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("10");
    // Les compteurs restent jusqu'à la remise à zéro, pas au « Nouveau round ».
    chooseStance("Attaque");
    click("Nouveau round");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("30");
    click(/compteurs à zéro/);
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
  });

  it("E18 : Kakita 2, attaque en Centre → étiquette Kakita R1 ; case « Initiative plus basse » décochée, remise à zéro", async () => {
    await mount({ schoolId: "kakita-bushi", insightRank: 2 });
    skirmish();
    chooseStance("Centre");
    // En Centre, la carte est grisée (annexe E.3 F2) : « Lancer quand même ».
    click("Lancer quand même : Attaque · Katana");
    // « + Rang d'école au total » : +2 au rang 2 (annexe C.1).
    expect(roller().getByTestId("tech-chips")).toHaveTextContent("+1g1 +2 · Kakita R1");
    expect(roller().getByTestId("pool")).toHaveTextContent("6g4");
    const box = roller().getByRole("checkbox", { name: /Cible à l'Initiative plus basse/ });
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(roller().getByTestId("pool")).toHaveTextContent("8g4");
    click("Lancer quand même : Dégâts · Katana");
    click("Lancer quand même : Attaque · Katana");
    expect(roller().getByRole("checkbox", { name: /Cible à l'Initiative plus basse/ })).not.toBeChecked();
  });

  it("E19 : fiche v1 Kakita → suggestion « Associer à École de bushi Kakita ? », rien d'appliqué sans confirmation", async () => {
    const { storage } = await mount();
    const suggestion = screen.getByRole("group", { name: "Suggestion d'école" });
    expect(suggestion).toHaveTextContent("Associer à École de bushi Kakita ?");
    expect(screen.queryByTestId("school-techniques")).toBeNull();
    expect((await storage.library.get("a"))?.character.schoolId).toBe("");
    fireEvent.click(within(suggestion).getByRole("button", { name: "Associer" }));
    expect(screen.getByTestId("school-techniques")).toHaveTextContent("École de bushi Kakita");
    expect(screen.getByTestId("sheet-initiative")).toHaveTextContent("4g3 +6");
    expect(screen.queryByRole("group", { name: "Suggestion d'école" })).toBeNull();
  });
});

describe("Techniques d'école : détails de l'interface", () => {
  it("cartes d'action : bonus fixe et badge « Attaque : Action simple »", async () => {
    await mount({ schoolId: "kakita-bushi", insightRank: 4 });
    skirmish();
    expect(screen.getByTestId("initiative")).toHaveTextContent("7g3 +6");
    const card = screen.getByRole("button", { name: /^Attaque · Katana/ });
    expect(card).toHaveTextContent("Attaque : Action simple");
    expect(screen.getByRole("button", { name: /^Attaque à mains nues/ })).not.toHaveTextContent("Action simple");
  });

  it("Shiba 5 : Vide doublé et option 2 points ; Akodo 5 : réussite sans les augmentations", async () => {
    await mount({ schoolId: "shiba-bushi", insightRank: 5 });
    skirmish();
    click(/^Attaque · Katana/);
    expect(roller().getByText(/Dépenser 1 point de Vide \(\+2g2\)/)).toBeInTheDocument();
    expect(roller().getByText(/Dépenser 2 points de Vide \(\+4g4\)/)).toBeInTheDocument();
    chooseVoid("armor");
    expect(voidPanel().getByTestId("void-desc")).toHaveTextContent("+20");
  });

  it("Akodo 5 : ND 20 + 2 augmentations, total 21 → Échec, réussite sans les augmentations", async () => {
    await mount({ schoolId: "akodo-bushi", insightRank: 5 }, () => 7);
    skirmish();
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augm. libres" }), { target: { value: "2" } });
    click(/^Lancer/);
    expect(roller().getByText(/^Échec/)).toBeInTheDocument();
    expect(roller().getByTestId("base-success")).toHaveTextContent("Réussite sans les augmentations");
  });

  it("Hida 2 : Réduction de la barre d'état avec la technique", async () => {
    await mount({ schoolId: "hida-bushi", insightRank: 2 });
    expect(screen.getByTestId("armor-reduction")).toHaveTextContent("2");
  });

  it("Mots-clés d'arme : saisie libre, étiquettes en lecture", async () => {
    await mount();
    click("Edit : Armes");
    const field = within(screen.getByRole("group", { name: "Arme : Katana" })).getByRole("textbox", { name: "Mots-clés" });
    expect(field).toHaveValue("samourai, moyenne");
    fireEvent.change(field, { target: { value: "Samouraï, deux mains, inconnu" } });
    expect(field).toHaveValue("Samouraï, deux mains, inconnu");
    fireEvent.blur(field);
    expect(field).toHaveValue("samourai, deux-mains");
    click("Terminer : Armes");
    const row = screen.getAllByRole("row").find((r) => r.textContent?.startsWith("Katana"))!;
    expect(row).toHaveTextContent("Samouraï");
    expect(row).toHaveTextContent("Deux mains");
  });
});

/** Fiche d'exemple avec des compétences sociales en plus (lot 11). */
const courtSkills = (): Partial<Character> => ({
  skills: [
    ...base().skills.filter((s) => s.name !== "Sincérité"),
    { name: "Sincérité", rank: 2, trait: "awareness", emphases: ["Honnêteté", "Duperie"] },
    { name: "Comédie", rank: 2, trait: "awareness", emphases: [] },
  ],
});

function court() {
  click("Aide de jeu");
  click("Cour");
}

describe("Techniques des courtisans et de Shosuro : parcours E20 à E23", () => {
  it("E20 : Doji, Honneur 6,5 puis 5,0 → « 1 augm. gratuite · Doji R1 » en Courtoisie, puis plus rien", async () => {
    await mount({ schoolId: "doji-courtisan", insightRank: 1 });
    court();
    click(/^Convaincre, manipuler/);
    expect(roller().getByTestId("tech-chips")).toHaveTextContent("1 augm. gratuite · Doji R1");
    expect(roller().getByText(/Augm\. gratuites \(\+1 bonus\)/)).toBeInTheDocument();

    click("Fiche");
    click("Edit : Identité & réputation");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Honneur" }), { target: { value: "5" } });
    click("Terminer : Identité & réputation");
    court();
    click(/^Convaincre, manipuler/);
    expect(roller().queryByTestId("tech-chips")).toBeNull();
  });

  it("E21 : Ide 1, Sincérité : Duperie → « ND +5 · Ide R1 », Honnêteté → « 1 augm. gratuite · Ide R1 » ; relance des 1", async () => {
    await mount({ schoolId: "ide-emissaire", insightRank: 1, ...courtSkills() });
    court();
    click(/^Être cru/);
    const emphasis = roller().getByRole("combobox", { name: /Spécialisation/ });
    expect(emphasis).toHaveValue("");
    expect(roller().queryByTestId("tech-chips")).toBeNull();

    fireEvent.change(emphasis, { target: { value: "Duperie" } });
    expect(roller().getByTestId("tech-chips")).toHaveTextContent("ND +5 · Ide R1");
    expect(roller().getByTestId("manual")).toHaveTextContent("relance une fois chaque 1");

    fireEvent.change(emphasis, { target: { value: "Honnêteté" } });
    expect(roller().getByTestId("tech-chips")).toHaveTextContent("1 augm. gratuite · Ide R1");
    expect(roller().getByTestId("manual")).toHaveTextContent("relance une fois chaque 1");
  });

  it("E22 : Yasuki 4, Étiquette → rappel « +20 au ND de qui tente de te tromper » sous la réserve", async () => {
    await mount({ schoolId: "yasuki-courtisan", insightRank: 4 });
    court();
    click(/^Résister à une influence/);
    expect(roller().getByTestId("school-reminders")).toHaveTextContent("+20 au ND de qui tente de te tromper.");
    // Panneau « Rappels d'école » de la situation Cour, détail chiffré par le « i ».
    click("Afficher le détail : Rappels d'école");
    expect(screen.getByText("+20 au ND de qui tente de te tromper.")).toBeInTheDocument();
  });

  it("E23 : Shosuro Acteur 3, Comédie → option « 2 points de Vide (+6g2) » ; absente en Kenjutsu", async () => {
    await mount({ schoolId: "shosuro-acteur", insightRank: 3, ...courtSkills() });
    court();
    click(/^Jouer un rôle/);
    expect(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+3g1\)/ })).toBeInTheDocument();
    const spend = roller().getByRole("checkbox", { name: /Dépenser 2 points de Vide \(\+6g2\)/ });
    fireEvent.click(spend);
    // Comédie 2 + Intuition 3 = 5g3, +6g2 = 11g5 → 10g5 (règle des dix dés, P8).
    expect(roller().getByTestId("pool")).toHaveTextContent("10g5");
    click("Combat");
    click(/^Attaque · Katana/);
    expect(roller().queryByRole("checkbox", { name: /Dépenser 2 points de Vide/ })).toBeNull();
  });

  it("fiche : rappels chiffrés sous les rangs atteints", async () => {
    await mount({ schoolId: "kitsuki-enqueteur", insightRank: 2 });
    expect(screen.getByTestId("school-rank-2")).toHaveTextContent("→ +10 au ND de qui te ment.");
    expect(screen.getByTestId("school-rank-1")).toHaveTextContent("auto");
  });

  it("Shosuro Infiltré 2 : case « Cible qui ne te voit pas », augmentations non limitées", async () => {
    await mount({ schoolId: "shosuro-infiltre", insightRank: 2 });
    click("Aide de jeu");
    click("Combat");
    click(/^Attaque · Katana/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Cible qui ne te voit pas/ }));
    expect(roller().getByText("Augmentations non limitées par ton Vide.")).toBeInTheDocument();
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augm. libres" }), { target: { value: "4" } });
    expect(roller().queryByText(/dépasse ton Vide/)).toBeNull();
  });
});
