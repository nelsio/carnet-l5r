/** Version mobile (HANDOFF §7), tests M1 à M15 (§10.5). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { openWounds, woundsButton, woundsTile } from "./wounds";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Ouvre le build et crée une fiche avec Kenjutsu et un katana : attaques, manœuvres et dégâts. */
async function start(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await page.getByRole("button", { name: "Edit : Compétences" }).click();
  await page.getByRole("button", { name: "+ Compétence" }).click();
  await page.getByRole("textbox", { name: "Nom de la compétence" }).fill("Kenjutsu");
  await page.getByRole("button", { name: "Terminer : Compétences" }).click();
  await page.getByRole("button", { name: "Edit : Armes" }).click();
  await page.getByRole("button", { name: "+ Arme" }).click();
  await page.getByRole("group", { name: /^Arme : / }).getByRole("textbox", { name: "Nom" }).fill("Katana");
  await page.getByRole("button", { name: "Terminer : Armes" }).click();
}

/** Ouvre tous les blocs de la fiche en modification (bouton « Edit » de chacun, annexe E.9 S2). */
async function editAllBlocks(page: Page) {
  const edit = page.getByRole("button", { name: /^Edit : / });
  while (await edit.count()) await edit.first().click();
}

const tab = (page: Page, name: "Fiche" | "Aide de jeu" | "Statistiques") => page.getByRole("group", { name: "Vue" }).getByRole("button", { name });
/** Le panneau fermé est masqué : on le cible par sa classe pour vérifier son état. */
const panel = (page: Page) => page.locator(".roller");
const rollButton = (page: Page) => panel(page).getByRole("button", { name: /^Lancer/ });

async function openAction(page: Page, situation: string, action: RegExp, sub?: string) {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: situation, exact: true }).click();
  if (sub) await page.getByRole("button", { name: sub, exact: true }).click();
  await page.locator("button.act").filter({ hasText: action }).first().click();
  await expect(panel(page)).toHaveClass(/open/);
  await settled(panel(page));
}

/** Attend la fin de l'animation d'ouverture du panneau. */
async function settled(el: Locator) {
  await el.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
}

async function noHorizontalScroll(page: Page, view: string) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, `défilement horizontal : ${view}`).toBeLessThanOrEqual(client);
}

/** L'élément est entièrement dans la fenêtre. */
async function inViewport(page: Page, el: Locator) {
  const box = (await el.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5);
}

test.beforeEach(async ({ page }) => start(page));

test("M1 : aucune vue ne défile horizontalement", async ({ page }) => {
  await noHorizontalScroll(page, "Fiche");
  await editAllBlocks(page);
  await noHorizontalScroll(page, "Fiche en modification");
  await tab(page, "Aide de jeu").click();
  for (const s of ["Enquête", "Cour", "Déplacement", "Combat"]) {
    await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: s, exact: true }).click();
    await noHorizontalScroll(page, s);
  }
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  for (const sub of ["Escarmouche", "Duel iaijutsu", "Bataille"]) {
    await page.getByRole("button", { name: sub, exact: true }).click();
    await noHorizontalScroll(page, sub);
  }
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await noHorizontalScroll(page, "lanceur ouvert");
  await page.keyboard.press("Escape");
  await tab(page, "Statistiques").click();
  await noHorizontalScroll(page, "Statistiques");
  await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
  await expect(page.getByRole("heading", { name: "Bibliothèque" })).toBeVisible();
  await noHorizontalScroll(page, "Bibliothèque");
  await page.getByRole("button", { name: /^Supprimer / }).click();
  await noHorizontalScroll(page, "Bibliothèque, confirmation de suppression");
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: /^Ouvrir / }).click();
  // La fiche doit être rouverte avant l'import : sinon le fichier part dans le champ de la Bibliothèque, qui disparaît.
  await expect(page.getByRole("button", { name: "Exporter la fiche" })).toBeVisible();
  const patch = { schemaVersion: 1, traits: { agility: 4 }, skills: [{ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] }], notes: "x".repeat(400), foo: 1 };
  await page.getByLabel("Fichier JSON à importer").setInputFiles({ name: "fusion-avec-un-nom-de-fichier-tres-long.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(patch)) });
  await expect(page.getByRole("dialog")).toBeVisible();
  await noHorizontalScroll(page, "fenêtre d'import");
  await inViewport(page, page.getByRole("dialog").getByRole("button", { name: "Appliquer" }));
});

