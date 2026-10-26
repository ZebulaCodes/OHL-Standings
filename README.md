# Ogden Hockey League (OHL-Standings)

A simple static website for tracking standings, schedule, and player stats for the Ogden Hockey League.

## Overview

This site displays:
- **Standings** — team records and points, sortable by column
- **Schedule** — game-by-game results and upcoming game times, with W/L shown for Venom
- **Player Stats** — roster stats for Venom (goals, assists, points, PIM)

All content is driven by `data.json`. Updating the site for a new week is just editing that file — no code changes needed.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure and layout |
| `styles.css` | Visual styling (colors, fonts, responsive layout) |
| `script.js` | Loads `data.json` and renders the tables, schedule cards, and sorting behavior |
| `data.json` | All league data — standings, schedule, and player stats |
| `start-local-server.bat` | Double-click to preview the site locally at `http://localhost:8000` |
| `.github/workflows/static.yml` | GitHub Actions workflow that deploys the site to GitHub Pages on every push to `main` |

## Updating data

Open `data.json` and edit the relevant section:

- **`standings`** — one object per team (`team`, `gamesPlayed`, `regularWins`, `OTwins`, `OTlosses`, `losses`, `points`)
- **`schedule`** — one object per game (`date`, `time`, `home`, `away`, `location`, `homeScore`, `awayScore`). Leave scores as `null` (or `0`/`0`) until the game is played.
- **`players`** — one object per player (`name`, `number`, `games`, `goals`, `assists`, `total`, `pim`)

## Running locally

Run `start-local-server.bat`, then open `http://localhost:8000` in a browser. Opening `index.html` directly (double-click) won't load the data — browsers block local JSON fetches from `file://` pages.

## Deployment

This repo deploys automatically to GitHub Pages via the workflow in `.github/workflows/static.yml` whenever changes are pushed to `main`. No server or VM required — commit and push your updated `data.json`, and the live site updates within a minute or two.

## Adding team logos

Drop PNG files into a `logos/` folder, named after the team in lowercase with dashes instead of spaces (e.g. `logos/bad-news-bears.png`). Any team without a matching logo file automatically falls back to a colored initials badge.
