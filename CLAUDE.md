# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Start Vite dev server (hot reload)
pnpm build         # Type-check (tsc) + build extension to dist/
```

There are no tests configured.

## Architecture

CursorFlag is a Chrome Manifest V3 extension that renders a floating label next to the cursor on specific domains — primarily to distinguish production from staging environments.

### Scripts

- **Popup** (`src/popup/main.ts`) — Extension popup UI. Manages CRUD for rules and import/export as JSON. Auto-fills domain from the active tab. Persists rules to Chrome sync storage.
- **Content script** (`src/content/main.ts`) — Injected into pages. Matches hostname against stored rules, creates and animates the cursor-following label, and tracks error counts.
- **Hook script** (`src/content/hook.ts`) — Injected into the page's main world. Intercepts `console.error`, unhandled exceptions, `fetch`, and `XMLHttpRequest` to count JS and network errors (HTTP ≥ 400), then forwards counts to the content script via `postMessage`.

### Data model

Rules are stored in Chrome sync storage as an array. Each rule has:

```ts
{ domain: string; text: string; blink: boolean; heartbeat: boolean; errorCounter: boolean }
```

Color is derived from the label text via a hash-based hue value (no user-set color).

### Build

Vite + `@crxjs/vite-plugin` bundles the extension directly from `manifest.config.ts`. Output goes to `dist/`. `vite-plugin-zip-pack` produces a zip in `release/` for distribution.

Load the extension in Chrome via **chrome://extensions → Load unpacked → `dist/`**.
