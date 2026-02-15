# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive radial bar chart built with D3.js v7 visualizing internet penetration across 200+ countries, highlighting those holding elections in 2024. Explores how AI-generated disinformation threatens democracies with high connectivity. Built with Vite and ES Modules — no framework.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build
node prepare-data.js  # Regenerate data-radial.csv from World Bank API + local CSVs
```

No test runner, linter, or formatter is configured.

## Architecture

`main.js` is the entry point. It imports `radial_chart.js` and wires up the layout toggle buttons.

### Active visualization: `radial_chart.js`

Exports a single function `radialChart(mode)` where mode is `"semi"` (half circle) or `"full"` (full circle). The function:
1. Selects `.poster-chart svg` and sets `viewBox` based on mode geometry
2. Clears previous render (`svg.selectAll("*").remove()`)
3. Loads `data-radial.csv` via `d3.csv()` (cached after first load)
4. Renders bars, gridlines, labels, and tooltip interactions

Mode-specific geometry (angle range, radii, viewBox, label flip logic) is defined in the `modes` object at the top of the file. Shared rendering logic lives in the `render()` function.

**Color encoding:** Freedom status — teal `#44bba4` (Free), amber `#f4a93b` (Partly Free), red `#e8545a` (Not Free), gray `#ddd` (no election at 20% opacity).

### Legacy layout modules (commented out in main.js)

- `circular_layout.js` — countries positioned in a circle
- `beeswarm_layout.js` — force-directed scatter (uses `beeswarm_force.js`)
- `dotstrip_layout.js` — horizontal strip with axis

### Data pipeline: `prepare-data.js`

Node script (no dependencies beyond `fs`) that:
1. Fetches World Bank indicator `IT.NET.USER.ZS` via public API
2. Reads `data-wb.csv` (218 countries: region, income group) and `data-voting.csv` (78 election countries: freedom data, election type)
3. Merges by ISO code, preferring World Bank API internet % with voting CSV as fallback
4. Outputs `data-radial.csv` sorted by internet % ascending (204 countries, 77 with elections)

### Page structure

`index.html` is a poster-style layout: `<article class="poster">` wrapping header (title + intro paragraph), toggle buttons, SVG chart, and HTML footer legend. CSS is mobile-first with breakpoints at 640px and 960px.

## Data

- `data-voting.csv` — 78 countries with 2024 elections (freedom score, freedom status, population, election type, internet %)
- `data-wb.csv` — 218 countries from World Bank (region, income group, population, GDP per capita)
- `data-radial.csv` — **Generated file** (run `node prepare-data.js`). Combined dataset with columns: country, iso, region, income_group, internet_pct, has_election, freedom_status, freedom_score, election_type

## Key patterns

- SVG is sized via `viewBox` only (no fixed width/height attributes) — CSS controls actual dimensions for responsiveness
- Tooltip is a `<div>` appended to `<body>`, shared across re-renders (created once, reused)
- Data is cached in module-level `cachedData` variable so toggling between modes doesn't re-fetch
- Touch events (`touchstart`/`touchend`) mirror mouse events for mobile tooltip support
