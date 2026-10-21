/** Techniques d'école sur le build (HANDOFF annexe C.7 : E16 à E19). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const kakitaPath = resolve("reference/exemple-personnage.json");

/** Importe la fiche v1 d'exemple en « Nouvelle fiche ». */
async function importKakita(page: Page) {
  await page.goto(pageUrl);
  await page.getByLabel("Fichier JSON à importer").setInputFiles(kakitaPath);
  await page.getByRole("dialog").getByRole("radio", { name: /Nouvelle fiche/ }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
}

async function chooseSchool(page: Page, school: string, insight: string) {
  await page.getByRole("button", { name: "Modifier la fiche" }).click();
  await page.getByRole("combobox", { name: "Techniques d'école" }).selectOption({ label: school });
  await page.getByRole("spinbutton", { name: "Rang (Insight)" }).fill(insight);
  await page.getByRole("button", { name: "Terminer" }).click();
}

async function skirmish(page: Page) {
  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
}

test("E16 : École de bushi Hiruma, Rang d'Insight 2 : R1 et R2 avec badges, R3 à R5 grisés ; attaque katana 6g3", async ({ page }) => {
  await importKakita(page);
  await chooseSchool(page, "École de bushi Hiruma", "2");
  await expect(page.getByTestId("school-rank-1")).toContainText("auto");
  await expect(page.getByTestId("school-rank-2")).toContainText("à cocher");
  for (const r of [3, 4, 5]) await expect(page.getByTestId(`school-rank-${r}`)).toHaveClass(/locked/);
  await expect(page.getByTestId("attack-pool-Katana")).toHaveText("6g3");
});

test("E17 : Hiruma 2, compteur « Touches » à 2 : ND d'armure +10, perdu en Assaut", async ({ page }) => {
  await importKakita(page);
  await chooseSchool(page, "École de bushi Hiruma", "2");
  await skirmish(page);
  const armor = page.getByTestId("armor-tn");
  await expect(armor).toHaveText("20");
  const add = page.getByRole("button", { name: "Ajouter : Touches au corps à corps" });
  await add.click();
  await add.click();
  await expect(armor).toHaveText("30");
  await page.getByRole("group", { name: "Posture" }).getByRole("button", { name: /^Assaut/ }).click();
  await expect(armor).toHaveText("10");
});

test("E18 : Kakita 2 en Centre : étiquette Kakita R1, case « Initiative plus basse » décochée puis remise à zéro", async ({ page }) => {
  await importKakita(page);
  await chooseSchool(page, "École de bushi Kakita", "2");
  await skirmish(page);
  await page.getByRole("group", { name: "Posture" }).getByRole("button", { name: /^Centre/ }).click();
  await page.getByRole("button", { name: /^Attaque · Katana/ }).click();
  const roller = page.getByRole("dialog", { name: "Lanceur de dés" });
  await expect(roller.getByTestId("tech-chips")).toContainText("+1g1 +2 · Kakita R1");
  const box = roller.getByRole("checkbox", { name: /Cible à l'Initiative plus basse/ });
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(roller.getByTestId("pool")).toHaveText("8g4");
  await page.getByRole("button", { name: /^Dégâts · Katana/ }).click();
  await page.getByRole("button", { name: /^Attaque · Katana/ }).click();
  await expect(roller.getByRole("checkbox", { name: /Cible à l'Initiative plus basse/ })).not.toBeChecked();
});

test("E19 : fiche v1 importée : suggestion « Associer à École de bushi Kakita ? », rien d'appliqué sans confirmation", async ({ page }) => {
  await importKakita(page);
  const suggestion = page.getByRole("group", { name: "Suggestion d'école" });
  await expect(suggestion).toContainText("Associer à École de bushi Kakita ?");
  await expect(page.getByTestId("school-techniques")).toHaveCount(0);
  await expect(page.getByTestId("sheet-initiative")).toHaveText("4g3");
  await suggestion.getByRole("button", { name: "Associer" }).click();
  await expect(page.getByTestId("school-techniques")).toContainText("École de bushi Kakita");
  await expect(page.getByTestId("sheet-initiative")).toHaveText("4g3 +6");
});
