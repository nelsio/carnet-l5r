/** Contrôle des textes en dur (annexes 50.4 et 51.3) : `scripts/check-i18n.mjs`, bloquant depuis le lot 51. */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const run = (dir?: string) => spawnSync(process.execPath, ["scripts/check-i18n.mjs", ...(dir ? [dir] : [])], { encoding: "utf8" });

describe("contrôle des textes en dur (annexe 51.3)", () => {
  let repo: string;
  const component = (jsx: string) => writeFileSync(join(repo, "src", "ui", "A.tsx"), `export const A = () => (\n  ${jsx}\n);\n`);

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), "carnet-i18n-"));
    mkdirSync(join(repo, "src", "ui"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("I2 : le dépôt n'a plus aucun texte brut, aucun fichier en attente", () => {
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 texte(s) brut(s) dans 0 fichier(s) non migré(s)");
  });

  it("textes passés par le dictionnaire : accepté", () => {
    component("<p title={t.title}>{t.hint}</p>");
    expect(run(repo).status).toBe(0);
  });

  it("texte JSX brut : erreur, fichier et ligne indiqués", () => {
    component("<p>Bonjour</p>");
    const r = run(repo);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("src/ui/A.tsx:2 : « Bonjour »");
  });

  it("exceptions : sigle, bouton d'information, champ JSON, kanji seul", () => {
    component("<p><b>L5R</b><i>i</i><code>modifiers</code><span>帳</span></p>");
    expect(run(repo).status).toBe(0);
  });

  it("commentaires et comparaisons ignorés", () => {
    component("<p>{/* Texte de commentaire */}{a > b ? x : y}</p>");
    expect(run(repo).status).toBe(0);
  });
});
