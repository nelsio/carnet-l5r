/** Version mobile (HANDOFF §7), tests M1 à M9 (§10.5). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;

/** Ouvre le build et crée une fiche avec Kenjutsu et un katana : attaques, manœuvres et dégâts. */
async function start(page: Page) {
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await page.getByRole("button", { name: "+ Compétence" }).click();
  await page.getByRole("textbox", { name: "Nom de la compétence" }).fill("Kenjutsu");
  await page.getByRole("button", { name: "+ Arme" }).click();
  await page.getByRole("textbox", { name: "Nom de l'arme" }).fill("Katana");
  await page.getByRole("button", { name: "Terminer" }).click();
}

const tab = (page: Page, name: "Fiche" | "Aide de jeu") => page.getByRole("group", { name: "Vue" }).getByRole("button", { name });
/** Le panneau fermé est masqué : on le cible par sa classe pour vérifier son état. */
const panel = (page: Page) => page.locator(".roller");
const rollButton = (page: Page) => panel(page).getByRole("button", { name: /^Lancer/ });

async function openAction(page: Page, situation: string, action: RegExp, sub?: string) {
  await tab(page, "Aide de jeu").click();
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: situation, exact: true }).click();
  if (sub) await page.getByRole("button", { name: sub, exact: true }).click();
  await page.locator("button.act").filter({ hasText: action }).first().click();
  await expect(panel(page)).toHaveClass(/open/);
  await settled(panel(page));
}

/** Attend la fin de l'animation d'ouverture du panneau. */
async function settled(el: Locator) {
  await el.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
}

async function noHorizontalScroll(page: Page, view: string) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, `défilement horizontal : ${view}`).toBeLessThanOrEqual(client);
}

/** L'élément est entièrement dans la fenêtre. */
async function inViewport(page: Page, el: Locator) {
  const box = (await el.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5);
}

test.beforeEach(async ({ page }) => start(page));

test("M1 : aucune vue ne défile horizontalement", async ({ page }) => {
  await noHorizontalScroll(page, "Fiche");
  await page.getByRole("button", { name: "Modifier la fiche" }).click();
  await noHorizontalScroll(page, "Fiche en modification");
  await tab(page, "Aide de jeu").click();
  for (const s of ["Enquête", "Déplacement", "Combat", "Statistiques"]) {
    await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: s, exact: true }).click();
    await noHorizontalScroll(page, s);
  }
  await page.getByRole("group", { name: "Situation" }).getByRole("button", { name: "Combat", exact: true }).click();
  for (const sub of ["Escarmouche", "Duel iaijutsu", "Bataille"]) {
    await page.getByRole("button", { name: sub, exact: true }).click();
    await noHorizontalScroll(page, sub);
  }
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await noHorizontalScroll(page, "lanceur ouvert");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bibliothèque" }).click();
  await expect(page.getByRole("heading", { name: "Bibliothèque" })).toBeVisible();
  await noHorizontalScroll(page, "Bibliothèque");
  await page.getByRole("button", { name: /^Supprimer / }).click();
  await noHorizontalScroll(page, "Bibliothèque, confirmation de suppression");
});

test("M2 : la barre de navigation est fixe en bas, sur Fiche comme sur Aide de jeu", async ({ page }) => {
  const vp = page.viewportSize()!;
  for (const view of ["Fiche", "Aide de jeu"] as const) {
    await tab(page, view).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const nav = page.getByRole("group", { name: "Vue" });
    await expect(nav).toBeVisible();
    expect(await nav.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
    const box = (await nav.boundingBox())!;
    expect(Math.abs(box.y + box.height - vp.height)).toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1);
  }
});

test("M3 : un appui sur le résumé déplie la piste en 2 × 4, un second la replie", async ({ page }) => {
  const summary = page.locator("button.wsum");
  const track = page.getByLabel("Niveaux de blessure");
  await expect(summary).toBeVisible();
  await expect(track).toBeHidden();
  await summary.click();
  await expect(track).toBeVisible();
  const tops = await track.locator(".wl").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops).toHaveLength(8);
  expect(new Set(tops).size).toBe(2);
  expect(tops.slice(0, 4).every((t) => t === tops[0])).toBe(true);
  await summary.click();
  await expect(track).toBeHidden();
});

