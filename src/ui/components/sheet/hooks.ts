import { computePool, defaultModifiers, findSchool, type Character, type PoolAction, type RollTrait } from "@carnet/core";
import type { Locale } from "../../../i18n";
import { CATALOG_EN, catalogText } from "../../../i18n/catalog";
import { poolLabel } from "../../rolls";
import { useCharacter, useStore, type BlockId } from "../../store";

export type Setter = (path: (string | number)[], value: unknown) => void;

export function useSheet(block?: BlockId) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const set: Setter = (path, value) => dispatch({ type: "set", path, value });
  return { c, edit: !!block && state.mode === "edit" && state.ui.editing.has(block), dispatch, set };
}

/** Réserve affichée sur la fiche : bonus et techniques d'office, posture Attaque (annexe C.4). */
export const poolOf = (c: Character, action: PoolAction) => computePool(c, action, { modifiers: defaultModifiers(c, action) });

export const pool = (c: Character, trait: RollTrait, skill: string, locale: Locale) => poolLabel(poolOf(c, { kind: "skill", skill, trait }), locale);

/**
 * Choix des techniques d'école : remplit aussi « École (nom affiché) » avec le nom du catalogue, modifiable ensuite ;
 * « — Aucune » garde le nom saisi (annexe E.19 S9). Le nom est écrit dans la langue de l'interface (annexe 54.2).
 */
export function chooseSchool(set: Setter, id: string, locale: Locale) {
  set(["schoolId"], id);
  const school = findSchool(id);
  if (school) set(["school"], catalogText(school.name, CATALOG_EN.schools[school.id]?.name, locale));
}
