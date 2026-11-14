import { fireEvent, screen, within } from "@testing-library/react";
import type { VoidChoice } from "../../src/ui/store";

/** Ouvre le panneau « Dépenser du Vide » s'il est replié (annexe 61.4) ; `name` : nom du chevron, « Void spending » en anglais. */
export function openVoidPanel(group = "Dépenser du Vide", name = "Dépenses de Vide") {
  const panel = screen.getByRole("group", { name: group });
  const fold = within(panel).getByRole("button", { name });
  if (fold.getAttribute("aria-expanded") === "false") fireEvent.click(fold);
  return panel;
}

/** Panneau « Dépenser du Vide » de l'Assistant L5R (annexe J.6), ouvert au besoin. */
export const voidPanel = () => within(openVoidPanel());

/** Choisit une option du menu (sans rien dépenser). */
export function chooseVoid(choice: VoidChoice) {
  fireEvent.change(voidPanel().getByRole("combobox", { name: "Dépense de Vide" }), { target: { value: choice } });
}

/** Choisit une option puis appuie sur son bouton (« Dépenser 1 point de Vide » ou « Annuler »). */
export function spendVoid(choice: VoidChoice) {
  chooseVoid(choice);
  fireEvent.click(voidPanel().getByRole("button", { name: /^(Dépenser 1 point de Vide|Annuler)$/ }));
}
