// Captures annotées du guide joueur (annexes 57.6 et 59.5). Usage : npm run build && npm run guide-shots [-- en] [-- clair|sombre]
// Sceaux vermillon numérotés en kanji, cadre washi (style « rouleau de Rokugan », annexe 57.8).
// Deux thèmes par exécution, clair puis sombre, mêmes noms et mêmes dimensions (annexe 59.5) ; `clair` ou `sombre` en limite un.
// Taille d'affichage fixée (`display`, px CSS) : l'image fait exactement 2 × display px de large, cadre compris.
// Données : modèles intégrés (Kakita Haruto, Tamori Ayane), aucune fiche personnelle.
// Les annotations sont injectées dans la page capturée, jamais dans l'application.
// Navigateur : celui de Playwright ; CHROMIUM_PATH pour en imposer un autre.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const args = process.argv.slice(2);
const lang = args.includes("en") ? "en" : "fr";
const THEMES = ["clair", "sombre"].filter((th) => !args.some((a) => a === "clair" || a === "sombre") || args.includes(th));
const L = { fr: { locale: "fr-FR", out: "docs/img/guide" }, en: { locale: "en-US", out: "docs/img/guide/en" } }[lang];

// Noms accessibles de l'interface, par langue (annexe 59.5).
const LABELS = {
  fr: {
    photo: "Depuis une photo…", forge: /Ouvrir la Forge/, blank: "Nouvelle fiche vierge", importJson: "Importer un JSON", importJsonMore: "Importer un JSON…",
    useTemplate: (type) => `Utiliser le modèle ${type}`, templates: "Modèles de personnage",
    copyPrompt: "Copier le prompt", aiReply: "Réponse de l'IA", check: "Vérifier",
    library: "Bibliothèque", roller: /^Lanceur de dés/, resources: "Ressources", view: "Vue",
    editRings: "Edit : Anneaux & Traits", rings: "Anneaux & Traits", agility: "Agilité", done: /^Terminer/,
    newDayMore: "Nouvelle journée…", newDay: "Nouvelle journée", situation: "Situation", aid: "Assistant L5R", stats: "Statistiques",
    combatType: "Type de combat", skirmish: "Escarmouche", combat: "Combat", attack: /^Attaque · Katana/, damageRow: /^└ Dégâts · Katana/, memento: /^Mémento de combat/,
    stance: "Posture", newRound: "Nouveau round", initiative: /^Initiative/,
    roll: /^Lancer/, rollerDialog: "Lanceur de dés", raisesExtra: "Augm. libres",
    addDamage: "Ajouter Augmentation des dégâts", realTotal: "Total obtenu aux dés", realNote: "Noter le résultat",
    slots: "Emplacements de sorts restants", magic: "Magie", cast: /^Lancer · Frappe de jade/, spellDamage: /^Dégâts · Frappe de jade/,
    scrolls: "Rouleaux & invocations", grimoire: "Grimoire (nouvel onglet)", spellLink: /^Frappe de jade dans le grimoire/,
    voidPoint: /^Avec un point de Vide/, export: "Exporter la fiche", link: "Lier à un fichier…", file: "Fichier",
    resourcesMenu: "Ressources L5R", clanPage: /page du clan/, language: "Langue",
  },
  en: {
    photo: "From a photo…", forge: /Open the Forge/, blank: "New blank sheet", importJson: "Import a JSON", importJsonMore: "Import a JSON…",
    useTemplate: (type) => `Use the ${type} template`, templates: "Character templates",
    copyPrompt: "Copy the prompt", aiReply: "AI reply", check: "Check",
    library: "Library", roller: /^Dice roller/, resources: "Resources", view: "View",
    editRings: "Edit: Rings & Traits", rings: "Rings & Traits", agility: "Agility", done: /^Done/,
    newDayMore: "New day…", newDay: "New day", situation: "Situation", aid: "L5R Assistant", stats: "Statistics",
    combatType: "Combat type", skirmish: "Skirmish", combat: "Combat", attack: /^Attack · Katana/, damageRow: /^└ Damage · Katana/, memento: /^Mémento de combat/,
    stance: "Stance", newRound: "New round", initiative: /^Initiative/,
    roll: /^Roll/, rollerDialog: "Dice roller", raisesExtra: "Extra Raises",
    addDamage: "Add Increased Damage", realTotal: "Total rolled", realNote: "Record result",
    slots: "Spell slots left", magic: "Magic", cast: /^Cast · Jade Strike/, spellDamage: /^Damage · Jade Strike/,
    scrolls: "Scrolls & invocations", grimoire: "Grimoire (new tab)", spellLink: /^Jade Strike in the grimoire/,
    voidPoint: /^With a Void Point/, export: "Export the sheet", link: "Link to a file…", file: "File",
    resourcesMenu: "L5R resources", clanPage: /clan page/, language: "Language",
  },
};
const T = LABELS[lang];

