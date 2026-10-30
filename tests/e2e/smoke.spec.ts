import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

test("le build unique s'ouvre en file:// sans aucune requête réseau, polices comprises", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (!req.url().startsWith("file://") && !req.url().startsWith("data:")) external.push(req.url());
  });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Nouveau samouraï" })).toBeVisible();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await page.getByRole("button", { name: /^Lancer/ }).click();
  await expect(page.locator(".die").first()).toBeVisible();

  // Chaque police se charge depuis le fichier lui-même (data:), sans réseau.
  const fonts = await page.evaluate(async () => {
    const faces = ['800 16px "Shippori Mincho B1"', '400 16px "Zen Kaku Gothic New"', '700 16px "JetBrains Mono"'];
    const loaded = await Promise.all(faces.map((f) => document.fonts.load(f)));
    return loaded.map((l) => l.length > 0);
  });
  expect(fonts).toEqual([true, true, true]);
  expect(external).toEqual([]);
});
