/** Bonus de jet dans l'interface (HANDOFF annexe B). */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character, Modifier } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { woundsField } from "../helpers/wounds";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;
const mod = (patch: Partial<Modifier>): Modifier => ({
  id: "m", name: "Bonus", source: "technique", appliesTo: "all", rolled: 0, kept: 0, flat: 0, freeRaises: 0, tn: 0,
  mode: "always", note: "", ...patch,
});
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));

async function mount(modifiers: Modifier[] = [], mode: LibraryEntry["mode"] = "edit", rng = () => 5) {
  const storage = memoryStorage();
  await storage.library.put({ id: "a", character: { ...base(), modifiers }, mode, updatedAt: "2026-10-18T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={rng} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return { storage, ...view };
}

describe("Saisie sur la fiche", () => {
  it("ajout depuis un modèle : « Dés en plus sur une compétence » (+1g1) à Kenjutsu met à jour les réserves de la fiche", async () => {
    const { storage } = await mount();
    expect(screen.getByText(/Aucun bonus/)).toBeInTheDocument();
    click("Edit : Bonus de jet");
    fireEvent.change(screen.getByRole("combobox", { name: "Modèle de bonus" }), { target: { value: "adv-skill-dice" } });
    click("+ Bonus");
    // Nom vide, placeholder selon la source (annexe J.4).
    const editor = screen.getByRole("group", { name: "Bonus 1" });
    const name = within(editor).getByRole("textbox", { name: "Nom du bonus" });
    expect(name).toHaveValue("");
    expect(name).toHaveAttribute("placeholder", "Nom de l'avantage");
    fireEvent.change(name, { target: { value: "Voie de la Grue" } });
    fireEvent.change(within(editor).getByRole("combobox", { name: "Compétence" }), { target: { value: "Kenjutsu" } });
    expect(within(editor).getByText("Effet : +1g1")).toBeInTheDocument();
    click("Terminer : Bonus de jet");
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("6g4");
    expect(screen.getByTestId("skill-pool-Iaijutsu")).toHaveTextContent("6g3");
    const katana = screen.getAllByRole("row").find((r) => r.textContent?.startsWith("KatanaKenjutsu"))!;
    expect(katana).toHaveTextContent("6g4");
    expect(screen.getByText("Compétence : Kenjutsu")).toBeInTheDocument();
    expect(screen.getByText("· d'office")).toBeInTheDocument();
    await waitFor(async () => expect((await storage.library.get("a"))?.character.modifiers?.[0]).toMatchObject({ name: "Voie de la Grue", source: "advantage", skill: "Kenjutsu", rolled: 1, kept: 1 }), { timeout: 1500 });
  });

  it("bonus libre : champs selon la cible, suppression", async () => {
    await mount();
    click("Edit : Bonus de jet");
    click("+ Bonus");
    const editor = screen.getByRole("group", { name: "Bonus 1" });
    fireEvent.change(within(editor).getByRole("combobox", { name: "S'applique à" }), { target: { value: "armor" } });
    expect(within(editor).queryByRole("spinbutton", { name: "Dés lancés" })).toBeNull();
    fireEvent.change(within(editor).getByRole("spinbutton", { name: "Bonus au ND d'armure" }), { target: { value: "5" } });
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("25");
    fireEvent.change(within(editor).getByRole("combobox", { name: "S'applique à" }), { target: { value: "trait" } });
    fireEvent.change(within(editor).getByRole("combobox", { name: "Trait" }), { target: { value: "agility" } });
    click("Supprimer le bonus");
    expect(screen.queryByRole("group", { name: /^Bonus / })).toBeNull();
  });
});

describe("Lanceur", () => {
  const grue = mod({ id: "g", name: "Voie de la Grue", appliesTo: "skill", skill: "Kenjutsu", rolled: 1 });
  const chance = mod({ id: "s", name: "Bien-né", source: "advantage", appliesTo: "all", rolled: 1, kept: 1, mode: "optional" });

  it("bonus d'office coché, situationnel décoché ; chaque case change la réserve ; remis à zéro au choix d'une action", async () => {
    await mount([grue, chance]);
    click(VIEW.aid);
    click("Combat");
    click(/^Attaque · Katana/);
    expect(screen.getByTestId("pool")).toHaveTextContent("6g3");
    const grueBox = roller().getByRole("checkbox", { name: /Voie de la Grue/ });
    const chanceBox = roller().getByRole("checkbox", { name: /Bien-né/ });
    expect(grueBox).toBeChecked();
    expect(chanceBox).not.toBeChecked();
    expect(roller().getByText(/situationnel/)).toBeInTheDocument();
    fireEvent.click(chanceBox);
    expect(screen.getByTestId("pool")).toHaveTextContent("7g4");
    fireEvent.click(grueBox);
    expect(screen.getByTestId("pool")).toHaveTextContent("6g4");
    click(/^Attaque · Wakizashi/);
    expect(screen.getByTestId("pool")).toHaveTextContent("6g3");
  });

  it("ne propose que les bonus qui concernent le jet", async () => {
    await mount([grue]);
    click(VIEW.aid);
    click(/^Remarquer un détail/);
    expect(roller().queryByText("Bonus de jet")).toBeNull();
  });

  it("augmentations gratuites et bonus fixe comptés au jet", async () => {
    await mount([mod({ name: "Enquêteur", appliesTo: "skill", skill: "Investigation", flat: 3, freeRaises: 1 })]);
    click(VIEW.aid);
    click(/^Remarquer un détail/);
    expect(roller().getByText("Augm. gratuites (+1 bonus)")).toBeInTheDocument();
    expect(roller().getByText("Investigation 1 + Perception 2 · +3 au total")).toBeInTheDocument();
    click("Lancer 3g2");
    // 2 dés gardés à 5 + 3 = 13 contre 15 : échec ; ND 10 : réussite avec 1 augmentation gratuite.
    expect(roller().getByText(/Échec/)).toHaveTextContent("13 / 15");
    fireEvent.change(roller().getByRole("combobox", { name: "ND de base" }), { target: { value: "10" } });
    click("Lancer 3g2");
    expect(roller().getByText(/augmentation\(s\) à appliquer/)).toHaveTextContent("1 augmentation(s) à appliquer dont 1 gratuite(s)");
  });

  it("ND d'armure : bonus d'office compté, bonus situationnel à cocher dans la posture", async () => {
    await mount([mod({ id: "a1", name: "Kata", appliesTo: "armor", flat: 5 }), mod({ id: "a2", name: "Esquive", appliesTo: "armor", flat: 3, mode: "optional" })]);
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("25");
    click(VIEW.aid);
    click("Combat");
    fireEvent.click(screen.getByRole("checkbox", { name: /Esquive/ }));
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("28");
    fireEvent.click(screen.getByRole("checkbox", { name: /Kata/ }));
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("23");
  });

  it("Statistiques : les bonus d'office sont compris", async () => {
    await mount([grue]);
    click(VIEW.aid);
    click("Statistiques");
    const row = screen.getAllByRole("row").find((r) => r.textContent?.startsWith("Kenjutsu"))!;
    expect(row).toHaveTextContent("6g3");
  });

  it("en consultation : bonus affichés, aucun champ, cases du lanceur utilisables", async () => {
    const { container } = await mount([grue, chance], "readonly");
    expect(screen.getByText("Voie de la Grue")).toBeInTheDocument();
    expect(container.querySelectorAll("input, textarea, select")).toHaveLength(0);
    click(VIEW.aid);
    click("Combat");
    click(/^Attaque · Katana/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Bien-né/ }));
    expect(screen.getByTestId("pool")).toHaveTextContent("7g4");
  });
});