// Couleurs des annotations et du cadre, par thème (annexe 59.5) : encre sur washi, ou or pâle sur laque sumi.
const INK = {
  clair: { ring: "#2b2118", bg: "#efe3c8", grain: "0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .08 0", line: "#2b2118", kanji: "#2b2118" },
  sombre: { ring: "#efe3c8", bg: "#1c1915", grain: "0 0 0 0 .94  0 0 0 0 .89  0 0 0 0 .78  0 0 0 .06 0", line: "#c9b48a", kanji: "#e8dcc0" },
};

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
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const VIEWPORTS = { desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } };

async function open(viewport, theme) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[viewport], deviceScaleFactor: 2,
    colorScheme: theme === "sombre" ? "dark" : "light", locale: L.locale });
  // Dés reproductibles : mêmes jets à chaque exécution, donc mêmes images, dans les deux thèmes.
  await ctx.addInitScript(() => {
    let s = 7;
    Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const tab = (p, name) => p.getByRole("group", { name: T.view }).getByRole("button", { name });
const situation = (p, name) => p.getByRole("group", { name: T.situation }).getByRole("button", { name, exact: true });
const settle = (p) => p.waitForTimeout(400);
const top = (p) => p.evaluate(() => window.scrollTo(0, 0));
const skirmish = async (p) => {
  await tab(p, T.aid).click();
  await situation(p, T.combat).click();
  await p.getByRole("button", { name: T.skirmish, exact: true }).click();
};

// Une entrée par capture (annexes 57.7 et 59.5).
// display : largeur d'affichage dans le guide, en px CSS ; l'image fait 2 × display px.
// marks : [numéro, locator (ou liste de locators, entourés ensemble), coin du sceau : "tl" (défaut) | "tr" | "bl" | "br"]
// clip : locators dont l'union, avec 24 px de marge, borne la capture ; ou { x, y } pour prendre la largeur
// des uns et la hauteur des autres ; null pour l'écran entier. margin : marge du recadrage (24 px par défaut).
const SHOTS = [
  {
    id: "01-accueil", kanji: "始", viewport: "desktop", display: 640, open: null, steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: T.photo })],
      [2, p.getByRole("link", { name: T.forge })],
      [3, p.getByRole("button", { name: T.blank })],
      [4, p.getByRole("button", { name: T.importJson, exact: true }), "tr"],
    ],
    clip: null,
  },
  {
    id: "01b-modeles", kanji: "始", viewport: "desktop", display: 640, open: null, steps: async () => {},
    marks: (p) => [[5, p.getByRole("button", { name: T.useTemplate("Bushi") }), "tr"]],
    clip: (p) => [p.getByRole("region", { name: T.templates })],
  },
  {
    id: "03-photo", kanji: "写", viewport: "desktop", display: 480, open: null,
    steps: async (p) => p.getByRole("button", { name: T.photo }).click(),
    marks: (p) => [
      [1, p.getByRole("button", { name: T.copyPrompt }), "tr"],
      [2, p.getByRole("textbox", { name: T.aiReply }), "tr"],
      [3, p.getByRole("button", { name: T.check }), "tr"],
    ],
    clip: (p) => [p.getByRole("dialog")],
  },
  {
    id: "04-fiche", kanji: "帳面", viewport: "desktop", display: 640, open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: T.library, exact: true }), "bl"],
      [2, p.getByRole("button", { name: T.roller }), "bl"],
      [3, p.getByRole("button", { name: T.resources }), "br"],
      [4, p.getByRole("group", { name: T.view }), "bl"],
      [5, p.locator(".status-in"), "bl"],
      [6, p.getByRole("button", { name: T.editRings }), "tr"],
    ],
    clip: null,
  },
  {
    id: "04-barre-etat", kanji: "状", viewport: "desktop", display: 720, open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.locator(".wtrack"), "bl"],
      [2, p.locator(".wtile"), "tr"],
      [3, p.locator(".vblock"), "tr"],
      [4, p.locator(".cstats"), "tr"],
      [5, p.getByRole("button", { name: T.newDayMore }), "tr"],
    ],
    clip: (p) => [p.locator(".status"), p.getByRole("group", { name: T.newDay })],
  },
  {
    id: "04-edition", kanji: "筆", viewport: "desktop", display: 640, open: "Bushi",
    steps: async (p) => {
      const block = p.getByRole("region", { name: T.rings });
      await block.getByRole("button", { name: /^Edit/ }).click();
      await block.getByRole("spinbutton", { name: T.agility }).fill("4");
      await block.getByRole("spinbutton", { name: T.agility }).blur();
    },
    marks: (p) => {
      const block = p.getByRole("region", { name: T.rings });
      return [[1, block.getByRole("spinbutton", { name: T.agility }), "tr"], [2, block.getByRole("button", { name: T.done }), "tr"]];
    },
    clip: (p) => [p.getByRole("region", { name: T.rings })],
  },
  {
    id: "05-assistant", kanji: "助", viewport: "desktop", display: 600, open: "Bushi", steps: skirmish,
    marks: (p) => [
      [1, p.getByRole("group", { name: T.situation })],
      [2, p.getByRole("group", { name: T.combatType })],
      [3, p.getByRole("button", { name: T.attack })],
      [4, p.getByRole("link", { name: T.memento })],
    ],
    clip: (p) => [p.getByRole("group", { name: T.situation }), p.getByRole("button", { name: T.attack }), p.getByRole("link", { name: T.memento })],
  },
  {
    // De l'Initiative aux modificateurs de la Posture, repliée par défaut, sans « Dépenser du Vide » (annexes 59.5, 61.7).
    id: "05-escarmouche", kanji: "戦", viewport: "desktop", display: 560, open: "Bushi", steps: skirmish,
    marks: (p) => [
      [1, p.getByRole("combobox", { name: T.stance }), "tr"],
      [2, p.getByRole("button", { name: T.newRound }), "tr"],
      [3, p.getByRole("button", { name: T.initiative }), "tr"],
    ],
    clip: (p) => [p.getByRole("button", { name: T.initiative }), p.getByTestId("posture-fx")],
    margin: 8,
  },
  {
    // Du titre de l'action à la ligne de résultat, sans « Derniers jets » (annexe 59.5).
    id: "06-lanceur", kanji: "賽", viewport: "desktop", display: 304, open: "Bushi",
    steps: async (p) => {
      await skirmish(p);
      await p.getByRole("button", { name: T.attack }).click(); await settle(p);
      await p.getByRole("button", { name: T.roll }).last().click();
    },
    marks: (p) => {
      const d = p.getByRole("dialog", { name: T.rollerDialog });
      return [
        [1, d.locator(".poolbig"), "tr"],
        [2, d.locator(".ch"), "tr"],
        [3, d.getByRole("spinbutton", { name: T.raisesExtra }), "tr"],
        [4, d.locator(".rollbtn"), "tr"],
        [5, d.locator(".verdict"), "tr"],
      ];
    },
    clip: (p) => {
      const d = p.getByRole("dialog", { name: T.rollerDialog });
      return { x: [d], y: [d.getByRole("heading").first(), d.locator(".verdict"), d.locator(".verdict + *")] };
    },
    margin: 16,
  },
  {
    // Lanceur masqué : Attaque · Katana, 1 Augmentation des dégâts, total 31 noté aux vrais dés (annexe 62.7).
    id: "06b-vrais-des", kanji: "賽", viewport: "desktop", display: 304, open: "Bushi",
    steps: async (p) => {
      await p.getByRole("button", { name: T.roller }).click();
      await skirmish(p);
      await p.getByRole("button", { name: T.attack }).click(); await settle(p);
      const d = p.getByRole("dialog", { name: T.rollerDialog });
      await d.getByRole("button", { name: T.addDamage }).click();
      await d.getByRole("spinbutton", { name: T.realTotal }).fill("31");
      await d.getByRole("button", { name: T.realNote }).click();
      // Le champ se vide après « Noter » : on y remet le total pour la capture.
      await d.getByRole("spinbutton", { name: T.realTotal }).fill("31");
    },
    marks: (p) => {
      const d = p.getByRole("dialog", { name: T.rollerDialog });
      return [
        [1, d.getByRole("spinbutton", { name: T.realTotal }), "tr"],
        [2, d.getByRole("button", { name: T.realNote }), "tr"],
        [3, d.locator(".mr-use"), "tr"],
        [4, d.locator(".verdict"), "tr"],
      ];
    },
    clip: (p) => {
      const d = p.getByRole("dialog", { name: T.rollerDialog });
      return { x: [d], y: [d.locator(".tnline").last(), d.locator(".verdict"), d.locator(".verdict ~ .hint").last()] };
    },
    margin: 8,
  },
  {
    // Des emplacements (一) à la carte des dégâts du sort (四), sans en-tête, blessures ni barre d'onglets (annexe 59.5).
    id: "07-magie-mobile", kanji: "術", viewport: "mobile", display: 320, open: "Shugenja",
    steps: async (p) => {
      await tab(p, T.aid).click();
      await situation(p, T.magic).click();
    },
    marks: (p) => [
      [1, p.getByRole("button", { name: T.slots }), "bl"],
      [2, situation(p, T.magic), "tr"],
      [3, p.getByRole("button", { name: T.cast }), "tr"],
      [4, p.getByRole("button", { name: T.spellDamage }), "tr"],
    ],
    clip: (p) => ({ x: [p.locator("main")], y: [p.getByRole("button", { name: T.slots }), p.getByRole("button", { name: T.spellDamage })] }),
    margin: 8,
  },
  {
    id: "07-sorts", kanji: "巻", viewport: "desktop", display: 520, open: "Shugenja",
    steps: async () => {},
    marks: (p) => {
      const block = p.getByRole("region", { name: T.scrolls });
      return [
        [1, block.getByRole("button", { name: /^Edit/ }), "tr"],
        [2, block.getByRole("link", { name: T.grimoire, exact: true }), "bl"],
        [3, block.getByRole("link", { name: T.spellLink }), "tr"],
      ];
    },
    clip: (p) => [p.getByRole("region", { name: T.scrolls })],
  },
  {
    // Titre, trois cases, en-tête du tableau et lignes Initiative à Dégâts · Katana (annexe 59.5).
    id: "09-stats", kanji: "数", viewport: "desktop", display: 720, open: "Bushi",
    steps: async (p) => tab(p, T.stats).click(),
    marks: (p) => [
      [1, p.getByRole("checkbox", { name: T.voidPoint }).locator(".."), "tr"],
      [2, p.getByRole("row", { name: T.attack }).getByRole("cell").nth(1), "tr"],
      [3, p.getByRole("row", { name: T.attack }).getByRole("cell").nth(7), "tr"],
    ],
    clip: (p) => ({ x: [p.locator("main")], y: [p.locator("main").getByRole("heading").first(), p.getByRole("row", { name: T.damageRow })] }),
    margin: 8,
  },
  {
    id: "10-fichier", kanji: "保", viewport: "desktop", display: 640, open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, p.getByRole("button", { name: T.export }), "bl"],
      [2, p.getByRole("button", { name: T.importJsonMore }), "tr"],
      [3, p.getByRole("button", { name: T.link }), "tr"],
    ],
    clip: (p) => [p.getByRole("heading", { name: T.file }), p.locator(".file-actions"), p.locator(".file-actions + .hint")],
  },
  {
    // En-tête et premier groupe du menu (portail et clan) ; le sceau 二 est sur le bouton Ressources (annexe 59.5).
    id: "12-en-tete", kanji: "言", viewport: "desktop", display: 640, open: "Bushi",
    steps: async (p) => p.getByRole("button", { name: T.resources }).click(),
    marks: (p) => [
      [1, p.getByRole("group", { name: T.language }), "bl"],
      [2, p.getByRole("button", { name: T.resources }), "bl"],
      [3, p.getByRole("link", { name: T.clanPage }), "tr"],
    ],
    clip: (p) => [p.locator("header.top"), p.getByRole("menu", { name: T.resourcesMenu }).getByRole("group").first()],
    margin: 8,
  },
  {
    id: "04-fiche-mobile", kanji: "帳面", viewport: "mobile", display: 256, open: "Bushi", steps: async () => {},
    marks: (p) => [
      [1, [p.getByRole("button", { name: T.library, exact: true }), p.getByRole("button", { name: T.resources })], "bl"],
      [4, p.getByRole("group", { name: T.language }), "tr"],
      [2, p.locator(".status-in"), "bl"],
      [3, p.getByRole("group", { name: T.view }), "tr"],
    ],
    clip: null,
  },
];

const KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

// Cadre : proportions d'une image de 1 730 px (capture de 1 500 px + 230 px de cadre), mises à l'échelle de la largeur finale.
const FRAME_REF = 1730;
const frameInner = (W) => W - 2 * Math.round(60 * W / FRAME_REF) - Math.round(110 * W / FRAME_REF);

// Sceaux vermillon et traits de pinceau, posés dans la page (annexe 57.8).
// `k` agrandit sceaux et traits pour qu'un sceau mesure au moins 18 px CSS une fois l'image affichée (annexe 59.5).
async function annotate(page, marks, k, theme) {
  for (const [n, loc, corner = "tl"] of marks) {
    const r = await box(page, Array.isArray(loc) ? loc : [loc], n);
    await page.evaluate(({ r, corner, k, n, ring: color }) => {
      const x = r.x + scrollX, y = r.y + scrollY, S = 28 * k;
      // Trait de pinceau : deux anneaux légèrement décalés, rayons irréguliers.
      for (const [dx, rot, op] of [[0, -0.6, 0.85], [2 * k, 0.5, 0.35]]) {
        const ring = document.createElement("div");
        Object.assign(ring.style, { position: "absolute", left: `${x - 6 + dx}px`, top: `${y - 6}px`,
          width: `${r.width + 12}px`, height: `${r.height + 12}px`, border: `${2.5 * k}px solid ${color}`,
          borderRadius: "18px 10px 22px 8px / 10px 20px 9px 16px", transform: `rotate(${rot}deg)`,
          opacity: op, zIndex: 9998, pointerEvents: "none" });
        document.body.append(ring);
      }
      // Sceau vermillon, chiffre en kanji.
      const seal = document.createElement("div");
      seal.textContent = n;
      // Le sceau reste dans la fenêtre, même sur un élément collé au bord.
      const left = Math.min(Math.max(corner.includes("r") ? x + r.width - 8 * k : x - 20 * k, 2), innerWidth - S - 4);
      Object.assign(seal.style, { position: "absolute",
        left: `${left}px`, top: `${Math.max(corner.includes("b") ? y + r.height - 8 * k : y - 20 * k, scrollY + 2)}px`,
        width: `${S}px`, height: `${S}px`, background: "#b8321f", color: "#fbf3e2",
        font: `800 ${17 * k}px/${S}px 'Shippori Mincho B1', serif`, textAlign: "center", borderRadius: `${4 * k}px`, transform: "rotate(-4deg)",
        boxShadow: `inset 0 0 0 ${2 * k}px #fbf3e2, inset 0 0 0 ${3 * k}px #b8321f, 0 1px 3px rgba(0,0,0,.35)`, zIndex: 9999, pointerEvents: "none" });
      document.body.append(seal);
    }, { r, corner, k, n: KANJI[n], ring: INK[theme].ring });
  }
}

