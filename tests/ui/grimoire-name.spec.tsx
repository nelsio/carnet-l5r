/**
 * Lot 31, v2.23.0 (HANDOFF annexe N.8) : autocomplétion du champ Nom d'un sort, cas GR23 à GR30 et GR32.
 * GR25 dans le build et GR31 (mobile) : tests/e2e/grimoire.spec.ts.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { migrate, type Character, type Spell } from "@carnet/core";
import { loadGrimoire, memoryStorage, type Storage } from "../../src/storage";
import { PORTAL } from "../../src/rules/portal";
import { App } from "../../src/ui/App";
import tamori from "../../reference/exemple-shugenja.json";
import { fixtureFetch } from "../helpers/grimoire";

const now = () => new Date("2026-10-28T12:00:00.000Z");

/** Tamori, avec sa Frappe de jade modifiée (portée « 30 m », zone et augmentations vides : GR26 et GR27). */
function shugenja(patch: Partial<Spell> = {}): Character {
  const c = migrate(structuredClone(tamori));
  c.spells = c.spells!.map((s) => (s.id === "frappe-de-jade" ? { ...s, range: "30 m", area: "", raises: "", ...patch } : s));
  return c;
}

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
const spellGroups = () => magic().getAllByRole("group", { name: /^Sort : / });
const jadeGroup = () => screen.getByTestId("block-magic").querySelector<HTMLElement>('[data-spell="frappe-de-jade"]')!;
const nameBox = (group: HTMLElement) => within(group).getByRole("combobox", { name: "Nom" }) as HTMLInputElement;
const text = (group: HTMLElement, name: string) => within(group).getByRole("textbox", { name }) as HTMLInputElement;
const suggestions = (group: HTMLElement) => {
  const list = within(group).queryByRole("listbox", { name: "Sorts du grimoire" });
  return list ? within(list).queryAllByRole("option") : [];
};
const confirmBox = (group: HTMLElement) => within(group).getByRole("alertdialog", { name: "Remplacer les valeurs saisies ?" });

afterEach(() => vi.unstubAllGlobals());

describe("GR23 : grimoire non chargé", () => {
  it("ligne « charger le grimoire » ; le clic charge sans ouvrir le panneau ; puis le champ devient un combobox", async () => {
    const spy = vi.fn(fixtureFetch());
    vi.stubGlobal("fetch", spy);
    await renderApp();
    editMagic();
    const group = jadeGroup();
    expect(within(group).queryByRole("combobox", { name: "Nom" })).toBeNull();
    expect(text(group, "Nom").value).toBe("Frappe de jade");
    const hint = within(group).getByTestId("grimoire-name-hint");
    expect(hint).toHaveTextContent("Autocomplétion depuis le grimoire : charger le grimoire");
    expect(spy).not.toHaveBeenCalled();

    fireEvent.click(within(hint).getByRole("button", { name: "charger le grimoire" }));
    expect(within(jadeGroup()).getByTestId("grimoire-name-hint")).toHaveTextContent(/^Chargement…$/);
    const box = await within(jadeGroup()).findByRole("combobox", { name: "Nom" });
    expect(spy).toHaveBeenCalledTimes(6);
    expect(screen.queryByRole("region", { name: "Ajouter depuis le grimoire" })).toBeNull();
    expect(within(jadeGroup()).queryByTestId("grimoire-name-hint")).toBeNull();
    expect(box).toHaveAttribute("aria-autocomplete", "list");
    expect(box).toHaveAttribute("aria-expanded", "false");
  });

  it("grimoire injoignable : « réessayer »", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await renderApp();
    editMagic();
    fireEvent.click(within(jadeGroup()).getByRole("button", { name: "charger le grimoire" }));
    expect(await within(jadeGroup()).findByRole("button", { name: "réessayer" })).toBeInTheDocument();
  });
});

