// Icônes de l'application installée (annexe O.3), dérivées de src/ui/favicon.svg. Usage : npm run pwa-icons (PNG committés).
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const svg = await readFile(resolve("src/ui/favicon.svg"));
const out = resolve("public-pages");
const SEAL = "#a8382a";
// Le lanceur peut découper un cercle de 80 % du côté : à 62 %, les coins du cadre du sceau y restent.
const MASKABLE_SCALE = 0.62;

const seal = (size) => sharp(svg, { density: (72 * size) / 64 }).resize(size).png({ compressionLevel: 9 });

await seal(192).toFile(`${out}/icon-192.png`);
await seal(512).toFile(`${out}/icon-512.png`);

const inner = Math.round(512 * MASKABLE_SCALE);
await sharp({ create: { width: 512, height: 512, channels: 4, background: SEAL } })
  .composite([{ input: await seal(inner).toBuffer(), gravity: "center" }])
  .png({ compressionLevel: 9 })
  .toFile(`${out}/icon-512-maskable.png`);
console.log("Icônes écrites dans public-pages/ : icon-192.png, icon-512.png, icon-512-maskable.png");
