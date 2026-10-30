/**
 * Couleurs (annexe I.1.11) : contrastes N1 à N6, N12 et V8 (pied de page, annexe M.3) sur les valeurs de la feuille de style et des clans,
 * lint N8 des couleurs littérales. Pas de navigateur : contraste WCAG et mélange oklab calculés ici.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CLANS, UNKNOWN_CLAN } from "../src/rules/l5r4e";
import { THEME_BG } from "../src/ui/theme";
import { channelGap, contrast, mixOklab } from "./helpers/color";

const CSS_DIR = resolve("src/ui");
const css = readFileSync(join(CSS_DIR, "styles.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Blocs de thème : `:root`, `:root:not([data-theme="light"])` (dans la media query sombre), `:root[data-theme="dark"]`. */
const THEME_BLOCK = /(?:^|[{}])\s*(:root(?:\[data-theme="dark"\]|:not\(\[data-theme="light"\]\))?)\s*\{([^{}]*)\}/g;

function themeBlocks(text: string): Map<string, string> {
  const blocks = new Map<string, string>();
  for (const m of text.matchAll(THEME_BLOCK)) blocks.set(m[1]!, m[2]!);
  return blocks;
}

function declarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

const blocks = themeBlocks(css);
const light = declarations(blocks.get(":root")!);
const dark = { ...light, ...declarations(blocks.get(':root[data-theme="dark"]')!) };
type Theme = "light" | "dark";
type Clan = { light: string; inkLight: string; dark: string; inkDark: string };

/** Valeur hexadécimale d'un jeton, `var()` et `color-mix(in oklab, …)` résolus, pour un clan donné. */
function token(name: string, theme: Theme, clan: Clan = UNKNOWN_CLAN): string {
  const decls = {
    ...(theme === "light" ? light : dark),
    "--clan-l": clan.light, "--clan-ink-l": clan.inkLight, "--clan-d": clan.dark, "--clan-ink-d": clan.inkDark,
  };
  const resolve = (value: string): string => {
    const v = /^var\((--[\w-]+)\)$/.exec(value);
    if (v) return resolve(decls[v[1] as keyof typeof decls]!);
    const mix = /^color-mix\(in oklab,\s*var\((--[\w-]+)\) (\d+)%,\s*var\((--[\w-]+)\)\)$/.exec(value);
    if (mix) return mixOklab(resolve(`var(${mix[1]})`), Number(mix[2]) / 100, resolve(`var(${mix[3]})`));
    if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
    throw new Error(`${name} : valeur non résolue « ${value} »`);
  };
  return resolve(`var(${name})`);
}

const ALL_CLANS: [string, Clan][] = [...CLANS.map((c) => [c.label, c] as [string, Clan]), ["Clan non reconnu", UNKNOWN_CLAN]];
const THEMES: Theme[] = ["light", "dark"];

describe("Jetons de la feuille de style (annexe I.1.9)", () => {
  it("les deux blocs sombres sont identiques", () => {
    expect(declarations(blocks.get(':root:not([data-theme="light"])')!)).toEqual(declarations(blocks.get(':root[data-theme="dark"]')!));
  });
  it("valeurs de base : fond, surfaces, encre", () => {
    expect([token("--bg", "light"), token("--surface", "light"), token("--surface-2", "light"), token("--ink", "light")])
      .toEqual(["#ece6d8", "#f7f3ea", "#fdfbf6", "#2a261f"]);
    expect([token("--bg", "dark"), token("--surface", "dark"), token("--surface-2", "dark"), token("--ink", "dark")])
      .toEqual(["#26252a", "#302f33", "#3a393e", "#e7e5e0"]);
  });
  it("--muted calculé : ≈ #615d55 en clair, ≈ #abaaa8 en sombre", () => {
    expect(channelGap(token("--muted", "light"), "#615d55")).toBeLessThanOrEqual(2);
    expect(channelGap(token("--muted", "dark"), "#abaaa8")).toBeLessThanOrEqual(2);
  });
  it("la barre de Chrome reprend --bg (THEME_BG) et le clan par défaut est UNKNOWN_CLAN", () => {
    expect(THEME_BG).toEqual({ light: token("--bg", "light"), dark: token("--bg", "dark") });
    expect([light["--clan-l"], light["--clan-ink-l"], light["--clan-d"], light["--clan-ink-d"]])
      .toEqual([UNKNOWN_CLAN.light, UNKNOWN_CLAN.inkLight, UNKNOWN_CLAN.dark, UNKNOWN_CLAN.inkDark]);
  });
  it.each(ALL_CLANS)("%s : accent-ink = mélange oklab de l'accent avec l'encre (I.1.4)", (_label, c) => {
    expect(channelGap(mixOklab(c.light, 0.65, "#2a261f"), c.inkLight)).toBeLessThanOrEqual(2);
    expect(channelGap(mixOklab(c.dark, 0.8, "#e7e5e0"), c.inkDark)).toBeLessThanOrEqual(2);
  });
});

