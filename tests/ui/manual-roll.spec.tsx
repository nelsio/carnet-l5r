/** Lot 62, v2.34.0 (annexe 62) : lanceur de dés masqué, total d'un jet fait aux vrais dés noté à la main. */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CharacterSchema, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-shugenja.json";
import kakita from "../fixtures/kakita-v1.json";
import { renderApp as renderLocale } from "../helpers/render";
import { chooseStance } from "../helpers/stance";
import { spendVoid } from "../helpers/void";
import { VIEW } from "../helpers/views";

const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

/** Fiche ouverte, lanceur de dés masqué (préférence enregistrée). */
async function renderApp(character: Character = base(), { mode = "edit", diceRoller = false }: { mode?: "edit" | "readonly"; diceRoller?: boolean } = {}) {
  const storage = memoryStorage();
  await storage.prefs.set({ diceRoller });
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-11-14T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  await screen.findByRole("button", { name: `Lanceur de dés : ${diceRoller ? "affiché" : "masqué"}` });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const toCombat = () => {
  click(VIEW.aid);
  click("Combat");
};
const block = () => roller().queryByRole("group", { name: "Ton jet aux vrais dés" });
const field = () => roller().getByRole("spinbutton", { name: "Total obtenu aux dés" });
const uses = () => [...block()!.querySelectorAll(".mr-use li")].map((li) => li.textContent);
/** Saisit le total puis « Noter le résultat ». */
function note(total: number) {
  fireEvent.change(field(), { target: { value: String(total) } });
  fireEvent.click(roller().getByRole("button", { name: "Noter le résultat" }));
}
const verdictLine = () => document.querySelector(".verdict");
const voidStatus = () => screen.getByText(/^Points de Vide \d+\/\d+$/);
const targetTn = (n: number) => fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: String(n) } });

describe("Initiative (annexe 62.2)", () => {
  it("MR1 : 27 noté → carte « 27 », texte « saisir à nouveau »", async () => {
    await renderApp();
    toCombat();
    click(/^Initiative/);
    expect(uses()).toEqual(["Ton score d'Initiative s'affiche dans la carte Initiative ; le Carnet y ajoute lui-même le Centre et le Vide d'Initiative."]);
    note(27);
    expect(screen.getByTestId("initiative")).toHaveTextContent("27");
    expect(screen.getByRole("button", { name: /^Initiative/ })).toHaveTextContent("Clique pour saisir à nouveau si un nouveau combat commence (4g3).");
  });

  it("MR1 : Centre au round précédent → 37", async () => {
    await renderApp();
    toCombat();
    chooseStance("Centre");
    click("Nouveau round");
    click(/^Initiative/);
    note(27);
    expect(screen.getByTestId("initiative")).toHaveTextContent("37");
  });

  it("MR1 : Vide d'Initiative gardé après une correction", async () => {
    await renderApp();
    toCombat();
    click(/^Initiative/);
    note(27);
    spendVoid("initiative");
    expect(screen.getByTestId("initiative")).toHaveTextContent("37");
    note(30);
    expect(screen.getByTestId("initiative")).toHaveTextContent("40");
  });
});

