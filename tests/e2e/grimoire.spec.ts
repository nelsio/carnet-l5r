/**
 * Lot 30, v2.22.0 (HANDOFF annexe N.5) : sorts du grimoire dans le build, réseau intercepté par page.route.
 * GR14 (aucune requête avant « Charger »), GR15 (ajout rempli), GR18 (mobile 390 px), GR19 (hors ligne).
 * GR22 (vrai portail, GitHub Pages et file://) reste une vérification manuelle avant merge.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const SORTS = "https://vincenzorpg.github.io/L5R/data/sorts/*.js";

/** Sert les fixtures du grimoire (GR1) ; compte les requêtes vers le portail. */
async function serveGrimoire(page: Page) {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("vincenzorpg.github.io")) requests.push(r.url());
  });
  await page.route(SORTS, (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop()!;
    const file = resolve("tests/fixtures/grimoire", name);
    try {
      return route.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", headers: { "access-control-allow-origin": "*" }, body: readFileSync(file, "utf-8") });
    } catch {
      return route.fulfill({ status: 404, body: "" });
    }
  });
  return requests;
}

async function openShugenjaMagic(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Utiliser le modèle Shugenja" }).click();
  await page.getByRole("button", { name: "Edit : Rouleaux & invocations" }).click();
}

const magic = (page: Page) => page.getByTestId("block-magic");
const panel = (page: Page) => page.getByRole("region", { name: "Ajouter depuis le grimoire" });
const toggle = (page: Page) => magic(page).getByRole("button", { name: "Ajouter depuis le grimoire" });
const groups = (page: Page) => magic(page).getByRole("group", { name: /^Sort : / });

test("GR14 : aucune requête au chargement, à l'ouverture du bloc ni du panneau tant qu'on ne clique pas sur « Charger »", async ({ page }) => {
  const requests = await serveGrimoire(page);
  await openShugenjaMagic(page);
  await toggle(page).click();
  await expect(panel(page).getByRole("button", { name: "Charger le grimoire" })).toBeFocused();
  await page.waitForLoadState("networkidle");
  expect(requests).toEqual([]);

  await panel(page).getByRole("button", { name: "Charger le grimoire" }).click();
  await expect(panel(page).getByRole("combobox", { name: "Nom du sort" })).toBeFocused();
  expect(requests.sort()).toEqual(["air", "eau", "feu", "terre", "universels", "vide"].map((k) => `https://vincenzorpg.github.io/L5R/data/sorts/sorts-${k}.js`));
});

test("GR15 : chercher « armure », Entrée : sort rempli en fin de liste ; grimoire gardé après rechargement", async ({ page }) => {
  await serveGrimoire(page);
  await openShugenjaMagic(page);
  await toggle(page).click();
  await panel(page).getByRole("button", { name: "Charger le grimoire" }).click();
  const before = await groups(page).count();
  await panel(page).getByRole("combobox", { name: "Nom du sort" }).fill("armure");
  await page.keyboard.press("Enter");
  await expect(groups(page)).toHaveCount(before + 1);
  const added = groups(page).last();
  await expect(added).toHaveAccessibleName("Sort : Armure de Terre");
  await expect(added.getByRole("textbox", { name: "Portée" })).toHaveValue("Personnelle");
  await expect(added.getByRole("textbox", { name: "Zone d'effet" })).toHaveValue("Le lanceur");
  await expect(added.getByRole("textbox", { name: "Durée" })).toHaveValue("10 Rounds");
  await expect(added.getByRole("textbox", { name: "Effet (résumé)" })).toHaveValue("");
  await expect(added.getByText("✓ Rempli depuis le grimoire")).toBeVisible();
  await expect(panel(page)).toBeVisible();
  await expect(page.getByTestId("grimoire-scrim")).toBeHidden();
  const list = (await panel(page).getByRole("listbox").boundingBox())!;
  expect(list.height).toBeLessThanOrEqual(321);

  // Le cache survit au rechargement : prêt sans nouvelle requête.
  const after: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("vincenzorpg.github.io")) after.push(r.url());
  });
  await page.reload();
  await page.getByRole("button", { name: "Edit : Rouleaux & invocations" }).click();
  await expect(page.getByTestId("grimoire-status")).toContainText("162 sorts");
  expect(after).toEqual([]);
});

test("GR18 : mobile 390 px, panneau en bas avec voile, fermeture après ajout, défilement vers le sort", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await serveGrimoire(page);
  await openShugenjaMagic(page);
  const status = page.getByTestId("grimoire-status");
  const tb = (await toggle(page).boundingBox())!;
  const sb = (await status.boundingBox())!;
  expect(sb.y).toBeGreaterThan(tb.y);
  await toggle(page).click();
  await panel(page).getByRole("button", { name: "Charger le grimoire" }).click();
  await expect(page.getByTestId("grimoire-scrim")).toBeVisible();
  const box = (await panel(page).boundingBox())!;
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.width)).toBe(390);
  expect(Math.round(box.y + box.height)).toBe(844);
  expect(box.height).toBeLessThanOrEqual(844 * 0.88 + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (const o of (await panel(page).getByRole("option").all()).slice(0, 5)) expect((await o.boundingBox())!.height).toBeGreaterThanOrEqual(48);

  await panel(page).getByRole("combobox").fill("eteindre");
  await panel(page).getByRole("option").first().click();
  await expect(panel(page)).toHaveCount(0);
  const added = groups(page).last();
  await expect(added).toHaveAccessibleName("Sort : Éteindre");
  await expect(added).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  // Le voile ferme le panneau.
  await toggle(page).click();
  await page.getByTestId("grimoire-scrim").click({ position: { x: 10, y: 10 } });
  await expect(panel(page)).toHaveCount(0);
});

test("GR19 : hors ligne, état error, encadré d'alerte, « + Sort » utilisable", async ({ page }) => {
  await page.route(SORTS, (route) => route.abort("internetdisconnected"));
  await openShugenjaMagic(page);
  await toggle(page).click();
  await panel(page).getByRole("button", { name: "Charger le grimoire" }).click();
  await expect(panel(page).getByRole("alert")).toContainText("Le grimoire ne répond pas.");
  await expect(page.getByTestId("grimoire-status")).toContainText("Grimoire injoignable");
  const before = await groups(page).count();
  await magic(page).getByRole("button", { name: "+ Sort" }).click();
  await expect(groups(page)).toHaveCount(before + 1);
});