test("M2 : la barre de navigation est fixe en bas, sur Fiche, Aide de jeu et Statistiques", async ({ page }) => {
  const vp = page.viewportSize()!;
  for (const view of ["Fiche", "Aide de jeu", "Statistiques"] as const) {
    await tab(page, view).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const nav = page.getByRole("group", { name: "Vue" });
    await expect(nav).toBeVisible();
    expect(await nav.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
    const box = (await nav.boundingBox())!;
    expect(Math.abs(box.y + box.height - vp.height)).toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1);
  }
});

test("M3 (E26) : un appui sur le résumé ouvre le détail, une ligne par niveau sous la barre ; un second le replie", async ({ page }) => {
  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  const summary = page.locator("button.wsum");
  const track = page.getByLabel("Niveaux de blessure");
  const detail = page.getByTestId("wound-detail");
  await expect(summary).toBeVisible();
  await expect(track).toBeHidden();
  await expect(detail).toHaveCount(0);
  await summary.click();
  await expect(detail).toBeVisible();
  await expect(track).toBeHidden();
  const rows = detail.getByRole("listitem");
  await expect(rows).toHaveCount(8);
  const boxes = await rows.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), width: Math.round(r.width) })));
  // Une ligne par niveau, de haut en bas, toutes de la même largeur.
  expect(boxes.every((b, i) => i === 0 || b.top > boxes[i - 1]!.top)).toBe(true);
  expect(new Set(boxes.map((b) => b.width)).size).toBe(1);
  await expect(rows.first()).toHaveAttribute("aria-current", "step");
  await expect(rows.first()).toContainText("Indemne");
  const summaryBox = (await summary.boundingBox())!;
  expect((await detail.boundingBox())!.y).toBeGreaterThanOrEqual(summaryBox.y + summaryBox.height);
  await summary.click();
  await expect(detail).toHaveCount(0);
});

test("M4 : choisir une action ouvre le panneau ; « Lancer » est visible sans défiler", async ({ page }) => {
  await tab(page, "Aide de jeu").click();
  await expect(panel(page)).not.toHaveClass(/open/);
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await expect(rollButton(page)).toBeVisible();
  await inViewport(page, rollButton(page));
});

