/** Lot 20, v2.17.0 (HANDOFF annexe J) : rendu réel du lanceur et du bloc Identité (cas Q4, Q19). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Fiche avec Kenjutsu 7 et un katana : les dégâts explosent sur 9 (étiquette « 9+ »). */
async function kenjutsu7(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  await page.getByRole("button", { name: "Edit : Compétences" }).click();
  await page.getByRole("button", { name: "+ Compétence" }).click();
  await page.getByRole("textbox", { name: "Nom de la compétence" }).fill("Kenjutsu");
  await page.getByRole("spinbutton", { name: "Rang de Kenjutsu" }).fill("7");
  await page.getByRole("button", { name: "Terminer : Compétences" }).click();
  await page.getByRole("button", { name: "Edit : Armes" }).click();
  await page.getByRole("button", { name: "+ Arme" }).click();
  await page.getByRole("group", { name: /^Arme : / }).getByRole("textbox", { name: "Nom" }).fill("Katana");
  await page.getByRole("button", { name: "Terminer : Armes" }).click();
}

test("Q19 : Min, Moy., Max et Réussite de même hauteur, texte centré (± 1 px) ; « 9+ » garde le style .tag", async ({ page }) => {
  await kenjutsu7(page);
  await page.getByRole("button", { name: "Aide de jeu" }).click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  await page.locator("button.act").filter({ hasText: /^Attaque · Katana/ }).click();
  await page.getByRole("spinbutton", { name: "ND d'armure cible" }).fill("10");
  await page.locator("button.act").filter({ hasText: /^Dégâts · Katana/ }).click();
  const dialog = page.getByRole("dialog", { name: "Lanceur de dés" });
  await expect(dialog.getByTitle("Explose sur 9")).toHaveText("9+");
  const cells = await dialog.locator(".statline > span").evaluateAll((spans) => spans.map((span) => {
    const box = span.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(span);
    const text = range.getBoundingClientRect();
    return { height: box.height, offset: Math.abs(text.top + text.height / 2 - (box.top + box.height / 2)) };
  }));
  expect(cells.length).toBeGreaterThanOrEqual(3);
  for (const c of cells) {
    expect(c.height).toBeCloseTo(cells[0]!.height, 0);
    expect(c.offset).toBeLessThanOrEqual(1);
  }
  // L'étiquette n'hérite plus du fond ni du padding des cases.
  const tag = await dialog.getByTitle("Explose sur 9").evaluate((el) => getComputedStyle(el).paddingLeft);
  expect(tag).toBe("7px");
});

test("Q4 : bloc Identité, valeurs en mono, Initiative en .pool, placeholder du Rang d'école en police du corps", async ({ page }) => {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Nouvelle fiche vierge" }).click();
  const placeholderFont = await page.getByRole("spinbutton", { name: "Rang d'école" })
    .evaluate((el) => getComputedStyle(el, "::placeholder").fontFamily);
  expect(placeholderFont).toContain("Zen Kaku Gothic New");
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
  const identity = page.getByTestId("block-identity");
  const honor = await identity.locator(".kv b").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(honor).toContain("JetBrains Mono");
  const skillsBlockValue = await page.locator(".cstats b").first().evaluate((el) => getComputedStyle(el).fontSize);
  expect(await identity.locator(".kv b").first().evaluate((el) => getComputedStyle(el).fontSize)).toBe(skillsBlockValue);
  await expect(identity.getByTestId("sheet-initiative")).toHaveClass(/pool/);
});
