/**
 * En-tête v2.8.0 (HANDOFF annexe E.19 S7) : nom du samouraï sur 2 lignes au plus, sans « … ».
 * En-tête v2.13.0 (annexe G) : sceau 帳, surtitre, favicon.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const LONG_NAME = "Kakita Haruto no Hikaru-sama des Plaines du Matin";

async function nameLines(page: Page) {
  return page.getByRole("heading", { level: 1 }).evaluate((h) => {
    const style = getComputedStyle(h);
    return {
      lines: Math.round(h.getBoundingClientRect().height / parseFloat(style.lineHeight)),
      size: parseFloat(style.fontSize),
      text: h.textContent,
      clipped: h.scrollWidth > h.clientWidth + 0.5 || style.textOverflow === "ellipsis",
    };
  });
}

for (const width of [360, 1200]) {
  test(`E32 : nom long à ${width} px : 2 lignes au plus, nom complet sans « … »`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(pageUrl);
    await page.getByRole("button", { name: "Créer mon personnage" }).click();
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill(LONG_NAME);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LONG_NAME);
    const fit = await nameLines(page);
    expect(fit.lines).toBeLessThanOrEqual(2);
    expect(fit.clipped).toBe(false);
    if (width === 360) {
      // Police réduite, environ 12 px.
      expect(fit.size).toBeLessThan(20);
      expect(fit.size).toBeGreaterThanOrEqual(8);
    }
    // Un nom court reprend la taille normale.
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Kakita Haruto");
    await expect.poll(async () => (await nameLines(page)).size).toBeGreaterThanOrEqual(26);
  });
}

const SEAL = "Carnet de Rokugan — ouvrir la bibliothèque";

async function create(page: Page, width: number, theme?: "dark") {
  await page.setViewportSize({ width, height: 800 });
  if (theme) await page.emulateMedia({ colorScheme: theme });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
}

/** Boîte du sceau sans la rotation de 3° : largeur CSS. */
const sealSize = (page: Page) => page.getByRole("button", { name: SEAL }).evaluate((b) => (b as HTMLElement).offsetWidth);

for (const theme of [undefined, "dark"] as const) {
  test(`H1 : sceau de 64 px vermillon fixe à gauche du nom, surtitre, pas de bouton Bibliothèque (${theme ?? "clair"})`, async ({ page }) => {
    await create(page, 1200, theme);
    await page.getByRole("combobox", { name: "Clan" }).fill("Crabe");
    expect(await sealSize(page)).toBe(64);
    const seal = (await page.getByRole("button", { name: SEAL }).boundingBox())!;
    const name = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(seal.x + seal.width).toBeLessThan(name.x);
    await expect(page.locator("header.top .eyebrow")).toHaveText(/Carnet de Rokugan\s*Clan du Crabe/);
    await expect(page.getByRole("button", { name: "Bibliothèque", exact: true })).toHaveCount(0);
    // Couleur de l'outil, pas celle du clan (G.3) ; teinte du thème.
    await expect(page.getByRole("button", { name: SEAL })).toHaveCSS("background-color", theme ? "rgb(181, 64, 47)" : "rgb(168, 56, 42)");
  });
}

test("H2 : Entrée sur le sceau ouvre la Bibliothèque", async ({ page }) => {
  await create(page, 1200);
  await page.getByRole("button", { name: SEAL }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Bibliothèque" })).toBeVisible();
});

test("H3 : sans personnage, sceau décoratif à côté du titre de l'outil", async ({ page }) => {
  await page.goto(pageUrl);
  await expect(page.locator("header.top span.seal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Carnet de Rokugan");
  await expect(page.locator("header.top .eyebrow")).toHaveCount(0);
});

for (const width of [390, 1200]) {
  test(`H4 : nom long à ${width} px : 2 lignes au plus, sans chevaucher le sceau`, async ({ page }) => {
    await create(page, width);
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill(LONG_NAME);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LONG_NAME);
    expect((await nameLines(page)).lines).toBeLessThanOrEqual(2);
    const seal = (await page.getByRole("button", { name: SEAL }).boundingBox())!;
    const name = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(seal.x + seal.width).toBeLessThan(name.x);
  });
}

test("H5 : « Clan de la Licorne » et nom long à 390 px : aucun débordement horizontal", async ({ page }) => {
  await create(page, 390);
  await page.getByRole("combobox", { name: "Clan" }).fill("Licorne");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Shinjo Altansarnai no Yoshiko-hime");
  await expect(page.locator("header.top .eyebrow .mon")).toHaveText("Clan de la Licorne");
  expect(await sealSize(page)).toBe(52);
  const eyebrow = (await page.locator("header.top .eyebrow").boundingBox())!;
  expect(eyebrow.x + eyebrow.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("H9 : 帳 rendu en Shippori Mincho B1 embarquée, pas en police de repli", async ({ page }) => {
  await create(page, 1200);
  await page.evaluate(() => document.fonts.ready);
  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: "button.seal" });
  const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
  // Une seule police, la nôtre (nom interne du fichier : « Shippori Mincho B1 ExtraBold »).
  expect(fonts).toHaveLength(1);
  expect(fonts[0]!.familyName).toMatch(/^Shippori Mincho B1/);
  expect(fonts[0]!.isCustomFont).toBe(true);
});

test("H12 : favicon et apple-touch-icon embarquées dans le fichier unique", async ({ page }) => {
  await page.goto(pageUrl);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /^data:image\/svg\+xml;base64,/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", /^data:image\/png;base64,/);
});