test("M5 : après un lancer, le résultat est visible et le panneau reste ouvert ; une option ne ramène pas en haut", async ({ page }) => {
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await rollButton(page).click();
  await expect(panel(page)).toHaveClass(/open/);
  const dice = panel(page).getByLabel("Dés", { exact: true });
  await expect(dice).toBeVisible();
  await inViewport(page, dice);

  const scrollTop = () => panel(page).evaluate((el) => el.scrollTop);
  await panel(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const before = await scrollTop();
  expect(before).toBeGreaterThan(0);
  await panel(page).getByRole("button", { name: "Ajouter Augmentation des dégâts" }).click();
  expect(await scrollTop()).toBe(before);
});

test("M6 : le panneau se ferme par ×, par appui sur le fond et par Échap", async ({ page }) => {
  await openAction(page, "Enquête", /Remarquer un détail/);
  await panel(page).getByRole("button", { name: "Fermer" }).click();
  await expect(panel(page)).not.toHaveClass(/open/);

  await page.locator("button.act").filter({ hasText: /Remarquer un détail/ }).click();
  await expect(panel(page)).toHaveClass(/open/);
  await page.mouse.click(page.viewportSize()!.width / 2, 20);
  await expect(panel(page)).not.toHaveClass(/open/);

  await page.locator("button.act").filter({ hasText: /Remarquer un détail/ }).click();
  await expect(panel(page)).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(panel(page)).not.toHaveClass(/open/);
});

test("M6 bis : la page ne défile pas derrière le panneau ouvert", async ({ page }) => {
  await openAction(page, "Enquête", /Remarquer un détail/);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
});

test("M7 : en modification, les champs ont une police d'au moins 16 px", async ({ page }) => {
  await editAllBlocks(page);
  // Le champ fichier caché (bouton « Importer ») n'est jamais saisi au clavier.
  const sizes = await page.locator("input:not([type=checkbox]):not([type=file]), select, textarea").evaluateAll((els) =>
    els.map((e) => ({ name: e.getAttribute("aria-label") ?? e.className, size: parseFloat(getComputedStyle(e).fontSize) })));
  expect(sizes.length).toBeGreaterThan(20);
  expect(sizes.filter((s) => s.size < 16)).toEqual([]);
});

test("M8 : cibles tactiles d'au moins 40 × 40 px (−/+, pastilles, onglets)", async ({ page }) => {
  await openWounds(page);
  const targets = [
    page.getByRole("button", { name: "Retirer 1 blessure" }),
    page.getByRole("button", { name: "Ajouter 1 blessure" }),
    page.getByRole("button", { name: "Point de Vide 1" }),
    page.getByRole("button", { name: "Point de Vide 2" }),
    tab(page, "Fiche"),
    tab(page, "Aide de jeu"),
    tab(page, "Statistiques"),
  ];
  for (const t of targets) {
    const box = (await t.boundingBox())!;
    expect(box.width, await t.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(40);
    expect(box.height, await t.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(40);
  }
});

test.describe("M9 : à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("les 4 tuiles de la barre d'état sont entièrement visibles, sans troncature ni retour à la ligne", async ({ page }) => {
    const tiles = page.locator(".cstats > *");
    await expect(tiles).toHaveCount(4);
    const report = await tiles.evaluateAll((els) => els.map((tile) => {
      const tileBox = tile.getBoundingClientRect();
      return [...tile.querySelectorAll(".label, b")].map((el) => {
        const r = el.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.3;
        return {
          text: el.textContent,
          truncated: el.scrollWidth > el.clientWidth + 0.5,
          inside: r.left >= tileBox.left - 0.5 && r.right <= tileBox.right + 0.5,
          oneLine: r.height <= lineHeight * 1.5,
        };
      });
    }));
    const flat = report.flat();
    expect(flat).toHaveLength(8);
    expect(flat.filter((x) => x.truncated || !x.inside || !x.oneLine)).toEqual([]);
    await noHorizontalScroll(page, "360 px");
  });
});

/** La zone de toucher (pseudo-élément étendu) couvre au moins 40 × 40 px autour du centre. */
async function touchArea(el: Locator) {
  const box = (await el.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hits = await el.evaluate((node, { cx, cy }) =>
    [[-20, 0], [19.5, 0], [0, -20], [0, 19.5]].map(([dx, dy]) => {
      const hit = document.elementFromPoint(cx + dx!, cy + dy!);
      return !!hit && (hit === node || node.contains(hit));
    }), { cx, cy });
  expect(hits, await el.getAttribute("aria-label") ?? "").toEqual([true, true, true, true]);
}

// Lot 19 (annexe I.3.7) : le panneau Posture n'a plus de « i » ; lot 20 (annexe J.6) : le panneau Vide non plus.
test("M10 : Vide et Posture tiennent sur un écran avec leur description ; menu Vide de 40 px", async ({ page }) => {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  const vp = page.viewportSize()!;
  const stance = page.getByRole("combobox", { name: "Posture" });
  await stance.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await expect(page.getByTestId("posture-desc")).toBeVisible();
  const stancePanel = (await stance.locator("xpath=ancestor::div[contains(@class,'panel')][1]").boundingBox())!;
  expect(stancePanel.height, "Posture").toBeLessThan(vp.height);
  const voidPanel = page.getByRole("group", { name: "Dépenser du Vide" });
  await voidPanel.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await expect(voidPanel.getByTestId("void-desc")).toBeVisible();
  expect((await voidPanel.boundingBox())!.height, "Vide").toBeLessThan(vp.height);
  await touchArea(voidPanel.getByRole("combobox", { name: "Dépense de Vide" }));
  await expect(voidPanel.getByRole("button", { name: /le détail/ })).toHaveCount(0);
});

/** Lisible : ni tronqué, ni hors de la fenêtre, sans défilement horizontal de la page. */
async function fits(el: Locator) {
  const r = await el.evaluate((e) => {
    const b = e.getBoundingClientRect();
    return { truncated: e.scrollWidth > e.clientWidth + 0.5, left: b.left, right: b.right, vw: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth };
  });
  expect(r.truncated).toBe(false);
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.right).toBeLessThanOrEqual(r.vw);
  expect(r.scroll).toBeLessThanOrEqual(r.vw);
}

