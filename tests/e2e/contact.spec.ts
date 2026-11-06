/**
 * Lot 56, v2.32.0 (HANDOFF annexe 56) : C12, formulaire de contact dans un vrai navigateur, sur ordinateur et à 360 px.
 * Le build garde la clé « A_REMPLACER » : formulaire désactivé, aucun envoi possible. Cas C1 à C11 : tests/ui/contact.spec.tsx.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const file = resolve("dist/carnet-l5r.html");
const pageUrl = pathToFileURL(file).href;

const contactBtn = (page: Page) => page.getByRole("contentinfo").getByRole("button", { name: "Contact" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Contacter l'auteur" });

test("C12 : ouverture, clé non renseignée, focus piégé, Échap rend le focus", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("file:") && !r.url().startsWith("data:")) requests.push(r.url()); });
  await page.goto(pageUrl);
  await contactBtn(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText("Le formulaire de contact n'est pas encore disponible.");
  await expect(dialog(page).getByRole("button", { name: "Envoyer" })).toBeDisabled();
  await expect(dialog(page).getByRole("button", { name: "Fermer" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("link", { name: "Signaler sur GitHub" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("button", { name: "Fermer" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(contactBtn(page)).toBeFocused();
  expect(requests).toEqual([]);
});

test("C12 : aucune adresse mail dans le HTML servi", () => {
  const html = readFileSync(file, "utf8");
  expect(html).toContain("https://api.web3forms.com/submit");
  expect(html).not.toMatch(/mailto:/i);
  expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.(?:com|fr|net|org|io|dev|me)\b/i);
});

test.describe("C12 : à 360 px", () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true });

  test("Contact visible dans le pied de page, fenêtre sans défilement horizontal, champs à 16 px", async ({ page }) => {
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Utiliser le modèle Bushi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(contactBtn(page)).toBeInViewport();
    const box = (await contactBtn(page).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(32);
    await contactBtn(page).click();
    await expect(dialog(page)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    const d = (await dialog(page).boundingBox())!;
    expect(d.width).toBeLessThanOrEqual(360);
    for (const field of await dialog(page).locator("input.in, select, textarea").all()) {
      expect(parseFloat(await field.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    }
    const send = dialog(page).getByRole("button", { name: "Envoyer" });
    await send.scrollIntoViewIfNeeded();
    await expect(send).toBeInViewport();
    await dialog(page).getByRole("button", { name: "Fermer" }).click();
    await expect(dialog(page)).toHaveCount(0);
  });
});
