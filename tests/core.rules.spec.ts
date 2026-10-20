/**
 * Spécification exécutable du moteur de règles L5R 4e (packages/core).
 * Contrat : implémenter @carnet/core jusqu'à ce que ce fichier passe.
 * Ne pas modifier les valeurs attendues : signaler un désaccord dans HANDOFF §11.
 */
import { describe, it, expect } from "vitest";
import {
  rings, findSkill, parseDR, applyTenDiceRule, computePool, rollDice,
  woundState, armorTN, targetNumber, maneuverRaises, raiseCapExceeded,
  mergeCharacter, migrate, movement, poolStats, DEFAULT_MANEUVERS, type Character,
} from "@carnet/core";
import kakita from "../reference/exemple-personnage.json";

const base = () => structuredClone(kakita) as Character;

/** RNG déterministe : renvoie les valeurs dans l'ordre, échoue si on en demande trop. */
function seq(values: number[]) {
  const q = [...values];
  const rng = () => {
    if (!q.length) throw new Error("RNG épuisé : trop de dés tirés");
    return q.shift()!;
  };
  return Object.assign(rng, { remaining: () => q.length });
}

const sword = { name: "Katana", skill: "Kenjutsu", dr: "3k2" };
const bow = { name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3 };

describe("Anneaux et compétences", () => {
  it("calcule les Anneaux (minimum des deux Traits, Vide à part)", () => {
    expect(rings(base())).toEqual({ earth: 2, water: 2, fire: 2, air: 3, void: 2 });
  });
  it("trouve une compétence sans tenir compte de la casse, des accents ni des espaces", () => {
    expect(findSkill(base(), "kenjutsu")?.name).toBe("Kenjutsu");
    expect(findSkill(base(), "  DEFENSE ")?.name).toBe("Défense");
    expect(findSkill(base(), "Jiujutsu")).toBeUndefined();
  });
  it("lit la valeur de dégâts en notation k ou g", () => {
    expect(parseDR("3k2")).toEqual({ rolled: 3, kept: 2 });
    expect(parseDR("3g2")).toEqual({ rolled: 3, kept: 2 });
    expect(parseDR("abc")).toEqual({ rolled: 0, kept: 0 });
  });
});

describe("Règle des dix dés (livre de base 4e, « Special Dice Rules »)", () => {
  it.each([
    [12, 4, { rolled: 10, kept: 5, bonus: 0 }],    // 2 dés lancés en trop → 1 dé gardé
    [13, 9, { rolled: 10, kept: 10, bonus: 2 }],   // 2 lancés → 1 gardé ; le dé impair restant → +2
    [10, 12, { rolled: 10, kept: 10, bonus: 4 }],  // chaque gardé au-delà de 10 → +2
    [14, 12, { rolled: 10, kept: 10, bonus: 12 }], // les deux dépassent : 4 lancés × 2 + 2 gardés × 2
  ])("exemple du livre : %ik%i", (r, k, expected) => {
    expect(applyTenDiceRule(r, k)).toEqual(expected);
  });
  it.each([
    [5, 3, { rolled: 5, kept: 3, bonus: 0 }],
    [10, 10, { rolled: 10, kept: 10, bonus: 0 }],
    [12, 5, { rolled: 10, kept: 6, bonus: 0 }],
    [11, 4, { rolled: 10, kept: 4, bonus: 0 }],    // dé impair restant perdu tant que les gardés n'atteignent pas 10
    [11, 10, { rolled: 10, kept: 10, bonus: 2 }],
    [14, 9, { rolled: 10, kept: 10, bonus: 4 }],   // 2 lancés → 10e gardé, les 2 restants → +4
    [16, 9, { rolled: 10, kept: 10, bonus: 8 }],
    [3, 5, { rolled: 3, kept: 3, bonus: 0 }],
  ])("%ik%i", (r, k, expected) => {
    expect(applyTenDiceRule(r, k)).toEqual(expected);
  });
});

