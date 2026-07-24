# 🛣️ Road Trip Buddy

An offline-first PWA co-pilot for road trips. No build step, no dependencies — just open it.

**Live app:** https://katebspurr-png.github.io/road-trip-buddy/

## Features

- **🗺️ Trip** — plan your stops in order, add notes, check them off as you arrive, one-tap Google Maps link for each stop
- **🎒 Packing** — pre-loaded road-trip checklist (essentials, car prep, comfort) plus your own items
- **💸 Expenses** — log gas/food/lodging/fun as you go; running total, category breakdown, and per-person split
- **🎮 Games** — License Plate Hunt (all 50 states + DC) and "Ask the Buddy" conversation prompts

Everything is stored in `localStorage` on your phone and the app shell is cached by a service worker, so **it keeps working with zero signal**.

## Use it on your phone

1. Open the live URL above in Safari (iPhone) or Chrome (Android)
2. **iPhone:** Share button → *Add to Home Screen*
   **Android:** menu (⋮) → *Add to Home screen* / *Install app*
3. Launch it from your home screen — it runs fullscreen like a native app

## Development

It's three files (`index.html`, `style.css`, `app.js`) plus a service worker. To run locally:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Pushes to the deploy branches publish automatically to GitHub Pages via `.github/workflows/deploy.yml`.