// Cadre washi (clair) ou laque sumi (sombre) : marge, double filet, cartouche vertical (titre kanji + sceau 帳).
// L'image finale fait exactement W px de large.
async function frame(buffer, title, file, W, theme) {
  const c = INK[theme], s = W / FRAME_REF;
  const M = Math.round(60 * s), side = Math.round(110 * s), w = frameInner(W);
  const inner = await sharp(buffer).resize({ width: w }).toBuffer();
  const { height: h } = await sharp(inner).metadata();
  const H = h + M * 2, cx = w + M * 2 + side / 2 - 6 * s, u = (n) => +(n * s).toFixed(2);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/>
      <feColorMatrix values="${c.grain}"/></filter></defs>
    <rect width="100%" height="100%" fill="${c.bg}"/><rect width="100%" height="100%" filter="url(#n)"/>
    <rect x="${u(18)}" y="${u(18)}" width="${W - u(36)}" height="${H - u(36)}" fill="none" stroke="${c.line}" stroke-width="${u(3)}"/>
    <rect x="${u(28)}" y="${u(28)}" width="${W - u(56)}" height="${H - u(56)}" fill="none" stroke="${c.line}" stroke-width="${u(1)}"/>
    <rect x="${M - u(6)}" y="${M - u(6)}" width="${w + u(12)}" height="${h + u(12)}" fill="none" stroke="${c.line}" stroke-width="${u(1.5)}"/>
    <line x1="${w + M * 2 - u(10)}" y1="${u(40)}" x2="${w + M * 2 - u(10)}" y2="${H - u(40)}" stroke="${c.line}" stroke-width="${u(1)}"/>
    <text x="${cx}" y="${u(80)}" font-family="${CJK}, serif" font-size="${u(46)}" font-weight="700"
      fill="${c.kanji}" writing-mode="tb" letter-spacing="${u(10)}">${title}</text>
    <rect x="${cx - u(24)}" y="${H - u(120)}" width="${u(48)}" height="${u(48)}" rx="${u(5)}" fill="#b8321f" transform="rotate(-5 ${cx} ${H - u(96)})"/>
    <text x="${cx}" y="${H - u(84)}" text-anchor="middle" font-family="${CJK}, serif" font-size="${u(30)}" font-weight="700" fill="#fbf3e2">帳</text>
  </svg>`;
  await sharp(Buffer.from(svg)).composite([{ input: inner, left: M, top: M }])
    .png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(file);
  return { width: W / 2, height: Math.round(H / 2) };
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

// Boîte d'un recadrage : union des locators, ou largeur de `x` et hauteur de `y`.
async function clipBox(page, zone) {
  if (Array.isArray(zone)) return box(page, zone, "du recadrage");
  const bx = await box(page, zone.x, "du recadrage"), by = await box(page, zone.y, "du recadrage");
  return { x: bx.x, width: bx.width, y: by.y, height: by.height };
}

// Zone de recadrage, page en haut : la fenêtre est agrandie jusqu'au bas de la zone, sans défilement,
// pour que la barre d'état (collante) et le lanceur (fixe) restent à leur place.
// Sur mobile, la barre d'onglets (fixe, en bas) reste sous la zone : 120 px de plus.
async function clipZone(page, zone, mobile, margin = 24) {
  await top(page); await settle(page);
  const { width } = page.viewportSize();
  const first = await clipBox(page, zone);
  await page.setViewportSize({ width, height: Math.max(720, Math.ceil(first.y + first.height + margin + (mobile ? 120 : 0))) }); await settle(page);
  const r = await clipBox(page, zone);
  const x = Math.max(0, r.x - margin), y = Math.max(0, r.y - margin);
  return { x, y, width: Math.min(width, r.x + r.width + margin) - x, height: r.y + r.height + margin - y };
}

const sizes = {};
// Recadrage calculé en clair, réutilisé en sombre : mêmes dimensions dans les deux thèmes (annexe 59.5).
const clips = {};
for (const theme of THEMES) {
  const out = resolve(theme === "sombre" ? `${L.out}/sombre` : L.out);
  await mkdir(out, { recursive: true });
  for (const s of SHOTS) {
    const page = await open(s.viewport, theme);
    if (s.open) { await page.getByRole("button", { name: T.useTemplate(s.open) }).click(); await settle(page); await top(page); }
    await s.steps(page); await settle(page);
    // Les boîtes du recadrage sont prises avant les annotations, qui débordent volontairement.
    let clip = null;
    if (s.clip) {
      const zone = await clipZone(page, s.clip(page), s.viewport === "mobile", s.margin);
      clip = clips[s.id] ??= zone;
    }
    const W = 2 * s.display;
    // Échelle d'affichage : px CSS affichés par px CSS de l'écran capturé.
    const scale = frameInner(W) / 2 / (clip?.width ?? VIEWPORTS[s.viewport].width);
    await annotate(page, s.marks(page), Math.max(1, 18 / (28 * scale)), theme); await settle(page);
    const shot = await page.screenshot(clip ? { clip } : {});
    const size = await frame(shot, s.kanji, `${out}/${s.id}.png`, W, theme);
    if (sizes[s.id] && (sizes[s.id].width !== size.width || sizes[s.id].height !== size.height)) {
      throw new Error(`Capture du guide : ${s.id} n'a pas les mêmes dimensions en clair et en sombre`);
    }
    sizes[s.id] = size;
    await page.context().close();
    console.log(`  ${theme}/${s.id}.png  ${size.width} × ${size.height}  (échelle ${scale.toFixed(2)})`);
  }
}
await browser.close();
if (THEMES.length === 2) await writeFile(resolve(`${L.out}/sizes.json`), `${JSON.stringify(sizes, null, 2)}\n`);
console.log(`Captures du guide écrites dans ${L.out}/`);
