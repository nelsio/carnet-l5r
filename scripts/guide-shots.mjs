// Captures annotées du guide joueur (annexe 57.6). Usage : npm run build && npm run guide-shots
// Thème clair, sceaux vermillon numérotés en kanji, cadre washi (style « rouleau de Rokugan », annexe 57.8).
// Données : modèles intégrés (Kakita Haruto, Tamori Ayane), aucune fiche personnelle.
// Les annotations sont injectées dans la page capturée, jamais dans l'application.
// Navigateur : celui de Playwright ; CHROMIUM_PATH pour en imposer un autre.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

// Français seulement : le guide n'existe qu'en français (annexe 57.4). `en` est prévu, pas branché.
const lang = process.argv[2] === "en" ? "en" : "fr";
if (lang === "en") throw new Error("Captures du guide : pas de guide anglais, seul le français est produit.");
const L = { locale: "fr-FR", out: "docs/img/guide" };

// Police CJK du cartouche, rendue par sharp (SVG) : Noto Serif CJK JP, ou Hiragino Mincho sous macOS.
function cjkFont() {
  try {
    const fonts = execFileSync("fc-list", [":lang=ja", "family"], { encoding: "utf8" });
    for (const family of ["Noto Serif CJK JP", "Hiragino Mincho ProN"]) if (fonts.includes(family)) return family;
  } catch {
    // Pas de fc-list (macOS) : on cherche la police système.
    if (existsSync("/System/Library/Fonts/ヒラギノ明朝 ProN.ttc")) return "Hiragino Mincho ProN";
  }
  throw new Error("Captures du guide : police CJK introuvable. Installe Noto Serif CJK JP (paquet fonts-noto-cjk).");
}
const CJK = cjkFont();

const url = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const out = resolve(L.out);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const VIEWPORTS = { desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } };

async function open(viewport) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[viewport], deviceScaleFactor: 2, colorScheme: "light", locale: L.locale });
  // Dés reproductibles : mêmes jets à chaque exécution, donc mêmes images.
  await ctx.addInitScript(() => {
    let s = 7;
    Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const tab = (p, name) => p.getByRole("group", { name: "Vue" }).getByRole("button", { name });
const situation = (p, name) => p.getByRole("group", { name: "Situation" }).getByRole("button", { name, exact: true });
const settle = (p) => p.waitForTimeout(400);
const top = (p) => p.evaluate(() => window.scrollTo(0, 0));

// Une entrée par capture (annexe 57.7).
// marks : [numéro, locator (ou liste de locators, entourés ensemble), coin du sceau : "tl" (défaut) | "tr" | "bl" | "br"]
// clip : locators dont l'union, avec 24 px de marge, borne la capture ; null pour l'écran entier.
const SHOTS = [
  {
    id: "01-accueil", kanji: "始", viewport: "desktop", open: null, steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: "Depuis une photo…" })],
      [2, p.getByRole("link", { name: /Ouvrir la Forge/ })],
      [3, p.getByRole("button", { name: "Nouvelle fiche vierge" })],
      [4, p.getByRole("button", { name: "Importer un JSON", exact: true }), "tr"],
    ],
    clip: null,
  },
  {
    id: "01b-modeles", kanji: "始", viewport: "desktop", open: null, steps: async () => {},
    marks: (p) => [[5, p.getByRole("button", { name: "Utiliser le modèle Bushi" }), "tr"]],
    clip: (p) => [p.getByRole("region", { name: "Modèles de personnage" })],
  },
  {
    id: "03-photo", kanji: "写", viewport: "desktop", open: null,
    steps: async (p) => p.getByRole("button", { name: "Depuis une photo…" }).click(),
    marks: (p) => [
      [1, p.getByRole("button", { name: "Copier le prompt" }), "tr"],
      [2, p.getByRole("textbox", { name: "Réponse de l'IA" }), "tr"],
      [3, p.getByRole("button", { name: "Vérifier" }), "tr"],
    ],
    clip: (p) => [p.getByRole("dialog")],
  },
  {
    id: "04-fiche", kanji: "帳面", viewport: "desktop", open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: "Bibliothèque", exact: true }), "bl"],
      [2, p.getByRole("button", { name: /^Lanceur de dés/ }), "bl"],
      [3, p.getByRole("button", { name: "Ressources" }), "br"],
      [4, p.getByRole("group", { name: "Vue" }), "bl"],
      [5, p.locator(".status-in"), "bl"],
      [6, p.getByRole("button", { name: "Edit : Anneaux & Traits" }), "tr"],
    ],
    clip: null,
  },
  {
    id: "04-barre-etat", kanji: "状", viewport: "desktop", open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.locator(".wtrack"), "bl"],
      [2, p.locator(".wtile"), "tr"],
      [3, p.locator(".vblock"), "tr"],
      [4, p.locator(".cstats"), "tr"],
      [5, p.getByRole("button", { name: "Nouvelle journée…" }), "tr"],
    ],
    clip: (p) => [p.locator(".status"), p.getByRole("group", { name: "Nouvelle journée" })],
  },
  {
    id: "04-edition", kanji: "筆", viewport: "desktop", open: "Bushi",
    steps: async (p) => {
      const block = p.getByRole("region", { name: "Anneaux & Traits" });
      await block.getByRole("button", { name: /^Edit/ }).click();
      await block.getByRole("spinbutton", { name: "Agilité" }).fill("4");
      await block.getByRole("spinbutton", { name: "Agilité" }).blur();
    },
    marks: (p) => {
      const block = p.getByRole("region", { name: "Anneaux & Traits" });
      return [[1, block.getByRole("spinbutton", { name: "Agilité" }), "tr"], [2, block.getByRole("button", { name: /^Terminer/ }), "tr"]];
    },
    clip: (p) => [p.getByRole("region", { name: "Anneaux & Traits" })],
  },
  {
    id: "05-assistant", kanji: "助", viewport: "desktop", open: "Bushi",
    steps: async (p) => {
      await tab(p, "Assistant L5R").click();
      await situation(p, "Combat").click();
      await p.getByRole("button", { name: "Escarmouche", exact: true }).click();
    },
    marks: (p) => [
      [1, p.getByRole("group", { name: "Situation" })],
      [2, p.getByRole("group", { name: "Type de combat" })],
      [3, p.getByRole("button", { name: /^Attaque · Katana/ })],
      [4, p.getByRole("link", { name: /^Mémento de combat/ })],
    ],
    clip: (p) => [p.getByRole("group", { name: "Situation" }), p.getByRole("button", { name: /^Attaque · Katana/ }), p.getByRole("link", { name: /^Mémento de combat/ })],
  },
  {
    id: "05-escarmouche", kanji: "戦", viewport: "desktop", open: "Bushi",
    steps: async (p) => {
      await tab(p, "Assistant L5R").click();
      await situation(p, "Combat").click();
      await p.getByRole("button", { name: "Escarmouche", exact: true }).click();
    },
    marks: (p) => [
      [1, p.getByRole("combobox", { name: "Posture" }), "tr"],
      [2, p.getByRole("button", { name: "Nouveau round" }), "tr"],
      [3, p.getByRole("button", { name: /^Initiative/ }), "tr"],
    ],
    clip: (p) => [p.getByRole("button", { name: /^Initiative/ }), p.getByRole("group", { name: "Dépenser du Vide" })],
  },
  {
    id: "06-lanceur", kanji: "賽", viewport: "desktop", open: "Bushi",
    steps: async (p) => {
      await tab(p, "Assistant L5R").click();
      await situation(p, "Combat").click();
      await p.getByRole("button", { name: "Escarmouche", exact: true }).click();
      await p.getByRole("button", { name: /^Attaque · Katana/ }).click(); await settle(p);
      await p.getByRole("button", { name: /^Lancer/ }).last().click();
    },
    marks: (p) => {
      const d = p.getByRole("dialog", { name: "Lanceur de dés" });
      return [
        [1, d.locator(".poolbig"), "tr"],
        [2, d.locator(".ch"), "tr"],
        [3, d.getByRole("spinbutton", { name: "Augm. libres" }), "tr"],
        [4, d.locator(".rollbtn"), "tr"],
        [5, d.locator(".verdict"), "tr"],
      ];
    },
    clip: (p) => [p.getByRole("dialog", { name: "Lanceur de dés" })],
  },
  {
    id: "07-magie-mobile", kanji: "術", viewport: "mobile", open: "Shugenja",
    steps: async (p) => {
      await tab(p, "Assistant L5R").click();
      await situation(p, "Magie").click();
    },
    marks: (p) => [
      [1, p.getByRole("button", { name: "Emplacements de sorts restants" }), "bl"],
      [2, situation(p, "Magie"), "tr"],
      [3, p.getByRole("button", { name: /^Lancer · Frappe de jade/ }), "tr"],
      [4, p.getByRole("button", { name: /^Dégâts · Frappe de jade/ }), "tr"],
    ],
    clip: null,
  },
  {
    id: "07-sorts", kanji: "巻", viewport: "desktop", open: "Shugenja",
    steps: async () => {},
    marks: (p) => {
      const block = p.getByRole("region", { name: "Rouleaux & invocations" });
      return [
        [1, block.getByRole("button", { name: /^Edit/ }), "tr"],
        [2, block.getByRole("link", { name: "Grimoire (nouvel onglet)", exact: true }), "bl"],
        [3, block.getByRole("link", { name: /^Frappe de jade dans le grimoire/ }), "tr"],
      ];
    },
    clip: (p) => [p.getByRole("region", { name: "Rouleaux & invocations" })],
  },
  {
    id: "09-stats", kanji: "数", viewport: "desktop", open: "Bushi",
    steps: async (p) => tab(p, "Statistiques").click(),
    marks: (p) => [
      [1, p.getByRole("checkbox", { name: /^Avec un point de Vide/ }).locator(".."), "tr"],
      [2, p.getByRole("row", { name: /^Attaque · Katana/ }).getByRole("cell").nth(1), "tr"],
      [3, p.getByRole("row", { name: /^Attaque · Katana/ }).getByRole("cell").nth(7), "tr"],
    ],
    clip: (p) => [p.locator("main")],
  },
  {
    id: "10-fichier", kanji: "保", viewport: "desktop", open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: "Exporter la fiche" }), "bl"],
      [2, p.getByRole("button", { name: "Importer un JSON…" }), "tr"],
      [3, p.getByRole("button", { name: "Lier à un fichier…" }), "tr"],
    ],
    clip: (p) => [p.getByRole("heading", { name: "Fichier" }), p.locator(".file-actions"), p.locator(".file-actions + .hint")],
  },
  {
    id: "12-en-tete", kanji: "言", viewport: "desktop", open: "Bushi",
    steps: async (p) => p.getByRole("button", { name: "Ressources" }).click(),
    marks: (p) => [
      [1, p.getByRole("group", { name: "Langue" }), "bl"],
      [2, p.getByRole("menu", { name: "Ressources L5R" }), "br"],
      [3, p.getByRole("link", { name: /page du clan/ }), "tr"],
    ],
    clip: (p) => [p.locator("header.top"), p.getByRole("menu", { name: "Ressources L5R" })],
  },
  {
    id: "04-fiche-mobile", kanji: "帳面", viewport: "mobile", open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, [p.getByRole("button", { name: "Bibliothèque", exact: true }), p.getByRole("button", { name: "Ressources" })], "bl"],
      [4, p.getByRole("group", { name: "Langue" }), "tr"],
      [2, p.locator(".status-in"), "bl"],
      [3, p.getByRole("group", { name: "Vue" }), "tr"],
    ],
    clip: null,
  },
];

const KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

// Sceaux vermillon et traits de pinceau, posés dans la page (annexe 57.8).
async function annotate(page, marks) {
  for (const [n, loc, corner = "tl"] of marks) {
    const r = await box(page, Array.isArray(loc) ? loc : [loc], n);
    await page.evaluate(({ r, corner, k }) => {
      const x = r.x + scrollX, y = r.y + scrollY;
      // Trait de pinceau : deux anneaux légèrement décalés, rayons irréguliers.
      for (const [dx, rot, op] of [[0, -0.6, 0.85], [2, 0.5, 0.35]]) {
        const ring = document.createElement("div");
        Object.assign(ring.style, { position: "absolute", left: `${x - 6 + dx}px`, top: `${y - 6}px`,
          width: `${r.width + 12}px`, height: `${r.height + 12}px`, border: "2.5px solid #2b2118",
          borderRadius: "18px 10px 22px 8px / 10px 20px 9px 16px", transform: `rotate(${rot}deg)`,
          opacity: op, zIndex: 9998, pointerEvents: "none" });
        document.body.append(ring);
      }
      // Sceau vermillon, chiffre en kanji.
      const seal = document.createElement("div");
      seal.textContent = k;
      // Le sceau reste dans la fenêtre, même sur un élément collé au bord.
      const left = Math.min(Math.max(corner.includes("r") ? x + r.width - 8 : x - 20, 2), innerWidth - 32);
      Object.assign(seal.style, { position: "absolute",
        left: `${left}px`, top: `${corner.includes("b") ? y + r.height - 8 : y - 20}px`,
        width: "28px", height: "28px", background: "#b8321f", color: "#fbf3e2",
        font: "800 17px/28px 'Shippori Mincho B1', serif", textAlign: "center", borderRadius: "4px", transform: "rotate(-4deg)",
        boxShadow: "inset 0 0 0 2px #fbf3e2, inset 0 0 0 3px #b8321f, 0 1px 3px rgba(0,0,0,.35)", zIndex: 9999, pointerEvents: "none" });
      document.body.append(seal);
    }, { r, corner, k: KANJI[n] });
  }
}