describe("Attaques (annexe 62.2)", () => {
  it("MR2 : ND 20, 1 Augmentation des dégâts, 31 → Réussite, +1g0 pré-rempli sur Dégâts · Katana", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    click("Ajouter Augmentation des dégâts");
    expect(uses()).toEqual(["Réussite ou échec contre le ND final (25).", "Si l'attaque touche : +1g0 pré-remplis sur Dégâts · Katana."]);
    note(31);
    expect(verdictLine()).toHaveTextContent("Réussite 31 / 25 (+6)saisi à la main");
    expect(roller().getByText("+1g0 pré-rempli sur le prochain jet de dégâts.")).toBeInTheDocument();
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("6g2");
    expect(roller().getByTestId("attack-raises")).toHaveTextContent("+1g0 · augmentations de l'attaque");
  });

  it("MR2 : 22 → Échec, rien de pré-rempli", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    click("Ajouter Augmentation des dégâts");
    note(22);
    expect(verdictLine()).toHaveTextContent("Échec 22 / 25 (-3)");
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("5g2");
    expect(roller().queryByTestId("attack-raises")).toBeNull();
  });

  it("MR3 : Feinte, ND 30, 38 → +4 ; excédent de 20 → plafond 5 × Insight", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    click(/^Feinte/);
    expect(uses()).toContain("Feinte : la moitié de l'excédent sur le ND s'ajoute aux dégâts (5 au plus).");
    note(38);
    expect(roller().getByTestId("feint-note")).toHaveTextContent("+4");
    note(50);
    expect(roller().getByTestId("feint-note")).toHaveTextContent("+5");
    click(/^Dégâts · Katana/);
    expect(roller().getByRole("spinbutton", { name: "Bonus fixe" })).toHaveValue(5);
  });

  it("MR4 : Désarmement réussi → dégâts liés 2g1", async () => {
    await renderApp(base({ voidRing: 3 }));
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    click(/^Désarmement/);
    expect(uses()).toContain("Désarmement : si l'attaque touche, les dégâts passent à 2g1 sans la Force.");
    note(40);
    expect(roller().getByTestId("disarm-note")).toBeInTheDocument();
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("2g1");
  });

  it("MR8 : Akodo R5, échec avec augmentations, total ≥ ND de base → réussite sans les augmentations", async () => {
    await renderApp(base({ schoolId: "akodo-bushi", insightRank: 5 }));
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augm. libres" }), { target: { value: "1" } });
    expect(uses()).toContain("Un échec qui atteint le ND de base (20) reste une réussite sans les augmentations.");
    note(22);
    expect(roller().getByTestId("base-success")).toHaveTextContent("ND de base 20");
  });
});

describe("Défense totale (annexe 62.2)", () => {
  it("MR5 : 23 → ND d'armure +12, posture Défense totale", async () => {
    await renderApp();
    toCombat();
    click(/^Défense totale.*moitié du résultat/);
    expect(uses()).toEqual(["La moitié du total (arrondie au supérieur) s'ajoute à ton ND d'armure ce round, en posture Défense totale."]);
    note(23);
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("32");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Posture" }).value).toBe("fullDefense");
  });
});

describe("Dépenses et historique (annexe 62.2, 62.4)", () => {
  it("MR6 : point de Vide coché débité une fois ; une correction ne le débite pas", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ }));
    expect(uses()).toContain("Le point de Vide coché est dépensé en notant.");
    note(31);
    expect(voidStatus()).toHaveTextContent("Points de Vide 1/2");
    expect(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ })).not.toBeChecked();
    note(33);
    expect(voidStatus()).toHaveTextContent("Points de Vide 1/2");
  });

  it("MR6 : après « Nouveau round », un nouveau total est un nouveau jet : le Vide coché est débité", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    note(31);
    click("Nouveau round");
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ }));
    note(28);
    expect(voidStatus()).toHaveTextContent("Points de Vide 1/2");
    expect(roller().getAllByRole("img", { name: "saisi à la main" })).toHaveLength(2);
  });

  it("MR6 : consultation → le bloc est là, rien n'est débité", async () => {
    await renderApp(base(), { mode: "readonly" });
    toCombat();
    click(/^Attaque · Katana/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ }));
    expect(uses()).not.toContain("Le point de Vide coché est dépensé en notant.");
    note(31);
    expect(voidStatus()).toHaveTextContent("Points de Vide 2/2");
  });

  it("MR7 : correction du même jet → une seule ligne d'historique, marquée « saisi à la main »", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    note(31);
    note(26);
    const hist = roller().getByText("Derniers jets").parentElement!;
    expect(hist.querySelectorAll(":scope > div")).toHaveLength(1);
    expect(hist).toHaveTextContent("26 ✓");
    expect(within(hist).getByRole("img", { name: "saisi à la main" })).toHaveTextContent("✎");
  });
});