// Lot 21 (annexe K) : ligne Insight et badge d'écart lisibles sur mobile.
test("K1 : ligne Insight et badge d'écart lisibles, sans débordement", async ({ page }) => {
  await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
  await page.getByRole("spinbutton", { name: "Rang d'Insight" }).fill("3");
  const identity = page.getByTestId("block-identity");
  await expect(identity.getByTestId("insight-computed")).toBeVisible();
  await expect(identity.getByTestId("insight-mismatch")).toHaveText(/Rang saisi 3 · calculé \d+/);
  await fits(identity.getByTestId("insight-mismatch"));
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  for (const id of ["sheet-insight", "insight-mismatch"]) {
    await expect(identity.getByTestId(id)).toBeVisible();
    await fits(identity.getByTestId(id));
  }
});

test.describe("K1 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("ligne Insight et badge d'écart lisibles, sans débordement", async ({ page }) => {
    await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
    await page.getByRole("spinbutton", { name: "Rang d'Insight" }).fill("3");
    const identity = page.getByTestId("block-identity");
    await expect(identity.getByTestId("insight-computed")).toBeVisible();
    await expect(identity.getByTestId("insight-mismatch")).toHaveText(/Rang saisi 3 · calculé \d+/);
    await fits(identity.getByTestId("insight-mismatch"));
    await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
    for (const id of ["sheet-insight", "insight-mismatch"]) {
      await expect(identity.getByTestId(id)).toBeVisible();
      await fits(identity.getByTestId(id));
    }
});
});

// Lot 20 (annexe J.1) : bloc Armes en cartes, lisible à 390 px.
test("Q1 : Armes en Edit, une carte par arme ; Nom, Compétence, VD lisibles en entier, 16 px, sans défilement horizontal", async ({ page }) => {
  await page.getByRole("button", { name: "Edit : Armes" }).click();
  const card = page.getByRole("group", { name: "Arme : Katana" });
  await expect(card).toBeVisible();
  for (const name of ["Nom", "Compétence", "VD"]) {
    const field = card.getByRole("textbox", { name, exact: true });
    const { fontSize, fits } = await field.evaluate((el: HTMLInputElement) => ({
      fontSize: parseFloat(getComputedStyle(el).fontSize), fits: el.scrollWidth <= el.clientWidth,
    }));
    expect(fontSize, name).toBeGreaterThanOrEqual(16);
    expect(fits, name).toBe(true);
  }
  await noHorizontalScroll(page, "Armes en Edit");
});

/** « Nouveau round » : entre l'initiative et la posture ; sa description tient sur 2 lignes au plus. */
async function roundOnTwoLines(page: Page) {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  const desc = page.getByTestId("round-desc");
  const { height, lineHeight } = await desc.evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    lineHeight: parseFloat(getComputedStyle(el).lineHeight),
  }));
  expect(height / lineHeight).toBeLessThanOrEqual(2.1);
  const initiative = (await page.getByTestId("initiative").boundingBox())!;
  const round = (await page.getByRole("button", { name: "Nouveau round" }).boundingBox())!;
  const stance = (await page.getByRole("combobox", { name: "Posture" }).boundingBox())!;
  expect(round.y).toBeGreaterThan(initiative.y);
  expect(stance.y).toBeGreaterThan(round.y);
  await noHorizontalScroll(page, "Combat");
}

test("M12 : « Nouveau round » entre l'initiative et la posture, description sur 2 lignes au plus", async ({ page }) => {
  await roundOnTwoLines(page);
});

