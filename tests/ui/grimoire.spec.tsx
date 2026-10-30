/**
 * Lot 30, v2.22.0 (HANDOFF annexe N.5) : panneau « Ajouter depuis le grimoire », cas GR13, GR15 à GR17 et GR19 à GR21.
 * GR14 (aucune requête réseau), GR18 (mobile) et GR15 dans le build : tests/e2e/grimoire.spec.ts.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { migrate, type Character } from "@carnet/core";
import { loadGrimoire, memoryStorage, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import tamori from "../../reference/exemple-shugenja.json";
import { fakeResponse, fixtureFetch, grimoireFile } from "../helpers/grimoire";

const shugenja = () => migrate(structuredClone(tamori));
const now = () => new Date("2026-10-28T12:00:00.000Z");

async function renderApp({ character = shugenja(), mode = "edit", storage = memoryStorage() }: { character?: Character; mode?: "edit" | "readonly"; storage?: Storage } = {}) {
  await storage.library.put({ id: "a", character, mode, updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  await screen.findByRole("heading", { level: 1 });
  return storage;
}

async function cachedStorage() {
  const storage = memoryStorage();
  await storage.grimoire.set(await loadGrimoire({ fetch: fixtureFetch(), now }));
  return storage;
}

const magic = () => within(screen.getByTestId("block-magic"));
const editMagic = () => fireEvent.click(screen.getByRole("button", { name: "Edit : Rouleaux & invocations" }));
const toggle = () => magic().getByRole("button", { name: "Ajouter depuis le grimoire" });
const panel = () => within(screen.getByRole("region", { name: "Ajouter depuis le grimoire" }));
const status = () => screen.getByTestId("grimoire-status");
const spellGroups = () => magic().getAllByRole("group", { name: /^Sort : / });
const field = (group: HTMLElement, name: string) => within(group).getByRole("textbox", { name }) as HTMLInputElement;

function stubFetch(impl = fixtureFetch()) {
  const spy = vi.fn(impl);
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => vi.unstubAllGlobals());

describe("GR15 : ouvrir, charger, chercher, ajouter", () => {
  it("aucune requête avant « Charger le grimoire » ; puis sort ajouté en fin de liste, rempli, effet vide, étiquette", async () => {
    const spy = stubFetch();
    await renderApp();
    editMagic();
    expect(status()).toHaveTextContent("Grimoire non chargé");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveClass("accent");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(toggle()).toHaveClass("on");
    expect(panel().getByText(/environ 110 Ko/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    fireEvent.click(panel().getByRole("button", { name: "Charger le grimoire" }));
    const search = await panel().findByRole("combobox", { name: "Nom du sort" });
    expect(spy).toHaveBeenCalledTimes(6);
    expect(search).toHaveFocus();
    expect(status()).toHaveTextContent(/Grimoire du \d\d\/\d\d\/\d{4} · 162 sorts · Actualiser/);
    expect(panel().getByText("162 sorts")).toBeInTheDocument();

    const before = spellGroups().length;
    fireEvent.change(search, { target: { value: "armure" } });
    expect(panel().getAllByRole("option")[0]).toHaveTextContent(/^Armure de Terre Armor of EarthTerre · Maîtrise 1 · ND 10 · Bataille, Défense\+ Ajouter$/);
    fireEvent.keyDown(search, { key: "Enter" });

    const groups = spellGroups();
    expect(groups).toHaveLength(before + 1);
    const added = groups.at(-1)!;
    expect(added).toHaveAttribute("aria-label", "Sort : Armure de Terre");
    expect(field(added, "Portée").value).toBe("Personnelle");
    expect(field(added, "Zone d'effet").value).toBe("Le lanceur");
    expect(field(added, "Durée").value).toBe("10 Rounds");
    expect(within(added).getByRole("button", { name: "Bataille" })).toHaveAttribute("aria-pressed", "true");
    expect(within(added).getByRole("button", { name: "Défense" })).toHaveAttribute("aria-pressed", "true");
    expect((within(added).getByRole("textbox", { name: "Augmentations (une par ligne)" }) as HTMLTextAreaElement).value).toBe("Durée (+2 rounds par Augmentation)");
    expect((within(added).getByRole("textbox", { name: "Effet (résumé)" }) as HTMLTextAreaElement).value).toBe("");
    expect(within(added).getByRole("checkbox")).not.toBeChecked();
    expect(within(added).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    expect(within(added).getByText("Résume l'effet ; ajoute la VD si le sort en a une.")).toBeInTheDocument();
    expect(added).toHaveClass("fresh");

    // Bureau : le panneau reste ouvert, focus sur la recherche, compteur avec le sort ajouté.
    expect(search).toHaveFocus();
    expect(panel().getByText(/Ajouté :/)).toHaveTextContent("Ajouté : Armure de Terre");
    expect(panel().getAllByRole("option")[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("l'étiquette disparaît si le nom change, et en sortant du mode édition", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(toggle());
    fireEvent.change(await panel().findByRole("combobox"), { target: { value: "éteindre" } });
    fireEvent.click(panel().getAllByRole("option")[0]!);
    let added = spellGroups().at(-1)!;
    expect(within(added).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    fireEvent.change(field(added, "Nom"), { target: { value: "Éteindre les feux" } });
    expect(within(added).queryByText("✓ Rempli depuis le grimoire")).toBeNull();

    fireEvent.change(panel().getByRole("combobox"), { target: { value: "armure de terre" } });
    fireEvent.click(panel().getAllByRole("option")[0]!);
    added = spellGroups().at(-1)!;
    expect(within(added).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Terminer : Rouleaux & invocations" }));
    editMagic();
    expect(magic().queryByText("✓ Rempli depuis le grimoire")).toBeNull();
    expect(screen.queryByRole("region", { name: "Ajouter depuis le grimoire" })).toBeNull();
  });
});

describe("GR13 : cache", () => {
  it("grimoire en cache : prêt au démarrage, sans réseau", async () => {
    const spy = stubFetch();
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    await waitFor(() => expect(status()).toHaveTextContent("Grimoire du 28/10/2026 · 162 sorts · Actualiser"));
    expect(status().querySelector(".dot")).not.toBeNull();
    expect(status()).toHaveClass("ok");
    fireEvent.click(toggle());
    expect(panel().getByRole("combobox", { name: "Nom du sort" })).toHaveFocus();
    expect(spy).not.toHaveBeenCalled();
  });

  it("chargement réussi : écrit dans le cache", async () => {
    stubFetch();
    const storage = await renderApp();
    editMagic();
    fireEvent.click(toggle());
    fireEvent.click(panel().getByRole("button", { name: "Charger le grimoire" }));
    await panel().findByRole("combobox");
    await waitFor(async () => expect(((await storage.grimoire.get()) as { spells: unknown[] }).spells).toHaveLength(162));
  });

  it("« Actualiser » en échec : l'ancien cache est gardé et un message le dit", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    await waitFor(() => expect(status()).toHaveTextContent("Actualiser"));
    fireEvent.click(within(status()).getByRole("button", { name: "Actualiser" }));
    await waitFor(() => expect(status()).toHaveTextContent("Actualisation impossible, grimoire du 28/10/2026 gardé · Réessayer"));
    expect(status()).toHaveClass("warn");
    fireEvent.click(toggle());
    expect(panel().getAllByRole("option")).toHaveLength(162);
  });

  it("grimoire incomplet (5 fichiers sur 6)", async () => {
    stubFetch(fixtureFetch({ eau: async () => fakeResponse("", 404) }));
    await renderApp();
    editMagic();
    fireEvent.click(toggle());
    fireEvent.click(panel().getByRole("button", { name: "Charger le grimoire" }));
    await panel().findByRole("combobox");
    expect(status()).toHaveTextContent("Grimoire incomplet (5 fichiers sur 6) · Actualiser");
    expect(status()).toHaveClass("warn");
  });
});

describe("GR16 : filtres et sorts déjà notés", () => {
  it("pastille « Universels » : 3 résultats ; sort déjà noté : aria-disabled, clic sans effet", async () => {
    const c = shugenja();
    c.spells = [...(c.spells ?? []), { ...c.spells![0]!, id: "jade", name: "Frappe de Jade", element: "earth" }];
    await renderApp({ character: c, storage: await cachedStorage() });
    editMagic();
    fireEvent.click(toggle());
    const chips = within(panel().getByRole("group", { name: "Élément" }));
    expect(chips.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chips.getByRole("button", { name: "Universels" }));
    expect(chips.getByRole("button", { name: "Universels" })).toHaveAttribute("aria-pressed", "true");
    expect(panel().getAllByRole("option")).toHaveLength(3);
    expect(panel().getByText("3 sorts")).toBeInTheDocument();

    fireEvent.click(chips.getByRole("button", { name: "Terre" }));
    fireEvent.change(panel().getByRole("combobox"), { target: { value: "jade" } });
    const jade = panel().getAllByRole("option").find((o) => o.textContent?.startsWith("Frappe de Jade"))!;
    expect(jade).toHaveAttribute("aria-disabled", "true");
    expect(jade).toHaveTextContent("déjà noté");
    const before = spellGroups().length;
    fireEvent.click(jade);
    expect(spellGroups()).toHaveLength(before);
  });
});

describe("GR17 : clavier", () => {
  it("↑ ↓ déplacent l'option active, Entrée ajoute, Échap ferme et rend le focus au bouton", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(toggle());
    const search = panel().getByRole("combobox");
    fireEvent.change(search, { target: { value: "armure" } });
    const options = panel().getAllByRole("option");
    expect(search).toHaveAttribute("aria-activedescendant", options[0]!.id);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(search).toHaveAttribute("aria-activedescendant", options[1]!.id);
    expect(panel().getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(search, { key: "ArrowUp" });
    fireEvent.keyDown(search, { key: "ArrowUp" });
    expect(search).toHaveAttribute("aria-activedescendant", options[0]!.id);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    const name = options[1]!.querySelector(".n")!.firstChild!.textContent;
    fireEvent.keyDown(search, { key: "Enter" });
    expect(spellGroups().at(-1)).toHaveAttribute("aria-label", `Sort : ${name}`);
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Ajouter depuis le grimoire" })).toBeNull();
    expect(toggle()).toHaveFocus();
  });

  it("× ferme le panneau", async () => {
    await renderApp();
    editMagic();
    fireEvent.click(toggle());
    expect(panel().getByRole("button", { name: "Charger le grimoire" })).toHaveFocus();
    fireEvent.click(panel().getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("region", { name: "Ajouter depuis le grimoire" })).toBeNull();
  });
});

describe("GR19 : hors ligne", () => {
  it("état error, encadré role=alert, « + Sort » utilisable, « Réessayer » recharge", async () => {
    const spy = stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await renderApp();
    editMagic();
    fireEvent.click(toggle());
    fireEvent.click(panel().getByRole("button", { name: "Charger le grimoire" }));
    const alert = await panel().findByRole("alert");
    expect(alert).toHaveTextContent("Le grimoire ne répond pas. Vérifie ta connexion, puis réessaie. Tu peux toujours saisir le sort à la main avec « + Sort ».");
    expect(status()).toHaveTextContent("Grimoire injoignable · Réessayer");
    expect(status()).toHaveClass("err");
    const before = spellGroups().length;
    fireEvent.click(magic().getByRole("button", { name: "+ Sort" }));
    expect(spellGroups()).toHaveLength(before + 1);

    spy.mockImplementation(fixtureFetch());
    fireEvent.click(within(alert).getByRole("button", { name: "Réessayer" }));
    expect(await panel().findByRole("combobox")).toHaveFocus();
  });
});

describe("GR20 : sorts universels", () => {
  it("grimoire prêt : les 3 universels sont remplis", async () => {
    const c = { ...shugenja(), spells: [] };
    await renderApp({ character: c, storage: await cachedStorage() });
    editMagic();
    await waitFor(() => expect(status()).toHaveTextContent("162 sorts"));
    fireEvent.click(magic().getByRole("button", { name: "Ajouter les sorts universels" }));
    const groups = spellGroups();
    expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual(["Sort : Sentir les Kami", "Sort : Communier avec les Kami", "Sort : Invoquer les Kami"]);
    expect(field(groups[0]!, "Portée").value).toBe("Personnelle");
    expect(field(groups[1]!, "Durée").value).toBe("Concentration");
    for (const g of groups) {
      expect(within(g).getByRole("combobox", { name: "Élément" })).toHaveValue("all");
      expect(within(g).getByRole("spinbutton", { name: "Maîtrise" })).toHaveValue(1);
      expect(within(g).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    }
    expect(magic().queryByRole("button", { name: "Ajouter les sorts universels" })).toBeNull();
  });

  it("grimoire non chargé : comportement d'avant (noms seuls)", async () => {
    await renderApp({ character: { ...shugenja(), spells: [] } });
    editMagic();
    fireEvent.click(magic().getByRole("button", { name: "Ajouter les sorts universels" }));
    expect(spellGroups().map((g) => g.getAttribute("aria-label"))).toEqual(["Sort : Sentir", "Sort : Communier", "Sort : Invoquer"]);
    expect(magic().queryByText("✓ Rempli depuis le grimoire")).toBeNull();
  });
});

describe("GR21 : consultation et lecture", () => {
  it("ni bouton, ni panneau, ni état du grimoire", async () => {
    await renderApp({ mode: "readonly", storage: await cachedStorage() });
    expect(screen.queryByRole("button", { name: "Ajouter depuis le grimoire" })).toBeNull();
    expect(screen.queryByTestId("grimoire-status")).toBeNull();
  });

  it("fiche en lecture (bloc fermé) : rien non plus", async () => {
    await renderApp({ storage: await cachedStorage() });
    expect(magic().queryByRole("button", { name: "Ajouter depuis le grimoire" })).toBeNull();
    expect(screen.queryByTestId("grimoire-status")).toBeNull();
  });
});

describe("GR3 : valeur piégée rendue comme texte", () => {
  it("le nom « </script><img onerror> » s'affiche tel quel, sans élément img", async () => {
    const trap = "<img src=x onerror=alert(1)>";
    stubFetch(async () => fakeResponse(grimoireFile(`{ id: "t", name: ${JSON.stringify(trap)}, element: "Feu", mastery: 1 }`)));
    await renderApp();
    editMagic();
    fireEvent.click(toggle());
    await act(async () => fireEvent.click(panel().getByRole("button", { name: "Charger le grimoire" })));
    fireEvent.change(await panel().findByRole("combobox"), { target: { value: "img" } });
    expect(panel().getAllByRole("option")[0]).toHaveTextContent(trap);
    expect(screen.getByRole("region", { name: "Ajouter depuis le grimoire" }).querySelector("img")).toBeNull();
  });
});
