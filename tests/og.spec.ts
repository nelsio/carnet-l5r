/**
 * Référencement et aperçu de lien (annexes O.1 et P) : balises de `index.html`, JSON-LD, sitemap,
 * image `public-pages/og-image.png` en 1200 × 630, sous 300 Ko (en-tête PNG lu ici, sans dépendance).
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SITE = "https://nelsio.github.io/carnet-l5r/";
const source = readFileSync(resolve("index.html"), "utf8");
const doc = new DOMParser().parseFromString(source, "text/html");
const head = doc.head;
const meta = (attr: "name" | "property", key: string) => head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content");

describe("référencement et aperçu de lien", () => {
  it("langue, titre, description et adresse canonique", () => {
    expect(doc.documentElement.lang).toBe("fr");
    expect(head.querySelector("title")?.textContent).toBe("Carnet de Rokugan – Fiche de personnage et assistant de jets L5R 4e édition");
    expect(meta("name", "description")).toMatch(/La Légende des Cinq Anneaux \(L5R 4e édition\)/);
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(SITE);
  });

  it("W1 : Open Graph et carte Twitter présents", () => {
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
    expect(meta("property", "og:type")).toBe("website");
    expect(meta("property", "og:site_name")).toBe("Carnet de Rokugan");
    expect(meta("property", "og:title")).toBe("Carnet de Rokugan – L5R 4e édition");
    expect(meta("property", "og:description")).toMatch(/La Légende des Cinq Anneaux/);
    expect(meta("property", "og:image:width")).toBe("1200");
    expect(meta("property", "og:image:height")).toBe("630");
    expect(meta("property", "og:image:alt")).toBeTruthy();
    expect(meta("property", "og:locale")).toBe("fr_FR");
  });

  it("W1 : adresses absolues vers GitHub Pages (justes aussi en file://)", () => {
    expect(meta("property", "og:url")).toBe(SITE);
    expect(meta("property", "og:image")).toBe(`${SITE}og-image.png`);
  });

  it("JSON-LD valide, gratuit, en français", () => {
    const data = JSON.parse(head.querySelector('script[type="application/ld+json"]')!.textContent!) as Record<string, unknown>;
    expect(data).toMatchObject({ "@type": "WebApplication", name: "Carnet de Rokugan", url: SITE, inLanguage: "fr", isAccessibleForFree: true });
  });

  it("vérification Google Search Console laissée en commentaire", () => {
    expect(source).toContain('<!-- <meta name="google-site-verification"');
    expect(meta("name", "google-site-verification")).toBeUndefined();
  });

  it("sitemap : XML valide, une seule adresse, celle du site", () => {
    const xml = new DOMParser().parseFromString(readFileSync(resolve("public-pages/sitemap.xml"), "utf8"), "application/xml");
    expect(xml.querySelector("parsererror")).toBeNull();
    expect([...xml.querySelectorAll("loc")].map((l) => l.textContent)).toEqual([SITE]);
    expect(xml.querySelector("lastmod")?.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("W2 : og-image.png fait exactement 1200 × 630 et moins de 300 Ko", () => {
    const file = resolve("public-pages/og-image.png");
    const png = readFileSync(file);
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(statSync(file).size).toBeLessThan(300 * 1024);
  });
});
