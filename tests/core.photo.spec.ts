/** Import depuis une fiche papier : prompt et lecture de la réponse de l'IA (lot 42, annexe S). */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ArmorSchema, buildPhotoPrompt, characterShape, extractPhotoReply, importCharacter, MAX_CHARACTER_BYTES, mergeCharacter, migrate,
  PHOTO_PROMPT_FIELDS, PHOTO_PROMPT_SKIPPED, reviewLabel, SkillSchema, SpellSchema, TechniqueSchema, TRAIT_KEYS, WeaponSchema,
  XpSchema, type Character,
} from "@carnet/core";
import { TRAIT_LABELS } from "../src/rules/l5r4e";
import kakita from "./fixtures/kakita-v1.json";

const reply = readFileSync(resolve("tests/fixtures/photo-reponse.txt"), "utf8");
const jsonOnly = reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1);
const extracted = () => {
  const r = extractPhotoReply(reply);
  if (!r.ok) throw new Error("réponse d'exemple refusée");
  return r;
};
const withReview = (review: unknown) => JSON.stringify({ ...JSON.parse(jsonOnly), _aVerifier: review });
const reviewOf = (text: string) => {
  const r = extractPhotoReply(text);
  return r.ok ? r.review : null;
};

describe("Prompt", () => {
  it("P1 : chaque champ de la fiche est demandé à l'IA ou laissé aux valeurs par défaut, jamais les deux", () => {
    const fields: readonly string[] = PHOTO_PROMPT_FIELDS;
    const skipped: readonly string[] = PHOTO_PROMPT_SKIPPED;
    for (const key of Object.keys(characterShape)) {
      expect([fields.includes(key), skipped.includes(key)], key).toSatisfy(([a, b]) => a !== b);
    }
    // Sous-champs : présents dans le prompt, ou listés comme ignorés.
    const prompt = buildPhotoPrompt();
    const nested = { xp: XpSchema, armor: ArmorSchema, "skills[]": SkillSchema, "weapons[]": WeaponSchema, "techniques[]": TechniqueSchema, "spells[]": SpellSchema };
    for (const [parent, schema] of Object.entries(nested)) {
      for (const sub of Object.keys(schema.shape)) {
        const path = `${parent}.${sub}`;
        expect([prompt.includes(`"${sub}"`) && !skipped.includes(path), skipped.includes(path)], path).toSatisfy(([a, b]) => a !== b);
      }
    }
    for (const key of fields) expect(prompt, key).toContain(`"${key}"`);
  });

  it("P2 : cite chaque Trait avec son libellé, schemaVersion 2, le format 3g2 et _aVerifier", () => {
    const prompt = buildPhotoPrompt();
    for (const k of TRAIT_KEYS) expect(prompt).toMatch(new RegExp(`"${k}": 2,?\\s+// ${TRAIT_LABELS[k]} \\(`));
    expect(prompt).toContain("// Vigilance (Air) (Intuition sur certaines fiches)");
    expect(prompt).toContain("// Agilité (Feu)");
    expect(prompt).toContain('"schemaVersion": 2');
    expect(prompt).toContain("3g2");
    expect(prompt).toContain('"_aVerifier": []');
    expect(prompt).toContain("air, earth, fire, water, void ou all");
    expect(prompt).not.toContain("Intuition (Air)");
  });
});

