/** Bloc Anneaux « Ensō » (annexe I.2.4) : A1 à A6 et A8 ; A7 est le lint N8 (tests/colors.spec.ts). */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pageUrl = pathToFileURL(resolve("dist/carnet-l5r.html")).href;
const KANJI = { earth: "土", water: "水", fire: "火", air: "風", void: "空" };

async function create(page: Page, width: number, theme: "light" | "dark" = "light") {
  await page.emulateMedia({ colorScheme: theme });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(pageUrl);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await page.getByRole("button", { name: "Terminer : Identité & réputation" }).click();
}

/** Mesures de chaque carte : couleur, pseudo-éléments, kanji, ensō. */
const measure = (page: Page) => page.locator(".ring").evaluateAll((rings) => rings.map((ring) => {
  const st = getComputedStyle(ring);
  const before = getComputedStyle(ring, "::before");
  const after = getComputedStyle(ring, "::after");
  const rv = ring.querySelector(".rv")!;
  const enso = getComputedStyle(rv, "::before");
  const box = ring.getBoundingClientRect();
  const rvBox = rv.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(rv);
  const digits = range.getBoundingClientRect();
  const mask = (s: CSSStyleDeclaration) => s.maskImage || s.getPropertyValue("-webkit-mask-image");
  return {
    key: ring.classList[1]!,
    rc: st.getPropertyValue("--rc").trim(),
    color: getComputedStyle(ring.querySelector(".rn")!).color,
    content: before.content,
    kanjiColor: before.color, kanjiSize: parseFloat(before.fontSize),
    brushColor: after.backgroundColor, brushMask: mask(after),
    ensoColor: enso.backgroundColor, ensoMask: mask(enso),
    width: box.width, height: box.height,
    rvWidth: rvBox.width, rvHeight: rvBox.height,
    rvInside: rvBox.left >= box.left && rvBox.right <= box.right,
    digitsWidth: digits.width,
  };
}));

for (const theme of ["light", "dark"] as const) {
  for (const width of [1200, 390]) {
    test(`A1, A2, A8 : liseré, ensō et kanji à la couleur de l'Anneau (${theme}, ${width} px)`, async ({ page }) => {
      await create(page, width, theme);
      const block = page.getByTestId("block-rings");
      const rings = await measure(page);
      expect(rings.map((r) => r.key)).toEqual(["earth", "water", "fire", "air", "void"]);
      for (const r of rings) {
        // Tout suit --rc : nom, kanji, liseré et ensō de la même couleur.
        expect(r.kanjiColor).toBe(r.color);
        expect(r.brushColor).toBe(r.color);
        expect(r.ensoColor).toBe(r.color);
        expect(r.brushMask).toContain("url(");
        expect(r.ensoMask).toContain("url(");
        expect(r.rvWidth).toBe(64);
        expect(r.rvHeight).toBe(64);
        // Kanji entier : sa taille (≈ un carré de 1 em) tient dans la carte, marges de 4 px comprises.
        expect(r.kanjiSize).toBeLessThanOrEqual(Math.min(r.width, r.height) - 8);
      }
      if (width === 390) {
        const [earth, water, , , voidRing] = rings;
        expect(earth!.width).toBeCloseTo(water!.width, 0);
        expect(voidRing!.width).toBeGreaterThan(earth!.width * 1.9);
      }
      // Capture pour la PR : la barre d'état collante masquerait le haut du bloc sur mobile.
      await page.locator(".status").evaluate((s) => { s.style.visibility = "hidden"; });
      await block.screenshot({ path: `test-results/anneaux/enso-${theme}-${width}.png` });
    });
  }
}

test("A3 : bureau étroit, cartes serrées : kanji réduit mais entier, ensō intact", async ({ page }) => {
  await create(page, 760);
  const rings = await measure(page);
  for (const r of rings) {
    expect(r.width).toBeLessThan(130);
    expect(r.kanjiSize).toBeLessThan(9.6 * 16);
    expect(r.kanjiSize).toBeLessThanOrEqual(Math.min(r.width, r.height) - 8);
    expect(r.rvWidth).toBe(64);
    expect(r.rvInside).toBe(true);
  }
  await page.getByTestId("block-rings").screenshot({ path: "test-results/anneaux/enso-light-760.png" });
});

test("A4 : en édition, les champs restent au-dessus du kanji, cliquables, focus visible", async ({ page }) => {
  await create(page, 1200);
  await page.getByRole("button", { name: "Edit : Anneaux & Traits" }).click();
  for (const name of ["Constitution", "Réflexes", "Anneau de Vide"]) {
    const field = page.getByRole("spinbutton", { name });
    // Le point au centre du champ appartient au champ, pas au filigrane.
    const onTop = await field.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === el;
    });
    expect(onTop).toBe(true);
  }
  const stamina = page.getByRole("spinbutton", { name: "Constitution" });
  await stamina.click();
  await stamina.fill("3");
  await expect(stamina).toHaveValue("3");
  await page.keyboard.press("Tab");
  const focused = page.getByRole("spinbutton", { name: "Volonté" });
  await expect(focused).toBeFocused();
  const ring = await focused.evaluate((el) => {
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" && s.outlineWidth !== "0px" || s.boxShadow !== "none";
  });
  expect(ring).toBe(true);
  await page.getByTestId("block-rings").screenshot({ path: "test-results/anneaux/enso-edition.png" });
});

test("A5 : un Anneau à 10 tient dans l'ensō sans toucher le trait", async ({ page }) => {
  await create(page, 1200);
  await page.getByRole("button", { name: "Edit : Anneaux & Traits" }).click();
  await page.getByRole("spinbutton", { name: "Constitution" }).fill("10");
  await page.getByRole("spinbutton", { name: "Volonté" }).fill("10");
  await page.getByRole("button", { name: "Terminer : Anneaux & Traits" }).click();
  await expect(page.locator(".ring.earth .rv")).toHaveText("10");
  const earth = (await measure(page))[0]!;
  // Trait de l'ensō : 3 px de débord, épaisseur maximale ≈ 9 % du diamètre ; on garde 10 px de chaque côté.
  expect(earth.digitsWidth).toBeLessThanOrEqual(earth.rvWidth - 20);
  await page.locator(".ring.earth").screenshot({ path: "test-results/anneaux/enso-10.png" });
});

test("A6 : correspondance des kanji", async ({ page }) => {
  await create(page, 1200);
  for (const r of await measure(page)) {
    expect(r.content).toBe(`"${KANJI[r.key as keyof typeof KANJI]}"`);
  }
});
