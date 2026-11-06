/**
 * Lot 56, v2.32.0 (HANDOFF annexe 56) : C12, formulaire de contact dans un vrai navigateur, sur ordinateur et à 360 px.
 * Depuis la v2.32.1, le build porte la vraie clé (annexe 56.7) : Web3Forms est simulé par `page.route`, aucun envoi réel.
 * Cas C1 à C11 : tests/ui/contact.spec.tsx.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const file = resolve("dist/carnet-l5r.html");
const pageUrl = pathToFileURL(file).href;
const MESSAGE = "Bonjour, une question sur les écoles.";

const contactBtn = (page: Page) => page.getByRole("contentinfo").getByRole("button", { name: "Contact" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Contacter l'auteur" });

test("C12 : ouverture sans requête, focus piégé, Échap rend le focus", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("file:") && !r.url().startsWith("data:")) requests.push(r.url()); });
  await page.goto(pageUrl);
  await contactBtn(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).not.toContainText("pas encore disponible");
  await expect(dialog(page).getByRole("button", { name: "Envoyer" })).toBeEnabled();
  const close = dialog(page).getByRole("button", { name: "Fermer" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog(page).getByRole("link", { name: "Signaler sur GitHub" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(contactBtn(page)).toBeFocused();
  expect(requests).toEqual([]);
});

test("C12 : envoi vers Web3Forms simulé, clé du build, remerciement", async ({ page }) => {
  const bodies: Record<string, string>[] = [];
  await page.route("https://api.web3forms.com/submit", async (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, string>);
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ success: true, message: "ok" }) });
  });
  await page.clock.install();
  await page.goto(pageUrl);
  await contactBtn(page).click();
  await dialog(page).getByLabel("Message").fill(MESSAGE);
  await page.clock.fastForward(3_000);
  await dialog(page).getByRole("button", { name: "Envoyer" }).click();
  await expect(dialog(page).getByText("Merci ! Message envoyé.")).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0]!.access_key).toMatch(/^[0-9a-f-]{36}$/);
  expect(bodies[0]!.message).toBe(MESSAGE);
  expect(bodies[0]!.subject).toBe("[Carnet] Question");
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
