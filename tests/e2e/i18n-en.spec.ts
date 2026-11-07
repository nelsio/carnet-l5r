/** Interface en anglais dans le build (annexe 52.5) : E1, E3, E7 ; E2 et E4 en Vitest (`tests/ui/i18n-en.spec.tsx`). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

const box = async (l: Locator) => (await l.boundingBox())!;

test.describe("navigateur en anglais", () => {
  test.use({ locale: "en-US" });

  test("E1 : premier lancement en anglais, <html lang=\"en\">", async ({ page }) => {
    await page.goto(pageUrl);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "New blank sheet" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Language" }).getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveTitle(/^Carnet de Rokugan – L5R 4th edition/);
  });

  test("E3 : choix FR gardé au rechargement", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Français", exact: true }).click();
    await expect(page.getByRole("button", { name: "Nouvelle fiche vierge" })).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("group", { name: "Langue" }).getByRole("button", { name: "Français" })).toHaveAttribute("aria-pressed", "true");
  });

  test("E5 : modèle bushi en anglais, réserves XkY et TN", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: /^Use the / }).first().click();
    await expect(page.getByTestId("skill-pool-Kenjutsu")).toHaveText(/^\d+k\d+/);
    await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Statistics" }).click();
    await expect(page.getByRole("columnheader", { name: /^TN \d+$/ }).first()).toBeVisible();
  });

  /** Fiche vierge en anglais, bloc Identité refermé (même départ que `status-bar.spec.ts`, annexe 45). */
  async function blank(page: Page, width: number) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "New blank sheet" }).click();
    await page.getByRole("button", { name: "Done: Identity & reputation" }).click();
  }
  const overflowing = (l: Locator) => l.evaluateAll((spans) => spans.filter((s) => s.scrollWidth > s.clientWidth).map((s) => s.textContent));

  for (const width of [800, 1280]) {
    test(`V8 : ${width} px, piste de blessures en anglais sans troncature (annexe 53.4)`, async ({ page }) => {
      await blank(page, width);
      const labels = page.locator(".wtrack .wl span[aria-hidden='true']");
      await expect(labels).toHaveText(["Healthy", "Nicked", "Grazed", "Hurt", "Injured", "Crippled", "Down", "Out"]);
      expect(await overflowing(labels)).toEqual([]);
    });
  }

  test("V8 : mobile 360 px, détail des blessures en anglais sans débordement (annexe 53.4)", async ({ page }) => {
    await blank(page, 360);
    await expect(page.getByRole("heading", { level: 1, name: "New samurai" })).toBeVisible();
    await page.getByRole("button", { name: /^Healthy/ }).click();
    const names = page.getByTestId("wound-detail").locator(".wn");
    await expect(names).toHaveText(["Healthy", "Nicked", "Grazed", "Hurt", "Injured", "Crippled", "Down", "Out"]);
    expect(await overflowing(names)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test("E7 : mobile 360 px, onglets sur une ligne, bouton de langue sans chevauchement", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: /^Use the / }).first().click();
    const tabs = page.getByRole("group", { name: "View" }).getByRole("button");
    await expect(tabs).toHaveText(["Sheet", "Assistant", "Statistics"], { useInnerText: true });
    const tops = await Promise.all((await tabs.all()).map(async (t) => (await box(t)).y));
    expect(new Set(tops).size).toBe(1);
    const lang = await box(page.getByRole("group", { name: "Language" }));
    expect(lang.x + lang.width).toBeLessThanOrEqual(360);
    for (const name of [/^Theme: /, "Resources"]) {
      const other = await box(page.getByRole("button", { name }));
      const apart = lang.x + lang.width <= other.x || other.x + other.width <= lang.x || lang.y + lang.height <= other.y || other.y + other.height <= lang.y;
      expect(apart).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test("C6 : mobile 360 px, Techniques d'école en anglais : noms entiers, menu dans l'écran (annexe 54)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "New blank sheet" }).click();
    const school = page.getByRole("combobox", { name: "School techniques" });
    expect(await school.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    await school.selectOption("kitsune-shugenja");
    await expect(page.getByRole("textbox", { name: "School (displayed name)" })).toHaveValue("Kitsune Shugenja School (Fox)");
    await expect(page.getByTestId("school-techniques")).toContainText("R1 · The Essence of Chikushudo");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    if (!(await page.evaluate(() => CSS.supports("appearance", "base-select")))) return;
    await expect(school.locator("selectedcontent .n")).toHaveText("Kitsune Shugenja School (Fox)");
    await school.click();
    await expect(school.locator("legend", { hasText: "Minor Clans" })).toBeVisible();
    const clipped = await school.locator("option .n").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    expect(clipped).toEqual([]);
    for (const option of await school.locator("option").all()) {
      const b = (await option.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(360.5);
    }
    await page.screenshot({ path: "test-results/i18n-en/ecoles-360.png" });
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
