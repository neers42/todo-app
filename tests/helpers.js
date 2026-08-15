import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { vi } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.resolve(__dirname, "../index.html"), "utf-8");
const bodyHtml = html
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/<script[^>]*><\/script>/, "");

// app.js is a self-executing script (no exports) that wires itself up to
// the DOM elements from index.html at import time. To get a fresh instance
// per test we reset the DOM to the markup from index.html, then reset
// vitest's module registry so the next import re-runs app.js against it.
export async function loadApp() {
  document.body.innerHTML = bodyHtml;
  vi.resetModules();
  await import("../app.js");
}

export const STORAGE_KEY = "todo-app.todos";

export function seedTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function readStoredTodos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
}

const KEY_EVENT_TYPES = new Set(["keydown", "keyup", "keypress"]);

export function fireEvent(el, type, init) {
  const EventClass = KEY_EVENT_TYPES.has(type) ? KeyboardEvent : Event;
  el.dispatchEvent(new EventClass(type, { bubbles: true, cancelable: true, ...init }));
}