describe("Contrastes (annexe I.1.11)", () => {
  it.each(ALL_CLANS)("N1 : %s, clair : accent-ink sur fond, surface et accent pâle ≥ 4,5:1", (_label, c) => {
    for (const bg of ["--bg", "--surface", "--accent-pale"]) {
      expect(contrast(token("--accent-ink", "light", c), token(bg, "light", c)), bg).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(ALL_CLANS)("N2 : %s, sombre : accent-ink sur surface, surface-2 et accent pâle ≥ 4,5:1", (_label, c) => {
    for (const bg of ["--surface", "--surface-2", "--accent-pale"]) {
      expect(contrast(token("--accent-ink", "dark", c), token(bg, "dark", c)), bg).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(ALL_CLANS)("N3 : %s : accent sur surface ≥ 3:1, deux thèmes", (_label, c) => {
    for (const t of THEMES) expect(contrast(token("--accent", t, c), token("--surface", t)), t).toBeGreaterThanOrEqual(3);
  });
  it.each(THEMES)("N4 : %s : encre et texte secondaire sur fond, surface et surface-2 ≥ 4,5:1", (t) => {
    for (const fg of ["--ink", "--muted"]) {
      for (const bg of ["--bg", "--surface", "--surface-2"]) expect(contrast(token(fg, t), token(bg, t)), `${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(THEMES)("N5 : %s : danger, ok, warn sur fond et surface ≥ 4,5:1", (t) => {
    for (const fg of ["--danger", "--ok", "--warn"]) {
      for (const bg of ["--bg", "--surface"]) expect(contrast(token(fg, t), token(bg, t)), `${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(THEMES)("N6 : %s : Anneaux face à --on-ring et à la surface ≥ 3:1", (t) => {
    for (const ring of ["earth", "water", "fire", "air", "void"]) {
      const color = token(`--ring-${ring}`, t);
      expect(contrast(color, token("--on-ring", t)), `${ring} / on-ring`).toBeGreaterThanOrEqual(3);
      expect(contrast(color, token("--surface", t)), `${ring} / surface`).toBeGreaterThanOrEqual(3);
    }
  });
  it.each(ALL_CLANS)("N12 : %s : texte sur fond d'accent plein ≥ 4,5:1, deux thèmes (P-I1)", (_label, c) => {
    for (const t of THEMES) expect(contrast(token("--on-accent", t, c), token("--accent-fill", t, c)), t).toBeGreaterThanOrEqual(4.5);
  });
  it.each(ALL_CLANS)("V8 : %s : badge de version du pied de page (accent-ink sur fond) ≥ 4,5:1, deux thèmes (annexe M.3)", (_label, c) => {
    for (const t of THEMES) expect(contrast(token("--accent-ink", t, c), token("--bg", t, c)), t).toBeGreaterThanOrEqual(4.5);
  });
  it.each(THEMES)("V8 : %s : kanji du sceau (pied de page, section « Le Carnet ») ≥ 4,5:1", (t) => {
    expect(contrast(token("--seal-ink", t), token("--seal", t))).toBeGreaterThanOrEqual(4.5);
  });
  it("N7 (données) : l'accent du Scorpion n'est pas la couleur de danger", () => {
    const scorpion = CLANS.find((c) => c.id === "scorpion")!;
    for (const t of THEMES) expect(token("--accent", t, scorpion)).not.toBe(token("--danger", t));
  });
});

describe("N8 : aucune couleur littérale hors des blocs de thème", () => {
  const files = readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
  it("les feuilles de style de src/ui sont couvertes", () => {
    expect(files).toContain("styles.css");
  });
  it.each(files)("%s", (file) => {
    const text = readFileSync(join(CSS_DIR, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const outside = text.replace(THEME_BLOCK, (m) => m[0] === "{" || m[0] === "}" ? m[0] : "");
    const literals = outside.match(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi) ?? [];
    expect(literals).toEqual([]);
  });
  it("le lint repère une couleur littérale dans une règle ordinaire", () => {
    const sample = ":root{--bg:#fff}.x{color:#a82828;background:rgb(0 0 0 / .4)}";
    const outside = sample.replace(THEME_BLOCK, (m) => m[0] === "{" || m[0] === "}" ? m[0] : "");
    expect(outside.match(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi)).toEqual(["#a82828", "rgb("]);
  });
});
