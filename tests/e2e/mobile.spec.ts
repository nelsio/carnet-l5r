/** Version mobile (HANDOFF §7), tests M1 à M14 (§10.5). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Ouvre le build et crée une fiche avec Kenjutsu et un katana : attaques, manœuvres et dégâts. */
async function start(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await page.getByRole("button", { name: "Edit : Compétences" }).click();
  await page.getByRole("button", { name: "+ Compétence" }).click();
  await page.getByRole("textbox", { name: "Nom de la compétence" }).fill("Kenjutsu");
  await page.getByRole("button", { name: "Terminer : Compétences" }).click();
  await page.getByRole("button", { name: "Edit : Armes" }).click();
  await page.getByRole("button", { name: "+ Arme" }).click();
  await page.getByRole("textbox", { name: "Nom de l'arme" }).fill("Katana");
  await page.getByRole("button", { name: "Terminer : Armes" }).click();
  // Le bouton « Lancer » n'apparaît qu'avec le lanceur de dés affiché (masqué par défaut).
  await page.getByRole("button", { name: "Lanceur de dés : masqué" }).click();
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
  await page.getByRole("button", { name: "Bibliothèque" }).click();
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
  await page.getByRole("button", { name: "Ajouter 1 blessure" }).click();
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

test("M10 : boutons « i » touchables sur 40 × 40 px ; Posture et Vide tiennent sur un écran, détails fermés", async ({ page }) => {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  const vp = page.viewportSize()!;
  for (const name of ["Posture", "Dépenser du Vide"]) {
    const info = page.getByRole("button", { name: `Afficher le détail : ${name}` });
    await info.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await touchArea(info);
    const panelBox = (await info.locator("xpath=ancestor::div[contains(@class,'panel')][1]").boundingBox())!;
    expect(panelBox.height, name).toBeLessThan(vp.height);
    // En-tête sur une seule ligne : le « i » est aligné sur le titre.
    const title = (await info.locator("xpath=preceding-sibling::span[1]").boundingBox())!;
    const ib = (await info.boundingBox())!;
    expect(Math.abs(title.y + title.height / 2 - (ib.y + ib.height / 2)), name).toBeLessThan(6);
  }
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
  const stance = (await page.getByRole("group", { name: "Posture" }).boundingBox())!;
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
async function situationsFit(page: Page) {
  await tab(page, "Aide de jeu").click();
  const group = page.getByRole("group", { name: "Situation" });
  await expect(group.getByRole("button")).toHaveText(["Enquête", "Cour", "Déplacement", "Combat"]);
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
  test("Bibliothèque, Lanceur de dés, Thème et Blessures en icônes de 40 px sur la ligne du nom, libellés avec l'état", async ({ page }) => {
    const buttons = [
      page.getByRole("button", { name: "Bibliothèque" }),
      page.getByRole("button", { name: "Lanceur de dés : affiché" }),
      page.getByRole("button", { name: "Thème : auto" }),
      page.getByRole("button", { name: "Blessures : Terre × 2" }),
    ];
    const name = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    for (const b of buttons) {
      const box = (await b.boundingBox())!;
      expect(Math.round(box.width)).toBe(40);
      expect(Math.round(box.height)).toBe(40);
      expect(box.y).toBeLessThan(name.y + name.height);
      expect(box.y + box.height).toBeGreaterThan(name.y);
      await expect(b.locator(".txt")).toHaveCSS("width", "1px");
    }
    const tops = await Promise.all(buttons.map(async (b) => (await b.boundingBox())!.y));
    expect(new Set(tops.map(Math.round)).size).toBe(1);
    await expect(buttons[1]!).toHaveAttribute("title", "Lanceur de dés : affiché");
    await noHorizontalScroll(page, "en-tête 360 px");
  });
});

/** Bonus de jet en lecture : trois lignes (nom, effet, cible), sans texte tronqué (annexe E.9 S1, E24). */
async function modifiersOnThreeLines(page: Page) {
  await page.getByRole("button", { name: "Edit : Bonus de jet" }).click();
  for (const id of ["skill-1g1", "force-de-la-terre"]) {
    await page.getByRole("combobox", { name: "Modèle de bonus" }).selectOption(id);
    await page.getByRole("button", { name: "+ Bonus" }).click();
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
