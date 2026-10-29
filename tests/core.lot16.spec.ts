/** Lot 16, v2.13.3 (HANDOFF annexe H.5, H.8) : VD affichées en XgY, données livrées normalisées. */
import { describe, expect, it } from "vitest";
import { buildActions, CharacterSchema, formatDR, mergeCharacter, serializeCharacter, spellActions, type Character } from "@carnet/core";
import bushi from "../src/rules/ecoles-bushi.json";
import { DISARM_DAMAGE } from "../src/rules/l5r4e";
import perso from "../reference/perso-test-shugenja.json";
import kakita from "./fixtures/kakita-v1.json";

const DICE_K = /\b\d+k\d+\b/;

describe("formatDR (H.5)", () => {
  it("K1 : « k » ou « g », espaces et casse → XgY ; texte invalide rendu tel quel, rogné", () => {
    expect(["3k3", "3K3", " 3 k 3 ", "3g3", "0k4", "abc", ""].map((s) => formatDR(s))).toEqual(["3g3", "3g3", "3g3", "3g3", "0g4", "abc", ""]);
    expect(formatDR("  abc  ")).toBe("abc");
  });

  it("lettre au choix pour le lot 20 (k en anglais)", () => {
    expect(formatDR("3g2", "k")).toBe("3k2");
  });
});

describe("Données livrées (H.5)", () => {
  it("K3 : aucune VD du catalogue d'armes ni constante de règles en « k »", () => {
    const drs = bushi.weaponCatalog.map((w) => w.dr);
    expect(drs).toHaveLength(16);
    for (const dr of drs) expect(dr).toMatch(/^\d+g\d+$/);
    expect(DISARM_DAMAGE).toBe("2g1");
  });
});

describe("Descriptions d'actions (H.5)", () => {
  it("dégâts d'arme et de sort en XgY, même stockés en « k »", () => {
    const c = CharacterSchema.parse(structuredClone(perso));
    c.weapons = [
      { name: "Katana", skill: "Kenjutsu", dr: "3k3" },
      { name: "Yumi", skill: "Kyujutsu", dr: "2K2", bowStrength: 3, keywords: ["arc", "distance", "grande"] },
    ];
    const text = [...buildActions(c, "combat", "skirmish"), ...spellActions(c)].map((a) => a.description).join("\n");
    expect(text).not.toMatch(DICE_K);
    expect(text).toContain("Force + VD 3g3.");
    expect(text).toContain("VD de la flèche 2g2.");
    expect(text).toContain("VD 2g2, sans la Force ni point de Vide.");
  });
});

describe("Fiches anciennes (H.5)", () => {
  it("K5 : export puis import d'une fiche en « 3k2 » : fusion sans changement sur la VD, VD gardée telle quelle", () => {
    const old = structuredClone(kakita) as Character;
    expect(old.weapons[0]!.dr).toBe("3k2");
    const r = mergeCharacter(old, JSON.parse(serializeCharacter(old)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes.filter((ch) => ch.path.startsWith("weapons"))).toEqual([]);
    expect(r.character.weapons[0]!.dr).toBe("3k2");
    expect(formatDR(r.character.weapons[0]!.dr)).toBe("3g2");
  });
});
