/**
 * Lot 34, v2.24.0 (HANDOFF annexe O.3) : dossier publié reconstruit depuis le build et servi en HTTP sous /carnet-l5r/, comme sur GitHub Pages.
 * W8 (ouverture hors ligne, mise à jour dès qu'il y a du réseau), W9 (le grimoire ne passe pas par le service worker),
 * W10 (le build ne contient ni manifeste ni service worker). W11 (installation sur de vrais appareils) reste manuel après déploiement.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const SORTS = "https://vincenzorpg.github.io/L5R/data/sorts/*.js";

let site: string;
let server: Server;
let home: string;
let index: string;
let down = false;

test.beforeEach(() => {
  down = false;
});

test.beforeAll(async () => {
  site = mkdtempSync(join(tmpdir(), "carnet-pwa-"));
  copyFileSync("dist/carnet-l5r.html", join(site, "index.html"));
  execFileSync(process.execPath, ["scripts/pages-pwa.mjs", site]);
  index = readFileSync(join(site, "index.html"), "utf8");
  server = createServer((req, res) => {
    if (down) return void req.socket.destroy();
    const path = new URL(req.url!, "http://localhost").pathname;
    if (!path.startsWith("/carnet-l5r/")) return void res.writeHead(404).end();
    const name = path.slice("/carnet-l5r/".length) || "index.html";
    try {
      const body = name === "index.html" ? index : readFileSync(join(site, name));
      res.writeHead(200, { "content-type": TYPES[extname(name)]!, "cache-control": "no-store" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "localhost", done));
  home = `http://localhost:${(server.address() as AddressInfo).port}/carnet-l5r/`;
});

test.afterAll(async () => {
  await new Promise((done) => server.close(done));
  rmSync(site, { recursive: true, force: true });
});

const library = (page: Page) => page.getByRole("button", { name: "Utiliser le modèle Shugenja" });

/** Première visite avec réseau : le service worker est actif et contrôle la page. */
async function firstVisit(page: Page) {
  await page.goto(home);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

/** Coupe aussi le serveur : setOffline seul pourrait laisser passer les requêtes du service worker. */
async function goOffline(context: BrowserContext) {
  down = true;
  await context.setOffline(true);
}

test("W8 : après une première visite, le Carnet s'ouvre sans réseau", async ({ page, context }) => {
  await firstVisit(page);
  await goOffline(context);
  await page.reload();
  await expect(library(page)).toBeVisible();
});

test("W8 : une nouvelle version arrive dès qu'il y a du réseau, et remplace la copie hors ligne", async ({ page, context }) => {
  await firstVisit(page);
  const published = index;
  index = index.replace("</head>", '<meta name="deploiement" content="suivant" /></head>');
  try {
    await page.reload();
    await expect(page.locator('meta[name="deploiement"]')).toHaveCount(1);
    await goOffline(context);
    await page.reload();
    await expect(page.locator('meta[name="deploiement"]')).toHaveCount(1);
    await expect(library(page)).toBeVisible();
  } finally {
    index = published;
  }
});

test("W9 : le grimoire du portail ne passe pas par le service worker", async ({ page }) => {
  await firstVisit(page);
  const portal: boolean[] = [];
  page.on("response", (r) => {
    if (r.url().includes("vincenzorpg.github.io")) portal.push(r.fromServiceWorker());
  });
  await page.route(SORTS, (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop()!;
    return route.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", headers: { "access-control-allow-origin": "*" }, body: readFileSync(resolve("tests/fixtures/grimoire", name), "utf-8") });
  });
  await library(page).click();
  await page.getByRole("button", { name: "Edit : Rouleaux & invocations" }).click();
  await page.getByTestId("block-magic").getByRole("button", { name: "Ajouter depuis le grimoire" }).click();
  const panel = page.getByRole("region", { name: "Ajouter depuis le grimoire" });
  await panel.getByRole("button", { name: "Charger le grimoire" }).click();
  await expect(panel.getByRole("combobox", { name: "Nom du sort" })).toBeVisible();
  // Intercepté par page.route : une réponse du service worker n'y passerait pas.
  expect(portal).toEqual(Array(6).fill(false));
});

test("W10 : le build ne contient ni manifeste ni service worker", () => {
  const html = readFileSync("dist/carnet-l5r.html", "utf8");
  expect(html).not.toContain('rel="manifest"');
  expect(html).not.toContain("serviceWorker.register");
});
