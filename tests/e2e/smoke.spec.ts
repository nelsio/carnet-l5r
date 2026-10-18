import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

test("le build unique s'ouvre en file:// sans aucune requête réseau", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (!req.url().startsWith("file://") && !req.url().startsWith("data:")) external.push(req.url());
  });
  await page.goto(pageUrl);
  await expect(page.getByRole("heading", { name: "Carnet de Rokugan" })).toBeVisible();
  expect(external).toEqual([]);
});
