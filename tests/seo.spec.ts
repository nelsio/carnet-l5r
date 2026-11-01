/** Présentation statique (annexe P) : `scripts/pages-seo.mjs` sur un dossier temporaire. */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const run = (dir: string) => spawnSync(process.execPath, ["scripts/pages-seo.mjs", dir], { encoding: "utf8" });

describe("présentation sur GitHub Pages (annexe P)", () => {
  let site: string;
  beforeEach(() => {
    site = mkdtempSync(join(tmpdir(), "carnet-seo-"));
  });
  afterEach(() => rmSync(site, { recursive: true, force: true }));

  it("texte juste après #root, hors de ce que React remplace, le reste intact", () => {
    writeFileSync(join(site, "index.html"), '<html><body><div id="root"></div><script>x</script></body></html>');
    expect(run(site).status).toBe(0);
    const doc = new DOMParser().parseFromString(readFileSync(join(site, "index.html"), "utf8"), "text/html");
    expect(doc.getElementById("root")!.childElementCount).toBe(0);
    const block = doc.getElementById("root")!.nextElementSibling!;
    expect(block.querySelector("h1")?.textContent).toBe("Carnet de Rokugan");
    const text = block.textContent!.replace(/\s+/g, " ");
    for (const word of ["La Légende des Cinq Anneaux", "L5R", "4e édition", "fiche de personnage", "jets de dés", "joueurs", "mobile", "import/export JSON", "gratuit", "sans compte"]) {
      expect(text).toContain(word);
    }
    expect(block.querySelector("a")?.getAttribute("href")).toBe("https://vincenzorpg.github.io/L5R/");
    expect(doc.querySelector("script")?.textContent).toBe("x");
  });

  it("échoue si #root est introuvable", () => {
    writeFileSync(join(site, "index.html"), "<html><body></body></html>");
    const r = run(site);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("introuvable");
  });
});
