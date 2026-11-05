// Contrôle des textes en dur dans l'interface (annexe 50.4), lancé par `npm run lint`.
// Usage : node scripts/check-i18n.mjs [racine]
// Cherche dans src/ui/**/*.tsx le texte JSX brut contenant une lettre (`>texte<`), hors exceptions.
// Erreur (code 1) : texte brut dans un fichier migré, ou fichier de PENDING sans texte brut (à retirer
// de la liste). Rapport (code 0) : occurrences restantes des fichiers de PENDING.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] ?? process.cwd();

/** Fichiers pas encore migrés vers le dictionnaire : la liste ne fait que diminuer, vide au lot 51. */
const PENDING = [
  "src/ui/App.tsx",
  "src/ui/components/AppFooter.tsx",
  "src/ui/components/ArmorCatalog.tsx",
  "src/ui/components/FileActions.tsx",
  "src/ui/components/ForgePending.tsx",
  "src/ui/components/Grimoire.tsx",
  "src/ui/components/ImportDialog.tsx",
  "src/ui/components/ImportReview.tsx",
  "src/ui/components/Library.tsx",
  "src/ui/components/LinkBanner.tsx",
  "src/ui/components/Modifiers.tsx",
  "src/ui/components/PhotoImportDialog.tsx",
  "src/ui/components/ResourcesMenu.tsx",
  "src/ui/components/Stats.tsx",
  "src/ui/components/fields.tsx",
];

/** Textes qui ne se traduisent pas : sigle ; les kanji seuls (sceau, pied de page) aussi. */
const EXCEPTIONS = new Set(["L5R"]);
const KANJI = /^\p{Script=Han}+$/u;

const JSX_TEXT = />\s*([\p{L}][^<{]*?)\s*</gu;

function walk(path, out) {
  if (!existsSync(path)) return out;
  if (statSync(path).isFile()) return path.endsWith(".tsx") ? [...out, path] : out;
  for (const name of readdirSync(path)) out = walk(join(path, name), out);
  return out;
}

/** Commentaires retirés, longueur des lignes gardée pour situer les occurrences. */
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
  .replace(/(^|[^:"'`])\/\/.*$/gm, (c, before) => before + " ".repeat(c.length - before.length));

function occurrences(src) {
  const code = stripComments(src);
  const found = [];
  for (const m of code.matchAll(JSX_TEXT)) {
    // `=>`, `>=` et la comparaison `a > b` ne sont pas des fins de balise.
    const before = code[m.index - 1];
    if (before === "=" || /\s/.test(before) || code[m.index + 1] === "=") continue;
    const text = m[1].replace(/\s+/g, " ").trim();
    if (EXCEPTIONS.has(text) || KANJI.test(text)) continue;
    found.push({ line: code.slice(0, m.index).split("\n").length, text });
  }
  return found;
}

let errors = 0;
let reported = 0;
const files = walk(join(root, "src/ui"), []).map((f) => relative(root, f).split("\\").join("/")).sort();
for (const file of files) {
  const found = occurrences(readFileSync(join(root, file), "utf8"));
  const pending = PENDING.includes(file);
  if (pending && !found.length) {
    console.error(`${file} : plus aucun texte brut, à retirer de PENDING`);
    errors++;
  }
  for (const { line, text } of found) {
    if (pending) reported++;
    else errors++;
    (pending ? console.log : console.error)(`${file}:${line} : « ${text} »`);
  }
}
for (const file of PENDING.filter((f) => !files.includes(f))) {
  console.error(`${file} : fichier absent, à retirer de PENDING`);
  errors++;
}

console.log(`check-i18n : ${reported} texte(s) brut(s) dans ${PENDING.length} fichier(s) non migré(s).`);
if (errors) {
  console.error(`check-i18n : ${errors} erreur(s).`);
  process.exit(1);
}