describe("GR24 : à partir de 2 caractères", () => {
  it("rien à 1 caractère ; 8 suggestions au plus à 2 caractères, aria-expanded vrai", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(magic().getByRole("button", { name: "+ Sort" }));
    const group = spellGroups().at(-1)!;
    const box = nameBox(group);
    expect(box).toHaveAttribute("placeholder", "Tape pour chercher dans le grimoire");
    fireEvent.change(box, { target: { value: "f" } });
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(within(group).getByRole("listbox", { hidden: true })).not.toBeVisible();
    fireEvent.change(box, { target: { value: "fr" } });
    expect(box).toHaveAttribute("aria-expanded", "true");
    const opts = suggestions(group);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.length).toBeLessThanOrEqual(8);
    expect(opts[0]).toHaveTextContent(/^Frappe de Jade Jade StrikeTerre · Maîtrise 1 · ND 10 · Jade, Tonnerre$/);
    expect(box).toHaveAttribute("aria-activedescendant", opts[0]!.id);
    expect(within(group).getByText("Entrée ou clic : remplit le sort (sauf effet et mémorisé)")).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "e" } });
    expect(box).toHaveAttribute("aria-expanded", "false");
  });
});

describe("GR25 : nouveau sort", () => {
  it("« + Sort », taper « armu », Entrée : sort rempli sans confirmation", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(magic().getByRole("button", { name: "+ Sort" }));
    const box = nameBox(spellGroups().at(-1)!);
    fireEvent.change(box, { target: { value: "armu" } });
    fireEvent.keyDown(box, { key: "Enter" });
    const group = spellGroups().at(-1)!;
    expect(within(group).queryByRole("alertdialog")).toBeNull();
    expect(group).toHaveAttribute("aria-label", "Sort : Armure de Terre");
    expect(text(group, "Portée").value).toBe("Personnelle");
    expect(text(group, "Zone d'effet").value).toBe("Le lanceur");
    expect(text(group, "Durée").value).toBe("10 Rounds");
    expect(within(group).getByRole("button", { name: "Bataille" })).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("textbox", { name: "Effet (résumé)" })).toHaveValue("");
    expect(within(group).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    expect(group).toHaveClass("fresh");
    expect(nameBox(group)).toHaveAttribute("aria-expanded", "false");
  });
});

