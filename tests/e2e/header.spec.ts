/** En-tête v2.8.0 (HANDOFF annexe E.19 S7) : nom du samouraï sur 2 lignes au plus, sans « … ». */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const LONG_NAME = "Kakita Haruto no Hikaru-sama des Plaines du Matin";

async function nameLines(page: Page) {
  return page.getByRole("heading", { level: 1 }).evaluate((h) => {
    const style = getComputedStyle(h);
    return {
      lines: Math.round(h.getBoundingClientRect().height / parseFloat(style.lineHeight)),
      size: parseFloat(style.fontSize),
      text: h.textContent,
      clipped: h.scrollWidth > h.clientWidth + 0.5 || style.textOverflow === "ellipsis",
    };
  });
}

for (const width of [360, 1200]) {
  test(`E32 : nom long à ${width} px : 2 lignes au plus, nom complet sans « … »`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Créer mon personnage" }).click();
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill(LONG_NAME);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LONG_NAME);
    const fit = await nameLines(page);
    expect(fit.lines).toBeLessThanOrEqual(2);
    expect(fit.clipped).toBe(false);
    if (width === 360) {
      // Police réduite, environ 12 px.
      expect(fit.size).toBeLessThan(20);
      expect(fit.size).toBeGreaterThanOrEqual(8);
    }
    // Un nom court reprend la taille normale.
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Kakita Haruto");
    await expect.poll(async () => (await nameLines(page)).size).toBeGreaterThanOrEqual(26);
  });
}
