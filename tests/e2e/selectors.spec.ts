/**
 * Sélecteurs stylés (annexe I.3.7) : D1, D7 et D8 dans Chromium (`appearance: base-select`).
 * D3 à D6 : tests/ui/selectors.spec.tsx ; D9 : tests/e2e/mobile.spec.ts ; D10 : lint N8 (tests/colors.spec.ts).
 * Captures (deux thèmes, liste ouverte) dans test-results/selecteurs/, hors dépôt.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

async function create(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
}

/** Valeur calculée d'un jeton de couleur, via un élément témoin. */
const token = (page: Page, name: string) => page.evaluate((n) => {
  const probe = document.createElement("div");
  probe.style.background = `var(${n})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}, name);

/** Fond et ombre du menu ouvert. */
const picker = (select: Locator) => select.evaluate((e) => {
  const st = getComputedStyle(e, "::picker(select)");
  return { background: st.backgroundColor, shadow: st.boxShadow };
});

async function checkOpenMenu(page: Page, select: Locator) {
  expect(await select.evaluate((e) => getComputedStyle(e).appearance)).toBe("base-select");
  await select.click();
  const checked = select.locator("option:checked");
  await expect(checked).toBeVisible();
  const menu = await picker(select);
  expect(menu.background).toBe(await token(page, "--surface-2"));
  expect(menu.shadow).not.toBe("none");
  // Option choisie sur --accent-pale (sauf survol : la souris est sur le champ, pas sur la liste).
  expect(await checked.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(await token(page, "--accent-pale"));
  await page.keyboard.press("Escape");
}

async function checkFocusRing(page: Page, select: Locator) {
  await select.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await select.evaluate((e) => ({ style: getComputedStyle(e).outlineStyle, width: getComputedStyle(e).outlineWidth }));
  expect(outline).toEqual({ style: "solid", width: "2px" });
}

for (const theme of ["light", "dark"] as const) {
  test(`D1, D8 : Techniques d'école (catalogue groupé), ${theme}`, async ({ page }) => {
    await create(page, theme);
    const select = page.getByRole("combobox", { name: "Techniques d'école" });
    await checkFocusRing(page, select);
    await checkOpenMenu(page, select);
    await select.click();
    // D8 : titres de clan, « Aucune » en tête, classe de l'école à droite ; liste au moins à la largeur du champ (I.8).
    await expect(select.locator("legend", { hasText: "Crabe" })).toBeVisible();
    await expect(select.locator("option").first()).toContainText("Aucune");
    const hiruma = select.locator('option[value="hiruma-bushi"]');
    await hiruma.scrollIntoViewIfNeeded();
    const name = (await hiruma.locator(".n").boundingBox())!;
    const meta = (await hiruma.locator(".m").boundingBox())!;
    expect(meta.x).toBeGreaterThan(name.x + name.width);
    const field = (await select.boundingBox())!;
    const list = (await select.locator("option").first().boundingBox())!;
    // Options = largeur du menu − rembourrage (2 × 4 px) − bordures (2 × 1 px) ; nom et classe sans débordement.
    expect(list.width).toBeGreaterThanOrEqual(field.width - 10);
    const option = (await hiruma.boundingBox())!;
    expect(meta.x + meta.width).toBeLessThanOrEqual(option.x + option.width);
    await page.screenshot({ path: `test-results/selecteurs/catalogue-${theme}.png` });
    await page.keyboard.press("Escape");
    // Champ fermé : nom seul (le résumé est masqué dans <selectedcontent>).
    await select.selectOption("hiruma-bushi");
    await expect(select.locator("selectedcontent .n")).toHaveText("École de bushi Hiruma");
    await expect(select.locator("selectedcontent .d")).toBeHidden();
  });

  test(`D1, D7 : Affinité (Anneau, ensō et kanji), ${theme}`, async ({ page }) => {
    await create(page, theme);
    await page.getByRole("combobox", { name: "Techniques d'école" }).selectOption("isawa-shugenja");
    const select = page.getByRole("combobox", { name: "Affinité (shugenja)" });
    await checkFocusRing(page, select);
    await select.click();
    const rings = await select.locator("option").evaluateAll((options) => options.filter((o) => o.getAttribute("value")).map((o) => {
      const k = o.querySelector(".k")!;
      const enso = getComputedStyle(k, "::before");
      return {
        value: o.getAttribute("value"), kanji: k.textContent,
        color: getComputedStyle(k).color, ensoColor: enso.backgroundColor,
        ensoMask: enso.maskImage || enso.getPropertyValue("-webkit-mask-image"),
      };
    }));
    expect(rings.map((r) => r.kanji)).toEqual(["風", "土", "火", "水", "空"]);
    for (const r of rings) {
      expect(r.color).toBe(await token(page, `--ring-${r.value}`));
      expect(r.ensoColor).toBe(r.color);
      expect(r.ensoMask).toContain("url(");
    }
    await page.screenshot({ path: `test-results/selecteurs/anneau-${theme}.png` });
    await page.keyboard.press("Escape");
    // Champ fermé : pastille et nom, sans les Traits.
    await select.selectOption("air");
    await expect(select.locator("selectedcontent .k")).toHaveText("風");
    await expect(select.locator("selectedcontent .n")).toHaveText("Air");
    await expect(select.locator("selectedcontent .d")).toBeHidden();
    await checkOpenMenu(page, select);
  });

  test(`D1 : Posture (avec effets) et Trait (champ), ${theme}`, async ({ page }) => {
    await create(page, theme);
    await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
    await page.getByRole("button", { name: "Aide de jeu" }).click();
    await page.getByRole("button", { name: "Combat", exact: true }).click();
    const stance = page.getByRole("combobox", { name: "Posture" });
    // Nouveau personnage, Réflexes 2 : ND d'armure 15 en Attaque, 5 en Assaut.
    await expect(page.getByTestId("armor-tn")).toHaveText("15");
    await checkFocusRing(page, stance);
    await checkOpenMenu(page, stance);
    await stance.click();
    await expect(stance.locator('option[value="fullAttack"] .fx .up')).toHaveText("+2g1 attaque");
    await expect(stance.locator('option[value="fullAttack"] .d')).toBeVisible();
    await page.screenshot({ path: `test-results/selecteurs/posture-${theme}.png` });
    await page.keyboard.press("Escape");
    await stance.selectOption("fullAttack");
    // Champ fermé : nom seul ; étiquettes et description sous le sélecteur.
    await expect(stance.locator("selectedcontent .n")).toHaveText("Assaut");
    await expect(stance.locator("selectedcontent .fx")).toBeHidden();
    await expect(page.getByTestId("posture-desc")).toContainText("+2g1 à l'attaque");
    await expect(page.getByTestId("armor-tn")).toHaveText("5");

    await page.getByRole("button", { name: "Fiche", exact: true }).click();
    await page.getByRole("button", { name: "Edit : Compétences" }).click();
    await page.getByRole("button", { name: "+ Compétence" }).click();
    const trait = page.getByRole("combobox", { name: /^Trait de/ });
    await checkFocusRing(page, trait);
    await checkOpenMenu(page, trait);
  });
}
