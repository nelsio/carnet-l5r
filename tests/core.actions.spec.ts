/** Valeurs de dégâts affichées en XgY (HANDOFF annexe H.5) : formatDR et descriptions d'actions. */
import { describe, expect, it } from "vitest";
import { buildActions, CharacterSchema, formatDR, spellActions } from "@carnet/core";
import perso from "../reference/perso-test-shugenja.json";

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
