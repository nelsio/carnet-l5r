import { useEffect } from "react";
import { clanAccent } from "@carnet/core";
import type { Theme } from "./store";

export const THEME_LABELS: Record<Theme, string> = { auto: "auto", light: "clair", dark: "sombre" };
export const NEXT_THEME: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };

/** Valeur de `--bg` de chaque thème, reprise par la barre de Chrome sur Android (annexe I.1.8). */
export const THEME_BG = { light: "#ece6d8", dark: "#26252a" } as const;
/** Cache du thème forcé, lu par le script de `index.html` avant le premier rendu ; IndexedDB fait foi. */
export const THEME_CACHE_KEY = "carnet-theme";

/** Thème mis en cache dans `localStorage` (« auto » si absent ou illisible). */
export function cachedTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_CACHE_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

/** Thème forcé via `data-theme` sur <html> ; en auto, la page suit `prefers-color-scheme` (annexe I.1). */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "auto") localStorage.removeItem(THEME_CACHE_KEY);
    else localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // Stockage bloqué : seul le flash au chargement revient.
  }
  applyThemeColor(root.ownerDocument, theme);
}

/** Thème forcé : une seule balise `theme-color` ; auto : une par schéma, avec `media` (annexe I.1.8). */
function applyThemeColor(doc: Document, theme: Theme): void {
  doc.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const metas: [string, string | null][] = theme === "auto"
    ? [[THEME_BG.light, "(prefers-color-scheme: light)"], [THEME_BG.dark, "(prefers-color-scheme: dark)"]]
    : [[THEME_BG[theme], null]];
  for (const [color, media] of metas) {
    const m = doc.createElement("meta");
    m.name = "theme-color";
    m.content = color;
    if (media) m.setAttribute("media", media);
    doc.head.append(m);
  }
}

/** Accent du clan dans --clan-l, --clan-ink-l, --clan-d, --clan-ink-d ; un clan non reconnu garde les valeurs par défaut de la feuille de style. */
export function applyClan(root: HTMLElement, clan: string | undefined): void {
  const accent = clan ? clanAccent(clan) : null;
  for (const [field, name] of CLAN_VARS) {
    if (accent?.id) root.style.setProperty(name, accent[field]);
    else root.style.removeProperty(name);
  }
}

const CLAN_VARS = [["light", "--clan-l"], ["inkLight", "--clan-ink-l"], ["dark", "--clan-d"], ["inkDark", "--clan-ink-d"]] as const;

export function useThemeAndClan(theme: Theme, clan: string | undefined): void {
  useEffect(() => applyTheme(document.documentElement, theme), [theme]);
  useEffect(() => applyClan(document.documentElement, clan), [clan]);
}