describe("Réponse de l'IA", () => {
  it("P3 : JSON seul, entouré de texte ou en bloc ```json : même fiche", () => {
    const { json } = extracted();
    expect(json.name).toBe("Hiruma Daisuke");
    for (const text of [jsonOnly, `Voici ta fiche : ${jsonOnly} Bonne partie !`, "```json\n" + jsonOnly + "\n```"]) {
      const r = extractPhotoReply(text);
      expect(r.ok && r.json).toEqual(json);
    }
  });

  it("P4 : réponse coupée, sans accolade, tableau à la racine : refusées avec un message qui dit quoi faire", () => {
    const cut = extractPhotoReply("```json\n" + jsonOnly.slice(0, Math.floor(jsonOnly.length * 0.55)));
    expect(cut).toEqual({ ok: false, errors: [{ path: "", message: expect.stringContaining("Renvoie le JSON complet, sans texte autour.") as string }] });
    expect(extractPhotoReply("{ \"name\": \"Hida\"")).toMatchObject({ ok: false, errors: [{ message: expect.stringContaining("incomplet ou abîmé") as string }] });
    expect(extractPhotoReply("Je ne peux pas lire cette photo.")).toEqual({
      ok: false, errors: [{ path: "", message: "La réponse ne contient pas de JSON. Recopie toute la réponse de l'IA, accolades comprises." }],
    });
    const notCharacter = { ok: false, errors: [{ path: "", message: "La réponse ne contient pas une fiche de personnage." }] };
    expect(extractPhotoReply(`[${jsonOnly}]`)).toEqual(notCharacter);
    expect(extractPhotoReply("```json\n[1, 2]\n```")).toEqual(notCharacter);
  });

  it("P4 : la limite de taille d'un fichier importé s'applique", () => {
    const big = JSON.stringify({ name: "x", notes: "a".repeat(MAX_CHARACTER_BYTES) });
    expect(extractPhotoReply(big)).toMatchObject({ ok: false, errors: [{ message: expect.stringContaining("trop volumineux") as string }] });
  });

  it("P5 : _aVerifier est retiré ; liste sans doublons, limitée à 50, sans chemin absent", () => {
    const { json, review } = extracted();
    expect(json).not.toHaveProperty("_aVerifier");
    expect(review).toEqual(["traits.intelligence", "skills[6].rank", "glory"]);

    expect(reviewOf(withReview(["glory", "glory", "traits.agility", "skills[42].rank", "traits.chance", "constructor", "__proto__", "", "xp"]))).toEqual(["glory", "traits.agility", "xp"]);
    // 56 chemins présents, distincts : seuls les 50 premiers sont gardés.
    const present = [
      ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => ["name", "rank", "trait", "emphases"].map((f) => `skills[${i}].${f}`)),
      ...TRAIT_KEYS.map((k) => `traits.${k}`),
      "honor", "glory", "status", "xp.total", "xp.spent", "name", "clan", "family", "school", "insightRank",
      "voidRing", "voidPoints", "wounds", "armor.name", "armor.bonus", "armor.reduction",
    ];
    expect(present).toHaveLength(56);
    expect(reviewOf(withReview(present))).toEqual(present.slice(0, 50));
  });

  it("P5 : _aVerifier ignoré s'il n'est pas une liste de textes, mais toujours retiré", () => {
    for (const bad of ["glory", ["glory", 3], { glory: true }, null]) {
      const r = extractPhotoReply(withReview(bad));
      expect(r.ok && r.review).toEqual([]);
      expect(r.ok && r.json).not.toHaveProperty("_aVerifier");
    }
  });

  it("P6 : la fiche extraite s'importe et se fusionne sans avertissement", () => {
    const { json } = extracted();
    const imported = importCharacter(json);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.character).toMatchObject({ name: "Hiruma Daisuke", schoolId: "", schoolRank: null, insightRank: 3, glory: 2.1 });
    expect(imported.character.weapons[2]).toMatchObject({ name: "Daikyu", bowStrength: 4 });
    expect(imported.character).not.toHaveProperty("_aVerifier");

    const merged = mergeCharacter(migrate(structuredClone(kakita) as Character), json);
    expect(merged.ok).toBe(true);
    expect(merged.ok && merged.warnings).toEqual([]);
    expect(merged.ok && merged.character.name).toBe("Hiruma Daisuke");
  });

  it("P7 : libellés de l'encadré « À vérifier »", () => {
    const { json } = extracted();
    expect(reviewLabel("traits.agility", json)).toBe("Agilité");
    expect(reviewLabel("traits.awareness", json)).toBe("Vigilance");
    expect(reviewLabel("voidRing", json)).toBe("Anneau de Vide");
    expect(reviewLabel("glory", json)).toBe("Gloire");
    expect(reviewLabel("xp.total", json)).toBe("XP total");
    expect(reviewLabel("skills[6].rank", json)).toBe("Rang de Connaissance : Outremonde");
    expect(reviewLabel("skills[2].rank", json)).toBe("Rang d'Athlétisme");
    expect(reviewLabel("skills[2]", json)).toBe("Compétence : Athlétisme");
    expect(reviewLabel("weapons[0].dr", json)).toBe("VD de Katana");
    expect(reviewLabel("weapons[2].bowStrength", json)).toBe("Force de Daikyu");
    expect(reviewLabel("skills[42].rank", json)).toBe("skills[42].rank");
    expect(reviewLabel("traits.chance", json)).toBe("traits.chance");
    expect(reviewLabel("foo.bar", json)).toBe("foo.bar");
  });
});
