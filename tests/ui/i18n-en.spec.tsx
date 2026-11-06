/** Interface en anglais (annexe 52) : langue au lancement, bouton FR/EN, notation XkY, distances, contenu en français. */
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { initialLocale, LOCALE_KEY, type Locale } from "../../src/i18n";
import { formatDistance, formatPool, pct } from "../../src/ui/format";
import { poolLabel } from "../../src/ui/rolls";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { renderApp } from "../helpers/render";
import { chooseSchool } from "../../src/ui/components/sheet/hooks";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.lang = "fr";
});

async function openKakita(locale: Locale, patch: Partial<Character> = {}) {
  const storage = memoryStorage();
  const character = { ...structuredClone(kakita), ...patch } as Character;
  await storage.library.put({ id: "kakita", character, mode: "edit", updatedAt: "2026-11-06T10:00:00.000Z" });
  renderApp(<App storage={storage} rng={() => 5} />, { locale });
  await screen.findByRole("heading", { level: 1, name: /Kakita/ });
}

describe("Langue au lancement (52.2)", () => {
  it("E1 : navigateur en-US, premier lancement → anglais", () => {
    expect(initialLocale("en-US")).toBe("en");
  });

  it("E2 : navigateur pt-PT → français", () => {
    expect(initialLocale("pt-PT")).toBe("fr");
  });

  it("E3 : le choix mémorisé l'emporte sur la langue du navigateur", () => {
    localStorage.setItem(LOCALE_KEY, "en");
    expect(initialLocale("fr-FR")).toBe("en");
    localStorage.setItem(LOCALE_KEY, "fr");
    expect(initialLocale("en-US")).toBe("fr");
    localStorage.setItem(LOCALE_KEY, "de");
    expect(initialLocale("en-GB")).toBe("en");
  });

  it("E4 : stockage illisible → langue détectée", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqué"); });
    expect(initialLocale("en-US")).toBe("en");
    expect(initialLocale("pt-PT")).toBe("fr");
  });
});

describe("Bouton FR/EN (52.2)", () => {
  it("un clic bascule : textes, <html lang>, description, choix mémorisé", async () => {
    await openKakita("fr");
    const button = screen.getByRole("button", { name: "Langue : français" });
    expect(button).toHaveTextContent("FR");
    expect(document.documentElement.lang).toBe("fr");

    act(() => fireEvent.click(button));
    expect(screen.getByRole("button", { name: "Language: English" })).toHaveTextContent("EN");
    expect(screen.getByRole("group", { name: "View" })).toHaveTextContent("SheetAssistant L5RStatistics");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LOCALE_KEY)).toBe("en");
    expect(document.title).toBe("Kakita Haruto · Carnet de Rokugan");

    act(() => fireEvent.click(screen.getByRole("button", { name: "Language: English" })));
    expect(screen.getByRole("group", { name: "Vue" })).toBeInTheDocument();
    expect(localStorage.getItem(LOCALE_KEY)).toBe("fr");
  });

  it("stockage bloqué en écriture : la langue change quand même", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqué"); });
    await openKakita("fr");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Langue : français" })));
    expect(screen.getByRole("button", { name: "Language: English" })).toBeInTheDocument();
  });

  it("la description de la page suit la langue", async () => {
    const meta = document.createElement("meta");
    meta.name = "description";
    document.head.append(meta);
    await openKakita("en");
    expect(meta.content).toMatch(/^Free tool for Legend of the Five Rings/);
    act(() => fireEvent.click(screen.getByRole("button", { name: "Language: English" })));
    expect(meta.content).toMatch(/^Outil gratuit/);
    meta.remove();
  });
});