test.describe("M12 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("description de « Nouveau round » sur 2 lignes au plus", async ({ page }) => roundOnTwoLines(page));
});

/** Les onglets de situation tiennent sur une ligne, sans défilement ni texte tronqué, en zones de 40 px. */
async function situationsFit(page: Page, labels = ["Enquête", "Cour", "Déplacement", "Combat"]) {
  await tab(page, "Aide de jeu").click();
  const group = page.getByRole("group", { name: "Situation" });
  await expect(group.getByRole("button")).toHaveText(labels);
  const report = await group.evaluate((g) => {
    const vw = document.documentElement.clientWidth;
    const buttons = [...g.querySelectorAll("button")].map((b) => {
      const r = b.getBoundingClientRect();
      return { text: b.textContent, truncated: b.scrollWidth > b.clientWidth + 0.5, top: Math.round(r.top), right: r.right, height: r.height };
    });
    return { scrolls: g.scrollWidth > g.clientWidth + 0.5, vw, buttons };
  });
  expect(report.scrolls).toBe(false);
  expect(new Set(report.buttons.map((b) => b.top)).size, "une seule ligne").toBe(1);
  for (const b of report.buttons) {
    expect(b.truncated, b.text ?? "").toBe(false);
    expect(b.right, b.text ?? "").toBeLessThanOrEqual(report.vw);
    expect(b.height, b.text ?? "").toBeGreaterThanOrEqual(40);
  }
}

test("M13 : les 4 onglets de situation tiennent sur une ligne, sans défilement", async ({ page }) => {
  await situationsFit(page);
});

test.describe("M13 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("onglets de situation sur une ligne, sans défilement ni troncature", async ({ page }) => situationsFit(page));
});

test.describe("M11 : en-tête à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("H7 : sceau de 52 px ; Bibliothèque, Lanceur de dés, Thème et Ressources en icônes de 40 px sous le nom, à gauche, libellés avec l'état", async ({ page }) => {
    const buttons = [
      page.getByRole("button", { name: "Bibliothèque", exact: true }),
      page.getByRole("button", { name: "Lanceur de dés : affiché" }),
      page.getByRole("button", { name: "Thème : auto" }),
      page.getByRole("button", { name: "Ressources" }),
    ];
    // Multiplicateur de blessures masqué (annexe E.19 S6) : 4 icônes, la Bibliothèque gardée à côté du sceau (annexe G.6), Ressources en dernier (annexe L.2, O6).
    await expect(page.locator("header.top .theme-btn")).toHaveCount(4);
    const seal = (await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).boundingBox())!;
    const who = (await page.locator("header.top .who").boundingBox())!;
    // Boîte du sceau tourné de 3° : un peu plus de 52 px.
    expect(seal.width).toBeGreaterThanOrEqual(52);
    expect(seal.width).toBeLessThan(56);
    for (const b of buttons) {
      const box = (await b.boundingBox())!;
      expect(Math.round(box.width)).toBe(40);
      expect(Math.round(box.height)).toBe(40);
      expect(box.y).toBeGreaterThanOrEqual(who.y + who.height);
      await expect(b.locator(".txt")).toHaveCSS("width", "1px");
    }
    expect(Math.round((await buttons[0]!.boundingBox())!.x)).toBe(Math.round(who.x));
    const tops = await Promise.all(buttons.map(async (b) => (await b.boundingBox())!.y));
    expect(new Set(tops.map(Math.round)).size).toBe(1);
    await expect(buttons[1]!).toHaveAttribute("title", "Lanceur de dés : affiché");
    await noHorizontalScroll(page, "en-tête 360 px");
  });
});

