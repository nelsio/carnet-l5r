/** Bascule de langue FR | EN à part des actions de l'en-tête (annexe 58) : L5 bureau, L6 mobile, L7 clavier. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const LONG_NAME = "Kakita Haruto no Hikaru-sama des Plaines du Matin";

type Box = { x: number; y: number; width: number; height: number };
const box = async (l: Locator): Promise<Box> => (await l.boundingBox())!;
const apart = (a: Box, b: Box) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
const langSwitch = (page: Page) => page.getByRole("group", { name: "Langue" });

/** Éléments visibles de l'en-tête, hors bascule : aucun ne doit la recouvrir. */
async function headerBoxes(page: Page): Promise<Box[]> {
  const items = page.locator("header.top .who h1, header.top .who .eyebrow, header.top .who .sub, header.top .seal, header.top .theme-btn, header.top .tabs");
  const boxes: Box[] = [];
  for (const item of await items.all()) if (await item.isVisible()) boxes.push(await box(item));
  return boxes;
}

async function expectTopRight(page: Page) {
  const header = await box(page.locator("header.top"));
  const lang = await box(langSwitch(page));
  expect(lang.x).toBeGreaterThanOrEqual(header.x + header.width * 0.75);
  expect(lang.y + lang.height).toBeLessThanOrEqual(header.y + header.height / 2 + 1);
  for (const other of await headerBoxes(page)) expect(apart(lang, other)).toBe(true);
}

test.describe("L5 : bureau 1280 px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("sans fiche : quart haut droit de l'en-tête, sans chevauchement", async ({ page }) => {
    await page.goto(pageUrl);
    await expectTopRight(page);
  });

  test("avec une fiche au nom long : même place, sans chevauchement", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill(LONG_NAME);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LONG_NAME);
    await expectTopRight(page);
  });
});

for (const width of [360, 390]) {
  test.describe(`L6 : mobile ${width} px`, () => {
    test.use({ viewport: { width, height: 780 } });

    test("au bout de la rangée de boutons ronds, calée à droite, 40 px, sans défilement", async ({ page }) => {
      await page.goto(pageUrl);
      await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kakita Haruto");
      // Mesures prises ensemble, page en haut : l'ouverture de la fiche fait défiler la page.
      const { resources, lang, right } = await page.evaluate(() => {
        scrollTo(0, 0);
        const rect = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON() as Box;
        return { resources: rect("header.top .res .theme-btn"), lang: rect("header.top .lang-switch"), right: rect("header.top").x + rect("header.top").width };
      });
      expect(Math.round(lang.y)).toBe(Math.round(resources.y));
      expect(Math.round(lang.height)).toBe(40);
      expect(Math.round(lang.x + lang.width)).toBe(Math.round(right));
      expect(lang.x).toBeGreaterThanOrEqual(resources.x + resources.width);
      await expect(langSwitch(page).locator(".globe")).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  });
}

test("L7 : clavier : Tab atteint FR puis EN, Entrée bascule, le focus reste sur le bouton", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(pageUrl);
  // Ordre de tabulation : actions de l'en-tête, puis la bascule.
  await page.getByRole("button", { name: "Ressources" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Français", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const en = page.getByRole("button", { name: "English", exact: true });
  await expect(en).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: "Language" })).toBeVisible();
  await expect(en).toBeFocused();
  await expect(en).toHaveAttribute("aria-pressed", "true");
});
