/**
 * Aperçu de lien (annexe O.1) : W1 balises description et Open Graph de `index.html`,
 * W2 image `docs/img/og.png` en 1200 × 630, sous 300 Ko (en-tête PNG lu ici, sans dépendance).
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SITE = "https://nelsio.github.io/carnet-l5r/";
const head = new DOMParser().parseFromString(readFileSync(resolve("index.html"), "utf8"), "text/html").head;
const meta = (attr: "name" | "property", key: string) => head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content");

describe("aperçu de lien (O.1)", () => {
  it("W1 : description, Open Graph et carte Twitter présentes", () => {
    expect(meta("name", "description")).toMatch(/Roll & Keep/);
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
    expect(meta("property", "og:type")).toBe("website");
    expect(meta("property", "og:site_name")).toBe("Carnet de Rokugan");
    expect(meta("property", "og:title")).toBe("Carnet de Rokugan · compagnon L5R 4e");
    expect(meta("property", "og:description")).toMatch(/tes fiches restent dans ton navigateur/);
    expect(meta("property", "og:image:width")).toBe("1200");
    expect(meta("property", "og:image:height")).toBe("630");
    expect(meta("property", "og:image:alt")).toBeTruthy();
    expect(meta("property", "og:locale")).toBe("fr_FR");
  });

  it("W1 : adresses absolues vers GitHub Pages (justes aussi en file://)", () => {
    expect(meta("property", "og:url")).toBe(SITE);
    expect(meta("property", "og:image")).toBe(`${SITE}og.png`);
  });

  it("W2 : og.png fait exactement 1200 × 630 et moins de 300 Ko", () => {
    const file = resolve("docs/img/og.png");
    const png = readFileSync(file);
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(statSync(file).size).toBeLessThan(300 * 1024);
  });
});
