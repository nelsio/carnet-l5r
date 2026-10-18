/** Import et export de fiches (HANDOFF §8). */
import { describe, expect, it } from "vitest";
import {
  exportFileName, importCharacter, MAX_CHARACTER_BYTES, parseCharacterFile, serializeCharacter, type Character,
} from "@carnet/core";
import kakita from "../reference/exemple-personnage.json";

const base = () => structuredClone(kakita) as Character;

describe("Export", () => {
  it("nomme le fichier d'après le nom normalisé", () => {
    expect(exportFileName({ name: "Kakita Haruto" })).toBe("kakita-haruto-l5r.json");
    expect(exportFileName({ name: "  Dōji  Ayamé (2e) " })).toBe("doji-ayame-2e-l5r.json");
    expect(exportFileName({ name: "" })).toBe("fiche-l5r.json");
    expect(exportFileName({ name: "!!!" })).toBe("fiche-l5r.json");
  });
  it("produit un JSON indenté avec schemaVersion, relu à l'identique", () => {
    const text = serializeCharacter(base());
    expect(text).toMatch(/^\{\n {2}"schemaVersion": 1,/);
    expect(text.endsWith("}\n")).toBe(true);
    const parsed = parseCharacterFile(text);
    expect(parsed.ok && importCharacter(parsed.json)).toEqual({ ok: true, character: base() });
  });
});

describe("Lecture d'un fichier", () => {
  it("refuse un JSON invalide", () => {
    expect(parseCharacterFile("{ pas du json")).toEqual({ ok: false, errors: [{ path: "", message: "Fichier illisible : ce n'est pas un JSON valide" }] });
  });
  it("refuse un fichier de plus de 256 Ko", () => {
    const big = JSON.stringify({ notes: "x".repeat(MAX_CHARACTER_BYTES) });
    const r = parseCharacterFile(big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.message).toMatch(/trop volumineux \(257 Ko, maximum 256 Ko\)/);
    expect(parseCharacterFile("{}", MAX_CHARACTER_BYTES).ok).toBe(true);
  });
});

describe("Import d'une fiche complète", () => {
  it("migre un fichier du prototype", () => {
    const { insightRank, ...rest } = base();
    const r = importCharacter({ ...rest, schemaVersion: undefined, insight: insightRank });
    expect(r).toEqual({ ok: true, character: base() });
  });
  it("liste les erreurs par champ", () => {
    const r = importCharacter({ ...base(), traits: { ...base().traits, agility: 12 }, name: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path).sort()).toEqual(["name", "traits.agility"]);
  });
  it("refuse une version plus récente", () => {
    const r = importCharacter({ ...base(), schemaVersion: 2 });
    expect(!r.ok && r.errors[0]?.message).toMatch(/version plus récente/);
  });
  it("laisse remonter une erreur inattendue", () => {
    expect(() => importCharacter({ f: () => 1 })).toThrow();
  });
});
