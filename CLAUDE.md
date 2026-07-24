# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Seven Segment Display — a website/Wallpaper Engine plugin that renders time, date, countdowns, and other content on simulated 7-segment, 16-segment, and dot-matrix displays. TypeScript, Vite, SCSS, Jest.

## Commands

- `npm run dev` — start Vite dev server
- `npm run dev:global` — dev server bound to `0.0.0.0` (for testing on other devices)
- `npm run build` — full production build (versions assets, runs `tsc`, then `vite build`)
- `npm run build:zip` — build and zip `dist/` (used for Wallpaper Engine distribution)
- `npm run test` — run Jest test suite
- `npm run watch:test` — Jest in watch mode
- `npx jest test/utils.test.ts` — run a single test file
- `npm run test:prettier` / `npm run fix:prettier` — check/fix formatting (Prettier + organize-imports plugin)
- ESLint config exists (`.eslintrc.json`) but there is no `lint` npm script; run `npx eslint src` directly if needed

## Architecture

### Entry points

Vite builds three separate HTML pages, each with its own TS entry:
- `src/index.html` / `src/main.ts` — main display page (clock, countdown, etc.)
- `src/gps.html` / `src/main.gps.ts` — GPS-driven variant
- `src/config.html` — settings/configuration UI

`main.ts` finds `#app`, constructs `App`, and after a 100ms delay calls `registerEvents()` + `startTicking()`. The app also runs inside Wallpaper Engine as a wallpaper plugin (see `plugins/wpe.ts`), which is why event registration is conditional on `isWpeEnabled()`.

### Rendering pipeline (`src/segment-display/`)

- `SegmentDisplay` implementations (`7seg/`, `16seg/`, `matrix/`) each render one character cell as SVG segments, driven by a `SegmentDisplayFont` (`fonts.ts`) that maps characters to segment sets.
- `SegmentDisplayController` wraps an ordered array of `SegmentDisplay`s + a font and exposes `show()`/`showCenter()`/`showLeft()` to render a string across the cells, right-to-left, handling "special chars" (e.g. `.`, `:`) that combine into the previous cell instead of taking their own.
- `src/app/collection.ts` defines `MainDisplayCollection`: the named group of controllers (`main`, `date`, `weekday`) that screens render into.

### App/Screen model (`src/app/`)

- `App` (`app/app.ts`) owns the `MainDisplayCollection`, the settings interface, and a tick loop (`setInterval` at configurable framerate) that calls `currentScreen.render(RenderArgs)` every frame.
- A `Screen<T>` (`base/screen.ts`) is any object with a `render(RenderArgs<T>)` method. Screens live in `app/screens/` (clock, countdown, countdown-set, progress-bar, scroller, welcome, wpe-player, wpe-player-2) and are swapped at runtime via `RenderArgs#changeScreen` / `App#setScreen`.
- Screens can optionally implement `InputHandler` (keyboard input, `base/input.ts`) or `WpeEventReceiver` (Wallpaper Engine media/audio events, `base/wpe.ts`); `App` checks these via `supportsInput`/`supportsWpeEvents` duck-typing before dispatching.
- `determineDefaultScreen()` in `app/app.ts` picks the initial screen from URL query params (`?app=newyear|countdown|demo-scroller|demo-progressbar`) or the URL hash, falling back to a resumed interactive countdown (via `countdown-storage.ts` localStorage) or the welcome screen.

### Settings (`src/app/settings/`)

`createSettingsInterface()` picks an implementation at runtime: `WpeSettingsInterface` when running inside Wallpaper Engine (properties pushed via `window.wallpaperPropertyListener`), otherwise `LocalStorageSettingsInterface`. Both implement the same `AppSettingsInterface` (`settings/base.ts`) with `loadSettings()` / `addUpdateHandler()`. `App` reacts to settings changes by updating CSS custom properties (colors, fade timing) and swapping the time display style (7seg/16seg/matrix) live.

### Wallpaper Engine integration

`src/types/wallpaper-engine.d.ts` has the WPE global type definitions. `app/plugins/wpe.ts` detects the WPE host; `app/base/wpe.ts` defines the WPE event receiver interface. Playback/timeline/property/audio listeners are only registered when WPE is detected, and route events to the current screen if it implements `WpeEventReceiver`.

## Conventions

- Prettier: single quotes, imports auto-organized via `prettier-plugin-organize-imports` — always run through Prettier rather than hand-formatting.
- Strict TypeScript (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` all on) — matches CI (`tsc` runs as part of `build`).
- Barrel `index.ts` files (`export * from './x'`) are used throughout `src/app` and `src/segment-display` — add new modules there and re-export rather than deep-importing.
