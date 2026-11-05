import { buildActions, type ActionDef, type Character } from "@carnet/core";
import type { UiState } from "./types";

/** Actions de la situation courante de l'Assistant L5R. */
export function currentActions(c: Character, ui: Pick<UiState, "situation" | "sub">): ActionDef[] {
  return buildActions(c, ui.situation, ui.situation === "combat" ? ui.sub : undefined);
}

export function selectedAction(c: Character, ui: UiState): ActionDef | undefined {
  return currentActions(c, ui).find((a) => a.id === ui.selectedId);
}
