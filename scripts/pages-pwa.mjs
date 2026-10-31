// Rend l'adresse GitHub Pages installable et disponible hors ligne (annexe O.3). Usage : node scripts/pages-pwa.mjs [dossier]
// Lancé par pages.yml après la copie de index.html, sur le dossier publié seulement : le build et le fichier de release ne changent pas.
import { cp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const site = resolve(process.argv[2] ?? "site");
const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

// localhost : contexte sûr, pour les tests de bout en bout (cas W8 et W9).
const TAGS = `<link rel="manifest" href="manifest.webmanifest" />
    <script>
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
      }
    </script>
  `;

const html = await readFile(`${site}/index.html`, "utf8");
const head = html.indexOf("</head>");
if (head < 0) {
  console.error(`</head> introuvable dans ${site}/index.html`);
  process.exit(1);
}

await cp(new URL("../public-pages/", import.meta.url), site, { recursive: true });
const sw = await readFile(`${site}/sw.js`, "utf8");
await writeFile(`${site}/sw.js`, sw.replaceAll("__APP_VERSION__", version));
await writeFile(`${site}/index.html`, html.slice(0, head) + TAGS + html.slice(head));
console.log(`Service worker carnet-v${version} et manifeste ajoutés à ${site}`);
