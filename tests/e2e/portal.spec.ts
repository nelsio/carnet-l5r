/**
 * Lot 22, v2.19.0 (HANDOFF annexe L) : liens vers le portail de la campagne dans un vrai navigateur.
 * O5 (Entrée et Espace), O6 (panneau bas à 390 px), O7 (largeurs des deux options), O10 (aucune requête vers le portail).
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

const resources = (page: Page) => page.getByRole("button", { name: "Ressources" });
const menu = (page: Page) => page.getByRole("menu", { name: "Ressources de la campagne" });

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
  await expect(menu(page).getByRole("menuitem")).toHaveCount(7);
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
  test("bureau : deux options de même largeur, côte à côte ; modèles sur trois colonnes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(pageUrl);
    const opts = page.locator(".start .start-opt");
    const [a, b] = [(await opts.nth(0).boundingBox())!, (await opts.nth(1).boundingBox())!];
    expect(Math.round(a.width)).toBe(Math.round(b.width));
    expect(Math.round(a.y)).toBe(Math.round(b.y));
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
