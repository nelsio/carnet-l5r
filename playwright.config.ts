import { defineConfig, devices } from "@playwright/test";

// Les tests de bout en bout tournent sur le build : lancer `npm run build` avant.
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Annexe 50.3 : navigateur en français, sinon un runner anglais basculerait l'app en anglais (lot 52).
  use: { locale: "fr-FR" },
  // E2 : le même fichier servi en HTTP, comme sur GitHub Pages.
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/carnet-l5r.html",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    // Annexe 45.4 : la piste de la barre d'état aussi sous WebKit (Safari sur ordinateur).
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /status-bar\.spec\.ts/ },
    // HANDOFF §10.5 : appareils « iPhone 13 » et « Pixel 7 ».
    { name: "iphone-13", use: { ...devices["iPhone 13"] }, testMatch: /mobile\.spec\.ts/ },
    { name: "pixel-7", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