// Cadre washi : marge papier, double filet, cartouche vertical (titre kanji + sceau 帳).
async function frame(buffer, title, file, width) {
  const inner = await sharp(buffer).resize({ width }).toBuffer();
  const { width: w, height: h } = await sharp(inner).metadata();
  const M = 60, side = 110, W = w + M * 2 + side, H = h + M * 2, cx = w + M * 2 + side / 2 - 6;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .08 0"/></filter></defs>
    <rect width="100%" height="100%" fill="#efe3c8"/><rect width="100%" height="100%" filter="url(#n)"/>
    <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="#2b2118" stroke-width="3"/>
    <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#2b2118" stroke-width="1"/>
    <rect x="${M - 6}" y="${M - 6}" width="${w + 12}" height="${h + 12}" fill="none" stroke="#2b2118" stroke-width="1.5"/>
    <line x1="${w + M * 2 - 10}" y1="40" x2="${w + M * 2 - 10}" y2="${H - 40}" stroke="#2b2118" stroke-width="1"/>
    <text x="${cx}" y="80" font-family="${CJK}, serif" font-size="46" font-weight="700"
      fill="#2b2118" writing-mode="tb" letter-spacing="10">${title}</text>
    <rect x="${cx - 24}" y="${H - 120}" width="48" height="48" rx="5" fill="#b8321f" transform="rotate(-5 ${cx} ${H - 96})"/>
    <text x="${cx}" y="${H - 84}" text-anchor="middle" font-family="${CJK}, serif" font-size="30" font-weight="700" fill="#fbf3e2">帳</text>
  </svg>`;
  await sharp(Buffer.from(svg)).composite([{ input: inner, left: M, top: M }])
    .png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(file);
}

// Boîte englobante de plusieurs locators, en coordonnées de la fenêtre.
async function box(page, locators, what) {
  const boxes = [];
  for (const loc of locators) {
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Capture du guide : élément ${what} introuvable`);
    boxes.push(b);
  }
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y };
}

// Zone de recadrage, page en haut : la fenêtre est agrandie jusqu'au bas de la zone, sans défilement,
// pour que la barre d'état (collante) et le lanceur (fixe) restent à leur place.
async function clipZone(page, locators, margin = 24) {
  await top(page); await settle(page);
  const { width } = page.viewportSize();
  const first = await box(page, locators, "du recadrage");
  await page.setViewportSize({ width, height: Math.max(720, Math.ceil(first.y + first.height + margin)) }); await settle(page);
  const r = await box(page, locators, "du recadrage");
  const x = Math.max(0, r.x - margin), y = Math.max(0, r.y - margin);
  return { x, y, width: Math.min(width, r.x + r.width + margin) - x, height: r.y + r.height + margin - y };
}

await mkdir(out, { recursive: true });
for (const s of SHOTS) {
  const page = await open(s.viewport);
  if (s.open) { await page.getByRole("button", { name: `Utiliser le modèle ${s.open}` }).click(); await settle(page); await top(page); }
  await s.steps(page); await settle(page);
  // Les boîtes du recadrage sont prises avant les annotations, qui débordent volontairement.
  const clip = s.clip ? await clipZone(page, s.clip(page)) : null;
  await annotate(page, s.marks(page)); await settle(page);
  const shot = await page.screenshot(clip ? { clip } : {});
  await frame(shot, s.kanji, `${out}/${s.id}.png`, s.viewport === "mobile" ? 700 : Math.min(1500, Math.round((clip?.width ?? 1280) * 2)));
  await page.context().close();
  console.log(`  ${s.id}.png`);
}
await browser.close();
console.log(`Captures du guide écrites dans ${L.out}/`);