describe("GR26 et GR27 : confirmation avant de remplacer", () => {
  async function pickJade() {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    // ↓ sur un nom déjà saisi ouvre la liste sans retaper.
    fireEvent.keyDown(nameBox(jadeGroup()), { key: "ArrowDown" });
    expect(nameBox(jadeGroup())).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(suggestions(jadeGroup())[0]!);
    return jadeGroup();
  }

  const untouched = (group: HTMLElement) => {
    expect(within(group).getByRole("textbox", { name: "Effet (résumé)" })).toHaveValue("Projectile de jade contre une créature souillée. Valeurs à vérifier dans ton livre.");
    expect(within(group).getByRole("checkbox", { name: /Mémorisé/ })).toBeChecked();
  };

  it("GR26 : la confirmation liste la portée (le grimoire n'a pas de VD pour ce sort)", async () => {
    const group = await pickJade();
    const dialog = confirmBox(group);
    expect(dialog).toHaveTextContent("« Frappe de Jade » : des valeurs déjà saisies seraient remplacées.");
    const lines = within(dialog).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual(["Portée : « 30 m » → « 30 mètres (100') »", "Mots-clés : « Jade » → « Jade, Tonnerre »"]);
    expect(within(dialog).getByRole("button", { name: "Remplacer" })).toHaveFocus();
    expect(text(group, "Portée").value).toBe("30 m");
  });

  it("GR26 : augmentations affichées sur une ligne avec « · », mots-clés, VD si le grimoire en fournit", async () => {
    await renderApp({ character: shugenja({ raises: "Portée (+10 pieds)\nCibles (+1)" }), storage: await cachedStorage() });
    editMagic();
    const box = nameBox(jadeGroup());
    fireEvent.change(box, { target: { value: "frappe de j" } });
    fireEvent.keyDown(box, { key: "Enter" });
    const lines = within(confirmBox(jadeGroup())).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual([
      "Portée : « 30 m » → « 30 mètres (100') »",
      "Augmentations : « Portée (+10 pieds) · Cibles (+1) » → « Dégâts (+1g0) · Portée (+3 m / +10') · Cibles (+1 cible, max 5 cibles au total) »",
      "Mots-clés : « Jade » → « Jade, Tonnerre »",
    ]);
  });

  it("GR27 : « Remplacer » remplace la portée ; effet et mémorisé intacts", async () => {
    const group = await pickJade();
    fireEvent.click(within(confirmBox(group)).getByRole("button", { name: "Remplacer" }));
    const after = magic().getByRole("group", { name: "Sort : Frappe de Jade" });
    expect(within(after).queryByRole("alertdialog")).toBeNull();
    expect(text(after, "Portée").value).toBe("30 mètres (100')");
    expect(text(after, "Zone d'effet").value).toBe("Une cible");
    expect(within(after).getByRole("textbox", { name: "Augmentations (une par ligne)" })).toHaveValue("Dégâts (+1g0)\nPortée (+3 m / +10')\nCibles (+1 cible, max 5 cibles au total)");
    expect(within(after).getByRole("button", { name: "Tonnerre" })).toHaveAttribute("aria-pressed", "true");
    expect(within(after).getByText("✓ Rempli depuis le grimoire")).toBeInTheDocument();
    untouched(after);
    expect(nameBox(after)).toHaveFocus();
  });

  it("GR27 : « Compléter les vides » garde la portée, remplit zone et augmentations", async () => {
    const group = await pickJade();
    fireEvent.click(within(confirmBox(group)).getByRole("button", { name: "Compléter les vides" }));
    const after = magic().getByRole("group", { name: "Sort : Frappe de Jade" });
    expect(text(after, "Portée").value).toBe("30 m");
    expect(text(after, "Zone d'effet").value).toBe("Une cible");
    expect(within(after).getByRole("textbox", { name: "Augmentations (une par ligne)" })).toHaveValue("Dégâts (+1g0)\nPortée (+3 m / +10')\nCibles (+1 cible, max 5 cibles au total)");
    expect(within(after).getByRole("textbox", { name: "VD (dégâts)" })).toHaveValue("2g2");
    untouched(after);
  });

  it("GR27 : « Annuler » (ou Échap) ne change rien, nom compris", async () => {
    const group = await pickJade();
    fireEvent.click(within(confirmBox(group)).getByRole("button", { name: "Annuler" }));
    const after = jadeGroup();
    expect(within(after).queryByRole("alertdialog")).toBeNull();
    expect(nameBox(after).value).toBe("Frappe de jade");
    expect(text(after, "Portée").value).toBe("30 m");
    expect(text(after, "Zone d'effet").value).toBe("");
    expect(within(after).queryByText("✓ Rempli depuis le grimoire")).toBeNull();
    untouched(after);

    fireEvent.keyDown(nameBox(after), { key: "ArrowDown" });
    fireEvent.click(suggestions(after)[0]!);
    fireEvent.keyDown(within(confirmBox(after)).getByRole("button", { name: "Remplacer" }), { key: "Escape" });
    expect(within(jadeGroup()).queryByRole("alertdialog")).toBeNull();
    expect(text(jadeGroup(), "Portée").value).toBe("30 m");
  });

  it("sortir du mode édition ferme la confirmation", async () => {
    await pickJade();
    fireEvent.click(screen.getByRole("button", { name: "Terminer : Rouleaux & invocations" }));
    editMagic();
    expect(magic().queryByRole("alertdialog")).toBeNull();
  });
});

