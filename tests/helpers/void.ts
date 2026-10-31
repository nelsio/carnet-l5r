import { fireEvent, screen, within } from "@testing-library/react";
import type { VoidChoice } from "../../src/ui/store";

/** Panneau « Dépenser du Vide » de l'Assistant L5R (annexe J.6). */
export const voidPanel = () => within(screen.getByRole("group", { name: "Dépenser du Vide" }));

/** Choisit une option du menu (sans rien dépenser). */
export function chooseVoid(choice: VoidChoice) {
  fireEvent.change(voidPanel().getByRole("combobox", { name: "Dépense de Vide" }), { target: { value: choice } });
}

/** Choisit une option puis appuie sur son bouton (« Dépenser 1 point de Vide » ou « Annuler »). */
export function spendVoid(choice: VoidChoice) {
  chooseVoid(choice);
  fireEvent.click(voidPanel().getByRole("button", { name: /^(Dépenser 1 point de Vide|Annuler)$/ }));
}