describe("Modèles par source, sans catalogue (annexe J.4)", () => {
  async function addFromTemplate(...ids: string[]) {
    click("Edit : Bonus de jet");
    for (const id of ids) {
      fireEvent.change(screen.getByRole("combobox", { name: "Modèle de bonus" }), { target: { value: id } });
      click("+ Bonus");
    }
  }

  it("Q6 : menu en 4 groupes (Autre, Avantage, Désavantage, Technique), « Bonus libre » choisi par défaut, aucune entrée nommée", async () => {
    await mount();
    click("Edit : Bonus de jet");
    const select = screen.getByRole("combobox", { name: "Modèle de bonus" });
    expect(select).toHaveValue("free");
    expect(within(select).getAllByRole("group").map((g) => g.getAttribute("label"))).toEqual(["Autre", "Avantage", "Désavantage", "Technique"]);
    expect(within(select).queryByRole("group", { name: /Catalogue/ })).toBeNull();
    expect(select).not.toHaveTextContent(/Force de la Terre|Aspect dérangeant|Seuil de douleur/);
    expect(screen.getByText(/Tu peux aussi les écrire dans le JSON de ta fiche/)).toBeInTheDocument();
  });

  it("Q7 : « ND augmenté sur les jets sociaux » → désavantage, social, ND +5, nom vide ; +5 au ND d'un jet social, pas des autres", async () => {
    const { storage } = await mount();
    await addFromTemplate("dis-social-tn");
    const name = within(screen.getByRole("group", { name: "Bonus 1" })).getByRole("textbox", { name: "Nom du bonus" });
    expect(name).toHaveAttribute("placeholder", "Nom du désavantage");
    click("Terminer : Bonus de jet");
    await waitFor(async () => expect((await storage.library.get("a"))?.character.modifiers?.[0]).toMatchObject({ name: "", source: "disadvantage", appliesTo: "social", tn: 5 }), { timeout: 1500 });
    click(VIEW.aid);
    click(/^Garder contenance/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
    expect(roller().getByText(/= 15 \+ 5 bonus/)).toBeInTheDocument();
    click(/^Remarquer un détail/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("15");
  });

  it("Q8 : un bonus créé depuis l'ancien catalogue reste tel quel et s'applique", async () => {
    await mount([mod({
      id: "force-de-la-terre", name: "Force de la Terre (Strength of the Earth)", source: "advantage", appliesTo: "wounds", flat: 3,
      note: "Avantage physique, 3 points (2 pour un bushi) : pénalités de ND des niveaux de blessure réduites de 3. À vérifier dans le livre.",
    })]);
    expect(screen.getByText("Force de la Terre (Strength of the Earth)")).toBeInTheDocument();
    fireEvent.change(woundsField(), { target: { value: "18" } });
    expect(screen.getByText("+2", { selector: ".pen b" })).toBeInTheDocument();
    expect(screen.getByText("-3 à la pénalité de blessure")).toBeInTheDocument();
  });
});
