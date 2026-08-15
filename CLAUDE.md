# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page TODO app: plain HTML/CSS/JS, no build step, no framework, no
backend. State persists to the browser's `localStorage`.

## Running

Open `index.html` directly in a browser, or serve the directory statically,
e.g.:

```
python3 -m http.server 8000
```

## Testing

Tests use Vitest with a jsdom environment (`vitest.config.js`).

```
npm install
npm test          # run once
npm run test:watch
```

`app.js` is a self-executing script with no exports — it wires itself to
the DOM elements from `index.html` at import time. `tests/helpers.js`
provides `loadApp()`, which resets `document.body` to the markup from
`index.html` and re-imports `app.js` (via `vi.resetModules()`) so each
test gets a fresh instance. Tests drive the app the same way a user would:
dispatching DOM events (`fireEvent` in `tests/helpers.js`) and asserting
on the rendered DOM / `localStorage`, rather than calling internal
functions directly.

## Architecture

- `index.html` — static shell only (form, filter buttons, empty `<ul
  id="todo-list">`). All list items are rendered by JS, not present in the
  markup.
- `style.css` — theming via CSS custom properties on `:root`, overridden
  under `@media (prefers-color-scheme: dark)`.
- `app.js` — single IIFE, no modules/bundler. Holds all logic:
  - `todos` is the in-memory array of `{ id, text, due, completed,
    createdAt }`, the single source of truth. Every mutation (`addTodo`,
    `toggleTodo`, `editTodo`, `deleteTodo`, `clearCompleted`) follows the
    same pattern: mutate `todos` → `saveTodos()` (writes JSON to
    `localStorage` under key `todo-app.todos`) → `render()`.
  - `render()` does a full re-render of `#todo-list` from `todos` filtered
    by `currentFilter` (`all` / `active` / `completed`) — there is no
    partial/diffed DOM update, so new UI state should go through this same
    mutate-save-render cycle rather than direct DOM patching.
  - Inline editing is done via `contenteditable` on the `.todo-text` span
    (`startEdit`), committed on blur/Enter, reverted on Escape.

## Deployment

Static site deployed to GitHub Pages from the `master` branch root
(`/`) — no CI/build step. Push to `master` and the Pages build picks it
up. Public URL: https://neers42.github.io/todo-app/
