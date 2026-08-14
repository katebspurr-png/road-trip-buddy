# Road Trip Buddy — Project Overview & Design Brief

## What it is

An **offline-first road-trip companion app**: plan stops, pack, track expenses, play back-seat games. Born as a self-serve tool for **solo travellers** (the driver is the user), later expanded with Co-pilot and Family modes. It must work with **zero cell signal** — that constraint drives every technical and design decision.

- **Live web app / PWA:** https://katebspurr-png.github.io/road-trip-buddy/
- **Also ships as a native iOS app:** a SwiftUI `WKWebView` wrapper around the same HTML/JS/CSS, adding a native share sheet, Siri shortcuts ("What's my next stop", "Mark arrived"), and screen wake-lock for Driver Mode.
- **Repo:** github.com/katebspurr-png/road-trip-buddy (working branch `claude/road-trip-phone-testing-843q7y` auto-deploys to GitHub Pages)

## Tech stack (design-relevant)

- **Vanilla HTML + CSS + JS. No framework, no build step, no dependencies.** Three files: `index.html`, `style.css`, `app.js`, plus `sw.js` (cache-first service worker).
- All state in `localStorage` (versioned schema with migrations). No server, no accounts.
- **Everything must be self-contained and offline** — no CDN fonts, no external images, no web fonts. System font stack; **emoji are the entire icon system** (this is a deliberate charm, not a gap).
- **One exception: weather.** Forecasts come from Open-Meteo (free, no key) — fetched opportunistically when signal exists, cached in state, always stamped with staleness. The app never *needs* the network; weather just appears when it can. Toggleable off in Settings.
- Renders in Safari/Chrome as a PWA and inside an iOS WKWebView. Must respect `env(safe-area-inset-*)` (notch, home indicator).

## Screens & surfaces (complete inventory)

1. **Welcome / first-run setup** (`#welcome`) — one-time: trip name, optional start date, "who's going" picker (3 mode cards). Skippable.
2. **Trip tab** — trip card (inline-editable name, date picker, trip-switcher chips, mode chips Solo/Co-pilot/Family), Driver Mode launch button, progress bar, weather meta row (forecast day + staleness + refresh), ordered stop list (check off / edit / reorder / delete, map link + per-stop forecast line), add-stop form, delete-trip button.
3. **Packing tab** — progress bar, grouped checklist (Essentials / Car / Comfort / Kids / My items), add form, "uncheck everything".
4. **Expenses tab** — totals card (big total, N-way split, category breakdown, settle-up lines like "Jo owes Kate $40"), fuel stats card (L/100 km, cost/km, distance, $/L), travelers card (name chips), add-expense form (amount + category chips + note + paid-by chips + odometer/litres when Gas), expense list (edit-in-place), share-settle-up button.
5. **Games tab** — Ask the Buddy (conversation prompts), Road Trip Bingo (5×5, win detection, BINGO banner), 20 Questions counter, Trivia (90 questions, 6 category filter chips), License Plate Hunt (US grid + optional Canadian provinces).
6. **Driver Mode** (`#driver-mode`) — full-screen, **always-dark**, for a mounted phone: NEXT STOP in huge type, note, one-line weather (a decision, not data — severe conditions go mustard), progress, three giant buttons (🧭 Navigate / ✓ Arrived / ⛽ Gas stop). Gas stop swaps to a giant-type quick-log (oversized amount field, litres/odometer, Log it / Back) with a green confirmation toast.
7. **Settings panel** (`#settings-panel`) — gear in header; feature toggles (hide Packing / Expenses / Games tabs), Backup card (export/import JSON).
8. **App header** — title + dynamic subtitle ("3 days to go · 4 stops to go") + ⚙️ gear.
9. **Tab bar** — fixed bottom, 4 tabs (emoji + label), blur backdrop.

## Current design system (from `style.css`)

**Tokens** (CSS custom properties on `:root`, with a `prefers-color-scheme: dark` override set):

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#faf7f2` (warm off-white) | `#1c1917` |
| `--card` | `#ffffff` | `#292524` |
| `--text` | `#292524` | `#fafaf9` |
| `--muted` | `#78716c` | `#a8a29e` |
| `--accent` | `#ea580c` (orange) | `#fb923c` |
| `--accent-soft` | `#ffedd5` | `#431407` |
| `--border` | `#e7e5e4` | `#44403c` |
| `--done` | `#16a34a` (green) | same |
| `--danger` | `#dc2626` | same |

- **Header:** orange gradient (`160deg, #ea580c → #c2410c`), white text, light status bar (iOS).
- **Driver Mode:** hard-coded dark (`#0c0a09` bg) regardless of theme — night-driving surface.
- **Type:** system font stack. Weights do the hierarchy work (600/700/800). Biggest type: driver-mode stop name `clamp(2.2rem, 10vw, 3.4rem)`.
- **Shape language:** rounded everything — cards 14–16px radius, buttons 12px, chips/pills 999px. 1px borders, no shadows.
- **Components:** cards in lists, chip/pill selectors (active = filled accent), circular check buttons (fill green when done), thin progress bars, dashed-border "ghost" buttons for secondary actions, native-styled checkbox toggles.
- **Content width:** `max-width: 560px`, centered — it's a phone app that tolerates desktop.

## Modes (they shape what's visible)

- **🧍 Solo** — travelers/split/settle-up hidden, Driver Mode button turns solid orange (primary), games trimmed to Plate Hunt + Trivia.
- **🧑‍✈️ Co-pilot** *(default)* — everything on.
- **👨‍👩‍👧 Family** — Kids packing group, 🧸 Kids expense category, kid games ordered first.
Rule: modes only hide/emphasize; never alter data.

## Hard constraints for any redesign

1. **Offline/self-contained:** no external fonts, images, scripts, or icon sets. Emoji + CSS only (inline SVG is acceptable).
2. **No build step:** plain CSS in one file; no preprocessors or frameworks.
3. **Both themes:** every surface must work in light and dark (media query + the tokens above).
4. **Glove-and-glare usability for Driver Mode:** huge tap targets (≥60px), extreme contrast, always dark. This screen is safety-critical — clarity beats beauty.
5. **Safe areas:** header and tab bar already pad with `env(safe-area-inset-*)`; keep it.
6. **One-handed phone use** is the primary ergonomic: bottom tab bar, forms near the bottom of their sections, thumb-reachable actions.
7. Existing element **ids and class hooks are load-bearing** (JS binds to them) — restyle freely, but renames need coordinated JS changes.

## Design opportunities (known rough edges)

- The **app icon** is a basic generated one — a real identity/icon would lift everything.
- **Welcome screen** is functional but plain; it's the first impression.
- **Empty states** are text-only (trip/expenses); could be warmer.
- **Bingo cells** at 0.58rem text are dense on small phones.
- The **trip card** now hosts a lot (name, date, trip chips, mode chips) — could use visual hierarchy.
- **Trivia/game cards** are uniform white cards; the Games tab could feel more playful.
- No motion design anywhere except a progress-bar transition and BINGO banner timeout — tasteful micro-interactions are open territory.

## How to run it

```sh
cd road-trip-buddy && python3 -m http.server 8000   # open localhost:8000
```
iOS: `ios/RoadTripBuddy.xcodeproj` (regenerated via `xcodegen` from `ios/project.yml`), ⌘R.
