/** Fiche : « Edit » par bloc, blocs Identité, Techniques, Armes et Armure, bonus de jet en lecture. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { EXAMPLES } from "../../src/rules/example";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";

const exampleCharacter = () => EXAMPLES[0]!.build();
const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

/** Shugenja de test avec une arme et des sorts stockés en « k » (Frappe de jade 2k2, Feux intérieurs 3k2). */
function kuni(): Character {
  const c = CharacterSchema.parse(structuredClone(perso));
  c.weapons = [{ name: "Katana", skill: "Kenjutsu", dr: "3k3" }];
  return c;
}

async function renderApp(character: Character = base(), mode: LibraryEntry["mode"] = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const block = (id: string) => within(screen.getByTestId(`block-${id}`));
const weapon = (name: string) => within(screen.getByRole("group", { name: `Arme : ${name}` }));
const armorBlock = () => within(screen.getByTestId("block-armor"));

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
    await renderApp(base(), "readonly");
    expect(screen.queryByRole("button", { name: /^Edit/ })).toBeNull();
    const make = screen.getByRole("button", { name: "Rendre modifiable" });
    const first = screen.getByTestId("block-rings");
    expect(!!(make.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });
});

describe("Suppression depuis le bloc Identité (H.7 X1)", () => {
  it("K6 : confirmation et Annuler, bouton d'origine masqué ; Annuler revient ; confirmer ramène à la Bibliothèque", async () => {
    const { storage } = await renderApp(kuni());
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

describe("Identité et Techniques (J.2, J.3)", () => {
  it("Q4 : Initiative en réserve (.pool) ; valeurs en mono", async () => {
    await renderApp();
    expect(screen.getByTestId("sheet-initiative")).toHaveClass("pool");
  });

  it("Q5 : bouton « + Technique / kata », aucun « sort » dans le bloc Techniques", async () => {
    await renderApp();
    click("Edit : Techniques d'école");
    expect(block("techniques").getByRole("button", { name: "+ Technique / kata" })).toBeInTheDocument();
    expect(screen.getByTestId("block-techniques")).not.toHaveTextContent(/\bsorts?\b/i);
  });
});

describe("Bloc Armes en Edit (J.1)", () => {
  it("Q1 : une carte par arme, champs nommés par leur libellé, plus de tableau", async () => {
    await renderApp();
    click("Edit : Armes");
    expect(block("weapons").queryByRole("table")).toBeNull();
    const katana = weapon("Katana");
    expect(katana.getByRole("textbox", { name: "Nom" })).toHaveValue("Katana");
    expect(katana.getByRole("textbox", { name: "Compétence" })).toHaveValue("Kenjutsu");
    expect(katana.getByRole("textbox", { name: "VD" })).toHaveAttribute("enterkeyhint", "next");
    expect(katana.getByRole("textbox", { name: "VD" })).toHaveAttribute("autocapitalize", "off");
    expect(katana.getByRole("textbox", { name: "Mots-clés" })).toBeInTheDocument();
  });

  it("Q2 : le nom, le VD et les mots-clés se vident entièrement ; le VD vide est accepté pendant la saisie", async () => {
    await renderApp();
    click("Edit : Armes");
    const katana = weapon("Katana");
    const dr = katana.getByRole("textbox", { name: "VD" });
    const keywords = katana.getByRole("textbox", { name: "Mots-clés" });
    fireEvent.change(dr, { target: { value: "" } });
    expect(dr).toHaveValue("");
    fireEvent.change(keywords, { target: { value: "" } });
    expect(keywords).toHaveValue("");
    fireEvent.change(katana.getByRole("textbox", { name: "Nom" }), { target: { value: "" } });
    expect(screen.getByRole("group", { name: "Arme : sans nom" })).toBeInTheDocument();
  });

  it("Q3 : « Force de l'arc » seulement pour une arme à distance", async () => {
    const c = base();
    c.weapons.push({ name: "Yumi", skill: "Kyujutsu", dr: "2g2", bowStrength: 3, keywords: ["arc"] });
    await renderApp(c);
    click("Edit : Armes");
    expect(weapon("Katana").queryByRole("spinbutton", { name: "Force de l'arc" })).toBeNull();
    expect(weapon("Yumi").getByRole("spinbutton", { name: "Force de l'arc" })).toHaveValue(3);
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
    await renderApp(c, "readonly");
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

describe("Bloc Armure (E.18)", () => {
  it("lecture : armure du livre, ND détaillé, Réduction, règle spéciale, posture de référence", async () => {
    await renderApp(exampleCharacter());
    const block = armorBlock();
    expect(block.getByText("armure du livre")).toBeInTheDocument();
    expect(block.getByTestId("armor-block-tn")).toHaveTextContent("25");
    expect(block.getByText("5 × Réflexes 3 + 5 + armure 5 = 25")).toBeInTheDocument();
    expect(block.getByTestId("armor-block-reduction")).toHaveTextContent("3");
    expect(block.getByTestId("armor-rule")).toHaveTextContent("Règle spéciale : +5 au ND des jets d'Athlétisme et de Discrétion.");
    expect(block.getByText("Posture de référence : Attaque.")).toBeInTheDocument();
  });

  it("E29 : Edit, « Armure lourde » puis bonus à 8 : ND +10 / Réduction 5, puis armure personnalisée ; barre d'état à jour", async () => {
    const { storage } = await renderApp(base({ armor: { name: "", bonus: 0, reduction: 0 } }));
    click("Edit : Armure");
    fireEvent.change(armorBlock().getByRole("combobox", { name: "Armure du livre" }), { target: { value: "heavy" } });
    expect(armorBlock().getByRole("spinbutton", { name: "Bonus au ND" })).toHaveValue(10);
    expect(armorBlock().getByRole("spinbutton", { name: "Réduction" })).toHaveValue(5);
    expect(screen.getByTestId("armor-reduction")).toHaveTextContent("5");
    fireEvent.change(armorBlock().getByRole("spinbutton", { name: "Bonus au ND" }), { target: { value: "8" } });
    click("Terminer : Armure");
    expect(armorBlock().getByText("armure personnalisée")).toBeInTheDocument();
    expect(armorBlock().queryByTestId("armor-rule")).toBeNull();
    // Kakita, Réflexes 3 : 5 × 3 + 5 + 8.
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("28");
    expect(armorBlock().getByTestId("armor-block-tn")).toHaveTextContent("28");
    await vi.waitFor(async () => expect((await storage.library.get("kakita"))?.character.armor).toEqual({ name: "Armure lourde", bonus: 8, reduction: 5 }));
  });

  it("bloc et éditeur de la barre d'état restent synchronisés", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("armor-tn").closest("button")!);
    const editor = within(screen.getByRole("group", { name: "Armure" }));
    fireEvent.change(editor.getByRole("spinbutton", { name: "Réduction" }), { target: { value: "4" } });
    expect(armorBlock().getByTestId("armor-block-reduction")).toHaveTextContent("4");
  });

  it("E30 : Identité en édition : plus de champs d'armure", async () => {
    await renderApp();
    click("Edit : Identité & réputation");
    const identity = within(screen.getByTestId("block-identity"));
    expect(identity.queryByRole("combobox", { name: "Armure du livre" })).toBeNull();
    expect(identity.queryByRole("textbox", { name: /Armure/ })).toBeNull();
    expect(identity.queryByRole("spinbutton", { name: /armure|Réduction/i })).toBeNull();
  });

  it("consultation : bloc en lecture, sans bouton Edit", async () => {
    await renderApp(exampleCharacter(), "readonly");
    expect(armorBlock().getByTestId("armor-block-tn")).toHaveTextContent("25");
    expect(armorBlock().queryByRole("button")).toBeNull();
  });
});
