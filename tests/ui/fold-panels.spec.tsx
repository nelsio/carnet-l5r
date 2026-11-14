/** Lot 61, v2.33.0 (annexe 61) : panneaux Posture et Dépenser du Vide repliables, chevron mémorisé. */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character, Modifier } from "@carnet/core";
import { memoryStorage, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import { initialState, initialUi, reducer } from "../../src/ui/store";
import kakita from "../fixtures/kakita-v1.json";
import { renderApp as renderLocale } from "../helpers/render";
import { chooseStance, openStanceOptions } from "../helpers/stance";
import { spendVoid } from "../helpers/void";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;
const STANCE_FOLD = "Options de posture : Monté, Je garde un allié";
const VOID_FOLD = "Dépenses de Vide";
const armorMod = (patch: Partial<Modifier>): Modifier => ({
  id: "m", name: "Bonus", source: "technique", appliesTo: "armor", rolled: 0, kept: 0, flat: 0, freeRaises: 0, tn: 0,
  mode: "optional", note: "", ...patch,
});

async function renderApp(storage: Storage = memoryStorage(), patch: Partial<Character> = {}) {
  const character = { ...base(), ...patch };
  await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-11-12T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const toSkirmish = () => {
  click(VIEW.aid);
  click("Combat");
};
const fold = (name: string) => screen.getByRole("button", { name });
const stanceHead = () => fold(STANCE_FOLD).closest(".panel-head") as HTMLElement;
const voidGroup = () => screen.getByRole("group", { name: "Dépenser du Vide" });

describe("Préférences stanceOptions et voidPanel (annexe 61.5)", () => {
  it("repliés à l'état initial ; l'action « panel » les ouvre et les ferme", () => {
    expect(initialUi.stanceOptions).toBe(false);
    expect(initialUi.voidPanel).toBe(false);
    const on = reducer(initialState(), { type: "panel", panel: "voidPanel", open: true });
    expect(on.ui.voidPanel).toBe(true);
    expect(on.ui.stanceOptions).toBe(false);
    expect(reducer(on, { type: "panel", panel: "voidPanel", open: false }).ui.voidPanel).toBe(false);
  });

  it("P7 : gardés au changement de fiche et au retour à la Bibliothèque", () => {
    let s = reducer(initialState(), { type: "panel", panel: "stanceOptions", open: true });
    s = reducer(s, { type: "panel", panel: "voidPanel", open: true });
    const opened = reducer(s, { type: "open", id: "x", character: base(), mode: "edit" });
    expect(opened.ui).toMatchObject({ stanceOptions: true, voidPanel: true });
    expect(reducer(opened, { type: "library" }).ui).toMatchObject({ stanceOptions: true, voidPanel: true });
  });

  it("P7 : relus au démarrage et écrits à chaque changement", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ stanceOptions: true });
    await renderApp(storage);
    toSkirmish();
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-expanded", "true");
    expect(fold(VOID_FOLD)).toHaveAttribute("aria-expanded", "false");
    click(VOID_FOLD);
    await expect.poll(async () => (await storage.prefs.get()).voidPanel).toBe(true);
    click(STANCE_FOLD);
    await expect.poll(async () => (await storage.prefs.get()).stanceOptions).toBe(false);
  });

  it("« Nouveau round » ne change pas les réglages", async () => {
    await renderApp();
    toSkirmish();
    click(VOID_FOLD);
    click("Nouveau round");
    expect(fold(VOID_FOLD)).toHaveAttribute("aria-expanded", "true");
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Panneau Posture (annexe 61.3)", () => {
  it("P1 : par défaut, menu, ND d'armure et modificateurs visibles ; description, Monté, garde absents", async () => {
    await renderApp();
    toSkirmish();
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-expanded", "false");
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-controls", "stance-options");
    expect(screen.getByRole("combobox", { name: "Posture" })).toBeVisible();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    expect(screen.getByTestId("posture-fx")).toHaveTextContent("aucun modificateur");
    expect(screen.queryByRole("checkbox", { name: /^Monté/ })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Je garde un allié/ })).toBeNull();
    expect(screen.getByTestId("posture-desc")).not.toBeVisible();
    // Le menu garde sa description, même masquée.
    expect(screen.getByRole("combobox", { name: "Posture" })).toHaveAttribute("aria-describedby", "posture-desc");
    chooseStance("Assaut");
    expect(within(screen.getByTestId("posture-fx")).getByText("+2g1 attaque")).toHaveClass("up");
  });

  it("P2 : le chevron affiche la zone et passe à aria-expanded=true", async () => {
    await renderApp();
    toSkirmish();
    click(STANCE_FOLD);
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("posture-desc")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /^Monté/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Je garde un allié/ })).toBeInTheDocument();
    expect(fold(STANCE_FOLD).closest(".panel")).not.toHaveClass("folded");
  });

  it("P3 : Monté, garde et bonus d'armure cochés restent en étiquettes dans l'en-tête une fois repliés", async () => {
    await renderApp(memoryStorage(), { modifiers: [armorMod({ id: "a1", name: "Esquive", flat: 3 })] });
    toSkirmish();
    openStanceOptions();
    for (const name of [/^Monté/, /Je garde un allié/, /Esquive/]) fireEvent.click(screen.getByRole("checkbox", { name }));
    expect(within(stanceHead()).queryAllByTestId("stance-active")).toHaveLength(0);
    click(STANCE_FOLD);
    expect(within(stanceHead()).getAllByTestId("stance-active").map((t) => t.textContent)).toEqual(["Monté", "Garde un allié", "Esquive"]);
  });

  it("P3 : l'étiquette « +10 Vide » reste dans les deux états", async () => {
    await renderApp();
    toSkirmish();
    spendVoid("armor");
    expect(stanceHead()).toHaveTextContent("+10 Vide");
    click(STANCE_FOLD);
    expect(stanceHead()).toHaveTextContent("+10 Vide");
  });

  it("P4 : compteur Hiruma R2 visible, panneau replié", async () => {
    await renderApp(memoryStorage(), { schoolId: "hiruma-bushi", insightRank: 2 });
    toSkirmish();
    expect(fold(STANCE_FOLD)).toHaveAttribute("aria-expanded", "false");
    const techniques = screen.getByRole("group", { name: "Techniques d'école" });
    expect(within(techniques).getAllByRole("button", { name: /^Ajouter/ }).length).toBeGreaterThan(0);
  });
});