describe("Interface (annexe 62.3)", () => {
  it("MR9 : bloc absent lanceur affiché", async () => {
    await renderApp(base(), { diceRoller: true });
    toCombat();
    click(/^Attaque · Katana/);
    expect(block()).toBeNull();
  });

  it("MR10 : bloc absent sur une compétence, des dégâts, la Méditation, un sort", async () => {
    await renderApp();
    click(VIEW.aid);
    click(/^Remarquer un détail/);
    expect(block()).toBeNull();
    click(/^Méditer/);
    expect(block()).toBeNull();
    click("Combat");
    click(/^Dégâts · Katana/);
    expect(block()).toBeNull();
  });

  it("MR10 : bloc absent sur un sort (Réussi / Raté restent)", async () => {
    await renderApp({ ...CharacterSchema.parse(structuredClone(perso)) });
    click(VIEW.aid);
    fireEvent.click(within(screen.getByRole("group", { name: "Situation" })).getByRole("button", { name: "Magie" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Lancer · Frappe de jade/ })[0]!);
    expect(block()).toBeNull();
    expect(roller().getByRole("button", { name: "Réussi" })).toBeInTheDocument();
  });

  it("MR11 : bouton désactivé champ vide ; Entrée valide, champ vidé, focus rendu", async () => {
    await renderApp();
    toCombat();
    click(/^Initiative/);
    expect(roller().getByRole("button", { name: "Noter le résultat" })).toBeDisabled();
    expect(field()).toHaveAttribute("aria-describedby", "mr-use");
    fireEvent.change(field(), { target: { value: "24" } });
    expect(roller().getByRole("button", { name: "Noter le résultat" })).toBeEnabled();
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(screen.getByTestId("initiative")).toHaveTextContent("24");
    expect(field()).toHaveValue(null);
    expect(field()).toHaveFocus();
  });

  it("MR12 : la liste suit les manœuvres et la case Vide", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    targetTn(20);
    expect(uses()).toEqual(["Réussite ou échec contre le ND final (20)."]);
    click("Ajouter Augmentation des dégâts");
    expect(uses()).toHaveLength(2);
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ }));
    expect(uses()).toHaveLength(3);
    click("Retirer Augmentation des dégâts");
    expect(uses()).toEqual(["Réussite ou échec contre le ND final (20).", "Le point de Vide coché est dépensé en notant."]);
  });

  it("MR13 : pas de rangée de dés sur un jet noté", async () => {
    await renderApp();
    toCombat();
    click(/^Attaque · Katana/);
    note(31);
    expect(roller().queryByLabelText("Dés")).toBeNull();
    expect(document.querySelector(".dice")).toBeNull();
  });
});

describe("En anglais (annexe 62.5)", () => {
  it("MR14 : bloc, bouton, liste et étiquette traduits", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ diceRoller: false });
    await storage.library.put({ id: "kakita", character: base(), mode: "edit", updatedAt: "2026-11-14T10:00:00.000Z" });
    renderLocale(<App storage={storage} rng={() => 5} />, { locale: "en" });
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    await screen.findByRole("button", { name: /Dice roller: hidden/ });
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    act(() => fireEvent.click(screen.getAllByRole("button", { name: /^Full Defense/ })[0]!));
    const group = screen.getByRole("group", { name: "Your roll with real dice" });
    expect(group).toHaveTextContent("Half the total (rounded up) is added to your Armor TN this round, in Full Defense stance.");
    fireEvent.change(within(group).getByRole("spinbutton", { name: "Total rolled" }), { target: { value: "23" } });
    act(() => fireEvent.click(within(group).getByRole("button", { name: "Record result" })));
    expect(screen.getByText("entered by hand")).toHaveClass("manual-tag");
  });
});
