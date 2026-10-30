/** Lot 21, v2.18.0 (HANDOFF annexe K) : ligne Insight du bloc Identité, badge d'écart (I8, I9), bonus du MJ. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { EXAMPLES } from "../../src/rules/example";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";

const haruto = (patch: Partial<Character> = {}): Character => ({ ...EXAMPLES[0]!.build(), ...patch });

async function renderApp(character: Character) {
  const storage = memoryStorage();
  await storage.library.put({ id: "c", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: /Kakita/ });
  return storage;
}
const identity = () => within(screen.getByTestId("block-identity"));

describe("Insight dans le bloc Identité (annexe K)", () => {
  it("lecture : « 125 · Rang 1 » ; I9 : Rang 1 saisi, aucun badge", async () => {
    await renderApp(haruto({ insightRank: 1 }));
    expect(screen.getByTestId("sheet-insight")).toHaveTextContent("125 · Rang 1");
    expect(screen.queryByTestId("insight-mismatch")).toBeNull();
  });

  it("I8 : Rang 3 saisi → badge « Rang saisi 3 · calculé 1 » en lecture et en Edit ; l'initiative garde le rang saisi", async () => {
    await renderApp(haruto({ insightRank: 3 }));
    expect(screen.getByTestId("insight-mismatch")).toHaveTextContent("Rang saisi 3 · calculé 1");
    const initiative = screen.getByTestId("sheet-initiative").textContent;
    fireEvent.click(screen.getByRole("button", { name: "Edit : Identité & réputation" }));
    expect(identity().getByTestId("insight-computed")).toHaveTextContent("Calculé : 125 pts → Rang 1");
    expect(identity().getByTestId("insight-mismatch")).toHaveTextContent("Rang saisi 3 · calculé 1");
    expect(identity().getByRole("spinbutton", { name: "Rang d'Insight" })).toHaveValue(3);
    fireEvent.click(screen.getByRole("button", { name: "Terminer : Identité & réputation" }));
    expect(screen.getByTestId("sheet-initiative")).toHaveTextContent(initiative!);
  });

  it("bonus du MJ : facultatif, ajouté aux points, vide = absent", async () => {
    const storage = await renderApp(haruto({ insightRank: 1 }));
    fireEvent.click(screen.getByRole("button", { name: "Edit : Identité & réputation" }));
    const bonus = identity().getByRole("spinbutton", { name: "Bonus d'Insight (MJ)" });
    expect(bonus).toHaveValue(null);
    fireEvent.change(bonus, { target: { value: "30" } });
    expect(identity().getByTestId("insight-computed")).toHaveTextContent("Calculé : 155 pts → Rang 2");
    expect(identity().getByTestId("insight-mismatch")).toHaveTextContent("Rang saisi 1 · calculé 2");
    await waitFor(async () => expect((await storage.library.get("c"))?.character.insightBonus).toBe(30), { timeout: 1500 });
    fireEvent.change(bonus, { target: { value: "" } });
    expect(identity().getByTestId("insight-computed")).toHaveTextContent("Calculé : 125 pts → Rang 1");
  });
});
