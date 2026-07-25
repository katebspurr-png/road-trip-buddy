# 🛣️ Road Trip Buddy

An offline-first PWA co-pilot for road trips. No build step, no dependencies — just open it.

**Live app:** https://katebspurr-png.github.io/road-trip-buddy/

## Features

- **🗺️ Trips** — multiple trips with their own stops, expenses, and travelers; name each one, set a start date for a countdown ("3 days to go" → "Day 2"), plan stops in order, check them off as you arrive, edit in place, one-tap map link for each stop (Apple Maps on Apple devices, Google Maps elsewhere)
- **🎤 Siri (iOS app)** — "Hey Siri, what's my next stop in Road Trip Buddy" and "Mark arrived in Road Trip Buddy", fully hands-free
- **🚗 Driver Mode** — full-screen co-pilot for solo travellers: next stop in huge text, giant Arrived/Navigate buttons, keeps the screen awake while mounted
- **🎒 Packing** — pre-loaded road-trip checklist (essentials, car prep, comfort) plus your own items
- **💸 Expenses** — log gas/food/lodging/fun as you go; running total, category breakdown, per-person split, and edit in place. Add traveler names to track **who paid** and get a settle-up ("Jo owes Kate $40") you can share via the share sheet
- **⛽ Fuel log** — gas expenses take optional odometer + litres; after two fill-ups you get L/100 km (and US mpg), cost per km, distance driven, and average price per litre
- **🎮 Games** — License Plate Hunt (all 50 states + DC, with an optional 🇨🇦 provinces & territories mode), Road Trip Bingo with win detection, a 20 Questions counter, an offline trivia pack, and "Ask the Buddy" conversation prompts
- **💾 Backup** — export/import all your data as a JSON file, so a cleared browser cache can't eat your trip

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