/** Bonus de jet en lecture : trois lignes (nom, effet, cible), sans texte tronqué (annexe E.9 S1, E24). */
async function modifiersOnThreeLines(page: Page) {
  await page.getByRole("button", { name: "Edit : Bonus de jet" }).click();
  // Modèles sans nom (annexe J.4) : le joueur écrit celui de son avantage.
  const added = [["adv-skill-dice", "Voix"], ["adv-wounds", "Force de la Terre"]] as const;
  for (const [i, [id, name]] of added.entries()) {
    await page.getByRole("combobox", { name: "Modèle de bonus" }).selectOption(id);
    await page.getByRole("button", { name: "+ Bonus" }).click();
    await page.getByRole("textbox", { name: "Nom du bonus" }).nth(i).fill(name);
  }
  await page.getByRole("button", { name: "Terminer : Bonus de jet" }).click();
  const rows = page.locator(".modrow");
  await expect(rows).toHaveCount(2);
  for (const row of await rows.all()) {
    const parts = await row.evaluate((r) => [".mod-name", ".mod-effect", ".mod-target"].map((s) => {
      const e = r.querySelector(s)!;
      const b = e.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, truncated: e.scrollWidth > e.clientWidth + 0.5 };
    }));
    // Chaque partie commence sous la précédente.
    expect(parts[1]!.top).toBeGreaterThanOrEqual(parts[0]!.bottom - 0.5);
    expect(parts[2]!.top).toBeGreaterThanOrEqual(parts[1]!.bottom - 0.5);
    expect(parts.filter((p) => p.truncated)).toEqual([]);
  }
  await expect(rows.first().locator(".mod-effect")).toHaveText("+1g1 · d'office");
  await noHorizontalScroll(page, "bonus de jet");
}

test("M14 (E24) : bonus de jet sur 3 lignes, aucun texte tronqué", async ({ page }) => modifiersOnThreeLines(page));

test.describe("M14 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("bonus de jet sur 3 lignes, aucun texte tronqué", async ({ page }) => modifiersOnThreeLines(page));
});

/** Bataille de masse (annexe E.8) : panneau rempli (jet, résultat, dés de blessures) sans défilement ni texte tronqué. */
async function battleFits(page: Page) {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  await page.getByRole("button", { name: "Bataille", exact: true }).click();
  const battle = page.getByRole("group", { name: "Bataille de masse" });
  await battle.getByRole("button", { name: "Lancer 1d10" }).click();
  await battle.getByRole("checkbox", { name: "Tacticien" }).check();
  await expect(battle.getByTestId("battle-outcome")).toBeVisible();
  await battle.getByRole("button", { name: /^Lancer les dés de blessures/ }).click();
  await expect(battle.getByRole("group", { name: "Encaisser des dégâts" })).toBeVisible();
  for (const group of ["État de l'armée", "Engagement"]) {
    for (const b of await battle.getByRole("group", { name: group }).getByRole("button").all()) {
      const box = (await b.boundingBox())!;
      expect(box.height, group).toBeGreaterThanOrEqual(40);
      expect(await b.evaluate((e) => e.scrollWidth > e.clientWidth + 0.5), `${group} tronqué`).toBe(false);
    }
  }
  await noHorizontalScroll(page, "bataille de masse");
}

test("M15 : bataille de masse, boutons de 40 px, aucun texte tronqué", async ({ page }) => battleFits(page));

test.describe("M15 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("bataille de masse, boutons de 40 px, aucun texte tronqué", async ({ page }) => battleFits(page));
});

/* ---------- v2.8.0 : bloc Armure, tuile Blessures et Vide (annexe E.18, E.19) ---------- */

/** Armure du livre choisie dans le bloc Armure de la fiche. */
async function wearArmor(page: Page, id: string) {
  const block = page.getByTestId("block-armor");
  await block.getByRole("button", { name: "Edit : Armure" }).click();
  await block.getByRole("combobox", { name: "Armure du livre" }).selectOption(id);
  await block.getByRole("button", { name: "Terminer : Armure" }).click();
}

async function setVoidRing(page: Page, n: number) {
  await page.getByRole("button", { name: "Edit : Anneaux & Traits" }).click();
  await page.getByRole("spinbutton", { name: "Anneau de Vide" }).fill(String(n));
  await page.getByRole("button", { name: "Terminer : Anneaux & Traits" }).click();
}

