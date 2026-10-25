/** Vocabulaire de l'édition française (HANDOFF annexe E.7, v2.6.0) : renommage des anciens libellés d'une fiche. */
import { VOCABULARY_UPDATES } from "../rules/l5r4e";
import { normalize, sameSkill } from "./engine";
import type { Character } from "./schema";

/** Un renommage : chemin dans la fiche, ancien et nouveau libellé. */
export interface VocabularyChange {
  path: string;
  kind: "skill" | "emphasis" | "modifier";
  before: string;
  after: string;
}

const renamedSkill = (name: string): string | undefined =>
  VOCABULARY_UPDATES.skills.find(([from]) => normalize(from) === normalize(name))?.[1];

/**
 * Renommages à proposer. Une compétence n'est pas renommée si la fiche a déjà le nouveau nom (pas de doublon).
 * « Courtoisie » compétence devient Courtisan ; la spécialisation Politesse d'Étiquette devient Courtoisie.
 */
export function vocabularyChanges(c: Character): VocabularyChange[] {
  const has = (name: string) => c.skills.some((s) => normalize(s.name) === normalize(name));
  const changes: VocabularyChange[] = [];
  c.skills.forEach((s, i) => {
    const to = renamedSkill(s.name);
    if (to && !has(to)) changes.push({ path: `skills[${i}].name`, kind: "skill", before: s.name, after: to });
    for (const rule of VOCABULARY_UPDATES.emphases) {
      if (!sameSkill(s.name, rule.skill)) continue;
      s.emphases.forEach((e, j) => {
        if (normalize(e) === normalize(rule.from) && !s.emphases.some((x) => normalize(x) === normalize(rule.to))) {
          changes.push({ path: `skills[${i}].emphases[${j}]`, kind: "emphasis", before: e, after: rule.to });
        }
      });
    }
  });
  c.modifiers?.forEach((m, i) => {
    const to = m.skill && renamedSkill(m.skill);
    if (m.skill && to) changes.push({ path: `modifiers[${i}].skill`, kind: "modifier", before: m.skill, after: to });
  });
  return changes;
}

/** Fiche au vocabulaire de l'édition française. Ne modifie jamais `c`. */
export function updateVocabulary(c: Character): Character {
  const changes = vocabularyChanges(c);
  if (!changes.length) return c;
  const after = new Map(changes.map((x) => [x.path, x.after]));
  return {
    ...c,
    skills: c.skills.map((s, i) => ({
      ...s,
      name: after.get(`skills[${i}].name`) ?? s.name,
      emphases: s.emphases.map((e, j) => after.get(`skills[${i}].emphases[${j}]`) ?? e),
    })),
    ...(c.modifiers && {
      modifiers: c.modifiers.map((m, i) => {
        const skill = after.get(`modifiers[${i}].skill`);
        return skill ? { ...m, skill } : m;
      }),
    }),
  };
}