describe("Réserves de dés (computePool)", () => {
  const atk = { kind: "skill", skill: "Kenjutsu", trait: "agility", attack: true } as const;

  it("attaque Kenjutsu : 5g3, explose, augmentations permises", () => {
    expect(computePool(base(), atk, {})).toMatchObject({ rolled: 5, kept: 3, bonus: 0, explodes: true, canRaise: true });
  });
  it("posture Attaque totale : +2g1 sur une attaque", () => {
    expect(computePool(base(), atk, { stance: "fullAttack" })).toMatchObject({ rolled: 7, kept: 4 });
  });
  it("posture Attaque totale sans effet hors attaque", () => {
    const notice = { kind: "skill", skill: "Investigation", trait: "perception" } as const;
    expect(computePool(base(), notice, { stance: "fullAttack" })).toMatchObject({ rolled: 3, kept: 2 });
  });
  it("point de Vide : +1g1, cumulable avec Attaque totale", () => {
    expect(computePool(base(), atk, { voidPoint: true })).toMatchObject({ rolled: 6, kept: 4 });
    expect(computePool(base(), atk, { voidPoint: true, stance: "fullAttack" })).toMatchObject({ rolled: 8, kept: 5 });
  });
  it("sans compétence : trait seul, pas d'explosion, pas d'augmentation", () => {
    const grapple = { kind: "skill", skill: "Jiujutsu", trait: "agility", attack: true } as const;
    expect(computePool(base(), grapple, {})).toMatchObject({ rolled: 3, kept: 3, explodes: false, canRaise: false });
  });
  it("Vide « compétence au rang 1 » : 4g3, explose, augmentations permises", () => {
    const grapple = { kind: "skill", skill: "Jiujutsu", trait: "agility", attack: true } as const;
    expect(computePool(base(), grapple, { voidSkill: true })).toMatchObject({ rolled: 4, kept: 3, explodes: true, canRaise: true });
  });
  it("Vide « compétence au rang 1 » sans effet si la compétence est maîtrisée", () => {
    expect(computePool(base(), atk, { voidSkill: true })).toMatchObject({ rolled: 5, kept: 3 });
  });
  it("jet de trait pur : Constitution 2g2", () => {
    expect(computePool(base(), { kind: "trait", trait: "stamina" }, {})).toMatchObject({ rolled: 2, kept: 2, explodes: true });
  });
  it("trait Vide pour la Concentration du duel : Iaijutsu 3 + Vide 2 = 5g2", () => {
    expect(computePool(base(), { kind: "skill", skill: "Iaijutsu", trait: "void" }, {})).toMatchObject({ rolled: 5, kept: 2 });
  });
  it("dégâts au katana : Force 2 + 3k2 = 5g2, sans augmentation", () => {
    expect(computePool(base(), { kind: "damage", weapon: sword }, {})).toMatchObject({ rolled: 5, kept: 2, canRaise: false });
  });
  it("dégâts avec augmentations d'attaque pré-remplies (+2 dés lancés)", () => {
    expect(computePool(base(), { kind: "damage", weapon: sword }, { extraRolled: 2 })).toMatchObject({ rolled: 7, kept: 2 });
  });
  it("arc : dégâts sur la force de l'arc, pas sur la Force", () => {
    expect(computePool(base(), { kind: "damage", weapon: bow }, {})).toMatchObject({ rolled: 5, kept: 2 });
  });
  it("maîtrise : compétence martiale au rang 7+, les dégâts explosent aussi sur 9", () => {
    const c = base();
    expect(computePool(c, { kind: "damage", weapon: sword }, {})).toMatchObject({ explodeOn: 10 });
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 7;
    expect(computePool(c, { kind: "damage", weapon: sword }, {})).toMatchObject({ explodes: true, explodeOn: 9 });
    expect(computePool(c, atk, {})).toMatchObject({ explodeOn: 10 });        // l'attaque n'est pas concernée
  });
  it("maîtrise : s'applique à l'arc (Kyujutsu 7) et aux mains nues (Jiujutsu 7)", () => {
    const c = base();
    c.skills.push({ name: "Kyujutsu", rank: 7, trait: "reflexes", emphases: [] });
    c.skills.push({ name: "Jiujutsu", rank: 7, trait: "agility", emphases: [] });
    expect(computePool(c, { kind: "damage", weapon: bow }, {})).toMatchObject({ explodeOn: 9 });
    expect(computePool(c, { kind: "damage", weapon: { name: "Mains nues", skill: "Jiujutsu", dr: "0k1" } }, {})).toMatchObject({ explodeOn: 9 });
  });
  it("initiative : Rang 1 + Réflexes 3 = 4g3", () => {
    expect(computePool(base(), { kind: "initiative" }, {})).toMatchObject({ rolled: 4, kept: 3, canRaise: false });
  });
  it("applique la règle des dix dés en dernier", () => {
    const c = base();
    c.traits.agility = 5;
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 6;
    // 6 + 5 = 11g5, +2g1 Attaque totale = 13g6, +1g1 Vide = 14g7 → 4 lancés en trop = 2 gardés → 10g9
    expect(computePool(c, atk, { stance: "fullAttack", voidPoint: true })).toMatchObject({ rolled: 10, kept: 9, bonus: 0 });
  });
});

