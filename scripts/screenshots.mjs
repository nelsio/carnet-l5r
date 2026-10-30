// Captures du README (thème sombre). Usage : npm run build && npm run screenshots
// Données : modèles intégrés (Kakita Haruto, Tamori Ayane), aucune fiche personnelle.
// Navigateur : celui de Playwright ; CHROMIUM_PATH pour en imposer un autre.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const url = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const out = resolve("docs/img");
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function open(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: "dark", locale: "fr-FR" });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const tab = (p, name) => p.getByRole("group", { name: "Vue" }).getByRole("button", { name });
const situation = (p, name) => p.getByRole("group", { name: "Situation" }).getByRole("button", { name, exact: true });
// Pauses courtes : laissent finir le rendu et les transitions avant chaque capture.
const settle = (p) => p.waitForTimeout(400);

await mkdir(out, { recursive: true });
const shots = {};

// Bureau : fiche, puis escarmouche avec un jet lancé.
const d = await open(1280, 720);
await d.getByRole("button", { name: "Utiliser" }).first().click(); await settle(d);
shots.fiche = await d.screenshot();
await tab(d, "Aide de jeu").click();
await situation(d, "Combat").click();
await d.getByRole("button", { name: "Escarmouche", exact: true }).click();
await d.getByRole("button", { name: /Attaque · Katana/ }).first().click(); await settle(d);
await d.getByRole("button", { name: /^Lancer/ }).last().click(); await settle(d);
await d.getByRole("button", { name: /Attaque · Katana/ }).first().evaluate((e) => e.scrollIntoView({ block: "center" })); await settle(d);
shots.combat = await d.screenshot();

// Mobile : fiche, aide de jeu Magie, lanceur d'un sort.
const m = await open(390, 844);
await m.getByRole("button", { name: "Utiliser" }).nth(1).click(); await settle(m);
await m.evaluate(() => window.scrollTo(0, 0)); await settle(m);
const phones = [await m.screenshot()];
await tab(m, "Aide de jeu").click();
await situation(m, "Magie").click(); await settle(m);
phones.push(await m.screenshot());
await m.getByRole("button", { name: /Lancer · Frappe de jade/ }).click(); await settle(m);
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
console.log("Captures écrites dans docs/img/ : fiche.png, combat.png, mobile.png");
