import "@testing-library/jest-dom/vitest";
// IndexedDB en mémoire (classes globales IDBRequest, IDBFactory… utilisées par idb).
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // Cache du thème (annexe I.1.8) : ne passe pas d'un test à l'autre.
  localStorage.clear();
});
