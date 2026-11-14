/** Lot 62, v2.34.0 (annexe 62.6) : total d'un jet aux vrais dés, sur le build. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Modèle Bushi, lanceur masqué, escarmouche. */
async function skirmish(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
  await page.getByRole("button", { name: "Lanceur de dés : affiché" }).click();
  await page.getByRole("button", { name: VIEW.aid, exact: true }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
}

const sheet = (page: Page) => page.getByRole("dialog", { name: "Lanceur de dés" });

async function note(page: Page, total: number) {
  await sheet(page).getByRole("spinbutton", { name: "Total obtenu aux dés" }).fill(String(total));
  await sheet(page).getByRole("button", { name: "Noter le résultat" }).click();
}

for (const width of [360, 390]) {
  test.describe(`MR15 : ${width} px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true });

    test("champ et bouton sur une ligne, 44 px ; résultat visible dans la feuille du bas", async ({ page }) => {
      await skirmish(page);
      await page.getByRole("button", { name: /^Attaque · Katana/ }).click();
      const field = sheet(page).getByRole("spinbutton", { name: "Total obtenu aux dés" });
      const button = sheet(page).getByRole("button", { name: "Noter le résultat" });
      await field.scrollIntoViewIfNeeded();
      const f = (await field.boundingBox())!;
      const b = (await button.boundingBox())!;
      expect(Math.abs(f.y + f.height / 2 - (b.y + b.height / 2))).toBeLessThan(2);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(f.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await note(page, 31);
      await expect(sheet(page).locator(".verdict")).toBeInViewport();
      await expect(sheet(page).locator(".verdict")).toContainText("saisi à la main");
    });
  });
}

test("MR16 : Attaque → Dégâts aux vrais dés, dégâts pré-remplis", async ({ page }) => {
  await skirmish(page);
  await page.getByRole("button", { name: /^Attaque · Katana/ }).click();
  await sheet(page).getByRole("spinbutton", { name: "ND d'armure cible" }).fill("20");
  await sheet(page).getByRole("button", { name: "Ajouter Augmentation des dégâts" }).click();
  await expect(sheet(page).locator(".mr-use li")).toHaveText(["Réussite ou échec contre le ND final (25).", "Si l'attaque touche : +1g0 pré-remplis sur Dégâts · Katana."]);
  await note(page, 31);
  await expect(sheet(page).locator(".verdict")).toContainText("Réussite 31 / 25 (+6)");
  await expect(sheet(page).locator(".dice")).toHaveCount(0);
  await page.getByRole("button", { name: /^Dégâts · Katana/ }).click();
  await expect(sheet(page).getByTestId("pool")).toHaveText("6g2");
  await expect(sheet(page).getByRole("group", { name: "Ton jet aux vrais dés" })).toHaveCount(0);
  await expect(sheet(page).getByText("Derniers jets")).toBeVisible();
});
