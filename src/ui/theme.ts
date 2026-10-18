import { useEffect } from "react";
import { clanAccent } from "@carnet/core";
import type { Theme } from "./store";

export const THEME_LABELS: Record<Theme, string> = { auto: "auto", light: "clair", dark: "sombre" };
export const NEXT_THEME: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };

/** Thème forcé via `data-theme` sur <html> ; en auto, la page suit `prefers-color-scheme` (HANDOFF §6.4). */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Accent du clan dans --acc-l / --acc-d ; un clan non reconnu garde la couleur par défaut de la feuille de style. */
export function applyClan(root: HTMLElement, clan: string | undefined): void {
  const accent = clan ? clanAccent(clan) : null;
  if (accent?.id) {
    root.style.setProperty("--acc-l", accent.light);
    root.style.setProperty("--acc-d", accent.dark);
  } else {
    root.style.removeProperty("--acc-l");
    root.style.removeProperty("--acc-d");
  }
}

export function useThemeAndClan(theme: Theme, clan: string | undefined): void {
  useEffect(() => applyTheme(document.documentElement, theme), [theme]);
  useEffect(() => applyClan(document.documentElement, clan), [clan]);
}
