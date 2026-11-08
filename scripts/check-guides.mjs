// Contrôle des deux guides joueur et des deux README (annexe 59.6), lancé par `npm run lint`.
// Usage : node scripts/check-guides.mjs [racine]
// Erreur (code 1) :
// - parité : `docs/GUIDE.md` et `docs/GUIDE-en.md` ont autant de sections `## ` numérotées, de blocs <details>,
//   et les mêmes images dans le même ordre (`img/guide/X.png` ↔ `img/guide/en/X.png`) avec le même `width` ;
// - tailles et thèmes : chaque image du guide est un <picture> dont la source sombre existe et a les dimensions
//   de l'image claire ; `width` = largeur du PNG / 2 ; aucune image Markdown `![…](img/guide/…)` ;
// - résolution : chaque lien relatif vise un fichier existant, chaque ancre existe (`<a id>` ou titre) ;
// - images : aucune capture orpheline dans docs/img/guide/, sombre/, en/ et en/sombre/.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.argv[2] ?? process.cwd();
const GUIDES = { fr: "docs/GUIDE.md", en: "docs/GUIDE-en.md" };
const DOCS = [GUIDES.fr, GUIDES.en, "README.md", "README-en.md"];
const SHOT_DIRS = ["docs/img/guide", "docs/img/guide/sombre", "docs/img/guide/en", "docs/img/guide/en/sombre"];
const errors = [];

const read = (file) => readFileSync(join(root, file), "utf8");
// Texte hors blocs de code : un lien d'exemple dans un bloc ``` n'est pas un lien.
const prose = (text) => text.replace(/^```[\s\S]*?^```/gm, "");

// Dimensions d'un PNG : en-tête IHDR, largeur et hauteur aux octets 16 et 20.
function pngSize(file) {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

// Ancre d'un titre, comme GitHub : minuscules, ponctuation retirée (accents gardés), espaces → `-`, doublons suffixés.
function anchors(text) {
  const ids = new Set();
  const seen = new Map();
  for (const m of text.matchAll(/<a id="([^"]+)"/g)) ids.add(m[1]);
  for (const m of text.matchAll(/^#{1,6} (.+)$/gm)) {
    const slug = m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, "").replace(/ /g, "-");
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    ids.add(n ? `${slug}-${n}` : slug);
  }
  return ids;
}

// Images du guide, dans l'ordre : <picture> (source sombre + <img>) ; les images Markdown sont des erreurs.
function pictures(file) {
  const text = prose(read(file));
  for (const m of text.matchAll(/!\[[^\]]*\]\((img\/guide\/[^)]+)\)/g)) errors.push(`${file} : image Markdown ${m[1]}, attendu <picture>`);
  const out = [];
  for (const m of text.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
    const dark = /<source media="\(prefers-color-scheme: dark\)" srcset="([^"]+)">/.exec(m[1])?.[1];
    const img = /<img src="([^"]+)"[^>]*\swidth="(\d+)"/.exec(m[1]);
    if (!dark || !img) { errors.push(`${file} : <picture> sans source sombre ou sans <img … width>`); continue; }
    out.push({ src: img[1], dark, width: Number(img[2]) });
  }
  // Toute <img> du guide doit être dans un <picture>.
  const loose = text.replace(/<picture>[\s\S]*?<\/picture>/g, "").match(/<img src="img\/guide\/[^"]+"/g) ?? [];
  for (const x of loose) errors.push(`${file} : ${x} hors d'un <picture>`);
  return out;
}

// Parité des deux guides.
const fr = read(GUIDES.fr), en = read(GUIDES.en);
const count = (text, re) => (prose(text).match(re) ?? []).length;
const sections = (text) => count(text, /^## \S+ · /gm);
if (sections(fr) !== sections(en)) errors.push(`parité : ${sections(fr)} sections en français, ${sections(en)} en anglais`);
if (count(fr, /<details>/g) !== count(en, /<details>/g)) {
  errors.push(`parité : ${count(fr, /<details>/g)} blocs <details> en français, ${count(en, /<details>/g)} en anglais`);
}
const pics = { fr: pictures(GUIDES.fr), en: pictures(GUIDES.en) };
const name = (src) => src.split("/").pop();
if (pics.fr.length !== pics.en.length) errors.push(`parité : ${pics.fr.length} images en français, ${pics.en.length} en anglais`);
pics.fr.forEach((p, i) => {
  const q = pics.en[i];
  if (!q) return;
  if (name(p.src) !== name(q.src)) errors.push(`parité : image ${i + 1}, ${name(p.src)} en français, ${name(q.src)} en anglais`);
  if (p.width !== q.width) errors.push(`parité : ${name(p.src)}, width ${p.width} en français, ${q.width} en anglais`);
});

// Tailles et thèmes : chemins attendus, PNG existants, sombre = clair, width = largeur / 2.
const referenced = new Set();
for (const [lang, file] of Object.entries(GUIDES)) {
  const base = lang === "en" ? "img/guide/en" : "img/guide";
  for (const p of pics[lang]) {
    const id = name(p.src);
    if (p.src !== `${base}/${id}` || p.dark !== `${base}/sombre/${id}`) errors.push(`${file} : ${p.src} / ${p.dark}, attendu ${base}/${id} et ${base}/sombre/${id}`);
    const light = join(root, dirname(file), p.src), dark = join(root, dirname(file), p.dark);
    referenced.add(light); referenced.add(dark);
    if (!existsSync(light) || !existsSync(dark)) { errors.push(`${file} : ${!existsSync(light) ? p.src : p.dark} introuvable`); continue; }
    const a = pngSize(light), b = pngSize(dark);
    if (a.width !== b.width || a.height !== b.height) errors.push(`${file} : ${id}, ${a.width} × ${a.height} en clair, ${b.width} × ${b.height} en sombre`);
    if (a.width !== p.width * 2) errors.push(`${file} : ${id}, width ${p.width}, attendu ${a.width / 2} (largeur du PNG / 2)`);
  }
}

// Résolution des liens relatifs et des ancres, dans les deux guides et les deux README.
for (const file of DOCS) {
  const text = prose(read(file));
  const targets = [
    ...[...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ...[...text.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const t of targets) {
    if (/^[a-z]+:/i.test(t)) continue;
    const [path, hash] = t.split("#");
    const target = path ? join(root, dirname(file), decodeURI(path)) : join(root, file);
    if (!existsSync(target)) { errors.push(`${file} : lien ${t}, fichier introuvable`); continue; }
    if (hash !== undefined && target.endsWith(".md") && !anchors(readFileSync(target, "utf8")).has(decodeURI(hash))) {
      errors.push(`${file} : lien ${t}, ancre introuvable`);
    }
  }
}

// Captures orphelines.
for (const dir of SHOT_DIRS) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (f.endsWith(".png") && !referenced.has(join(abs, f))) errors.push(`${relative(root, join(abs, f))} : capture sans référence dans les guides`);
  }
}

if (errors.length) {
  console.error(`check-guides : ${errors.length} écart(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-guides : ${pics.fr.length} images par guide, ${DOCS.length} documents, liens et ancres valides`);
