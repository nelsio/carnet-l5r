// Ajoute à l'adresse GitHub Pages une présentation lisible sans JavaScript (annexe P). Usage : node scripts/pages-seo.mjs [dossier]
// Lancé par pages.yml sur le dossier publié seulement : le build et le fichier de release ne changent pas.
// Après #root et non dedans : React remplace le contenu de #root, le texte disparaîtrait de la page rendue par les moteurs.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const site = resolve(process.argv[2] ?? "site");

const ROOT = '<div id="root"></div>';
const BLOCK = `
    <section class="presentation" aria-label="Présentation du Carnet">
      <h1>Carnet de Rokugan</h1>
      <p>
        Le Carnet de Rokugan est un outil gratuit pour les joueurs de <i>La Légende des Cinq Anneaux</i> (L5R), 4e édition :
        une fiche de personnage et un assistant de jets de dés Roll &amp; Keep. Il fonctionne sur ordinateur et sur mobile, sans compte,
        et tes fiches restent dans ton navigateur. L'import/export JSON sert à sauvegarder une fiche ou à changer d'appareil.
        Pour découvrir les clans et créer un personnage, va voir
        <a href="https://vincenzorpg.github.io/L5R/" target="_blank" rel="noopener noreferrer">Les chroniques de Rokugan</a>, un site de fan indépendant
        avec un créateur de personnage compatible : son export JSON s'importe dans le Carnet.
      </p>
    </section>`;

const html = await readFile(`${site}/index.html`, "utf8");
const at = html.indexOf(ROOT);
if (at < 0) {
  console.error(`${ROOT} introuvable dans ${site}/index.html`);
  process.exit(1);
}

const end = at + ROOT.length;
await writeFile(`${site}/index.html`, html.slice(0, end) + BLOCK + html.slice(end));
console.log(`Présentation ajoutée à ${site}`);
