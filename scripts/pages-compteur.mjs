// Ajoute le compteur de visites GoatCounter à l'adresse GitHub Pages (annexe O.5, P13). Usage : node scripts/pages-compteur.mjs [dossier]
// Lancé par pages.yml sur le dossier publié seulement : le build et le fichier de release ne changent pas.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const site = resolve(process.argv[2] ?? "site");

// Le code du site GoatCounter n'apparaît qu'ici.
const COUNT = "https://carnet-l5r.goatcounter.com/count";

// Titre fixe : count.js enverrait sinon document.title, qui porte le nom du personnage (annexe G.3).
// Version épinglée et intégrité : ce script tourne sur la même origine que les fiches, un fichier modifié est refusé.
const TAGS = `<!-- Mesure de fréquentation (GoatCounter, sans cookies, annexe O.5) -->
    <script data-goatcounter="${COUNT}"
            data-goatcounter-settings='{"title":"Carnet de Rokugan"}'
            async src="https://gc.zgo.at/count.v5.js"
            crossorigin="anonymous"
            integrity="sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ"></script>
    <noscript>
      <img src="${COUNT}?p=/noscript" alt="" width="1" height="1">
    </noscript>
  `;

const html = await readFile(`${site}/index.html`, "utf8");
const body = html.lastIndexOf("</body>");
if (body < 0) {
  console.error(`</body> introuvable dans ${site}/index.html`);
  process.exit(1);
}

await writeFile(`${site}/index.html`, html.slice(0, body) + TAGS + html.slice(body));
console.log(`Compteur de visites ajouté à ${site}`);
