/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Le livrable unique s'appelle dist/carnet-l5r.html (HANDOFF §2). */
function renameHtml(fileName: string): Plugin {
  return {
    name: "carnet:rename-html",
    enforce: "post",
    generateBundle(_options, bundle) {
      const page = bundle["index.html"];
      if (page) page.fileName = fileName;
    },
  };
}

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), viteSingleFile(), renameHtml("carnet-l5r.html")],
  resolve: {
    alias: {
      "@carnet/core": fileURLToPath(new URL("./src/core/index.ts", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.spec.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      // HANDOFF §10.1 : 100 % des lignes du moteur.
      include: ["src/core/**"],
      thresholds: { "src/core/**": { lines: 100 } },
    },
  },
});
