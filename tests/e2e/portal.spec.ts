/**
 * Lot 22, v2.19.0 (HANDOFF annexe L) : liens vers le portail de la campagne dans un vrai navigateur.
 * O5 (Entrée et Espace), O6 (panneau bas à 390 px), O7 (largeurs des deux options), O10 (aucune requête vers le portail) ;
 * lot 23 : O15 sur bureau et O16 à 390 px.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

const resources = (page: Page) => page.getByRole("button", { name: "Ressources" });
const menu = (page: Page) => page.getByRole("menu", { name: "Ressources L5R" });

test("O10 : aucune requête vers le portail au chargement ni à l'ouverture du menu", async ({ page }) => {
  const portal: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("vincenzorpg.github.io")) portal.push(r.url());
  });
  await page.goto(pageUrl);
  await expect(page.getByRole("heading", { name: "Pas encore de personnage ?" })).toBeVisible();
  await resources(page).click();
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
  await resources(page).click();
  await expect(menu(page).getByRole("menuitem")).toHaveCount(11);
  await page.waitForLoadState("networkidle");
  expect(portal).toEqual([]);
});

for (const key of ["Enter", "Space"]) {
  test(`O5 : ${key} ouvre le menu, focus sur la 1re entrée, flèches, Échap ferme et rend le focus`, async ({ page }) => {
    await page.goto(pageUrl);
    await resources(page).focus();
    await page.keyboard.press(key);
    const items = menu(page).getByRole("menuitem");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(resources(page)).toBeFocused();
    await expect(resources(page)).toHaveAttribute("aria-expanded", "false");
  });
}

test("O4 : menu déroulant de 340 px sous le bouton, aligné à droite, sur bureau", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(pageUrl);
  await resources(page).click();
  const b = (await resources(page).boundingBox())!;
  const m = (await menu(page).boundingBox())!;
  expect(Math.round(m.width)).toBe(340);
  expect(m.y).toBeGreaterThan(b.y + b.height);
  expect(Math.round(m.x + m.width)).toBe(Math.round(b.x + b.width));
  await expect(page.getByTestId("res-scrim")).toBeHidden();
  for (const item of await menu(page).getByRole("menuitem").all()) expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // Clic hors du menu : fermeture.
  await page.mouse.click(20, 700);
  await expect(menu(page)).toHaveCount(0);
});

test.describe("O6 : menu Ressources à 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("panneau bas avec voile ; appui sur le voile ferme ; bouton rond de 40 px sous le nom", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
    const b = (await resources(page).boundingBox())!;
    const who = (await page.locator("header.top .who").boundingBox())!;
    expect(Math.round(b.width)).toBe(40);
    expect(Math.round(b.height)).toBe(40);
    expect(b.y).toBeGreaterThanOrEqual(who.y + who.height);

    await resources(page).click();
    // Mesure après l'entrée du panneau (animation de 0,2 s).
    await menu(page).evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const m = (await menu(page).boundingBox())!;
    expect(Math.round(m.x)).toBe(0);
    expect(Math.round(m.width)).toBe(390);
    expect(Math.round(m.y + m.height)).toBe(844);
    expect(m.height).toBeLessThanOrEqual(844 * 0.88 + 1);
    await expect(page.getByTestId("res-scrim")).toBeVisible();
    await page.touchscreen.tap(195, 40);
    await expect(menu(page)).toHaveCount(0);
  });
});

test.describe("O7 : Bibliothèque vide", () => {
  test("bureau : trois options de même largeur, côte à côte ; modèles sur trois colonnes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(pageUrl);
    const opts = page.locator(".start .start-opt");
    await expect(opts).toHaveCount(3);
    const [a, b, c] = [(await opts.nth(0).boundingBox())!, (await opts.nth(1).boundingBox())!, (await opts.nth(2).boundingBox())!];
    for (const o of [b, c]) {
      expect(Math.round(o.width)).toBe(Math.round(a.width));
      expect(Math.round(o.y)).toBe(Math.round(a.y));
      expect(Math.round(o.height)).toBe(Math.round(a.height));
    }
    // Description plus longue d'un côté : étapes et boutons restent alignés, cases de même taille (v2.20.1).
    const boxes = async (sel: string) => Promise.all((await page.locator(`.start ${sel}`).all()).map(async (x) => (await x.boundingBox())!));
    const steps = await boxes(".steps li");
    expect(steps).toHaveLength(9);
    // Lot 43 : étapes empilées ; la n-ième étape de chaque carte est au même niveau.
    for (let i = 0; i < 3; i++) expect(new Set([steps[i]!, steps[i + 3]!, steps[i + 6]!].map((s) => Math.round(s.y))).size).toBe(1);
    expect(new Set(steps.map((s) => Math.round(s.height))).size).toBe(1);
    const acts = await boxes(".start-opt-act");
    expect(new Set(acts.map((x) => Math.round(x.y))).size).toBe(1);
    // Lot 43 : Fiche papier à gauche, Forge au milieu, Fiche vierge à droite (ordre DOM et visuel).
    await expect(opts.getByRole("heading")).toHaveText(["Depuis une fiche papier", "Forger sur le portail", "Fiche vierge"]);
    expect(b.x).toBeGreaterThan(a.x);
    expect(c.x).toBeGreaterThan(b.x);
    const cards = await page.locator(".tplc").all();
    const tops = await Promise.all(cards.map(async (c) => Math.round((await c.boundingBox())!.y)));
    expect(new Set(tops).size).toBe(1);
  });

  test("390 px : options et modèles empilés, sans défilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pageUrl);
    const opts = page.locator(".start .start-opt");
    const [a, b] = [(await opts.nth(0).boundingBox())!, (await opts.nth(1).boundingBox())!];
    expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);
    const steps = (await opts.nth(0).locator("li").all());
    const ys = await Promise.all(steps.map(async (s) => (await s.boundingBox())!.y));
    expect(ys[1]!).toBeGreaterThan(ys[0]!);
    // Lot 43 : Fiche papier en haut, Forge, puis Fiche vierge ; lot 39 : plus de pastille.
    await expect(opts.getByRole("heading")).toHaveText(["Depuis une fiche papier", "Forger sur le portail", "Fiche vierge"]);
    await expect(opts.nth(1).locator(".pend")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  for (const width of [1024, 1280]) {
    test(`lot 43, ${width} px : étapes empilées dans chaque carte, listes alignées`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(pageUrl);
      await expect(page.locator(".start .steps")).toHaveCount(3);
      const lists = await page.locator(".start .steps").all();
      const tops: number[] = [];
      for (const list of lists) {
        const l = (await list.boundingBox())!;
        tops.push(Math.round(l.y));
        const items = await list.locator("li").all();
        expect(items).toHaveLength(3);
        const boxes = await Promise.all(items.map(async (li) => (await li.boundingBox())!));
        expect(new Set(boxes.map((x) => Math.round(x.x))).size).toBe(1);
        for (const x of boxes) expect(x.width).toBeGreaterThanOrEqual(l.width * 0.8);
        expect(boxes[1]!.y).toBeGreaterThanOrEqual(boxes[0]!.y + boxes[0]!.height);
        for (const li of items) {
          const n = (await li.locator(".step-n").boundingBox())!;
          const s = (await li.locator(".step-s").boundingBox())!;
          expect(n.x + n.width).toBeLessThanOrEqual(s.x);
          // Intitulé sur une ligne : aucun mot coupé.
          expect(await li.locator(".step-s").evaluate((el) => el.getClientRects().length)).toBe(1);
        }
      }
      expect(new Set(tops).size).toBe(1);
    });
  }
});

test.describe("Lot 27, lot 39, lot 43 : Forge compatible, ordre lot 43", () => {
  test("Bibliothèque vide : Fiche papier, Forge sans pastille ni encadré (étapes Forger · Exporter · Importer), Fiche vierge, trois boutons pleins (lot 60)", async ({ page }) => {
    await page.goto(pageUrl);
    const opts = page.locator(".start .start-opt");
    await expect(opts.nth(0).getByRole("heading")).toHaveText("Depuis une fiche papier");
    await expect(opts.nth(2).getByRole("heading")).toHaveText("Fiche vierge");
    await expect(opts.nth(2).getByRole("button", { name: "Nouvelle fiche vierge" })).toHaveClass(/\baccent\b/);
    const forge = opts.nth(1);
    await expect(forge.locator(".pend")).toHaveCount(0);
    await expect(forge.getByRole("note")).toHaveCount(0);
    await expect(forge.locator(".step-s")).toHaveText(["Forger", "Exporter", "Importer"]);
    const link = forge.getByRole("link", { name: "Ouvrir la Forge (nouvel onglet)" });
    await expect(link).toHaveAttribute("href", "https://vincenzorpg.github.io/L5R/createcharacter.html");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveClass(/\baccent\b/); // lot 60, annexe 60.1 : les trois boutons de création en accent
  });

  test("Bibliothèque avec fiches : même ordre, sans pastille ; menu Ressources : description compatible", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
    await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
    const opts = page.locator(".newchar .start-opt");
    await expect(opts.getByRole("heading")).toHaveText(["Depuis une fiche papier", "Forger sur le portail", "Fiche vierge"]);
    await expect(opts.nth(1).locator(".pend")).toHaveCount(0);
    await expect(opts.nth(1)).toContainText("Création guidée, puis export JSON à importer ici.");
    await resources(page).click();
    const forge = menu(page).getByRole("menuitem", { name: /^Forge de personnage/ });
    await expect(forge.locator(".pend")).toHaveCount(0);
    await expect(forge).toContainText("Exporte un JSON compatible avec le Carnet");
  });

  test("390 px : menu Ressources, ligne Forge sans défilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pageUrl);
    await resources(page).click();
    const forge = menu(page).getByRole("menuitem", { name: /^Forge de personnage/ });
    const row = (await forge.boundingBox())!;
    const items = await menu(page).boundingBox();
    expect(row.x + row.width).toBeLessThanOrEqual(items!.x + items!.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("O16 : Assistant L5R à 390 px (lot 23, annexe L.8)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("encadré sous les actions ; onglets de situation sur une ligne", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Utiliser le modèle Shugenja" }).click();
    await page.getByRole("group", { name: "Vue" }).getByRole("button", { name: VIEW.aid }).click();
    const sit = page.getByRole("group", { name: "Situation" });
    for (const name of ["Combat", "Cour"]) {
      await sit.getByRole("button", { name }).click();
      const box = page.getByRole("complementary", { name: "Liens vers le portail" });
      const actions = (await page.locator(".aid .actions").boundingBox())!;
      const b = (await box.boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(actions.y + actions.height);
      expect(Math.round(b.x + b.width)).toBeLessThanOrEqual(390);
      for (const a of await box.getByRole("link").all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const tops = await Promise.all((await sit.getByRole("button").all()).map(async (t) => Math.round((await t.boundingBox())!.y)));
    expect(tops).toHaveLength(5);
    expect(new Set(tops).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test("O15 : encadré à droite des actions sur bureau", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
  await page.getByRole("group", { name: "Vue" }).getByRole("button", { name: VIEW.aid }).click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Cour" }).click();
  const actions = (await page.locator(".aid .actions").boundingBox())!;
  const b = (await page.getByRole("complementary", { name: "Liens vers le portail" }).boundingBox())!;
  expect(b.x).toBeGreaterThan(actions.x + actions.width);
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Enquête" }).click();
  await expect(page.getByRole("complementary", { name: "Liens vers le portail" })).toHaveCount(0);
});
