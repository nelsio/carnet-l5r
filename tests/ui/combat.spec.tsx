/** Lot 12, v2.3.0 (HANDOFF annexe E.3) : parcours de combat complet dans l'aide de jeu. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance, currentStance, stanceOption } from "../helpers/stance";
import { openWounds, woundsField } from "../helpers/wounds";
import { spendVoid } from "../helpers/void";

const base = () => structuredClone(kakita) as Character;
const always = (v: number) => () => v;

async function renderApp(character: Character = base(), rng = always(5)) {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-10-24T10:00:00.000Z" });
  render(<App storage={storage} rng={rng} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return storage;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const toCombat = (sub?: string) => {
  click("Aide de jeu");
  click("Combat");
  if (sub) click(sub);
};
const withBow = (c: Character = base()) => {
  c.weapons.push({ name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3, keywords: ["arc", "distance", "grande"] });
  c.skills.push({ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] });
  return c;
};

describe("Centre (F1)", () => {
  it("L7 : en Centre, « Aucune action ce round » ; au round suivant, Bonus de Centre sur un seul jet et Initiative +10", async () => {
    await renderApp();
    toCombat();
    click(/^Initiative/);
    click("Lancer 4g3");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
    chooseStance("Centre");
    expect(screen.getByTestId("blocked-atk-skirmish-Katana")).toHaveTextContent("Posture Centre : aucune action ce round.");
    click("Lancer quand même : Attaque · Katana");
    expect(roller().getByTestId("stance-restriction")).toHaveTextContent("aucune action ce round");
    click("Nouveau round");
    expect(screen.getByTestId("initiative")).toHaveTextContent("25");
    expect(screen.getByTestId("initiative-bonus")).toHaveTextContent("+10 Centre");
    chooseStance("Attaque");
    click(/^Attaque · Katana/);
    const box = roller().getByRole("checkbox", { name: /Bonus de Centre/ });
    fireEvent.click(box);
    expect(roller().getByTestId("pool")).toHaveTextContent("6g4");
    expect(roller().getByText(/\+2 au total/)).toBeInTheDocument();
    click("Lancer 6g4");
    expect(roller().queryByRole("checkbox", { name: /Bonus de Centre/ })).toBeNull();
    click("Nouveau round");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
  });
});

describe("Restrictions de posture (F2)", () => {
  it("L10 : Assaut → carte Tir grisée ; Assaut monté refusé avec Équitation 1, permis avec Équitation 3", async () => {
    await renderApp(withBow());
    toCombat();
    chooseStance("Assaut");
    expect(screen.getByTestId("blocked-atk-skirmish-Yumi")).toHaveTextContent("Assaut : pas d'attaque à distance.");
    expect(screen.queryByTestId("blocked-atk-skirmish-Katana")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /^Monté/ }));
    // Équitation 1 : l'Assaut est désactivé, la posture repasse en Attaque.
    expect(stanceOption("Assaut")).toBeDisabled();
    expect(currentStance()).toBe("Attaque");
  });

  it("L10 : Équitation 3 → Assaut monté permis", async () => {
    const c = base();
    c.skills.find((s) => s.name === "Équitation")!.rank = 3;
    await renderApp(c);
    toCombat();
    fireEvent.click(screen.getByRole("checkbox", { name: /^Monté/ }));
    expect(stanceOption("Assaut")).toBeEnabled();
  });

  it("Défense : les attaques sont grisées, la Défense totale reste jouable", async () => {
    await renderApp();
    toCombat();
    chooseStance("Défense totale");
    expect(screen.getByTestId("blocked-atk-skirmish-Katana")).toHaveTextContent("Posture Défense");
    expect(screen.queryByTestId("blocked-full-defense")).toBeNull();
  });
});

describe("Vide, Feinte, Garde, encaissement (F3 à F6)", () => {
  it("F3 : +10 Initiative pour l'escarmouche, un point de Vide dépensé", async () => {
    await renderApp();
    toCombat();
    click(/^Initiative/);
    click("Lancer 4g3");
    spendVoid("initiative");
    expect(screen.getByTestId("initiative")).toHaveTextContent("25");
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
    click("Nouveau round");
    expect(screen.getByTestId("initiative")).toHaveTextContent("25");
  });

  it("L11 : Feinte réussie de 15 sur ND 20 → dégâts liés +7, plafonnés à +5 (Insight 1)", async () => {
    await renderApp(base(), always(9));
    toCombat();
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "20" } });
    click(/^Feinte/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("30");
    click("Lancer 5g3");
    // 3 × 9 = 27 contre 30 : échec, pas de Feinte.
    expect(roller().queryByTestId("feint-note")).toBeNull();
    // La Feinte reste sélectionnée après le jet.
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "5" } });
    click("Lancer 5g3");
    // 27 contre 15 : excédent 12 → +6, plafonné à 5.
    expect(roller().getByTestId("feint-note")).toHaveTextContent("+5");
    click(/^Dégâts · Katana/);
    expect(roller().getByRole("spinbutton", { name: "Bonus fixe" })).toHaveValue(5);
  });

  it("L14 : « Je garde un allié » → ND d'armure 15 ; indisponible en Assaut ; « Nouveau round » ne la décoche pas", async () => {
    await renderApp();
    toCombat();
    const guard = () => screen.getByRole("checkbox", { name: /Je garde un allié/ });
    fireEvent.click(guard());
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("15");
    expect(screen.getByTestId("guard-note")).toHaveTextContent("ton allié : +10 au ND d'armure");
    click("Nouveau round");
    expect(guard()).toBeChecked();
    chooseStance("Assaut");
    expect(guard()).not.toBeChecked();
    expect(guard()).toBeDisabled();
  });

  it("L14 : Daidoji R2 → ND d'armure 20 en gardant, allié +15", async () => {
    await renderApp({ ...base(), schoolId: "daidoji-bushi", insightRank: 2 });
    toCombat();
    fireEvent.click(screen.getByRole("checkbox", { name: /Je garde un allié/ }));
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    expect(screen.getByTestId("guard-note")).toHaveTextContent("Aucune pénalité pour toi jusqu'à ton tour suivant (un round de plus) ; ton allié : +15");
  });

  it("L15 : encaisser 12 dégâts, Réduction 3 → +9 blessures ; avec le Vide → +0 et un point dépensé", async () => {
    await renderApp({ ...base(), armor: { name: "Armure légère", bonus: 5, reduction: 3 } });
    openWounds();
    const box = within(screen.getByRole("group", { name: "Encaisser des dégâts" }));
    fireEvent.change(box.getByRole("spinbutton", { name: "Dégâts de l'attaque" }), { target: { value: "12" } });
    expect(box.getByTestId("damage-preview")).toHaveTextContent("Réduction 3 → +9 blessure(s)");
    fireEvent.click(box.getByRole("button", { name: "Encaisser" }));
    expect(woundsField()).toHaveValue(9);
    openWounds();
    const again = within(screen.getByRole("group", { name: "Encaisser des dégâts" }));
    fireEvent.change(again.getByRole("spinbutton", { name: "Dégâts de l'attaque" }), { target: { value: "12" } });
    fireEvent.click(again.getByRole("checkbox", { name: /Vide : −10 blessures/ }));
    expect(again.getByTestId("damage-preview")).toHaveTextContent("+0");
    fireEvent.click(again.getByRole("button", { name: "Encaisser" }));
    expect(woundsField()).toHaveValue(9);
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
  });
});

describe("Jets et duel (F7 à F12)", () => {
  it("F7 : opposition avec 2 augmentations → « Bats l'adversaire d'au moins 10 », verdict avec le total adverse", async () => {
    await renderApp(base(), always(9));
    click("Aide de jeu");
    click("Cour");
    click(/^Convaincre, manipuler/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augmentations" }), { target: { value: "2" } });
    expect(roller().getByTestId("opposed-margin")).toHaveTextContent("10");
    fireEvent.change(roller().getByRole("spinbutton", { name: "Total adverse" }), { target: { value: "15" } });
    click("Lancer 4g3");
    expect(roller().getByTestId("opposed-verdict")).toHaveTextContent("Tu l'emportes");
  });

  it("F8 : augmentations gratuites → ND −5 chacune ; F9 : tir sur une cible au corps à corps −10", async () => {
    await renderApp(withBow());
    toCombat();
    click(/^Tir · Yumi/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "20" } });
    fireEvent.change(roller().getByRole("spinbutton", { name: /Augm\. gratuites/ }), { target: { value: "2" } });
    fireEvent.click(roller().getByRole("checkbox", { name: /baisser le ND/ }));
    expect(screen.getByTestId("final-tn")).toHaveTextContent("10");
    fireEvent.click(roller().getByRole("checkbox", { name: /Cible au corps à corps/ }));
    expect(roller().getByText(/−10 au total/)).toBeInTheDocument();
    click(/^Attaque · Katana/);
    expect(roller().queryByRole("checkbox", { name: /Cible au corps à corps/ })).toBeNull();
  });

  it("L16 : duel, Évaluation gagnée de 10 → Concentration +1g1 ; écart 12 → premier, 1 augm. gratuite sur la Frappe", async () => {
    await renderApp();
    toCombat("Duel iaijutsu");
    click(/^1 · Évaluation/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Gagnée de 10 ou plus/ }));
    click(/^2 · Concentration/);
    expect(roller().getByTestId("pool")).toHaveTextContent("6g3");
    fireEvent.change(roller().getByRole("spinbutton", { name: "Écart de Concentration" }), { target: { value: "4" } });
    expect(roller().getByTestId("focus-outcome")).toHaveTextContent("Frappe simultanée");
    fireEvent.change(roller().getByRole("spinbutton", { name: "Écart de Concentration" }), { target: { value: "12" } });
    expect(roller().getByTestId("focus-outcome")).toHaveTextContent("Tu frappes en premier, 1 augmentation(s) gratuite(s)");
    click(/^3 · Frappe/);
    expect(roller().getByRole("spinbutton", { name: /Augm\. gratuites/ })).toHaveValue(1);
    // Pas de restriction de posture en duel (Centre implicite).
    expect(roller().queryByTestId("stance-restriction")).toBeNull();
  });

  it("F11 : Estropié → rappel dans le lanceur ; F12 : augmentations de dégâts groupées", async () => {
    await renderApp({ ...base(), wounds: 28 });
    toCombat();
    click(/^Attaque · Katana/);
    expect(roller().getByTestId("wound-note")).toHaveTextContent("Estropié");
    click("Ajouter Augmentation des dégâts");
    expect(roller().getByTestId("damage-raises-note")).toHaveTextContent("un seul effet");
  });
});