describe("Lancer (rollDice)", () => {
  const pool = (rolled: number, kept: number, explodes = true, bonus = 0) => ({ rolled, kept, bonus, explodes, canRaise: true, notes: [] });

  it("explosion d'un 10, puis on garde les meilleurs", () => {
    const rng = seq([10, 7, 3, 2]);
    const r = rollDice(pool(3, 2), { emphasis: false }, rng);
    expect(r.total).toBe(20);
    expect(r.dice[0]).toMatchObject({ faces: [10, 7], total: 17, kept: true });
    expect(r.dice.filter((d) => d.kept)).toHaveLength(2);
    expect(rng.remaining()).toBe(0);
  });
  it("sans explosion pour un jet sans compétence", () => {
    const rng = seq([10, 7, 3]);
    expect(rollDice(pool(3, 2, false), { emphasis: false }, rng).total).toBe(17);
    expect(rng.remaining()).toBe(0);
  });
  it("spécialisation : un 1 est relancé une fois", () => {
    const r = rollDice(pool(2, 1), { emphasis: true }, seq([1, 8, 5]));
    expect(r.total).toBe(8);
    expect(r.dice.find((d) => d.kept)).toMatchObject({ rerolledOne: true, faces: [8] });
  });
  it("spécialisation : le second 1 est gardé", () => {
    expect(rollDice(pool(2, 1), { emphasis: true }, seq([1, 1, 4])).total).toBe(4);
  });
  it("spécialisation : le dé relancé peut exploser", () => {
    expect(rollDice(pool(2, 1), { emphasis: true }, seq([1, 10, 6, 2])).total).toBe(16);
  });
  it("explose sur 9 quand explodeOn = 9", () => {
    const rng = seq([9, 10, 2, 3]);
    const r = rollDice({ ...pool(2, 1), explodeOn: 9 }, { emphasis: false }, rng);
    expect(r.total).toBe(21);
    expect(r.dice[0]).toMatchObject({ faces: [9, 10, 2], total: 21 });
    expect(rng.remaining()).toBe(0);
  });
  it("explodeOn absent = 10 : un 9 n'explose pas", () => {
    const rng = seq([9, 3]);
    expect(rollDice(pool(2, 1), { emphasis: false }, rng).total).toBe(9);
    expect(rng.remaining()).toBe(0);
  });
  it("explosions en chaîne", () => {
    expect(rollDice(pool(1, 1), { emphasis: false }, seq([10, 10, 3])).total).toBe(23);
  });
  it("ajoute le bonus de la règle des dix dés et le bonus fixe", () => {
    expect(rollDice(pool(2, 1, true, 4), { emphasis: false, flatBonus: 2 }, seq([6, 3])).total).toBe(12);
  });
});

describe("Blessures", () => {
  it("seuils cumulés pour Terre 2", () => {
    expect(woundState(base()).thresholds).toEqual([10, 14, 18, 22, 26, 30, 34, 38]);
  });
  it("seuils cumulés pour Terre 3", () => {
    const c = base(); c.traits.stamina = 3; c.traits.willpower = 3;
    expect(woundState(c).thresholds).toEqual([15, 21, 27, 33, 39, 45, 51, 57]);
  });
  it.each([
    [0, 0, "Indemne", 0, "ok"],
    [10, 0, "Indemne", 0, "ok"],
    [11, 1, "Égratigné", 3, "ok"],
    [18, 2, "Éraflé", 5, "ok"],
    [34, 6, "À terre", 40, "ok"],
    [35, 7, "Hors de combat", null, "out"],
    [38, 7, "Hors de combat", null, "out"],
    [39, 7, "Mort", null, "dead"],
  ])("%i blessures → niveau %i (%s)", (wounds, level, label, penalty, status) => {
    const c = base(); c.wounds = wounds;
    expect(woundState(c)).toMatchObject({ level, label, penalty, status });
  });
});

