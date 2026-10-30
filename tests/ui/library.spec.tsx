/** Bibliothèque, sauvegarde automatique et mode consultation (HANDOFF §5.1, §6.1, U1). */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { clickWounds } from "../helpers/wounds";
import { spendVoid } from "../helpers/void";

const base = () => structuredClone(kakita) as Character;
const entry = (id: string, patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id, character: base(), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z", ...patch,
});
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
/** Le bouton « Lancer » n'apparaît qu'avec le lanceur de dés affiché (masqué par défaut). */
let ids = 0;
const newId = () => `id-${++ids}`;

async function mount(storage: Storage, rng = () => 5) {
  const view = render(<App storage={storage} rng={rng} newId={newId} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
  return view;
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

describe("Démarrage", () => {
  it("sans fiche : la Bibliothèque vide invite à créer un personnage", async () => {
    await mount(memoryStorage());
    expect(screen.getByRole("heading", { name: "Aucun personnage dans ce carnet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bibliothèque/i })).toBeNull();
  });

  it("rouvre la dernière fiche ouverte", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a", { character: { ...base(), name: "Akodo Toshi" } }));
    await s.library.put(entry("b", { updatedAt: "2026-10-19T10:00:00.000Z" }));
    await s.prefs.set({ lastOpenedId: "a" });
    await mount(s);
    expect(screen.getByRole("heading", { level: 1, name: "Akodo Toshi" })).toBeInTheDocument();
  });

  it("sinon la plus récente", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a", { character: { ...base(), name: "Ancienne" } }));
    await s.library.put(entry("b", { character: { ...base(), name: "Récente" }, updatedAt: "2026-10-19T10:00:00.000Z" }));
    await mount(s);
    expect(screen.getByRole("heading", { level: 1, name: "Récente" })).toBeInTheDocument();
  });

  it("mode dégradé : bannière permanente", async () => {
    await mount(memoryStorage(true));
    expect(screen.getByRole("alert")).toHaveTextContent("Sauvegarde impossible dans ce navigateur : exporte ta fiche avant de fermer.");
  });
});

describe("Sauvegarde automatique", () => {
  it("enregistre 500 ms après la dernière modification, et la fiche survit à un rechargement", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    const { unmount } = await mount(s);
    click("Edit : Identité & réputation");
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: "Kakita Haruto II" } });
    expect((await s.library.get("a"))?.character.name).toBe("Kakita Haruto");
    expect(await screen.findByText(/Enregistré dans ce navigateur/, {}, { timeout: 1500 })).toBeInTheDocument();
    expect((await s.library.get("a"))?.character.name).toBe("Kakita Haruto II");
    unmount();
    await mount(s);
    expect(screen.getByRole("heading", { level: 1, name: "Kakita Haruto II" })).toBeInTheDocument();
  });

  it("les blessures et le Vide dépensé sont enregistrés", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    await mount(s);
    clickWounds("Ajouter 1 blessure");
    click("Point de Vide 2");
    await waitFor(async () => expect((await s.library.get("a"))?.character).toMatchObject({ wounds: 1, voidPoints: 1 }), { timeout: 1500 });
  });

  it("un échec d'écriture est signalé", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    s.library.put = () => Promise.reject(new Error("quota"));
    const err = console.error;
    console.error = () => {};
    await mount(s);
    clickWounds("Ajouter 1 blessure");
    expect(await screen.findByText(/Échec de l'enregistrement/, {}, { timeout: 1500 })).toBeInTheDocument();
    console.error = err;
  });

  it("le thème choisi est mémorisé", async () => {
    const s = memoryStorage();
    const { unmount } = await mount(s);
    click("Thème : auto");
    await waitFor(async () => expect((await s.prefs.get()).theme).toBe("light"));
    unmount();
    document.documentElement.removeAttribute("data-theme");
    await mount(s);
    expect(screen.getByRole("button", { name: "Thème : clair" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("Écran Bibliothèque", () => {
  async function withTwo() {
    const s = memoryStorage();
    await s.library.put(entry("a", { character: { ...base(), name: "Kakita Haruto", clan: "Grue" } }));
    await s.library.put(entry("b", { character: { ...base(), name: "Bayushi Kaede", clan: "Scorpion", school: "École Bayushi" }, mode: "readonly", updatedAt: "2026-10-19T10:00:00.000Z" }));
    await s.prefs.set({ lastOpenedId: "a" });
    await mount(s);
    click("Carnet de Rokugan — ouvrir la bibliothèque");
    await screen.findByRole("heading", { name: "Bibliothèque" });
    return s;
  }
  const rows = () => within(screen.getByRole("list", { name: "Fiches" })).getAllByRole("listitem");

  it("liste les fiches : nom, clan, école, date, badge Consultation, la plus récente en tête", async () => {
    await withTwo();
    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent("Bayushi Kaede");
    expect(rows()[0]).toHaveTextContent("Scorpion · École Bayushi");
    expect(within(rows()[0]!).getByText("Consultation")).toBeInTheDocument();
    expect(within(rows()[1]!).queryByText("Consultation")).toBeNull();
    expect(rows()[0]!.querySelector("time")).toHaveAttribute("dateTime", "2026-10-19T10:00:00.000Z");
    expect((rows()[0]!.querySelector(".dot") as HTMLElement).style.getPropertyValue("--dot-l")).toBe("#a82828");
  });

  it("ouvre une fiche", async () => {
    await withTwo();
    click("Ouvrir Bayushi Kaede");
    expect(await screen.findByRole("heading", { level: 1, name: /Bayushi Kaede/ })).toBeInTheDocument();
  });

  it("supprime avec une confirmation intégrée à la page", async () => {
    const s = await withTwo();
    click("Supprimer Kakita Haruto");
    expect(screen.getByText("Supprimer « Kakita Haruto » ?")).toBeInTheDocument();
    click("Annuler");
    expect(rows()).toHaveLength(2);
    click("Supprimer Kakita Haruto");
    click("Supprimer définitivement");
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(await s.library.get("a")).toBeUndefined();
  });

  it("nouvelle fiche : créée, enregistrée et ouverte en modification", async () => {
    const s = await withTwo();
    click("Nouvelle fiche");
    expect(await screen.findByRole("heading", { level: 1, name: "Nouveau samouraï" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminer : Identité & réputation" })).toBeInTheDocument();
    expect(await s.library.list()).toHaveLength(3);
  });

  it("supprimer la fiche ouverte depuis la Fiche ramène à la Bibliothèque", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    await mount(s);
    click("Edit : Identité & réputation");
    click("Supprimer ce personnage…");
    click("Supprimer définitivement");
    expect(await screen.findByRole("heading", { name: "Aucun personnage dans ce carnet" })).toBeInTheDocument();
    expect(await s.library.list()).toEqual([]);
  });
});

describe("Fiche en consultation", () => {
  async function readonly() {
    const s = memoryStorage();
    await s.library.put(entry("ro", { mode: "readonly" }));
    const view = await mount(s, () => 9);
    return { s, ...view };
  }

  it("U1 : aucun champ modifiable, pas de bouton « Modifier », pastilles inactives", async () => {
    const { container } = await readonly();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(container.querySelectorAll("input, textarea, select")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /blessure/ })).toBeNull();
    for (const pip of screen.getAllByRole("button", { name: /Point de Vide/ })) expect(pip).toBeDisabled();
  });

  it("le lanceur reste utilisable mais ne dépense rien", async () => {
    const { s } = await readonly();
    click("Aide de jeu");
    click(/^Remarquer un détail/);
    fireEvent.click(screen.getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+1g1\)/ }));
    click("Lancer 4g3");
    expect(screen.getByLabelText("Dés")).toBeInTheDocument();
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    click("Combat");
    spendVoid("armor");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("30");
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    await act(() => new Promise((r) => setTimeout(r, 600)));
    expect((await s.library.get("ro"))?.character.voidPoints).toBe(2);
  });

  it("« Rendre modifiable » crée une copie modifiable et l'ouvre", async () => {
    const { s } = await readonly();
    click("Rendre modifiable");
    await waitFor(() => expect(screen.queryByText("Consultation")).toBeNull());
    expect(screen.getByRole("button", { name: "Edit : Compétences" })).toBeInTheDocument();
    const list = await s.library.list();
    expect(list.map((e) => e.mode).sort()).toEqual(["edit", "readonly"]);
    expect(list.find((e) => e.mode === "edit")?.character).toEqual(base());
  });
});

describe("Onglet masqué", () => {
  it("la modification en attente est enregistrée sans attendre les 500 ms", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    await mount(s);
    clickWounds("Ajouter 1 blessure");
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(async () => expect((await s.library.get("a"))?.character.wounds).toBe(1), { timeout: 200 });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    fireEvent(document, new Event("visibilitychange"));
  });

  it("de même quand la page est quittée", async () => {
    const s = memoryStorage();
    await s.library.put(entry("a"));
    await mount(s);
    clickWounds("Ajouter 1 blessure");
    fireEvent(window, new Event("pagehide"));
    await waitFor(async () => expect((await s.library.get("a"))?.character.wounds).toBe(1), { timeout: 200 });
  });
});
