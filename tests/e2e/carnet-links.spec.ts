/**
 * Lot 25, v2.21.0 (HANDOFF annexe M.3) : liens vers le guide et le dépôt dans un vrai navigateur.
 * V5 (menu Ressources, version de package.json), V6 (pied de page sur les quatre écrans), V7 (pied de page à 390 px).
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const { version } = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version: string };
const REPO = "https://github.com/nelsio/carnet-l5r";

const footer = (page: Page) => page.getByRole("contentinfo");
const footerLinks = (page: Page) => footer(page).getByRole("navigation", { name: "Liens du Carnet" }).getByRole("link");

async function useTemplate(page: Page) {
  await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
}

test("V5 : section « Le Carnet » du menu Ressources, version de package.json, quatre liens externes", async ({ page }) => {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Ressources" }).click();
  const carnet = page.getByRole("menu", { name: "Ressources de la campagne" }).getByRole("group", { name: "Le Carnet" });
  await expect(carnet).toContainText(`v${version}`);
  const items = carnet.getByRole("menuitem");
  await expect(items).toHaveCount(4);
  const hrefs = [`${REPO}/blob/main/docs/GUIDE.md`, `${REPO}/releases`, `${REPO}/issues/new`, REPO];
  for (const [i, href] of hrefs.entries()) {
    await expect(items.nth(i)).toHaveAttribute("href", href);
    await expect(items.nth(i)).toHaveAttribute("target", "_blank");
    await expect(items.nth(i)).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("V6 : pied de page sur la Bibliothèque, la Fiche, l'Assistant L5R et les Statistiques", async ({ page }) => {
  await page.goto(pageUrl);
  const check = async () => {
    await expect(footer(page).getByRole("link", { name: `Version ${version} : nouveautés (nouvel onglet)` })).toHaveAttribute("href", `${REPO}/releases`);
    await expect(footerLinks(page)).toHaveText(["Guide", "Signaler un bug", "Projet"]);
  };
  await check();
  await expect(page.getByRole("link", { name: "Lire le guide" })).toHaveAttribute("href", `${REPO}/blob/main/docs/GUIDE.md`);
  await useTemplate(page);
  await check();
  for (const view of [VIEW.aid, "Statistiques"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await check();
  }
});

test.describe("V7 : pied de page à 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("pas de défilement horizontal, trois liens visibles sous le nom, pas recouvert par la barre d'onglets", async ({ page }) => {
    await page.goto(pageUrl);
    await useTemplate(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const name = (await footer(page).locator(".id").boundingBox())!;
    for (const link of await footerLinks(page).all()) {
      await expect(link).toBeInViewport();
      expect((await link.boundingBox())!.y).toBeGreaterThanOrEqual(name.y + name.height);
    }
    const f = (await footer(page).boundingBox())!;
    const tabs = (await page.getByRole("group", { name: "Vue" }).boundingBox())!;
    expect(f.y + f.height).toBeLessThanOrEqual(tabs.y);
  });
});
