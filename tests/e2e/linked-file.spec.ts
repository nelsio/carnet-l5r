/**
 * Fichier lié sur le build, servi en HTTP (HANDOFF §5.2).
 * Le sélecteur natif ne se pilote pas : il est remplacé par un fichier de l'Origin Private File System,
 * un vrai FileSystemFileHandle (écriture, date de modification, rangement dans IndexedDB).
 */
import { expect, test, type Page } from "@playwright/test";
import { woundsButton } from "./wounds";

const url = "http://localhost:4173/carnet-l5r.html";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      value: async ({ suggestedName }: { suggestedName: string }) =>
        (await navigator.storage.getDirectory()).getFileHandle(suggestedName, { create: true }),
    });
  });
});

/**
 * Contenu du fichier lié ; `null` tant qu'il n'est pas écrit : le sélecteur crée le fichier vide avant la
 * première écriture de l'application, et un `expect.poll` qui lirait à cet instant échouerait au lieu de réessayer.
 */
const readFile = (page: Page, name: string) =>
  page.evaluate(async (n) => {
    const file = await (await (await navigator.storage.getDirectory()).getFileHandle(n)).getFile();
    const text = await file.text();
    return text.trim() ? JSON.parse(text) as { name: string; wounds: number; honor: number } : null;
  }, name);

const writeElsewhere = (page: Page, name: string, patch: Record<string, unknown>) =>
  page.evaluate(async ({ n, p }) => {
    await new Promise((r) => setTimeout(r, 20));
    const handle = await (await navigator.storage.getDirectory()).getFileHandle(n);
    const data = { ...JSON.parse(await (await handle.getFile()).text()), ...p };
    const w = await handle.createWritable();
    await w.write(JSON.stringify(data, null, 2));
    await w.close();
  }, { n: name, p: patch });

/** Noms des fiches enregistrées dans IndexedDB. */
const storedNames = (page: Page) =>
  page.evaluate(() => new Promise<string[]>((resolve, reject) => {
    const req = indexedDB.open("carnet-l5r");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const all = req.result.transaction("entries").objectStore("entries").getAll();
      all.onsuccess = () => resolve((all.result as { character: { name: string } }[]).map((e) => e.character.name));
    };
  }));

test("lier, écrire à chaque modification, survivre au rechargement, conflit, délier", async ({ page }) => {
  const file = "shiba-tetsu-l5r.json";
  await page.goto(url);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Shiba Tetsu");
  await page.getByRole("button", { name: "Terminer" }).click();

  await page.getByRole("button", { name: "Lier à un fichier…" }).click();
  await expect(page.getByText(`Lié à ${file}`)).toBeVisible();
  await expect.poll(async () => (await readFile(page, file))?.name).toBe("Shiba Tetsu");

  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  await expect.poll(async () => (await readFile(page, file))?.wounds).toBe(1);

  // La poignée survit au rechargement (rangée dans IndexedDB).
  await page.reload();
  await expect(page.getByText(`Lié à ${file}`)).toBeVisible();
  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  await expect.poll(async () => (await readFile(page, file))?.wounds).toBe(2);

  // Modification par un autre programme : conflit, rien n'est écrit.
  await writeElsewhere(page, file, { honor: 9 });
  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  const banner = page.getByRole("alert").filter({ hasText: "Le fichier a été modifié ailleurs" });
  await expect(banner).toBeVisible();
  expect(await readFile(page, file)).toMatchObject({ wounds: 2, honor: 9 });

  await banner.getByRole("button", { name: "Écraser avec ma version" }).click();
  await expect(banner).toBeHidden();
  await expect.poll(async () => (await readFile(page, file))?.wounds).toBe(3);
  expect((await readFile(page, file))?.honor).toBe(0);

  // Délier : le fichier n'est plus touché.
  await page.getByRole("button", { name: "Délier" }).click();
  await expect(page.getByRole("button", { name: "Lier à un fichier…" })).toBeVisible();
  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  await expect(page.getByText(/Enregistré dans ce navigateur/)).toBeVisible();
  await page.waitForTimeout(700);
  expect((await readFile(page, file))?.wounds).toBe(3);
});

test("conflit résolu en chargeant la version du fichier", async ({ page }) => {
  const file = "nouveau-samourai-l5r.json";
  await page.goto(url);
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.getByRole("button", { name: "Lier à un fichier…" }).click();
  await expect(page.getByText(`Lié à ${file}`)).toBeVisible();
  await expect.poll(async () => (await readFile(page, file))?.wounds).toBe(0);

  await writeElsewhere(page, file, { name: "Version du Drive", honor: 5 });
  await (await woundsButton(page, "Ajouter 1 blessure")).click();
  const banner = page.getByRole("alert").filter({ hasText: "Le fichier a été modifié ailleurs" });
  await banner.getByRole("button", { name: "Charger la version du fichier" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Version du Drive" })).toBeVisible();
  await expect(banner).toBeHidden();
  // Enregistré dans le navigateur (500 ms après le changement), puis rechargement.
  await expect.poll(() => storedNames(page)).toEqual(["Version du Drive"]);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Version du Drive" })).toBeVisible();
});
