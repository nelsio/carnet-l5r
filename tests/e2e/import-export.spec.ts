/** Import et export sur le build (HANDOFF §10.4 : E3, E4, E5). */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { VIEW } from "../helpers/views";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const kakitaPath = resolve("tests/fixtures/kakita-v1.json");

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
  // Fiche v1 de référence, exportée au format v2 (annexe C.2).
  const v1 = JSON.parse(readFileSync(kakitaPath, "utf8"));
  // Mots-clés du livre (annexe E.2 C8) : le wakizashi est une arme moyenne.
  const keywords = [["samourai", "moyenne"], ["samourai", "moyenne"]];
  expect(JSON.parse(exported.toString())).toEqual({
    ...v1, schemaVersion: 2, schoolId: "", schoolRank: null,
    weapons: v1.weapons.map((w: object, i: number) => ({ ...w, keywords: keywords[i] })),
  });

  await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("E4 : import en « Consultation » : badge, lecture seule, jet possible sans dépense de Vide", async ({ page }) => {
  await page.goto(pageUrl);
  await importFile(page, kakitaPath, /Consultation/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Consultation");
  await expect(page.locator("main input, main textarea, main select, .status input")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Edit : / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Point de Vide 1" })).toBeDisabled();

  await page.getByRole("button", { name: VIEW.aid }).click();
  await page.locator("button.act").filter({ hasText: "Remarquer un détail" }).click();
  await page.getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+1g1\)/ }).check();
  await page.getByRole("button", { name: "Lancer 4g3" }).click();
  await expect(page.getByLabel("Dés", { exact: true })).toBeVisible();
  await expect(page.getByText("Points de Vide 2/2")).toBeVisible();

  await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
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

  await page.getByRole("button", { name: VIEW.aid }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  // Kyujutsu 1 + Réflexes 3 = 4g3 ; force de l'arc 3 plafonnée par la Force 2 (C11) + 2g2 = 4g2.
  await expect(page.locator("button.act").filter({ hasText: "Tir · Yumi" }).locator(".p")).toHaveText("4g3");
  await expect(page.locator("button.act").filter({ hasText: "Dégâts · Yumi" }).locator(".p")).toHaveText("4g2");
  await page.locator("button.act").filter({ hasText: "Tir · Yumi" }).click();
  await expect(page.getByText("Kyujutsu 1 + Réflexes 3")).toBeVisible();
  await page.locator("button.act").filter({ hasText: "Dégâts · Yumi" }).click();
  await expect(page.getByText("Arc 2 + VD 2g2")).toBeVisible();
  await expect(page.getByText("Force 2 : l'arc de force 3 tire à 2.")).toBeVisible();
});

test("Lot 39 : export de la Forge importé depuis la Bibliothèque vide, puis avec fiches, puis en fusion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(pageUrl);
  await importFile(page, resolve("tests/fixtures/forge-mirumoto.json"), /Nouvelle fiche/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Testeur Kitsuki" })).toBeVisible();

  await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
  await importFile(page, resolve("tests/fixtures/forge-isawa.json"), /Nouvelle fiche/);
  await dialog(page).getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Testeur Shiba" })).toBeVisible();

  await importFile(page, resolve("tests/fixtures/forge-mirumoto.json"), /Fusionner dans « Testeur Shiba »/);
  await expect(dialog(page).getByRole("alert")).toHaveCount(0);
  await dialog(page).getByRole("button", { name: "Appliquer" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Testeur Kitsuki" })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("Lot 42 : import depuis une fiche papier", () => {
  const reply = readFileSync(resolve("tests/fixtures/photo-reponse.txt"), "utf8");
  const photoDialog = (page: Page) => page.getByRole("dialog", { name: "Importer depuis une fiche papier" });

  test("réponse collée dans la Bibliothèque vide : import, la fiche s'ouvre, aucune requête", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => { if (!r.url().startsWith("file:")) requests.push(r.url()); });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Depuis une photo…" }).click();
    await photoDialog(page).getByRole("textbox", { name: "Réponse de l'IA" }).fill(reply);
    await photoDialog(page).getByRole("button", { name: "Vérifier" }).click();
    await expect(photoDialog(page).getByRole("region", { name: "À vérifier sur ta fiche (3)" })).toBeVisible();
    await photoDialog(page).getByRole("button", { name: "Importer" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Hiruma Daisuke" })).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("390 px : feuille du bas sans défilement horizontal, boutons d'au moins 44 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Depuis une photo…" }).click();
    const box = (await photoDialog(page).boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    await photoDialog(page).getByText("Voir le prompt").click();
    await photoDialog(page).getByRole("textbox", { name: "Réponse de l'IA" }).fill(reply);
    await photoDialog(page).getByRole("button", { name: "Vérifier" }).click();
    for (const name of ["Copier le prompt", "Vérifier", "Annuler", "Importer"]) {
      expect((await photoDialog(page).getByRole("button", { name }).boundingBox())!.height, name).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(await photoDialog(page).evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  });
});
