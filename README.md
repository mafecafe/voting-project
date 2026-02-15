# Democracy in the Age of AI

An interactive radial bar chart visualizing internet penetration across 200+ countries, highlighting those holding elections in 2024. The project explores how widespread internet access — combined with the rise of AI-generated deepfakes, synthetic audio, and fabricated imagery — creates new vulnerabilities for democratic processes.

## Setup

```
npm install
```

## Development

```
npm run dev
```

## Data

### Sources

- **`data-voting.csv`** — 78 countries with 2024 elections. Columns: country, ISO code, freedom score (0–100), freedom status (Free / Partly Free / Not Free), population, election type, internet %. Sources: [Freedom House](https://freedomhouse.org/), Time, Center for American Progress.
- **`data-wb.csv`** — 218 countries with population, GDP per capita, region, and income group. Source: [World Bank Open Data](https://data.worldbank.org/).
- **`data-radial.csv`** — Combined dataset (generated). Merges both CSVs with internet penetration data fetched from the World Bank API indicator `IT.NET.USER.ZS` (Individuals using the Internet, % of population). 204 countries with internet data, 77 flagged as election countries.

### Data preparation

```
node prepare-data.js
```

Fetches the latest World Bank internet penetration data via their public API, merges it with both local CSVs by ISO code, and outputs `data-radial.csv` sorted by internet % ascending. Countries with no internet data from any source are excluded.

## Analysis notes

- The dataset is skewed: median internet penetration (79%) is well above the mean (71%), with a long tail of low-connectivity countries in Sub-Saharan Africa and South Asia.
- 14 of the 78 election countries had no internet % data in the original voting CSV; the World Bank API filled most of these gaps.
- Freedom status distribution among election countries: 40 Free, 22 Partly Free, 16 Not Free — meaning nearly 49% of elections occurred in countries with restricted freedoms.
- Taiwan is missing population data in the original dataset (`#N/A`).

## Tech stack

- **D3.js v7** — radial bar chart with `scaleBand`, `scaleRadial`, `arc` generator
- **Vite v5** — dev server with HMR, production bundler
- **ES Modules** — native browser module system, no framework
- **Inter** — typeface via Google Fonts

## Chart structure

The visualization offers two layouts via a toggle:

- **Half circle** — semicircle fan (180°), bars radiate upward from left (lowest internet %) to right (highest). Better use of horizontal space on desktop.
- **Full circle** — classic 360° radial bar chart with bars radiating outward from center.

Both layouts share:
- Bars colored by freedom status: teal (Free), amber (Partly Free), red (Not Free), light gray (no election)
- Non-election countries rendered at 20% opacity for context
- Interactive tooltips (mouse + touch) showing country name, internet %, election type, and freedom status
- Country name labels for election countries only
- Concentric gridlines at 25%, 50%, 75%, 100%
- Mobile-first responsive CSS with breakpoints at 640px and 960px

## References

- https://www.d3indepth.com/ — D3 fundamentals
- [(Basic) Three Little Circles](https://bost.ocks.org/mike/circles/)
- [(Basic) Thinking with Joins](https://bost.ocks.org/mike/join/)
- [(Advanced) How Selections Work](https://bost.ocks.org/mike/selection/)