describe("Panneau Dépenser du Vide (annexe 61.4)", () => {
  it("P5 : replié par défaut, points et dépenses actives visibles, menu absent", async () => {
    await renderApp();
    toSkirmish();
    expect(fold(VOID_FOLD)).toHaveAttribute("aria-expanded", "false");
    expect(fold(VOID_FOLD)).toHaveAttribute("aria-controls", "void-options");
    expect(voidGroup()).toHaveTextContent("Points de Vide 2");
    expect(within(voidGroup()).queryByRole("combobox")).toBeNull();
    spendVoid("roll");
    click(VOID_FOLD);
    expect(within(voidGroup()).queryByRole("combobox")).toBeNull();
    expect(within(voidGroup()).getByTestId("void-active")).toHaveTextContent("+1g1 au jet");
  });

  it("P6 : point dépensé ce round puis repli → étiquette « dépensé ce round »", async () => {
    await renderApp();
    toSkirmish();
    spendVoid("armor");
    expect(within(voidGroup()).queryByTestId("void-spent")).toBeNull();
    click(VOID_FOLD);
    expect(within(voidGroup()).getByTestId("void-spent")).toHaveTextContent("dépensé ce round");
  });

  it("présent replié en duel iaijutsu", async () => {
    await renderApp();
    toSkirmish();
    click("Duel iaijutsu");
    expect(fold(VOID_FOLD)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: STANCE_FOLD })).toBeNull();
  });
});

describe("En anglais (annexe 61.2)", () => {
  it("P8 : noms accessibles traduits", async () => {
    const storage = memoryStorage();
    await storage.library.put({ id: "kakita", character: base(), mode: "edit", updatedAt: "2026-11-12T10:00:00.000Z" });
    renderLocale(<App storage={storage} rng={() => 5} />, { locale: "en" });
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    expect(screen.getByRole("button", { name: "Stance options: Mounted, Guarding an ally" })).toHaveAttribute("aria-expanded", "false");
    const voidPanel = screen.getByRole("group", { name: "Spend Void" });
    act(() => fireEvent.click(within(voidPanel).getByRole("button", { name: "Void spending" })));
    expect(within(voidPanel).getByRole("combobox")).toBeInTheDocument();
  });
});
