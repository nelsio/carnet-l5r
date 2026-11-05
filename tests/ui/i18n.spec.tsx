/** Localisation, fournisseur de langue (annexe 50) : rendu neutre en français, langue et locale Intl. */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { useLocale, useT } from "../../src/i18n";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { renderApp } from "../helpers/render";

function Probe() {
  const t = useT();
  const { locale, intl, setLocale } = useLocale();
  return (
    <>
      <output data-testid="locale">{`${locale} ${intl} ${t.nav.sheet}`}</output>
      <button type="button" onClick={() => setLocale(locale === "fr" ? "en" : "fr")}>{t.common.ok}</button>
    </>
  );
}

describe("Fournisseur de langue (50.1)", () => {
  it("sans fournisseur : français, comme avant le lot 50", () => {
    render(<Probe />);
    expect(screen.getByTestId("locale")).toHaveTextContent("fr fr-FR Fiche");
  });

  it("langue initiale, puis changement : la locale Intl suit", () => {
    renderApp(<Probe />, { locale: "en" });
    expect(screen.getByTestId("locale")).toHaveTextContent("en en-US");
    act(() => fireEvent.click(screen.getByRole("button")));
    expect(screen.getByTestId("locale")).toHaveTextContent("fr fr-FR Fiche");
  });

  it("I1 : l'application dans le fournisseur affiche les mêmes textes", async () => {
    const storage = memoryStorage();
    const character = structuredClone(kakita) as Character;
    await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-11-05T10:00:00.000Z" });
    renderApp(<App storage={storage} rng={() => 5} />);
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    expect(screen.getByRole("group", { name: "Vue" })).toHaveTextContent("FicheAssistant L5RStatistiques");
    expect(screen.getByRole("button", { name: "Thème : auto" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Anneaux & Traits" })).toHaveTextContent("Augm. max");
  });
});
