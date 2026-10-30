import { fireEvent, screen } from "@testing-library/react";
import { STANCES } from "../../src/rules/l5r4e";

/** Sélecteur « Posture » du panneau Combat (annexe I.3.4). */
export const stanceSelect = () => screen.getByRole<HTMLSelectElement>("combobox", { name: "Posture" });

/** Option de la posture affichée sous ce nom (« Assaut »). */
export function stanceOption(label: string): HTMLOptionElement {
  const id = STANCES.find((s) => s.label === label)?.id;
  const option = stanceSelect().querySelector<HTMLOptionElement>(`option[value="${id}"]`);
  if (!option) throw new Error(`posture introuvable : ${label}`);
  return option;
}

/** Choisit une posture par son nom, comme dans la liste. */
export function chooseStance(label: string) {
  fireEvent.change(stanceSelect(), { target: { value: stanceOption(label).value } });
}

/** Nom de la posture choisie. */
export const currentStance = () => STANCES.find((s) => s.id === stanceSelect().value)?.label;
