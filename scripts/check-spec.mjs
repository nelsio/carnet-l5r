// Contrôle des références à la spécification (annexe 44.4), lancé par `npm run lint`.
// Usage : node scripts/check-spec.mjs [racine]
// Erreur (code 1) : un paragraphe (§ suivi d'un numéro) ou une annexe (lettre ou numéro de lot)
// sans section ni fichier dans spec/.
// Avertissement (code 0) : sous-section d'annexe sans titre `### <id>.N` (plusieurs annexes ne
// numérotent pas leurs titres).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] ?? process.cwd();
const SCANNED = ["src", "tests", "scripts", ".github", "spec", "HANDOFF.md", "CLAUDE.md"];
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|css|html)$/;

function walk(path, out) {
  if (!existsSync(path)) return out;
  if (statSync(path).isFile()) return TEXT.test(path) ? [...out, path] : out;
  for (const name of readdirSync(path)) {
    if (name !== "node_modules") out = walk(join(path, name), out);
  }
  return out;
}

// Sections : `## N.` et `### N.M` (éventuellement « bis ») des fichiers de spec/.
const sections = new Set();
const specDir = join(root, "spec");
for (const name of existsSync(specDir) ? readdirSync(specDir) : []) {
  if (!name.endsWith(".md")) continue;
  for (const line of readFileSync(join(specDir, name), "utf8").split("\n")) {
    const m = /^#{2,3} (\d+(?:\.\d+)?(?: bis)?)\.?\s/.exec(line);
    if (m) sections.add(m[1]);
  }
}

// Annexes : un fichier `spec/annexes/<id>-….md` ; sous-sections : titres `### <id>.N`.
const annexes = new Map();
const annexDir = join(specDir, "annexes");
for (const name of existsSync(annexDir) ? readdirSync(annexDir) : []) {
  const id = /^([A-Z]|\d+)-.*\.md$/.exec(name)?.[1];
  if (!id) continue;
  const subs = new Set();
  for (const line of readFileSync(join(annexDir, name), "utf8").split("\n")) {
    const m = /^#{3,4} ([A-Z]|\d+)\.(\d+(?: bis)?)\b/.exec(line);
    if (m && m[1] === id) subs.add(m[2]);
  }
  annexes.set(id, subs);
}

const SECTION_REF = /§\s?(\d+(?:\.\d+)?)( bis)?/g;
const ANNEX_REF = /\b[Aa]nnexes? ([A-Z]|\d+)(?![\p{L}\d-])(?:\.(\d+))?( bis)?/gu;

const errors = [];
const warnings = [];
const files = SCANNED.flatMap((entry) => walk(join(root, entry), []));
for (const name of readdirSync(root)) {
  if (/\.config\./.test(name)) files.push(join(root, name));
}

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const where = `${relative(root, file)}:${i + 1}`;
    for (const [ref, num, bis] of line.matchAll(SECTION_REF)) {
      const id = bis ? `${num} bis` : num;
      if (!sections.has(id) && !sections.has(num)) errors.push(`${where} : ${ref} introuvable dans spec/`);
    }
    for (const [ref, id, sub, bis] of line.matchAll(ANNEX_REF)) {
      const subs = annexes.get(id);
      if (!subs) errors.push(`${where} : ${ref} introuvable dans spec/annexes/`);
      else if (sub && !subs.has(bis ? `${sub} bis` : sub) && !subs.has(sub)) {
        warnings.push(`${where} : ${ref} sans titre « ### ${id}.${sub} »`);
      }
    }
  });
}

if (warnings.length) {
  console.log(`check-spec : ${warnings.length} avertissement(s)`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`check-spec : ${errors.length} erreur(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-spec : ${files.length} fichiers, références valides`);
