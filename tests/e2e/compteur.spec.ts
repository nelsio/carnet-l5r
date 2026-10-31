/**
 * Lot 35 (HANDOFF annexe O.5) : le dossier publié est servi à sa vraie adresse par page.route, sans réseau, avec le vrai count.v5.js.
 * W14 (ni le build ni le fichier de release ne comptent), W15 (aucune donnée de fiche ne part), W16 (script bloqué), W17 (script modifié).
 * W18 (visite visible sur le tableau de bord, rendu mobile en ligne) reste manuel après déploiement.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

const HOME = "https://nelsio.github.io/carnet-l5r/";
const SCRIPT = readFileSync("tests/fixtures/goatcounter/count.v5.js", "utf8");

let site: string;
let index: string;

test.beforeAll(() => {
  site = mkdtempSync(join(tmpdir(), "carnet-compteur-"));
  copyFileSync("dist/carnet-l5r.html", join(site, "index.html"));
  execFileSync(process.execPath, ["scripts/pages-pwa.mjs", site]);
  execFileSync(process.execPath, ["scripts/pages-compteur.mjs", site]);
  index = readFileSync(join(site, "index.html"), "utf8");
});

test.afterAll(() => rmSync(site, { recursive: true, force: true }));

/** Sert le Carnet à son adresse publique et note les requêtes de comptage. */
async function publish(page: Page, script: (route: Route) => Promise<void>) {
  const hits: URL[] = [];
  await page.route("https://nelsio.github.io/**", (route) => (new URL(route.request().url()).pathname === "/carnet-l5r/" ? route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: index }) : route.abort()));
  await page.route("https://gc.zgo.at/**", script);
  await page.route("https://carnet-l5r.goatcounter.com/**", (route) => {
    hits.push(new URL(route.request().url()));
    return route.fulfill({ status: 204 });
  });
  return hits;
}

const realScript = (route: Route) => route.fulfill({ status: 200, contentType: "application/javascript", headers: { "access-control-allow-origin": "*" }, body: SCRIPT });
const model = (page: Page) => page.getByRole("button", { name: "Utiliser le modèle Shugenja" });

test("W14 : le build ne contient pas le compteur", () => {
  const html = readFileSync("dist/carnet-l5r.html", "utf8");
  expect(html).not.toContain("goatcounter");
  expect(html).not.toContain("gc.zgo.at");
});

test("W15 : une visite est comptée avec le titre fixe, sans aucune donnée de fiche", async ({ page }) => {
  const hits = await publish(page, realScript);
  await page.goto(HOME);
  await expect.poll(() => hits.length).toBe(1);
  await model(page).click();
  await expect(page).toHaveTitle(/^.+ · Carnet de Rokugan$/);
  const title = await page.title();
  const name = title.split(" · ")[0]!;

  // La fiche est ouverte et son nom est dans document.title : count.js ne doit toujours pas l'envoyer.
  await page.evaluate(() => (window as unknown as { goatcounter: { count(): void } }).goatcounter.count());
  await expect.poll(() => hits.length).toBe(2);
  for (const hit of hits) {
    expect(hit.searchParams.get("t")).toBe("Carnet de Rokugan");
    expect(hit.searchParams.get("p")).toBe("/carnet-l5r/");
    expect(decodeURIComponent(hit.search)).not.toContain(name);
    expect([...hit.searchParams.keys()].sort()).toEqual(expect.arrayContaining(["p", "rnd", "s", "t"]));
    expect([...hit.searchParams.keys()].filter((key) => !["b", "p", "q", "r", "rnd", "s", "t"].includes(key))).toEqual([]);
  }
});

test("W16 : compteur bloqué, le Carnet marche à l'identique", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  const hits = await publish(page, (route) => route.abort("blockedbyclient"));
  await page.goto(HOME);
  await model(page).click();
  await expect(page).toHaveTitle(/ · Carnet de Rokugan$/);
  expect(hits).toEqual([]);
  expect(errors).toEqual([]);
});

test("W17 : un script modifié est refusé par le navigateur", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  const hits = await publish(page, (route) => route.fulfill({ status: 200, contentType: "application/javascript", headers: { "access-control-allow-origin": "*" }, body: `${SCRIPT}\nwindow.modifie = true;` }));
  await page.goto(HOME);
  await model(page).click();
  await expect(page).toHaveTitle(/ · Carnet de Rokugan$/);
  expect(await page.evaluate(() => "modifie" in window)).toBe(false);
  expect(hits).toEqual([]);
  expect(errors).toEqual([]);
});
