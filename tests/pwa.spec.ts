/**
 * Installable et hors ligne (annexe O.3) : W6 `scripts/pages-pwa.mjs` sur un dossier temporaire,
 * W7 manifeste et icônes de `public-pages/` (dimensions lues dans l'en-tête PNG, comme og.spec.ts).
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const { version } = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version: string };
const run = (dir: string) => spawnSync(process.execPath, ["scripts/pages-pwa.mjs", dir], { encoding: "utf8" });

describe("publication sur GitHub Pages (O.3)", () => {
  let site: string;
  beforeEach(() => {
    site = mkdtempSync(join(tmpdir(), "carnet-site-"));
  });
  afterEach(() => rmSync(site, { recursive: true, force: true }));

  it("W6 : index.html reçoit le manifeste et l'enregistrement, avant </head>", () => {
    writeFileSync(join(site, "index.html"), "<html><head><title>t</title></head><body></body></html>");
    expect(run(site).status).toBe(0);
    const html = readFileSync(join(site, "index.html"), "utf8");
    expect(html).toContain('<link rel="manifest" href="manifest.webmanifest" />');
    expect(html.indexOf("serviceWorker.register('sw.js')")).toBeGreaterThan(0);
    expect(html.indexOf("serviceWorker.register('sw.js')")).toBeLessThan(html.indexOf("</head>"));
    expect(html).toContain("<title>t</title>");
  });

  it("W6 : sw.js porte la version de package.json, sans gabarit restant", () => {
    writeFileSync(join(site, "index.html"), "<head></head>");
    expect(run(site).status).toBe(0);
    const sw = readFileSync(join(site, "sw.js"), "utf8");
    expect(sw).toContain(`"carnet-v${version}"`);
    expect(sw).not.toContain("__APP_VERSION__");
  });

  it("W6 : échoue sans </head>, sans rien publier", () => {
    writeFileSync(join(site, "index.html"), "<html><body></body></html>");
    const result = run(site);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("</head>");
    expect(readFileSync(join(site, "index.html"), "utf8")).not.toContain("manifest");
  });
});

describe("manifeste (O.3)", () => {
  const manifest = JSON.parse(readFileSync(resolve("public-pages/manifest.webmanifest"), "utf8")) as {
    name: string;
    start_url: string;
    display: string;
    theme_color: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };

  it("W7 : nom, adresse de départ et affichage", () => {
    expect(manifest.name).toBe("Carnet de Rokugan");
    expect(manifest.start_url).toBe("./");
    expect(manifest.display).toBe("standalone");
    expect(readFileSync(resolve("index.html"), "utf8")).toContain(`content="${manifest.theme_color}"`);
  });

  it("W7 : trois icônes existantes aux bonnes dimensions, dont une maskable", () => {
    expect(manifest.icons).toHaveLength(3);
    expect(manifest.icons.filter((icon) => icon.purpose === "maskable")).toHaveLength(1);
    for (const icon of manifest.icons) {
      const png = readFileSync(resolve("public-pages", icon.src));
      expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
    }
  });
});
