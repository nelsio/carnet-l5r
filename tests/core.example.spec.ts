/** Fiche d'exemple livrée (Kakita Haruto, HANDOFF annexe E.9 S4) : réserves, ND d'armure, vocabulaire. */
import { describe, expect, it } from "vitest";
import {
  activeEffects, armorTN, buildActions, CharacterSchema, computePool, findSkill, schoolReduction,
  type Character, type CombatSub, type PoolAction, type PoolMods, type Situation,
} from "@carnet/core";
import { EXAMPLES, EXAMPLES_EN, examplesFor } from "../src/rules/example";
import { isRollable, toPoolAction } from "../src/ui/rolls";

const exampleCharacter = () => EXAMPLES[0]!.build();

const show = (c: Character, a: PoolAction, mods: PoolMods = {}) => {
  const p = computePool(c, a, mods);
  return `${p.rolled}g${p.kept}${p.bonus ? ` +${p.bonus}` : ""}`;
};

describe("Fiche d'exemple (annexe E.9 S4)", () => {
  it("L22 : ND d'armure 25, Réduction 3, Initiative 4g3 +6, Représentation : Art oratoire 5g4 (4g3 + Voix 1g1)", () => {
    const c = exampleCharacter();
    expect(c).toMatchObject({ name: "Kakita Haruto", schoolId: "kakita-bushi" });
    expect(armorTN(c, { stance: "attack" })).toBe(25);
    expect(c.armor.reduction + schoolReduction(c)).toBe(3);
    expect(show(c, { kind: "initiative" })).toBe("4g3 +6");
    const oratory: PoolAction = { kind: "skill", skill: "Représentation : Art oratoire", trait: "awareness" };
    expect(show(c, oratory)).toBe("4g3");
    expect(show(c, oratory, { modifiers: c.modifiers })).toBe("5g4");
    expect(c.techniques).toEqual([]);
  });

  it("vocabulaire E.7 déjà compris : « Courtisan » répond aux actions de Courtoisie", () => {
    const c = exampleCharacter();
    expect(findSkill(c, "Courtoisie")?.name).toBe("Courtisan");
    const persuade = buildActions(c, "court").find((a) => a.id === "persuade")!;
    expect(show(c, { kind: "skill", skill: persuade.skill ?? "", trait: "awareness" })).toBe("4g3");
    // L'action « Se produire » reprend le nom de la fiche.
    expect(buildActions(c, "court").map((a) => a.label)).toContainEqual({ key: "action.perform", detail: "Art oratoire" });
  });
});

const PLACES: [Situation, CombatSub?][] = [["investigation"], ["court"], ["movement"], ["combat", "skirmish"], ["combat", "duel"], ["magic"]];

/** Réserves de chaque compétence de la fiche et de chaque action jouable de l'Assistant, en Attaque et en Assaut. */
function pools(c: Character) {
  const skills = c.skills.map((s) => computePool(c, { kind: "skill", skill: s.name, trait: s.trait }, { modifiers: c.modifiers }));
  const actions = PLACES.flatMap(([situation, sub]) => buildActions(c, situation, sub).filter(isRollable).flatMap((a) =>
    (["attack", "fullAttack"] as const).map((stance) => computePool(c, toPoolAction(a), { stance, voidPoint: true }))));
  return [...skills, ...actions].map((p) => ({ rolled: p.rolled, kept: p.kept, bonus: p.bonus, freeRaises: p.freeRaises, explodeOn: p.explodeOn }));
}

describe("Modèles de fiche en anglais (annexe 54.3)", () => {
  it("C5 : les trois modèles anglais passent migrate() et donnent les mêmes réserves que les français", () => {
    expect(EXAMPLES_EN.map((x) => x.id)).toEqual(EXAMPLES.map((x) => x.id));
    expect(EXAMPLES_EN.map((x) => x.fileName)).toEqual(["example-bushi-l5r.json", "example-shugenja-l5r.json", "example-courtier-l5r.json"]);
    EXAMPLES_EN.forEach((x, i) => {
      const en = CharacterSchema.parse(x.build());
      const fr = EXAMPLES[i]!.build();
      expect(en.name).toBe(fr.name);
      expect(en.skills.map((s) => s.rank)).toEqual(fr.skills.map((s) => s.rank));
      expect(armorTN(en, { stance: "attack" })).toBe(armorTN(fr, { stance: "attack" }));
      expect(activeEffects(en).map((e) => e.key.replace(/^maitrise-[^-]+/, "maitrise"))).toEqual(activeEffects(fr).map((e) => e.key.replace(/^maitrise-[^-]+/, "maitrise")));
      expect(pools(en)).toEqual(pools(fr));
    });
    expect(examplesFor("en")).toBe(EXAMPLES_EN);
    expect(examplesFor("fr")).toBe(EXAMPLES);
  });
});
