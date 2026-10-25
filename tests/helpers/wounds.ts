import { fireEvent, screen } from "@testing-library/react";

/** Nom accessible de la tuile « Blessures » de la barre d'état (annexe E.19 S14). */
export const WOUNDS_TILE = "Blessures : ajuster ou encaisser des dégâts";

/** Ouvre le panneau Blessures (Ajuster, Dégâts de l'attaque) s'il est fermé. */
export function openWounds() {
  const tile = screen.getByRole("button", { name: WOUNDS_TILE });
  if (tile.getAttribute("aria-expanded") !== "true") fireEvent.click(tile);
}

/** Bouton −, + du panneau Blessures, ouvert au besoin. */
export function clickWounds(name: "Ajouter 1 blessure" | "Retirer 1 blessure") {
  openWounds();
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Champ « Blessures subies » du panneau Blessures, ouvert au besoin. */
export function woundsField(): HTMLElement {
  openWounds();
  return screen.getByRole("spinbutton", { name: "Blessures subies" });
}
