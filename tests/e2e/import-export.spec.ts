/** Import et export sur le build (HANDOFF §10.4 : E3, E4, E5). */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const kakitaPath = resolve("reference/exemple-personnage.json");

const fileInput = (page: Page) => page.getByLabel("Fichier JSON à importer");
const dialog = (page: Page) => page.getByRole("dialog");

async function importFile(page: Page, file: string | { name: string; mimeType: string; buffer: Buffer }, destination: RegExp) {
  await fileInput(page).setInputFiles(file);
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole("radio", { name: destination }).check();
}

test("E3 : export, puis import en « Nouvelle fiche » : fiche identique", async ({ page }) => {
  await page.goto(pageUrl);
  await importFile(page, kakitaPath, /Nouvelle fiche/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();

  const [first] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter la fiche" }).click()]);
  expect(first.suggestedFilename()).toBe("kakita-haruto-l5r.json");
  const exported = readFileSync(await first.path());

  await importFile(page, { name: "kakita-haruto-l5r.json", mimeType: "application/json", buffer: exported }, /Nouvelle fiche/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(dialog(page)).toBeHidden();
  const [second] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter la fiche" }).click()]);
  expect(readFileSync(await second.path()).toString()).toBe(exported.toString());
  expect(JSON.parse(exported.toString())).toEqual(JSON.parse(readFileSync(kakitaPath, "utf8")));

  await page.getByRole("button", { name: "Bibliothèque" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("E4 : import en « Consultation » : badge, lecture seule, jet possible sans dépense de Vide", async ({ page }) => {
  await page.goto(pageUrl);
  await importFile(page, kakitaPath, /Consultation/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Consultation");
  await expect(page.locator("main input, main textarea, main select, .status input")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Modifier la fiche" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Point de Vide 1" })).toBeDisabled();

  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.locator("button.act").filter({ hasText: "Remarquer un détail" }).click();
  await page.getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+1g1\)/ }).check();
  await page.getByRole("button", { name: "Lancer 4g3" }).click();
  await expect(page.getByLabel("Dés", { exact: true })).toBeVisible();
  await expect(page.getByText("Points de Vide 2/2")).toBeVisible();

  await page.getByRole("button", { name: "Bibliothèque" }).click();
  await expect(page.getByRole("listitem").getByText("Consultation")).toBeVisible();
});

test("E5 : fusion ajoutant Kyujutsu et un arc : aperçu, puis tir sur Réflexes et dégâts sur la force de l'arc", async ({ page }) => {
  await page.goto(pageUrl);
  await importFile(page, kakitaPath, /Nouvelle fiche/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();

  const patch = {
    schemaVersion: 1,
    skills: [{ name: "Kyujutsu", rank: 1, trait: "reflexes", emphases: [] }],
    weapons: [{ name: "Yumi", skill: "Kyujutsu", dr: "2k2", bowStrength: 3 }],
  };
  await importFile(page, { name: "arc.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(patch)) }, /Fusionner dans « Kakita Haruto »/);
  const adds = dialog(page).getByRole("region", { name: "Ajouts" });
  await expect(adds).toContainText("Compétence : Kyujutsu");
  await expect(adds).toContainText("Arme : Yumi");
  await expect(dialog(page).getByRole("region", { name: "Modifications" })).toHaveCount(0);
  await dialog(page).getByRole("button", { name: "Appliquer" }).click();
  await expect(dialog(page)).toBeHidden();

  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  // Kyujutsu 1 + Réflexes 3 = 4g3 ; force de l'arc 3 + 2g2 = 5g2.
  await expect(page.locator("button.act").filter({ hasText: "Tir · Yumi" }).locator(".p")).toHaveText("4g3");
  await expect(page.locator("button.act").filter({ hasText: "Dégâts · Yumi" }).locator(".p")).toHaveText("5g2");
  await page.locator("button.act").filter({ hasText: "Tir · Yumi" }).click();
  await expect(page.getByText("Kyujutsu 1 + Réflexes 3")).toBeVisible();
  await page.locator("button.act").filter({ hasText: "Dégâts · Yumi" }).click();
  await expect(page.getByText("Arc 3 + VD 2k2")).toBeVisible();
});