test("M4 : choisir une action ouvre le panneau ; « Lancer » est visible sans défiler", async ({ page }) => {
  await tab(page, "Aide de jeu").click();
  await expect(panel(page)).not.toHaveClass(/open/);
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await expect(rollButton(page)).toBeVisible();
  await inViewport(page, rollButton(page));
});

test("M5 : après un lancer, le résultat est visible et le panneau reste ouvert ; une option ne ramène pas en haut", async ({ page }) => {
  await openAction(page, "Combat", /Attaque · Katana/, "Escarmouche");
  await rollButton(page).click();
  await expect(panel(page)).toHaveClass(/open/);
  const dice = panel(page).getByLabel("Dés", { exact: true });
  await expect(dice).toBeVisible();
  await inViewport(page, dice);

  const scrollTop = () => panel(page).evaluate((el) => el.scrollTop);
  await panel(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const before = await scrollTop();
  expect(before).toBeGreaterThan(0);
  await panel(page).getByRole("button", { name: "Ajouter Augmentation des dégâts" }).click();
  expect(await scrollTop()).toBe(before);
});

test("M6 : le panneau se ferme par ×, par appui sur le fond et par Échap", async ({ page }) => {
  await openAction(page, "Enquête", /Remarquer un détail/);
  await panel(page).getByRole("button", { name: "Fermer" }).click();
  await expect(panel(page)).not.toHaveClass(/open/);

  await page.locator("button.act").filter({ hasText: /Remarquer un détail/ }).click();
  await expect(panel(page)).toHaveClass(/open/);
  await page.mouse.click(page.viewportSize()!.width / 2, 20);
  await expect(panel(page)).not.toHaveClass(/open/);

  await page.locator("button.act").filter({ hasText: /Remarquer un détail/ }).click();
  await expect(panel(page)).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(panel(page)).not.toHaveClass(/open/);
});

test("M6 bis : la page ne défile pas derrière le panneau ouvert", async ({ page }) => {
  await openAction(page, "Enquête", /Remarquer un détail/);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
});

test("M7 : en modification, les champs ont une police d'au moins 16 px", async ({ page }) => {
  await page.getByRole("button", { name: "Modifier la fiche" }).click();
  const sizes = await page.locator("input:not([type=checkbox]), select, textarea").evaluateAll((els) =>
    els.map((e) => ({ name: e.getAttribute("aria-label") ?? e.className, size: parseFloat(getComputedStyle(e).fontSize) })));
  expect(sizes.length).toBeGreaterThan(20);
  expect(sizes.filter((s) => s.size < 16)).toEqual([]);
});

test("M8 : cibles tactiles d'au moins 40 × 40 px (−/+, pastilles, onglets)", async ({ page }) => {
  const targets = [
    page.getByRole("button", { name: "Retirer 1 blessure" }),
    page.getByRole("button", { name: "Ajouter 1 blessure" }),
    page.getByRole("button", { name: "Point de Vide 1" }),
    page.getByRole("button", { name: "Point de Vide 2" }),
    tab(page, "Fiche"),
    tab(page, "Aide de jeu"),
  ];
  for (const t of targets) {
    const box = (await t.boundingBox())!;
    expect(box.width, await t.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(40);
    expect(box.height, await t.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(40);
  }
});

test.describe("M9 : à 360 px de large", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("les 4 tuiles de la barre d'état sont entièrement visibles, sans troncature ni retour à la ligne", async ({ page }) => {
    const tiles = page.locator(".cstats > div");
    await expect(tiles).toHaveCount(4);
    const report = await tiles.evaluateAll((els) => els.map((tile) => {
      const tileBox = tile.getBoundingClientRect();
      return [...tile.querySelectorAll(".label, b")].map((el) => {
        const r = el.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.3;
        return {
          text: el.textContent,
          truncated: el.scrollWidth > el.clientWidth + 0.5,
          inside: r.left >= tileBox.left - 0.5 && r.right <= tileBox.right + 0.5,
          oneLine: r.height <= lineHeight * 1.5,
        };
      });
    }));
    const flat = report.flat();
    expect(flat).toHaveLength(8);
    expect(flat.filter((x) => x.truncated || !x.inside || !x.oneLine)).toEqual([]);
    await noHorizontalScroll(page, "360 px");
  });
});