/** Aucun texte de l'élément ne déborde (pas de « … », pas de coupure invisible). */
const overflows = (l: Locator) => l.evaluate((root) =>
  [root, ...root.querySelectorAll("*")].some((e) => e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).overflow !== "visible"));

/** M17 : bloc Vide à droite de la tuile, au plus la moitié de la largeur, pastilles sur une ligne. */
async function voidFits(page: Page, n: number) {
  await setVoidRing(page, n);
  const row = (await page.locator(".status-in").boundingBox())!;
  const tile = (await woundsTile(page).boundingBox())!;
  const block = (await page.locator(".vblock").boundingBox())!;
  expect(block.width, `Vide ${n}`).toBeLessThanOrEqual(row.width / 2 + 0.5);
  expect(block.x, `Vide ${n} chevauche la tuile`).toBeGreaterThanOrEqual(tile.x + tile.width - 0.5);
  const pips = await page.getByRole("button", { name: /^Point de Vide/ }).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(pips).toHaveLength(n);
  expect(new Set(pips).size, `${n} pastilles sur une ligne`).toBe(1);
  await expect(page.locator(".vblock .vshort")).toHaveText(new RegExp(`^Vide \\d/${n}$`));
  await expect(page.locator(".status-in > div > .label").filter({ hasText: /^Blessures$/ })).toHaveCount(0);
  await noHorizontalScroll(page, `Vide ${n}`);
}

for (const width of [360, 390]) {
  test.describe(`M17 à ${width} px de large`, () => {
    test.use({ viewport: { width, height: 780 } });
    test("bloc Vide ≤ 50 % à droite de la tuile, Vide 2 puis 6 ; pas de libellé « Blessures »", async ({ page }) => {
      await voidFits(page, 2);
      await voidFits(page, 6);
    });
  });
}

test.describe("M18 et M16 à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("M18 : tuile Blessures, + deux fois, puis 12 dégâts avec armure légère ; Vide 6 : tuile sur 2 lignes", async ({ page }) => {
    await wearArmor(page, "light");
    const tile = woundsTile(page);
    const row = (await page.locator(".status-in").boundingBox())!;
    const box = (await tile.boundingBox())!;
    // De la marge gauche jusqu'au bloc Vide.
    expect(Math.abs(box.x - row.x)).toBeLessThanOrEqual(1);
    await (await woundsButton(page, "Ajouter 1 blessure")).click();
    await page.getByRole("button", { name: "Ajouter 1 blessure" }).click();
    await expect(tile).toContainText("2/38");
    const panel = page.getByRole("group", { name: "Encaisser des dégâts" });
    await expect(panel.getByText("Ajuster")).toBeVisible();
    await panel.getByRole("spinbutton", { name: "Dégâts de l'attaque" }).fill("12");
    await panel.getByRole("button", { name: "Encaisser" }).click();
    await expect(tile).toContainText("11/38");
    await expect(panel).toHaveCount(0);

    await setVoidRing(page, 6);
    const line2 = tile.locator(".wt2");
    const h = await line2.evaluate((e) => ({ height: e.getBoundingClientRect().height, line: parseFloat(getComputedStyle(e).lineHeight) || 0, size: parseFloat(getComputedStyle(e).fontSize) }));
    expect(h.height).toBeLessThanOrEqual(h.size * 1.6);
    expect(h.size).toBeLessThanOrEqual(14);
    expect(await overflows(tile), "tuile tronquée").toBe(false);
  });

  test("M16 : bloc Armure, ND et Réduction côte à côte, règle spéciale lisible, aucun texte tronqué", async ({ page }) => {
    await wearArmor(page, "light");
    const block = page.getByTestId("armor-block");
    const tn = (await block.getByTestId("armor-block-tn").boundingBox())!;
    const red = (await block.getByTestId("armor-block-reduction").boundingBox())!;
    expect(Math.abs(tn.y - red.y)).toBeLessThanOrEqual(1);
    expect(red.x).toBeGreaterThan(tn.x + tn.width);
    await expect(block.getByTestId("armor-rule")).toBeVisible();
    expect(await overflows(block), "bloc Armure tronqué").toBe(false);
    await noHorizontalScroll(page, "bloc Armure");
  });
});

