import "@testing-library/jest-dom/vitest";
// IndexedDB en mémoire (classes globales IDBRequest, IDBFactory… utilisées par idb).
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
