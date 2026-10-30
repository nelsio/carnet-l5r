/** Lot 21, v2.18.0 (HANDOFF annexe K) : ligne Insight et badge d'écart sur bureau (cas K1). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Lisible : ni tronqué, ni hors de la fenêtre, sans défilement horizontal de la page. */
async function fits(el: Locator) {
  const r = await el.evaluate((e) => {
    const b = e.getBoundingClientRect();
    return { truncated: e.scrollWidth > e.clientWidth + 0.5, left: b.left, right: b.right, vw: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth };
  });
  expect(r.truncated).toBe(false);
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.right).toBeLessThanOrEqual(r.vw);
  expect(r.scroll).toBeLessThanOrEqual(r.vw);
}

test("K1 : ligne Insight et badge d'écart lisibles, sans débordement", async ({ page }) => {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
  await page.getByRole("spinbutton", { name: "Rang d'Insight" }).fill("3");
  const identity = page.getByTestId("block-identity");
  await expect(identity.getByTestId("insight-computed")).toBeVisible();
  await expect(identity.getByTestId("insight-mismatch")).toHaveText(/Rang saisi 3 · calculé \d+/);
  await fits(identity.getByTestId("insight-mismatch"));
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  for (const id of ["sheet-insight", "insight-mismatch"]) {
    await expect(identity.getByTestId(id)).toBeVisible();
    await fits(identity.getByTestId(id));
  }
});