test.describe("M19 (E36) à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("Rouleaux & invocations en édition : sorts universels et un sort complet, aucun débordement", async ({ page }) => {
    await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
    await page.getByRole("combobox", { name: "Techniques d'école" }).selectOption("kuni-shugenja");
    await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
    await page.getByRole("button", { name: "Edit : Rouleaux & invocations" }).click();
    await page.getByRole("button", { name: "Ajouter les sorts universels" }).click();
    await page.getByRole("button", { name: "+ Sort" }).click();
    const card = page.getByRole("group", { name: "Sort : ce sort" });
    await card.getByRole("textbox", { name: "Nom" }).fill("Frappe de jade");
    const jade = page.getByRole("group", { name: "Sort : Frappe de jade" });
    await jade.getByRole("button", { name: "Jade", exact: true }).click();
    await jade.getByRole("textbox", { name: "Portée" }).fill("100 pieds");
    await noHorizontalScroll(page, "Rouleaux & invocations en édition");
    // v2.12.0 : les 6 tuiles d'emplacements sur une ligne, sans troncature.
    const tiles = await page.getByRole("button", { name: "Emplacements de sorts restants" }).evaluate((row) =>
      [...row.querySelectorAll(".slot")].map((t) => ({
        top: Math.round(t.getBoundingClientRect().top), right: t.getBoundingClientRect().right,
        truncated: [...t.querySelectorAll("b")].some((b) => b.scrollWidth > b.clientWidth + 0.5),
      })));
    expect(tiles).toHaveLength(6);
    expect(new Set(tiles.map((t) => t.top)).size, "une seule ligne").toBe(1);
    for (const t of tiles) {
      expect(t.truncated).toBe(false);
      expect(t.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    const vw = page.viewportSize()!.width;
    for (const el of [jade, jade.getByRole("button", { name: "Protection" }), jade.getByRole("textbox", { name: /Autres mots-clés/ })]) {
      const box = (await el.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(vw + 0.5);
    }
    await page.getByRole("button", { name: "Terminer : Rouleaux & invocations" }).click();
    await expect(page.getByTestId("block-magic").locator(".spell")).toHaveCount(4);
    await noHorizontalScroll(page, "Rouleaux & invocations en lecture");
    // v2.11.0 : les 5 situations sur une ligne, puis le lanceur d'un sort sans débordement.
    await situationsFit(page, ["Enquête", "Cour", "Déplacement", "Combat", "Magie"]);
    await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Magie" }).click();
    await page.locator("button.act").filter({ hasText: "Lancer · Frappe de jade" }).click();
    await expect(page.getByTestId("spell-panel")).toBeVisible();
    await noHorizontalScroll(page, "lanceur de sort");
  });
});

/**
 * D9 (annexe I.3.7) : sélecteurs à 360 px. Champ en 16 px (pas de zoom), sans défilement horizontal ;
 * avec `base-select` (Chromium, « Pixel 7 ») : options d'au moins 40 px, menu dans l'écran. WebKit (« iPhone 13 ») : liste native.
 */
test.describe("D9 : sélecteurs à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("Posture : 16 px, options ≥ 40 px, menu dans l'écran", async ({ page }) => {
    await tab(page, "Aide de jeu").click();
    await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
    const stance = page.getByRole("combobox", { name: "Posture" });
    expect(await stance.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    await noHorizontalScroll(page, "Combat, sélecteur Posture");
    if (!(await page.evaluate(() => CSS.supports("appearance", "base-select")))) return;
    await stance.click();
    await expect(stance.locator("option").first()).toBeVisible();
    const vp = page.viewportSize()!;
    for (const option of await stance.locator("option").all()) {
      const box = (await option.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 0.5);
    }
    await noHorizontalScroll(page, "Combat, liste Posture ouverte");
  });
  test("Techniques d'école : 16 px, sans défilement horizontal", async ({ page }) => {
    await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
    const school = page.getByRole("combobox", { name: "Techniques d'école" });
    expect(await school.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    await noHorizontalScroll(page, "Identité, Techniques d'école");
  });
});