describe("ND d'armure", () => {
  it.each([
    [{ stance: "attack" }, 20],
    [{ stance: "fullAttack" }, 10],
    [{ stance: "defense" }, 24],                       // + Air 3 + Défense 1
    [{ stance: "fullDefense", fullDefenseBonus: 7 }, 27],
    [{ stance: "attack", voidArmor: true }, 30],
    [{ stance: "center" }, 20],
  ])("%o → %i", (state, expected) => {
    expect(armorTN(base(), state as never)).toBe(expected);
  });
  it("ajoute le bonus d'armure", () => {
    const c = base(); c.armor.bonus = 5;
    expect(armorTN(c, { stance: "attack" })).toBe(25);
  });
});

describe("ND, augmentations et manœuvres", () => {
  it("ND final = base + 5 × augmentations + pénalité de blessure", () => {
    expect(targetNumber({ base: 15, calledRaises: 2, woundPenalty: 3 })).toBe(28);
    expect(targetNumber({ base: null, calledRaises: 0, woundPenalty: 3 })).toBeNull();
    expect(targetNumber({ base: "opposed", calledRaises: 1, woundPenalty: 3 })).toBe("opposed");
  });
  it("coût des manœuvres par défaut", () => {
    expect(maneuverRaises({ dmg: 2, feint: 1 }, DEFAULT_MANEUVERS)).toBe(4);
    expect(maneuverRaises({ disarm: 1 }, DEFAULT_MANEUVERS)).toBe(3);
    expect(maneuverRaises({ inconnue: 1 }, DEFAULT_MANEUVERS)).toBe(0);
  });
  it("une manœuvre non cumulable ne compte qu'une fois", () => {
    expect(maneuverRaises({ feint: 3 }, DEFAULT_MANEUVERS)).toBe(2);
  });
  it("plafond d'augmentations = Anneau de Vide (avertissement)", () => {
    expect(raiseCapExceeded(base(), 2)).toBe(false);
    expect(raiseCapExceeded(base(), 3)).toBe(true);
  });
});

describe("Import par fusion (mergeCharacter)", () => {
  it("fusionne un trait sans toucher aux autres", () => {
    const r = mergeCharacter(base(), { traits: { agility: 4 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.character.traits.agility).toBe(4);
    expect(r.character.traits.reflexes).toBe(3);
    expect(r.changes).toEqual([{ path: "traits.agility", before: 3, after: 4, kind: "update" }]);
  });
  it("met à jour une compétence existante (nom normalisé) en gardant ses spécialisations", () => {
    const r = mergeCharacter(base(), { skills: [{ name: "kenjutsu", rank: 3 }] });
    if (!r.ok) throw new Error("fusion refusée");
    const k = r.character.skills.find((s) => s.name === "Kenjutsu")!;
    expect(k.rank).toBe(3);
    expect(k.emphases).toEqual(["Katana"]);
    expect(r.character.skills).toHaveLength(10);
  });
  it("ajoute une nouvelle compétence et une nouvelle arme en fin de liste", () => {
    const r = mergeCharacter(base(), {
      skills: [{ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] }],
      weapons: [bow],
    });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.skills.at(-1)?.name).toBe("Kyujutsu");
    expect(r.character.weapons.at(-1)?.name).toBe("Yumi");
    expect(r.changes.filter((c) => c.kind === "add")).toHaveLength(2);
  });
  it("ne supprime jamais : une liste vide ne change rien", () => {
    const r = mergeCharacter(base(), { skills: [], weapons: [] });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.skills).toHaveLength(10);
    expect(r.character.weapons).toHaveLength(2);
    expect(r.changes).toEqual([]);
  });
  it("ignore null et vide un texte avec une chaîne vide", () => {
    const r = mergeCharacter(base(), { clan: null, advantages: "" });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.character.clan).toBe("Grue");
    expect(r.character.advantages).toBe("");
  });
  it("ignore et signale les clés inconnues", () => {
    const r = mergeCharacter(base(), { foo: 1, traits: { agility: 4 } });
    if (!r.ok) throw new Error("fusion refusée");
    expect(r.warnings).toContain("foo");
    expect("foo" in r.character).toBe(false);
  });
  it("refuse tout l'import si un champ est invalide, avec le chemin du champ", () => {
    const r1 = mergeCharacter(base(), { traits: { agility: 11 }, name: "Autre" });
    expect(r1.ok).toBe(false);
    if (r1.ok) return;
    expect(r1.errors.map((e) => e.path)).toContain("traits.agility");
    expect(mergeCharacter(base(), { traits: { agility: "abc" } }).ok).toBe(false);
  });
  it("refuse un fichier d'une version plus récente", () => {
    const r = mergeCharacter(base(), { schemaVersion: 99 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0].message).toMatch(/version plus récente/);
  });
  it("ne modifie pas la fiche d'origine", () => {
    const b = base();
    mergeCharacter(b, { traits: { agility: 4 } });
    expect(b.traits.agility).toBe(3);
  });
});