describe("Notation et unités (52.3)", () => {
  it("formatPool : XgY en français, XkY en anglais", () => {
    expect(formatPool(5, 3)).toBe("5g3");
    expect(formatPool(5, 3, "fr")).toBe("5g3");
    expect(formatPool(5, 3, "en")).toBe("5k3");
    expect(poolLabel({ rolled: 4, kept: 3, bonus: 6 } as Parameters<typeof poolLabel>[0], "en")).toBe("4k3 +6");
  });

  it("formatDistance : mètres en français, pieds en anglais", () => {
    expect(formatDistance(10)).toBe("3,0 m");
    expect(formatDistance(10, "en")).toBe("10 ft");
  });

  it("pct : espace avant % en français seulement", () => {
    expect([pct(0.5), pct(1), pct(0)]).toEqual(["50 %", "≥99 %", "<1 %"]);
    expect([pct(0.5, "en"), pct(1, "en"), pct(0, "en")]).toEqual(["50%", "≥99%", "<1%"]);
  });

  it("E5 : fiche Kakita en anglais, réserves en XkY", async () => {
    await openKakita("en");
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("5k3");
    expect(screen.getByTestId("attack-pool-Katana")).toHaveTextContent(/^\d+k\d+/);
    expect(screen.getByTestId("sheet-initiative")).toHaveTextContent(/^\d+k\d+/);
  });

  it("E6 : VD saisie 3g2, affichée 3k2 en anglais (et 3g2 en français)", async () => {
    const weapons = [{ name: "Katana", skill: "Kenjutsu", dr: "3g2" }];
    await openKakita("en", { weapons } as Partial<Character>);
    expect(within(screen.getByTestId("block-weapons")).getByText(/DR 3k2/)).toBeInTheDocument();
    act(() => fireEvent.click(screen.getByRole("button", { name: "Language: English" })));
    expect(within(screen.getByTestId("block-weapons")).getByText(/VD 3g2/)).toBeInTheDocument();
  });

  it("Statistiques en anglais : TN, pourcentages sans espace", async () => {
    await openKakita("en");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Statistics" })));
    await waitFor(() => expect(screen.getAllByRole("columnheader", { name: /^TN \d+$/ }).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/^\d+%$|^≥99%$|^<1%$/).length).toBeGreaterThan(0);
  });
});

