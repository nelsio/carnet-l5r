/** Lot 45, v2.27.3 (annexe 45) : niveaux de blessure de la barre d'état, sans troncature. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

async function start(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
}

for (const width of [800, 1024, 1179, 1180, 1280]) {
  test(`${width} px : les 8 niveaux de la piste tiennent dans leur case (annexe 45.3)`, async ({ page }) => {
    await start(page, width);
    const labels = page.locator(".wtrack .wl span[aria-hidden='true']");
    await expect(labels).toHaveText(["Indemne", "Égrat.", "Éraflé", "Blessé", "Grav.", "Estropié", "À terre", "HdC"]);
    const overflows = await labels.evaluateAll((spans) => spans.filter((span) => span.scrollWidth > span.clientWidth).map((span) => span.textContent));
    expect(overflows).toEqual([]);
  });
}

test("700 px : la piste laisse place au détail, libellés complets (annexe 45.3)", async ({ page }) => {
  await start(page, 700);
  await expect(page.locator(".wtrack")).toBeHidden();
  await page.getByRole("button", { name: /^Indemne/ }).click();
  const names = page.getByTestId("wound-detail").locator(".wn");
  await expect(names).toHaveCount(8);
  await expect(names.nth(4)).toHaveText("Gravement blessé");
  const overflows = await names.evaluateAll((spans) => spans.filter((span) => span.scrollWidth > span.clientWidth).map((span) => span.textContent));
  expect(overflows).toEqual([]);
});

test("390 px : piste masquée, la hauteur de la barre ne dépend pas des abréviations (annexe 45.4)", async ({ page }) => {
  await start(page, 390);
  await expect(page.locator(".wtrack")).toBeHidden();
  await expect(page.getByTestId("wound-detail")).toHaveCount(0);
});
