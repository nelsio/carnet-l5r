/** Thème et Android (annexe I.1.8) : balises theme-color (N10, N11), cache localStorage, IndexedDB fait foi. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type Storage } from "../../src/storage";
import { App } from "../../src/ui/App";
import { applyTheme, cachedTheme, THEME_BG, THEME_CACHE_KEY } from "../../src/ui/theme";
import kakita from "../fixtures/kakita-v1.json";

const root = document.documentElement;
const metas = () => [...document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => [m.content, m.getAttribute("media")]);
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

async function mount(storage: Storage = memoryStorage()) {
  await storage.library.put({ id: "kakita", character: structuredClone(kakita) as Character, mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z" });
  render(<App storage={storage} />);
  await screen.findByRole("heading", { level: 1, name: "Kakita Haruto" });
  return storage;
}

beforeEach(() => {
  root.removeAttribute("data-theme");
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
});

describe("Balises theme-color (annexe I.1.8)", () => {
  it("N11 : mode auto : deux balises avec media", async () => {
    await mount();
    expect(metas()).toEqual([[THEME_BG.light, "(prefers-color-scheme: light)"], [THEME_BG.dark, "(prefers-color-scheme: dark)"]]);
  });
  it("N10 : thème forcé : une seule balise à la valeur de --bg, cache localStorage à jour", async () => {
    await mount();
    click("Thème : auto");
    expect(metas()).toEqual([[THEME_BG.light, null]]);
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBe("light");
    click("Thème : clair");
    expect(metas()).toEqual([[THEME_BG.dark, null]]);
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBe("dark");
    click("Thème : sombre");
    expect(metas()).toHaveLength(2);
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBeNull();
  });
});

describe("Cache du thème", () => {
  it("le thème en cache s'applique avant la lecture des préférences", () => {
    localStorage.setItem(THEME_CACHE_KEY, "dark");
    expect(cachedTheme()).toBe("dark");
    render(<App storage={memoryStorage()} />);
    expect(root.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Thème : sombre" })).toBeInTheDocument();
  });
  it("valeur inconnue en cache : auto", () => {
    localStorage.setItem(THEME_CACHE_KEY, "sepia");
    expect(cachedTheme()).toBe("auto");
  });
  it("IndexedDB fait foi : un cache périmé est remplacé par la préférence enregistrée", async () => {
    const storage = memoryStorage();
    await storage.prefs.set({ theme: "light" });
    localStorage.setItem(THEME_CACHE_KEY, "dark");
    await mount(storage);
    await waitFor(() => expect(root.dataset.theme).toBe("light"));
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBe("light");
  });
  it("sans préférence enregistrée, le cache est oublié (auto)", async () => {
    localStorage.setItem(THEME_CACHE_KEY, "dark");
    await mount();
    await waitFor(() => expect(root.hasAttribute("data-theme")).toBe(false));
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBeNull();
  });
  it("stockage bloqué : le thème s'applique quand même", () => {
    const { getItem, setItem } = window.Storage.prototype;
    window.Storage.prototype.getItem = () => { throw new Error("bloqué"); };
    window.Storage.prototype.setItem = () => { throw new Error("bloqué"); };
    try {
      expect(cachedTheme()).toBe("auto");
      applyTheme(root, "dark");
      expect(root.dataset.theme).toBe("dark");
      expect(metas()).toEqual([[THEME_BG.dark, null]]);
    } finally {
      Object.assign(window.Storage.prototype, { getItem, setItem });
    }
  });
});