describe("Contenu en français (52.4)", () => {
  it("E8 : panneau du grimoire en anglais, bandeau « in French » ; absent en français", async () => {
    const shugenja = (await import("../../reference/exemple-shugenja.json")).default;
    const storage = memoryStorage();
    await storage.library.put({ id: "t", character: structuredClone(shugenja) as unknown as Character, mode: "edit", updatedAt: "2026-11-06T10:00:00.000Z" });
    renderApp(<App storage={storage} rng={() => 5} />, { locale: "en" });
    await screen.findByRole("heading", { level: 1 });
    const magic = within(screen.getByTestId("block-magic"));
    fireEvent.click(screen.getByRole("button", { name: "Edit: Scrolls & invocations" }));
    fireEvent.click(magic.getByRole("button", { name: "Add from the grimoire" }));
    const panel = screen.getByRole("region", { name: "Add from the grimoire" });
    expect(panel).toHaveTextContent("Spells come from the campaign portal and are in French.");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Language: English" })));
    expect(screen.getByRole("region", { name: "Ajouter depuis le grimoire" }).querySelector(".gfr")).toBeNull();
  });

  it("menu Ressources en anglais : (FR) après les liens du portail et le guide, pas après le dépôt", async () => {
    await openKakita("en");
    fireEvent.click(screen.getByRole("button", { name: "Resources" }));
    const menu = within(screen.getByRole("menu", { name: "L5R resources" }));
    expect(menu.getByRole("menuitem", { name: /^Grimoire \(FR\): / })).toBeInTheDocument();
    expect(menu.getByRole("menuitem", { name: /^User guide \(FR\): / })).toBeInTheDocument();
    expect(menu.getByRole("menuitem", { name: /^What's new: / })).toBeInTheDocument();
  });

  it("V9 : Assistant en anglais (escarmouche) : situations, postures, actions et explications du moteur", async () => {
    await openKakita("en");
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    expect(screen.getByRole("button", { name: "Skirmish" })).toBeInTheDocument();
    expect(screen.getByText("Attack · Katana")).toBeInTheDocument();
    expect(screen.getAllByText(/Kenjutsu \(Agility\) against the target's Armor TN/).length).toBeGreaterThan(0);
    expect(screen.getByText("Damage · Katana")).toBeInTheDocument();
    expect(screen.getByTestId("posture-desc")).toHaveTextContent("Normal stance.");
    expect(document.body.textContent).not.toMatch(/Attaque · |contre le ND d'armure/);
    act(() => fireEvent.click(screen.getByText("Attack · Katana")));
    expect(screen.getByRole("heading", { level: 2, name: "Attack · Katana" })).toBeInTheDocument();
    expect(screen.getByText(/Kenjutsu 2 \+ Agility 3/)).toBeInTheDocument();
  });

  it("V9 : en français, les mêmes phrases qu'avant le lot 53", async () => {
    await openKakita("fr");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Assistant L5R" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    expect(screen.getByText("Attaque · Katana")).toBeInTheDocument();
    expect(screen.getAllByText(/Kenjutsu \(Agilité\) contre le ND d'armure de la cible\. Choisis tes manœuvres dans le lanceur\./).length).toBeGreaterThan(0);
    expect(screen.getByTestId("posture-desc")).toHaveTextContent("Posture normale.");
  });

  it("fiche saisie en anglais : compétence du catalogue affichée sous le nom de la fiche, en anglais sinon", async () => {
    await openKakita("en", { skills: [{ name: "Courtier", rank: 2, trait: "awareness", emphases: [] }] } as Partial<Character>);
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Court" })));
    act(() => fireEvent.click(screen.getAllByText("Convince, manipulate")[0]!));
    expect(screen.getByText(/^Courtier 2 \+ Awareness 3/)).toBeInTheDocument();
    act(() => fireEvent.click(screen.getAllByText("Be believed")[0]!));
    expect(screen.getByText(/^Sincerity 0 \+ Awareness 3/)).toBeInTheDocument();
  });

  it("menu Ressources en français : aucun suffixe", async () => {
    await openKakita("fr");
    fireEvent.click(screen.getByRole("button", { name: "Ressources" }));
    expect(screen.getByRole("menu").textContent).not.toContain("(FR)");
  });
});

describe("Catalogues en anglais (annexe 54)", () => {
  it("fiche : école, rangs, résumés et rappel chiffré en anglais ; en français, les textes d'avant", async () => {
    await openKakita("en", { schoolId: "kitsuki-enqueteur", insightRank: 2 });
    const block = within(screen.getByTestId("school-techniques"));
    expect(block.getByText("Kitsuki Investigator School")).toBeInTheDocument();
    expect(block.getByText(/· Dragon · School Rank 2/)).toBeInTheDocument();
    expect(block.getByText("R1 · The Kitsuki Method")).toBeInTheDocument();
    expect(block.getByText("1 Free Raise on Investigation. + Perception to your Armor TN in a skirmish.")).toBeInTheDocument();
    expect(block.getByText("→ +10 to the TN of anyone lying to you.")).toBeInTheDocument();
    expect(block.getByText("R5 · The Eyes Betray the Heart")).toBeInTheDocument();
    expect(screen.getByTestId("school-techniques").textContent).not.toMatch(/École|Rang d'école| ND /);
  });

  it("fiche en français : noms et résumés du catalogue français", async () => {
    await openKakita("fr", { schoolId: "kitsuki-enqueteur", insightRank: 2 });
    const block = within(screen.getByTestId("school-techniques"));
    expect(block.getByText("École d'enquêteurs Kitsuki")).toBeInTheDocument();
    expect(block.getByText("R1 · La Méthode Kitsuki")).toBeInTheDocument();
    expect(block.getByText("→ +10 au ND de qui te ment.")).toBeInTheDocument();
  });

  it("Assistant : compteur, case de ND d'armure, posture et rappels d'école en anglais", async () => {
    await openKakita("en", { schoolId: "hiruma-bushi", insightRank: 3 });
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    expect(screen.getByText("Melee hits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add: Melee hits" })).toBeInTheDocument();
    expect(screen.getByText("Hummingbird Wings (once per round)")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Touches au corps à corps|Ailes du colibri/);
  });

  it("table de bataille : événement en anglais", async () => {
    await openKakita("en");
    act(() => fireEvent.click(screen.getByRole("button", { name: "L5R Assistant" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Combat" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Battle" })));
    // Ligne 7-9, colonne Engagé + armée en recul : Occasion héroïque.
    const panel = within(screen.getByRole("group", { name: "Mass battle" }));
    fireEvent.change(panel.getByRole("spinbutton", { name: "Battle roll total" }), { target: { value: "8" } });
    act(() => fireEvent.click(panel.getByRole("button", { name: "Losing" })));
    expect(within(panel.getByTestId("battle-outcome")).getByText("Heroic Opportunity")).toBeInTheDocument();
  });

  it("Bibliothèque : modèles anglais, fichiers example-*.json", async () => {
    renderApp(<App storage={memoryStorage()} rng={() => 5} />, { locale: "en" });
    await screen.findByRole("article", { name: "Courtier template" });
    expect(screen.getByText("Kakita Haruto")).toBeInTheDocument();
    const names: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:example");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    for (const t of ["Bushi", "Shugenja", "Courtier"]) fireEvent.click(screen.getByRole("button", { name: `JSON of the ${t} template` }));
    expect(names).toEqual(["example-bushi-l5r.json", "example-shugenja-l5r.json", "example-courtier-l5r.json"]);
  });
});

describe("Choix d'une école (annexe 54.2)", () => {
  it("le nom affiché de l'école est écrit dans la langue de l'interface", () => {
    const set = vi.fn();
    chooseSchool(set, "doji-courtisan", "en");
    expect(set).toHaveBeenLastCalledWith(["school"], "Doji Courtier School");
    chooseSchool(set, "doji-courtisan", "fr");
    expect(set).toHaveBeenLastCalledWith(["school"], "École de courtisans Doji");
  });
});
