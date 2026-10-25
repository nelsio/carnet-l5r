/** Lot 12, v2.6.0 (HANDOFF annexe E.7) : bandeau « Mettre à jour le vocabulaire », aperçu, renommage annulable. */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import example from "../../reference/exemple-personnage.json";

const base = (patch: Partial<Character> = {}) => ({ ...(structuredClone(kakita) as Character), ...patch });

async function renderApp(character: Character = base(), mode: "edit" | "readonly" = "edit") {
  const storage = memoryStorage();
  await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-25T10:00:00.000Z" });
  const view = render(<App storage={storage} rng={() => 5} />);
  await screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) });
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const banner = () => screen.queryByRole("group", { name: "Vocabulaire" });

describe("Bandeau de vocabulaire (annexe E.7)", () => {
  it("proposé à l'ouverture d'une fiche qui contient un ancien nom", async () => {
    await renderApp();
    expect(banner()).toHaveTextContent("Mettre à jour le vocabulaire (Courtoisie → Courtisan)");
  });

  it("absent pour une fiche au vocabulaire à jour", async () => {
    await renderApp(structuredClone(example) as Character);
    expect(banner()).toBeNull();
  });

  it("absent en consultation", async () => {
    await renderApp(base(), "readonly");
    expect(banner()).toBeNull();
  });

  it("L23 : aperçu, puis Renommer : Courtisan ; Étiquette garde sa spécialisation Courtoisie", async () => {
    const { storage } = await renderApp();
    click("Mettre à jour…");
    const preview = screen.getByTestId("vocabulary-preview");
    expect(preview).toHaveTextContent("Compétence : « Courtoisie » → « Courtisan »");
    expect(preview).not.toHaveTextContent("Spécialisation");
    click("Renommer");
    expect(banner()).toHaveTextContent("Vocabulaire mis à jour.");
    await waitFor(async () => {
      const skills = (await storage.library.get("kakita"))?.character.skills ?? [];
      expect(skills.map((s) => s.name)).toContain("Courtisan");
      expect(skills.find((s) => s.name === "Étiquette")?.emphases).toEqual(["Courtoisie"]);
    });
  });

  it("Étiquette (Politesse) devient Étiquette (Courtoisie)", async () => {
    const c = base();
    c.skills.find((s) => s.name === "Étiquette")!.emphases = ["Politesse"];
    await renderApp(c);
    click("Mettre à jour…");
    expect(screen.getByTestId("vocabulary-preview")).toHaveTextContent("Spécialisation (Étiquette) : « Politesse » → « Courtoisie »");
  });

  it("Annuler le renommage rend les anciens noms et masque le bandeau", async () => {
    await renderApp();
    click("Mettre à jour…");
    click("Renommer");
    click("Annuler le renommage");
    expect(banner()).toBeNull();
    expect(screen.getByTestId("block-skills")).toHaveTextContent("Courtoisie");
    expect(screen.getByTestId("block-skills")).not.toHaveTextContent("Courtisan");
  });

  it("Annuler dans l'aperçu ne change rien ; Plus tard masque le bandeau", async () => {
    await renderApp();
    click("Mettre à jour…");
    click("Annuler");
    expect(banner()).toHaveTextContent("Mettre à jour le vocabulaire");
    click("Plus tard");
    expect(banner()).toBeNull();
  });

  it("le trait awareness s'affiche « Vigilance »", async () => {
    await renderApp();
    expect(within(screen.getByTestId("block-rings")).getByText("Vigilance")).toBeInTheDocument();
  });
});