describe("Migration v0 (prototype) → v1", () => {
  it("convertit le format du prototype", () => {
    const v0 = {
      name: "Test", clan: "Lion", insight: 2, honor: "4.5", glory: "", status: "1.0",
      xpTotal: 40, xpSpent: 10, void: 3, voidPoints: 1, wounds: 4,
      traits: { stamina: 2, willpower: 2, strength: 3, perception: 2, agility: 3, intelligence: 2, reflexes: 2, awareness: 2 },
      armor: { name: "Légère", bonus: 5 },
      skills: [{ name: "Kenjutsu", rank: 2, trait: "agility", emph: "Katana, Nodachi" }],
      weapons: [{ name: "Yumi", skill: "Kyujutsu", dr: "2g2", bow: 3 }],
      techniques: [], maneuvers: [{ k: "dmg", n: "Augmentation des dégâts", cost: 1, eff: "+1g0", rep: true }],
      advantages: "", disadvantages: "", notes: "",
    };
    const c = migrate(v0);
    expect(c).toMatchObject({
      schemaVersion: 1, insightRank: 2, honor: 4.5, glory: 0, voidRing: 3,
      xp: { total: 40, spent: 10 },
      skills: [{ name: "Kenjutsu", emphases: ["Katana", "Nodachi"] }],
      weapons: [{ name: "Yumi", dr: "2g2", bowStrength: 3 }],
      maneuvers: [{ id: "dmg", name: "Augmentation des dégâts", cost: 1, effect: "+1g0", stackable: true }],
    });
  });
  it("laisse passer une fiche v1 sans changement", () => {
    expect(migrate(base())).toEqual(base());
  });
});

describe("Déplacement en combat", () => {
  it("Eau 2 : action libre 10 pieds, action simple 20, maximum 40 par round", () => {
    expect(movement(base())).toEqual({ free: 10, simple: 20, max: 40 });
  });
  it("suit l'Anneau d'Eau (minimum de Force et Perception)", () => {
    const c = base(); c.traits.strength = 4; c.traits.perception = 3;
    expect(movement(c)).toEqual({ free: 15, simple: 30, max: 60 });
  });
});

describe("Statistiques de réserve (poolStats)", () => {
  const pool = (rolled: number, kept: number, explodes = true, bonus = 0) => ({ rolled, kept, bonus, explodes, canRaise: true, notes: [] });
  const opts = { emphasis: false, samples: 20000, seed: 42 };

  it("5g3 : min et max exacts, moyenne et chances dans la tolérance", () => {
    const s = poolStats(pool(5, 3), opts);
    expect(s).toMatchObject({ min: 3, max: 30, open: true });
    expect(s.mean).toBeGreaterThan(24);
    expect(s.mean).toBeLessThan(25);
    expect(s.chance(15)).toBeGreaterThan(0.92);
    expect(s.chance(15)).toBeLessThan(0.96);
    expect(s.chance(3)).toBe(1);
  });
  it("3g3 sans compétence : pas d'explosion, max fermé", () => {
    const s = poolStats(pool(3, 3, false), opts);
    expect(s).toMatchObject({ min: 3, max: 30, open: false });
    expect(s.mean).toBeGreaterThan(16.1);
    expect(s.mean).toBeLessThan(16.9);
    expect(s.chance(31)).toBe(0);
  });
  it("intègre le bonus des dix dés et le bonus fixe", () => {
    const s = poolStats(pool(2, 1, true, 4), { ...opts, flatBonus: 2 });
    expect(s.min).toBe(7);
    expect(s.max).toBe(16);
  });
  it("est déterministe pour une même graine", () => {
    expect(poolStats(pool(6, 3), opts).mean).toBe(poolStats(pool(6, 3), opts).mean);
  });
  it("exploser sur 9 augmente la moyenne", () => {
    const p = pool(5, 2);
    expect(poolStats({ ...p, explodeOn: 9 }, opts).mean).toBeGreaterThan(poolStats(p, opts).mean);
  });
  it("la spécialisation augmente la moyenne", () => {
    const sans = poolStats(pool(5, 3), opts).mean;
    const avec = poolStats(pool(5, 3), { ...opts, emphasis: true }).mean;
    expect(avec).toBeGreaterThan(sans);
  });
});
