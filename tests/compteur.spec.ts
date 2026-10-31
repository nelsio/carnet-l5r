/**
 * Compteur de visites (annexe O.5) : W12 et W13 `scripts/pages-compteur.mjs` sur un dossier temporaire.
 * Le comportement dans le navigateur (titre, script bloqué ou modifié) est dans tests/e2e/compteur.spec.ts.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const run = (dir: string) => spawnSync(process.execPath, ["scripts/pages-compteur.mjs", dir], { encoding: "utf8" });

describe("compteur de visites sur GitHub Pages (O.5)", () => {
  let site: string;
  beforeEach(() => {
    site = mkdtempSync(join(tmpdir(), "carnet-compteur-"));
  });
  afterEach(() => rmSync(site, { recursive: true, force: true }));

  const injected = () => {
    writeFileSync(join(site, "index.html"), '<html><head><title>t</title></head><body><script>"</body>"</script></body></html>');
    expect(run(site).status).toBe(0);
    return readFileSync(join(site, "index.html"), "utf8");
  };

  it("W12 : script et noscript avant le dernier </body>, le reste intact", () => {
    const html = injected();
    expect(html.indexOf("data-goatcounter=")).toBeGreaterThan(html.indexOf('<script>"</body>"</script>'));
    expect(html.indexOf("</noscript>")).toBeLessThan(html.lastIndexOf("</body>"));
    expect(html).toContain("<title>t</title>");
  });

  it("W12 : titre fixe, jamais celui de la page", () => {
    const settings = /data-goatcounter-settings='([^']+)'/.exec(injected())![1]!;
    expect(JSON.parse(settings)).toEqual({ title: "Carnet de Rokugan" });
  });

  it("W12 : script épinglé, empreinte conforme au fichier de référence", () => {
    const html = injected();
    const fixture = readFileSync(resolve("tests/fixtures/goatcounter/count.v5.js"));
    expect(html).toContain('src="https://gc.zgo.at/count.v5.js"');
    expect(html).toContain('crossorigin="anonymous"');
    expect(html).toContain(`integrity="sha384-${createHash("sha384").update(fixture).digest("base64")}"`);
  });

  it("W13 : échoue sans </body>, sans rien publier", () => {
    writeFileSync(join(site, "index.html"), "<html><head></head></html>");
    const result = run(site);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("</body>");
    expect(readFileSync(join(site, "index.html"), "utf8")).not.toContain("goatcounter");
  });
});