describe("GR28 : clavier et focus", () => {
  it("↑ ↓ déplacent l'option active, Entrée choisit, Échap ferme, perte du focus ferme", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(magic().getByRole("button", { name: "+ Sort" }));
    const box = nameBox(spellGroups().at(-1)!);
    fireEvent.change(box, { target: { value: "de" } });
    const opts = () => suggestions(spellGroups().at(-1)!);
    expect(opts()).toHaveLength(8);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box).toHaveAttribute("aria-activedescendant", opts()[2]!.id);
    expect(opts()[2]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(box, { key: "ArrowUp" });
    expect(box).toHaveAttribute("aria-activedescendant", opts()[1]!.id);

    fireEvent.keyDown(box, { key: "Escape" });
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(box).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box).toHaveAttribute("aria-expanded", "true");

    fireEvent.blur(box);
    expect(box).toHaveAttribute("aria-expanded", "false");

    fireEvent.change(box, { target: { value: "de" } });
    fireEvent.keyDown(box, { key: "ArrowDown" });
    const chosen = opts()[1]!.querySelector(".n")!.firstChild!.textContent!;
    fireEvent.keyDown(box, { key: "Enter" });
    expect(spellGroups().at(-1)).toHaveAttribute("aria-label", `Sort : ${chosen}`);
  });

  it("Entrée sans liste ouverte ne choisit rien", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    fireEvent.click(magic().getByRole("button", { name: "+ Sort" }));
    const box = nameBox(spellGroups().at(-1)!);
    fireEvent.change(box, { target: { value: "a" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.value).toBe("a");
  });
});

describe("GR29 : nom libre", () => {
  it("absent du grimoire : accepté, aucune suggestion, aucune confirmation", async () => {
    await renderApp({ storage: await cachedStorage() });
    editMagic();
    const box = nameBox(jadeGroup());
    fireEvent.change(box, { target: { value: "Souffle du dragon de brume" } });
    fireEvent.keyDown(box, { key: "Enter" });
    const group = magic().getByRole("group", { name: "Sort : Souffle du dragon de brume" });
    expect(suggestions(group)).toHaveLength(0);
    expect(nameBox(group)).toHaveAttribute("aria-expanded", "false");
    expect(within(group).queryByRole("alertdialog")).toBeNull();
    expect(text(group, "Portée").value).toBe("30 m");
  });
});

describe("GR30 : lien du sort", () => {
  it("après remplissage, le lien suit le nouveau nom et le nouvel élément", async () => {
    await renderApp({ character: shugenja({ element: "fire", range: "", keywords: [] }), storage: await cachedStorage() });
    editMagic();
    const box = nameBox(jadeGroup());
    fireEvent.change(box, { target: { value: "frappe de ja" } });
    fireEvent.keyDown(box, { key: "Enter" });
    const group = magic().getByRole("group", { name: "Sort : Frappe de Jade" });
    expect(within(group).queryByRole("alertdialog")).toBeNull();
    expect(within(group).getByRole("combobox", { name: "Élément" })).toHaveValue("earth");
    expect(within(group).getByRole("link", { name: "Frappe de Jade dans le grimoire (nouvel onglet)" }))
      .toHaveAttribute("href", `${PORTAL.grimoire}?q=Frappe%20de%20Jade&el=terre`);
  });
});

describe("GR32 : consultation", () => {
  it("champ Nom non éditable, pas d'autocomplétion", async () => {
    await renderApp({ mode: "readonly", storage: await cachedStorage() });
    expect(screen.queryByRole("button", { name: "Edit : Rouleaux & invocations" })).toBeNull();
    expect(magic().queryByRole("combobox", { name: "Nom" })).toBeNull();
    expect(magic().queryByRole("textbox")).toBeNull();
    expect(magic().queryByRole("listbox")).toBeNull();
    expect(magic().queryByTestId("grimoire-name-hint")).toBeNull();
  });
});
