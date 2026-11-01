// Image de partage public-pages/og-image.png depuis assets/og-image.svg (annexe P). Usage : npm run og-image
// Lancé à la main, PNG committé. Polices du Carnet : le rendu ne dépend pas de celles de la machine.
// Navigateur : celui de Playwright ; CHROMIUM_PATH pour en imposer un autre.
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const font = async (family, weight, file) => {
  const data = (await readFile(`src/ui/fonts/${file}`)).toString("base64");
  return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;
};
const faces = await Promise.all([
  font("Shippori Mincho B1", 800, "shippori-mincho-b1-800-latin.woff2"),
  font("Zen Kaku Gothic New", 500, "zen-kaku-gothic-new-500-latin.woff2"),
]);
const svg = await readFile("assets/og-image.svg", "utf8");

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><meta charset="utf-8"><style>${faces.join("")}body{margin:0}svg{display:block}</style>${svg}`);
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot();
await browser.close();

await sharp(shot).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile("public-pages/og-image.png");
console.log("Image écrite : public-pages/og-image.png");
