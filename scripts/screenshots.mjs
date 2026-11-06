// Captures du README (thème sombre). Usage : npm run build && npm run screenshots [-- en]
// Français par défaut → docs/img/ ; `en` → docs/img/en/ (annexe 52.5).
// Données : modèles intégrés (Kakita Haruto, Tamori Ayane), aucune fiche personnelle.
// Navigateur : celui de Playwright ; CHROMIUM_PATH pour en imposer un autre.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const lang = process.argv[2] === "en" ? "en" : "fr";
// Textes cliqués, par langue (règles traduites au lot 53). Les noms de sort viennent du modèle : en français jusqu'au lot 54.
const L = {
  fr: {
    locale: "fr-FR", out: "docs/img", use: "Utiliser", view: "Vue", aid: "Assistant L5R", roll: /^Lancer/,
    skirmish: "Escarmouche", attack: /Attaque · Katana/, magic: "Magie", cast: /Lancer · Frappe de jade/,
  },
  en: {
    locale: "en-US", out: "docs/img/en", use: /^Use the /, view: "View", aid: "L5R Assistant", roll: /^Roll/,
    skirmish: "Skirmish", attack: /Attack · Katana/, magic: "Magic", cast: /Cast · Frappe de jade/,
  },
}[lang];
const url = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const out = resolve(L.out);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function open(width, height, deviceScaleFactor = 2) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, colorScheme: "dark", locale: L.locale });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const tab = (p, name) => p.getByRole("group", { name: L.view }).getByRole("button", { name });
const situation = (p, name) => p.getByRole("group", { name: "Situation" }).getByRole("button", { name, exact: true });
// Pauses courtes : laissent finir le rendu et les transitions avant chaque capture.
const settle = (p) => p.waitForTimeout(400);

await mkdir(out, { recursive: true });
const shots = {};

// Bureau : fiche, puis escarmouche avec un jet lancé.
const d = await open(1280, 720);
await d.getByRole("button", { name: L.use }).first().click(); await settle(d);
await d.evaluate(() => window.scrollTo(0, 0)); await settle(d);
shots.fiche = await d.screenshot();
await tab(d, L.aid).click();
await situation(d, "Combat").click();
await d.getByRole("button", { name: L.skirmish, exact: true }).click();
await d.getByRole("button", { name: L.attack }).first().click(); await settle(d);
await d.getByRole("button", { name: L.roll }).last().click(); await settle(d);
await d.getByRole("button", { name: L.attack }).first().evaluate((e) => e.scrollIntoView({ block: "center" })); await settle(d);
shots.combat = await d.screenshot();

// Mobile : fiche, Assistant L5R en Magie, lanceur d'un sort.
const m = await open(390, 844);
await m.getByRole("button", { name: L.use }).nth(1).click(); await settle(m);
await m.evaluate(() => window.scrollTo(0, 0)); await settle(m);
const phones = [await m.screenshot()];
await tab(m, L.aid).click();
await situation(m, L.magic).click(); await settle(m);
phones.push(await m.screenshot());
await m.getByRole("button", { name: L.cast }).click(); await settle(m);
phones.push(await m.screenshot());

await browser.close();

const png = (img) => img.png({ palette: true, quality: 90, compressionLevel: 9 });
for (const name of ["fiche", "combat"]) await png(sharp(shots[name]).resize({ width: 1600 })).toFile(`${out}/${name}.png`);

// Triptyque mobile, 48 px transparents entre les écrans (à l'échelle 2x).
const { width: w, height: h } = await sharp(phones[0]).metadata();
const gap = 48;
const strip = await sharp({ create: { width: w * 3 + gap * 2, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(phones.map((input, i) => ({ input, left: i * (w + gap), top: 0 })))
  .png().toBuffer();
await png(sharp(strip).resize({ width: 1600 })).toFile(`${out}/mobile.png`);
console.log(`Captures écrites dans ${L.out}/ : fiche.png, combat.png, mobile.png`);
