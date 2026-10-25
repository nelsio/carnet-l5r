/** Tuile « Blessures » de la barre d'état (annexe E.19 S14) : −, + et champ sont dans son panneau. */
import type { Locator, Page } from "@playwright/test";

export const woundsTile = (page: Page): Locator => page.getByRole("button", { name: "Blessures : ajuster ou encaisser des dégâts" });

/** Ouvre le panneau Blessures s'il est fermé. */
export async function openWounds(page: Page): Promise<void> {
  const tile = woundsTile(page);
  if ((await tile.getAttribute("aria-expanded")) !== "true") await tile.click();
}

/** Bouton −, + du panneau, ouvert au besoin. */
export async function woundsButton(page: Page, name: "Ajouter 1 blessure" | "Retirer 1 blessure"): Promise<Locator> {
  await openWounds(page);
  return page.getByRole("button", { name });
}
