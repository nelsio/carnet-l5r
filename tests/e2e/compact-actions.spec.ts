/** Lot 46, v2.28.0 (annexe 46.4) : vue compacte de l'Assistant L5R sur le build. */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const kakitaPath = resolve("tests/fixtures/kakita-v1.json");

/** Importe la fiche v1 d'exemple en « Nouvelle fiche ». */
async function importKakita(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(pageUrl);
  await page.getByLabel("Fichier JSON à importer").setInputFiles(kakitaPath);
  await page.getByRole("dialog").getByRole("radio", { name: /Nouvelle fiche/ }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
}

async function skirmish(page: Page) {
  await page.getByRole("button", { name: VIEW.aid }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
}

/** Préférence enregistrée dans IndexedDB. */
const storedCompact = (page: Page) =>
  page.evaluate(() => new Promise<boolean | undefined>((resolve, reject) => {
    const req = indexedDB.open("carnet-l5r");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const get = req.result.transaction("prefs").objectStore("prefs").get("prefs");
      get.onsuccess = () => resolve((get.result as { compactActions?: boolean } | undefined)?.compactActions);
    };
  }));

const toggle = (page: Page) => page.getByRole("button", { name: "Explications des actions" });
const katana = (page: Page) => page.getByRole("button", { name: /^Attaque · Katana/ });

for (const width of [1280, 390]) {
  test(`${width} px : carte d'attaque non choisie à moins de 60 % de sa hauteur détaillée`, async ({ page }) => {
    await importKakita(page, width);
    await skirmish(page);
    await expect(katana(page)).toHaveAttribute("aria-pressed", "false");
    const detailed = (await katana(page).boundingBox())!.height;
    await toggle(page).click();
    await expect(page.getByText("explications masquées")).toBeVisible();
    const compact = (await katana(page).boundingBox())!.height;
    expect(compact / detailed).toBeLessThan(0.6);
  });
}

test("1280 px : « Attaque · Katana » en Action simple tient sur une ligne, étiquette comprise", async ({ page }) => {
  await importKakita(page, 1280);
  // Kakita R4 : attaque au katana en Action simple.
  await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
  const select = page.getByRole("combobox", { name: "Techniques d'école" });
  const option = select.locator("option").filter({ has: page.locator(".n", { hasText: /^École de bushi Kakita$/ }) });
  await select.selectOption((await option.getAttribute("value"))!);
  await page.getByRole("spinbutton", { name: "Rang d'Insight" }).fill("4");
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await skirmish(page);
  await toggle(page).click();
  const title = katana(page).locator(".t");
  const tag = title.locator(".tag.sa");
  await expect(tag).toHaveText("Attaque : Action simple");
  const [t, g] = [(await title.boundingBox())!, (await tag.boundingBox())!];
  // Une seule ligne : l'étiquette est dans la hauteur du titre, qui n'en a pas pris une deuxième.
  expect(g.y + g.height).toBeLessThanOrEqual(t.y + t.height + 1);
  expect(t.height).toBeLessThan(30);
});

test("la vue compacte est conservée après rechargement", async ({ page }) => {
  await importKakita(page, 1280);
  await skirmish(page);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => storedCompact(page)).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
  await skirmish(page);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("explications masquées")).toBeVisible();
});
