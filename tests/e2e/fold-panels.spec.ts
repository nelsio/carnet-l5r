/** Lot 61, v2.33.0 (annexe 61.6) : panneaux Posture et Dépenser du Vide repliables, sur le build. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const STANCE_FOLD = "Options de posture : Monté, Je garde un allié";
const VOID_FOLD = "Dépenses de Vide";

/** Modèle Bushi, Assistant L5R, escarmouche. */
async function skirmish(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
  await page.getByRole("button", { name: VIEW.aid, exact: true }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
}

const hasClass = (c: string) => `contains(concat(' ', normalize-space(@class), ' '), ' ${c} ')`;
const panelOf = (fold: Locator) => fold.locator(`xpath=ancestor::div[${hasClass("panel")}][1]`);
const headOf = (fold: Locator) => fold.locator(`xpath=ancestor::div[${hasClass("panel-head")}][1]`);

for (const width of [360, 390, 1280]) {
  test(`P9 : ${width} px, en-têtes sur une ligne, pas de défilement horizontal`, async ({ page }) => {
    await skirmish(page, width);
    for (const name of [STANCE_FOLD, VOID_FOLD]) {
      const fold = page.getByRole("button", { name });
      const f = (await fold.boundingBox())!;
      const head = (await headOf(fold).boundingBox())!;
      // Une seule ligne : l'en-tête ne dépasse pas le chevron de plus que quelques pixels.
      expect(head.height, name).toBeLessThanOrEqual(f.height + 8);
      expect(f.x + f.width, name).toBeLessThanOrEqual(width);
      expect(f.height, name).toBe(width <= 720 ? 26 : 22);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("P10 : clavier, Tab atteint le chevron de Posture, Entrée ouvre, le focus reste dessus", async ({ page }) => {
  await skirmish(page, 1280);
  await page.getByRole("button", { name: "Nouveau round" }).focus();
  await page.keyboard.press("Tab");
  const fold = page.getByRole("button", { name: STANCE_FOLD });
  await expect(fold).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(fold).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("checkbox", { name: /^Monté/ })).toBeVisible();
  await expect(fold).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(fold).toHaveAttribute("aria-expanded", "false");
  await expect(fold).toBeFocused();
});

test("P11 : fiche Bushi, les deux panneaux repliés font moins de la moitié de leur hauteur ouverts", async ({ page }) => {
  await skirmish(page, 1280);
  const folds = [page.getByRole("button", { name: STANCE_FOLD }), page.getByRole("button", { name: VOID_FOLD })];
  const height = async () => {
    let sum = 0;
    for (const f of folds) sum += (await panelOf(f).boundingBox())!.height;
    return sum;
  };
  const folded = await height();
  for (const f of folds) await f.click();
  const open = await height();
  expect(folded).toBeLessThan(open / 2);
});
