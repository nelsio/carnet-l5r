/** Barre d'état : piste et détail des blessures, pénalités effectives, tuile Blessures. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import { EXAMPLES } from "../../src/rules/example";
import { WOUND_LEVELS } from "../../src/rules/l5r4e";
import kakita from "../fixtures/kakita-v1.json";
import { openWounds, WOUNDS_TILE } from "../helpers/wounds";

const exampleCharacter = () => EXAMPLES[0]!.build();
const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

async function renderApp(character: Character = base(), mode: LibraryEntry["mode"] = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

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

  it("piste : abréviations à l'écran, libellé complet en sr-only et en title (annexe 45.1, 45.2)", async () => {
    await renderApp({ ...base(), wounds: 24 });
    const cells = Array.from(screen.getByLabelText("Niveaux de blessure").querySelectorAll(".wl"));
    const shown = cells.map((cell) => cell.querySelector("[aria-hidden='true']")?.textContent);
    expect(shown).toEqual(["Indemne", "Égrat.", "Éraflé", "Blessé", "Grav.", "Estropié", "À terre", "HdC"]);
    expect(cells.map((cell) => cell.querySelector(".sr-only")?.textContent)).toEqual(WOUND_LEVELS.map((w) => w.label));
    expect(cells[4]).toHaveAttribute("title", "Gravement blessé jusqu'à 26 blessures");
    // Le libellé courant et le détail déplié gardent le nom complet.
    const summary = screen.getByRole("button", { name: /Gravement blessé/ });
    fireEvent.click(summary);
    expect(within(screen.getByTestId("wound-detail")).getAllByRole("listitem")[4]).toHaveTextContent("Gravement blessé");
  });
});

describe("Tuile Blessures (E.19 S11, S14)", () => {
  it("total « N/max », panneau Ajuster puis Dégâts de l'attaque ; reste ouvert après + ; « Encaisser » le referme", async () => {
    await renderApp(exampleCharacter());
    const tile = screen.getByRole("button", { name: WOUNDS_TILE });
    expect(tile).toHaveTextContent("0/38");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Blessures", { selector: ".status-in > div > .label" })).toBeNull();
    openWounds();
    click("Ajouter 1 blessure");
    click("Ajouter 1 blessure");
    expect(tile).toHaveTextContent("2/38");
    const box = within(screen.getByRole("group", { name: "Encaisser des dégâts" }));
    expect(box.getByText("Ajuster")).toBeInTheDocument();
    fireEvent.change(box.getByRole("spinbutton", { name: "Dégâts de l'attaque" }), { target: { value: "12" } });
    fireEvent.click(box.getByRole("button", { name: "Encaisser" }));
    // 12 dégâts − Réduction 3 de l'armure légère = 9 ; 2 + 9 = 11.
    expect(tile).toHaveTextContent("11/38");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Encaisser des dégâts" })).toBeNull();
  });

  it("consultation : nombre affiché, pas de tuile", async () => {
    await renderApp(base({ wounds: 4 }), "readonly");
    expect(screen.queryByRole("button", { name: WOUNDS_TILE })).toBeNull();
    expect(screen.getByLabelText("Blessures subies")).toHaveTextContent("4");
  });
});
