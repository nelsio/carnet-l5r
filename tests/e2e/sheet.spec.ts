/** Rendu réel de la fiche : polices du bloc Identité et du Rang d'école (HANDOFF annexe J, cas Q4). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

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
