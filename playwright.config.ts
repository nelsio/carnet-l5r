import { defineConfig, devices } from "@playwright/test";

// Les tests de bout en bout tournent sur le build : lancer `npm run build` avant.
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    // HANDOFF §10.5 : appareils « iPhone 13 » et « Pixel 7 ».
    { name: "iphone-13", use: { ...devices["iPhone 13"] }, testMatch: /mobile\.spec\.ts/ },
    { name: "pixel-7", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
