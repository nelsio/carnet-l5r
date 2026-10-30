/** Techniques d'école sur le build (HANDOFF annexe C.7 : E16 à E19). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const kakitaPath = resolve("tests/fixtures/kakita-v1.json");

/** Importe la fiche v1 d'exemple en « Nouvelle fiche ». */
async function importKakita(page: Page) {
  await page.goto(pageUrl);
  await page.getByLabel("Fichier JSON à importer").setInputFiles(kakitaPath);
  await page.getByRole("dialog").getByRole("radio", { name: /Nouvelle fiche/ }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
}

async function chooseSchool(page: Page, school: string, insight: string) {
  await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
  // Option du catalogue groupé (annexe I.3.3) : le nom de l'école est dans `.n`.
  const select = page.getByRole("combobox", { name: "Techniques d'école" });
  const option = select.locator("option").filter({ has: page.locator(".n", { hasText: new RegExp(`^${school}$`) }) });
  await select.selectOption((await option.getAttribute("value"))!);
  await page.getByRole("spinbutton", { name: "Rang d'Insight" }).fill(insight);
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
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
  await page.getByRole("combobox", { name: "Posture" }).selectOption("fullAttack");
  await expect(armor).toHaveText("10");
});

test("E18 : Kakita 2 en Centre : étiquette Kakita R1, case « Initiative plus basse » décochée puis remise à zéro", async ({ page }) => {
  await importKakita(page);
  await chooseSchool(page, "École de bushi Kakita", "2");
  await skirmish(page);
  await page.getByRole("combobox", { name: "Posture" }).selectOption("center");
  // En Centre, la carte est grisée (annexe E.3 F2) : « Lancer quand même ».
  await page.getByRole("button", { name: "Lancer quand même : Attaque · Katana" }).click();
  const roller = page.getByRole("dialog", { name: "Lanceur de dés" });
  await expect(roller.getByTestId("tech-chips")).toContainText("+1g1 +2 · Kakita R1");
  const box = roller.getByRole("checkbox", { name: /Cible à l'Initiative plus basse/ });
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(roller.getByTestId("pool")).toHaveText("8g4");
  await page.getByRole("button", { name: "Lancer quand même : Dégâts · Katana" }).click();
  await page.getByRole("button", { name: "Lancer quand même : Attaque · Katana" }).click();
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

/* ---------- Lot 11 : courtisans et Shosuro (annexe D.7) ---------- */

const courtierPath = resolve("reference/perso-test-courtisans.json");

/** Importe le personnage de test des courtisans en « Nouvelle fiche ». */
async function importCourtier(page: Page) {
  await page.goto(pageUrl);
  await page.getByLabel("Fichier JSON à importer").setInputFiles(courtierPath);
  await page.getByRole("dialog").getByRole("radio", { name: /Nouvelle fiche/ }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Importer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Personnage de test des courtisans" })).toBeVisible();
}

async function court(page: Page) {
  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.getByRole("button", { name: "Cour", exact: true }).click();
}

test("E20 : Doji, Honneur 6,5 puis 5,0 : « 1 augm. gratuite · Doji R1 » en Courtoisie, puis plus rien", async ({ page }) => {
  await importCourtier(page);
  await chooseSchool(page, "École de courtisans Doji", "1");
  await court(page);
  await page.getByRole("button", { name: /^Convaincre, manipuler/ }).click();
  const roller = page.getByRole("dialog", { name: "Lanceur de dés" });
  await expect(roller.getByTestId("tech-chips")).toContainText("1 augm. gratuite · Doji R1");
  await page.getByRole("button", { name: "Fiche", exact: true }).click();
  await page.getByRole("button", { name: "Edit : Identité & réputation" }).click();
  await page.getByRole("spinbutton", { name: "Honneur" }).fill("5");
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await court(page);
  await page.getByRole("button", { name: /^Convaincre, manipuler/ }).click();
  await expect(roller.getByTestId("tech-chips")).toHaveCount(0);
});

test("E21 : Ide 1, Sincérité : Duperie puis Honnêteté, étiquettes Ide R1 et relance des 1", async ({ page }) => {
  await importCourtier(page);
  await chooseSchool(page, "École d'émissaires Ide", "1");
  await court(page);
  await page.getByRole("button", { name: /^Être cru/ }).click();
  const roller = page.getByRole("dialog", { name: "Lanceur de dés" });
  const emphasis = roller.getByRole("combobox", { name: /Spécialisation/ });
  await emphasis.selectOption("Duperie");
  await expect(roller.getByTestId("tech-chips")).toContainText("ND +5 · Ide R1");
  await expect(roller.getByTestId("manual")).toContainText("relance une fois chaque 1");
  await emphasis.selectOption("Honnêteté");
  await expect(roller.getByTestId("tech-chips")).toContainText("1 augm. gratuite · Ide R1");
  await expect(roller.getByTestId("manual")).toContainText("relance une fois chaque 1");
});

test("E22 : Yasuki 4, Étiquette : rappel « +20 au ND de qui tente de te tromper » sous la réserve", async ({ page }) => {
  await importCourtier(page);
  await chooseSchool(page, "École de courtisans Yasuki", "4");
  await court(page);
  await page.getByRole("button", { name: /^Résister à une influence/ }).click();
  await expect(page.getByRole("dialog", { name: "Lanceur de dés" }).getByTestId("school-reminders"))
    .toContainText("+20 au ND de qui tente de te tromper.");
});

test("E23 : Shosuro Acteur 3, Comédie : option « 2 points de Vide (+6g2) », absente en Kenjutsu", async ({ page }) => {
  await importCourtier(page);
  await chooseSchool(page, "École d'acteurs Shosuro", "3");
  await court(page);
  await page.getByRole("button", { name: /^Jouer un rôle/ }).click();
  const roller = page.getByRole("dialog", { name: "Lanceur de dés" });
  await roller.getByRole("checkbox", { name: /Dépenser 2 points de Vide \(\+6g2\)/ }).check();
  await expect(roller.getByTestId("pool")).toHaveText("10g5");
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await page.getByRole("button", { name: /^Attaque · Katana/ }).click();
  await expect(roller.getByRole("checkbox", { name: /Dépenser 2 points de Vide/ })).toHaveCount(0);
});
