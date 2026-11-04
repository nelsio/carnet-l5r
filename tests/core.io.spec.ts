/** Import et export de fiches (HANDOFF §8). */
import { describe, expect, it } from "vitest";
import {
  exportFileName, formatDR, importCharacter, MAX_CHARACTER_BYTES, mergeCharacter, migrate, parseCharacterFile, serializeCharacter, type Character,
} from "@carnet/core";
import isawa from "./fixtures/forge-isawa.json";
import kakita from "./fixtures/kakita-v1.json";
import mirumoto from "./fixtures/forge-mirumoto.json";

const base = () => structuredClone(kakita) as Character;
/** La même fiche au format courant (v2). */
const v2 = () => migrate(base());

describe("Export", () => {
  it("nomme le fichier d'après le nom normalisé", () => {
    expect(exportFileName({ name: "Kakita Haruto" })).toBe("kakita-haruto-l5r.json");
    expect(exportFileName({ name: "  Dōji  Ayamé (2e) " })).toBe("doji-ayame-2e-l5r.json");
    expect(exportFileName({ name: "" })).toBe("fiche-l5r.json");
    expect(exportFileName({ name: "!!!" })).toBe("fiche-l5r.json");
  });
  it("produit un JSON indenté avec schemaVersion, relu à l'identique", () => {
    const text = serializeCharacter(v2());
    expect(text).toMatch(/^\{\n {2}"schemaVersion": 2,/);
    expect(text.endsWith("}\n")).toBe(true);
    const parsed = parseCharacterFile(text);
    expect(parsed.ok && importCharacter(parsed.json)).toEqual({ ok: true, character: v2() });
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
    expect(r).toEqual({ ok: true, character: v2() });
  });
  it("liste les erreurs par champ", () => {
    const r = importCharacter({ ...base(), traits: { ...base().traits, agility: 12 }, name: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path).sort()).toEqual(["name", "traits.agility"]);
  });
  it("refuse une version plus récente", () => {
    const r = importCharacter({ ...base(), schemaVersion: 3 });
    expect(!r.ok && r.errors[0]?.message).toMatch(/version plus récente/);
  });
  it("laisse remonter une erreur inattendue", () => {
    expect(() => importCharacter({ f: () => 1 })).toThrow();
  });
});

describe("Lot 39 : export JSON de la Forge (portail, 02/11/2026)", () => {
  it.each([["bushi", mirumoto], ["shugenja", isawa]])("importe un export %s sans erreur", (_, json) => {
    const r = importCharacter(structuredClone(json));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.character).toMatchObject({ name: json.name, clan: json.clan, schoolId: json.schoolId });
  });
  it("fusionne un export dans une fiche existante", () => {
    const r = mergeCharacter(v2(), structuredClone(isawa));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.character.spells?.map((s) => s.name)).toEqual(isawa.spells.map((s) => s.name));
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
