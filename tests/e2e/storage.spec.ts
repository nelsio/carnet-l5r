/** Stockage dans le navigateur, sur le build (HANDOFF §10.4 : E1, E2, E8, E14, E15). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { openWounds, woundsButton } from "./wounds";

const targets = [
  { id: "E1", label: "en file://, réseau coupé", url: pathToFileURL(resolve("dist/carnet-l5r.html")).href, offline: true },
  { id: "E2", label: "servi en HTTP comme sur Pages", url: "http://localhost:4173/carnet-l5r.html", offline: false },
];

const BG = { light: "rgb(236, 230, 216)", dark: "rgb(38, 37, 42)" }; // --bg sombre réchauffé (annexe I.1.3)
const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

for (const t of targets) {
  test.describe(`${t.id} : ${t.label}`, () => {
    test("aucune requête sortante ; une fiche créée est conservée après rechargement", async ({ page, context }) => {
      const origin = new URL(t.url).origin;
      const external: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (!url.startsWith("data:") && !url.startsWith("file://") && !url.startsWith(origin)) external.push(url);
      });
      await page.goto(t.url);
      if (t.offline) await context.setOffline(true);

      await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
      await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Doji Ayame");
      await page.getByRole("combobox", { name: "Clan" }).fill("Grue");
      await page.getByRole("button", { name: "Edit : Anneaux & Traits" }).click();
      await page.getByRole("spinbutton", { name: "Agilité" }).fill("4");
      await page.getByRole("button", { name: "Terminer : Anneaux & Traits" }).click();
      await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
      await (await woundsButton(page, "Ajouter 1 blessure")).click();
      await expect(page.getByText(/Enregistré dans ce navigateur/)).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);

      await page.reload();
      await expect(page.getByRole("heading", { level: 1, name: "Doji Ayame" })).toBeVisible();
      await expect(page.getByText("Clan de la Grue")).toBeVisible();
      await openWounds(page);
      await expect(page.getByRole("spinbutton", { name: "Blessures subies" })).toHaveValue("1");
      await page.getByRole("button", { name: "Carnet de Rokugan — ouvrir la bibliothèque" }).click();
      await expect(page.getByRole("listitem")).toHaveCount(1);
      expect(external).toEqual([]);
    });

    test("E8 : thème forcé conservé après rechargement ; en auto, la page suit le système", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(t.url);
      await expect(page.getByRole("button", { name: "Thème : auto" })).toBeVisible();
      expect(await background(page)).toBe(BG.dark);
      await page.emulateMedia({ colorScheme: "light" });
      expect(await background(page)).toBe(BG.light);

      await page.getByRole("button", { name: "Thème : auto" }).click();
      await page.getByRole("button", { name: "Thème : clair" }).click();
      await expect(page.getByRole("button", { name: "Thème : sombre" })).toBeVisible();
      await page.waitForTimeout(200);
      await page.reload();
      await expect(page.getByRole("button", { name: "Thème : sombre" })).toBeVisible();
      expect(await background(page)).toBe(BG.dark);

      await page.getByRole("button", { name: "Thème : sombre" }).click();
      await expect(page.getByRole("button", { name: "Thème : auto" })).toBeVisible();
      await page.waitForTimeout(200);
      await page.reload();
      await expect(page.getByRole("button", { name: "Thème : auto" })).toBeVisible();
      expect(await background(page)).toBe(BG.light);
    });
  });
}

test.describe("Préférences et armure après rechargement (file://)", () => {
  const url = targets[0]!.url;

  test("E14 : l'éditeur d'armure s'ouvre depuis la tuile ; bonus et réduction conservés", async ({ page }) => {
    await page.goto(url);
    await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
    await page.getByRole("button", { name: "Terminer" }).click();
    const armorTile = page.locator(".cstats .ct").filter({ hasText: "ND armure" });
    await expect(armorTile).toContainText("15");
    await armorTile.click();
    const editor = page.getByRole("group", { name: "Armure" });
    await editor.getByRole("spinbutton", { name: "Bonus au ND" }).fill("5");
    await editor.getByRole("spinbutton", { name: "Réduction" }).fill("3");
    await expect(armorTile).toContainText("20");
    await expect(page.locator(".cstats .ct").filter({ hasText: "Réduction" })).toContainText("3");
    await expect(page.getByText(/Enregistré dans ce navigateur/)).toBeVisible();
    await page.reload();
    await expect(page.locator(".cstats .ct").filter({ hasText: "ND armure" })).toContainText("20");
    await expect(page.locator(".cstats .ct").filter({ hasText: "Réduction" })).toContainText("3");
  });

  test("E15 : lanceur de dés affiché par défaut, partout ; masqué, le choix survit au rechargement (J.7)", async ({ page }) => {
    await page.goto(url);
    await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
    await page.getByRole("button", { name: "Terminer" }).click();
    await page.getByRole("button", { name: "Aide de jeu" }).click();
    for (const s of ["Enquête", "Déplacement", "Combat"]) {
      await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: s, exact: true }).click();
      await page.locator("button.act").first().click();
      await expect(page.getByRole("button", { name: /^Lancer/ }), s).toBeVisible();
    }
    await page.getByRole("button", { name: "Lanceur de dés : affiché" }).click();
    await expect(page.getByRole("button", { name: /^Lancer/ })).toHaveCount(0);
    await page.waitForTimeout(200);
    await page.reload();
    await expect(page.getByRole("button", { name: "Lanceur de dés : masqué" })).toBeVisible();
  });
});
