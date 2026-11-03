/** Contrôle des références à la spécification (annexe 44.4) : `scripts/check-spec.mjs` sur un dépôt temporaire. */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const run = (dir: string) => spawnSync(process.execPath, ["scripts/check-spec.mjs", dir], { encoding: "utf8" });
// Assemblées pour que les références volontairement fausses ne soient pas vues par check-spec sur le dépôt.
const P = "§";
const ANNEXE = "annexe";

describe("contrôle des références à la spécification (annexe 44.4)", () => {
  let repo: string;
  const cite = (text: string) => writeFileSync(join(repo, "src", "a.ts"), `// ${text}\n`);

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), "carnet-spec-"));
    mkdirSync(join(repo, "spec", "annexes"), { recursive: true });
    mkdirSync(join(repo, "src"));
    writeFileSync(join(repo, "spec", "06-interface.md"), "## 6. Interface\n\n### 6.3 Sécurité\n");
    writeFileSync(join(repo, "spec", "annexes", "E-lot-12.md"), "## Annexe E\n\n### E.9 Tests\n");
    writeFileSync(join(repo, "spec", "annexes", "Q-forge.md"), "## Annexe Q\n\n### Q bis Lot 40\n");
    writeFileSync(join(repo, "spec", "annexes", "44-spec.md"), "## Annexe 44\n\n### 44.2 Index\n");
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("S1 : HANDOFF §6.3 existant", () => {
    cite("HANDOFF §6.3 et annexe E.9");
    const r = run(repo);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("références valides");
  });

  it("S2 : un paragraphe inexistant (99) est une erreur", () => {
    cite(`voir ${P}99`);
    const r = run(repo);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`src/a.ts:1 : ${P}99 introuvable`);
  });

  it("S3 : une annexe inexistante (lettre Z) est une erreur", () => {
    cite(`voir ${ANNEXE} Z`);
    const r = run(repo);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`${ANNEXE} Z introuvable`);
  });

  it("S4 : une sous-section d'annexe sans titre (E, 99) est un avertissement, code 0", () => {
    cite(`voir ${ANNEXE} E.99`);
    const r = run(repo);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("1 avertissement(s)");
    expect(r.stdout).toContain(`${ANNEXE} E.99 sans titre`);
  });

  it("S5 : annexe Q bis est reconnue", () => {
    cite("voir annexe Q bis");
    expect(run(repo).status).toBe(0);
  });

  it("S6 : annexe 44.2 est reconnue si ### 44.2 existe", () => {
    cite(`voir annexe 44.2, puis ${ANNEXE} 44.3`);
    const r = run(repo);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("annexe 44.2 sans titre");
    expect(r.stdout).toContain(`${ANNEXE} 44.3 sans titre`);
  });
});
