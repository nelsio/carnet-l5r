/** Interface en anglais dans le build (annexe 52.5) : E1, E3, E7 ; E2 et E4 en Vitest (`tests/ui/i18n-en.spec.tsx`). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

const box = async (l: Locator) => (await l.boundingBox())!;

test.describe("navigateur en anglais", () => {
  test.use({ locale: "en-US" });

  test("E1 : premier lancement en anglais, <html lang=\"en\">", async ({ page }) => {
    await page.goto(pageUrl);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "New blank sheet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Language: English" })).toHaveText("EN");
    await expect(page).toHaveTitle(/^Carnet de Rokugan – L5R 4th edition/);
  });

  test("E3 : choix FR gardé au rechargement", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Language: English" }).click();
    await expect(page.getByRole("button", { name: "Nouvelle fiche vierge" })).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("button", { name: "Langue : français" })).toBeVisible();
  });

  test("E5 : modèle bushi en anglais, réserves XkY et TN", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: /^Use the / }).first().click();
    await expect(page.getByTestId("skill-pool-Kenjutsu")).toHaveText(/^\d+k\d+/);
    await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Statistics" }).click();
    await expect(page.getByRole("columnheader", { name: /^TN \d+$/ }).first()).toBeVisible();
  });

  test("E7 : mobile 360 px, onglets sur une ligne, bouton de langue sans chevauchement", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: /^Use the / }).first().click();
    const tabs = page.getByRole("group", { name: "View" }).getByRole("button");
    await expect(tabs).toHaveText(["Sheet", "Assistant", "Statistics"], { useInnerText: true });
    const tops = await Promise.all((await tabs.all()).map(async (t) => (await box(t)).y));
    expect(new Set(tops).size).toBe(1);
    const lang = await box(page.getByRole("button", { name: "Language: English" }));
    expect(lang.x + lang.width).toBeLessThanOrEqual(360);
    for (const name of [/^Theme: /, "Resources"]) {
      const other = await box(page.getByRole("button", { name }));
      const apart = lang.x + lang.width <= other.x || other.x + other.width <= lang.x || lang.y + lang.height <= other.y || other.y + other.height <= lang.y;
      expect(apart).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
