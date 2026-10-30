/** Couleurs (annexe I.1.11) : N7 bordure de danger indépendante du clan, N9 pas de flash, N10 et N11 balises theme-color. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { woundsButton } from "./wounds";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const DANGER = { light: "rgb(179, 38, 30)", dark: "rgb(242, 134, 126)" };
const BG_DARK = "rgb(38, 37, 42)";

async function create(page: Page, width = 1200) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
}

/** Couleurs de bordure visibles dans la barre d'état. */
const statusBorders = (page: Page) => page.locator(".status").evaluate((s) =>
  [s, ...s.querySelectorAll("*")].flatMap((el) => {
    const st = getComputedStyle(el);
    if (st.display === "none") return [];
    return ["Top", "Right", "Bottom", "Left"].filter((k) => st.getPropertyValue(`border-${k.toLowerCase()}-width`) !== "0px")
      .map((k) => st.getPropertyValue(`border-${k.toLowerCase()}-color`));
  }));

for (const [width, theme] of [[1200, "light"], [390, "light"], [1200, "dark"]] as const) {
  test(`N7 : Scorpion indemne sans bordure de danger, blessé avec (${width} px, ${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await create(page, width);
    await page.getByRole("combobox", { name: "Clan" }).fill("Scorpion");
    await expect(page.locator(".mon")).toHaveText(/Scorpion/);
    expect(await statusBorders(page)).not.toContain(DANGER[theme]);
    await (await woundsButton(page, "Ajouter 1 blessure")).click();
    await expect.poll(() => statusBorders(page)).toContain(DANGER[theme]);
  });
}

test("N9 : thème forcé sombre, système clair : premier rendu déjà sombre", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await create(page);
  await page.getByRole("button", { name: "Thème : auto" }).click();
  await page.getByRole("button", { name: "Thème : clair" }).click();
  await expect(page.getByRole("button", { name: "Thème : sombre" })).toBeVisible();
  await page.waitForTimeout(200); // préférence écrite dans IndexedDB, comme E8
  // Fond relevé à la première image, avant tout script de l'appli.
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      (window as unknown as { firstFrame: string }).firstFrame = getComputedStyle(document.body).backgroundColor;
    });
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => (window as unknown as { firstFrame?: string }).firstFrame)).toBe(BG_DARK);
  await expect(page.locator("body")).toHaveCSS("background-color", BG_DARK);
});

test("N10, N11 : balises theme-color selon le thème", async ({ page }) => {
  await create(page);
  const metas = () => page.locator('meta[name="theme-color"]').evaluateAll((ms) => ms.map((m) => [m.getAttribute("content"), m.getAttribute("media")]));
  expect(await metas()).toEqual([["#ece6d8", "(prefers-color-scheme: light)"], ["#26252a", "(prefers-color-scheme: dark)"]]);
  await page.getByRole("button", { name: "Thème : auto" }).click();
  expect(await metas()).toEqual([["#ece6d8", null]]);
  expect(await page.evaluate(() => localStorage.getItem("carnet-theme"))).toBe("light");
  await page.getByRole("button", { name: "Thème : clair" }).click();
  expect(await metas()).toEqual([["#26252a", null]]);
  await expect(page.locator("body")).toHaveCSS("background-color", BG_DARK);
});
