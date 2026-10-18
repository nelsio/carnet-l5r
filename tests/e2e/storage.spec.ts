/** Stockage dans le navigateur, sur le build (HANDOFF §10.4 : E1, E2, E8). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const targets = [
  { id: "E1", label: "en file://, réseau coupé", url: pathToFileURL(resolve("dist/carnet-l5r.html")).href, offline: true },
  { id: "E2", label: "servi en HTTP comme sur Pages", url: "http://localhost:4173/carnet-l5r.html", offline: false },
];

const BG = { light: "rgb(236, 230, 216)", dark: "rgb(37, 39, 42)" };
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

      await page.getByRole("button", { name: "Créer mon personnage" }).click();
      await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Doji Ayame");
      await page.getByRole("combobox", { name: "Clan" }).fill("Grue");
      await page.getByRole("spinbutton", { name: "Agilité" }).fill("4");
      await page.getByRole("button", { name: "Terminer" }).click();
      await page.getByRole("button", { name: "Ajouter 1 blessure" }).click();
      await expect(page.getByText(/Enregistré dans ce navigateur/)).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);

      await page.reload();
      await expect(page.getByRole("heading", { level: 1, name: "Doji Ayame" })).toBeVisible();
      await expect(page.getByText("Clan de la Grue")).toBeVisible();
      await expect(page.getByRole("spinbutton", { name: "Blessures subies" })).toHaveValue("1");
      await page.getByRole("button", { name: "Bibliothèque" }).click();
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
