# Zambia Reservoir Monitor

A web app that maps all reservoirs in Zambia and shows surface water area time series (1985–present) sourced from Global Water Watch satellite data.

## Stack

- **Backend**: Node.js + Express (`src/server.ts`)
- **Frontend**: React + Vite + MapLibre GL JS + Recharts + Tailwind CSS v4
- **CMS**: Re:Earth CMS (production `https://api.cms.reearth.io`) — stores reservoir name, GWW ID, and GeoJSON Point location
- **Data source**: Global Water Watch API (`https://api.globalwaterwatch.earth`)
- **Language**: TypeScript throughout; Zod for runtime validation in the server

## Project structure

```
zambia-resevoir-monitor/
  src/
    server.ts               # Express API server
    types.ts                # Zod schemas + inferred TS types (shared server-side)
    scripts/
      import-reservoirs.ts  # One-time GWW → CMS import script
  client/
    index.html
    src/
      main.tsx
      App.tsx
      index.css             # Tailwind v4 entry (@import "tailwindcss")
      types.ts              # Client-side TypeScript types (no Zod)
      data/
        zambia.ts           # Simplified Zambia boundary polygon for point-in-polygon filter
      components/
        MapView.tsx         # MapLibre GL JS map
        Modal.tsx           # Reservoir detail overlay
        TimeSeriesChart.tsx # Recharts time series chart
  tsconfig.json             # Client (ESNext, JSX, noEmit)
  tsconfig.server.json      # Server build (CommonJS, outDir: dist/)
  vite.config.ts            # Vite config — root: client/, outDir: public/
  package.json
  .env                      # Not committed — see variables below
  .env.example
```

## Environment variables (`.env`)

```
PORT=3000
CMS_BASE_URL=https://api.cms.reearth.io
CMS_WORKSPACE_ID=<your-workspace-id>
CMS_PROJECT_ID=<your-project-id>
CMS_MODEL_ID=<your-model-id>
CMS_INTEGRATION_TOKEN=<your-integration-token>
CMS_WORKSPACE_ALIAS=<your-workspace-alias>
CMS_PROJECT_ALIAS=<your-project-alias>
```

## Running the app

Install dependencies:

```bash
npm install
```

Development (two terminals):

```bash
npm run dev:server   # Express on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173 (proxies /api to :3000)
```

Production:

```bash
npm run build        # Vite build → public/, tsc → dist/
npm start            # Express serves everything on http://localhost:3000
```

## Architecture

In development, two processes run in parallel:

- Express server on port 3000 (`npm run dev:server`)
- Vite dev server on port 5173 (`npm run dev:client`) — proxies `/api` to port 3000

In production, Express serves the Vite build from `public/` on port 3000.

## What has been built

### 1. CMS model

- Workspace alias: `<your-workspace-alias>`, project alias: `<your-project-alias>`
- Model ID: `<your-model-id>`
- Fields: `name` (text), `gww_id` (integer), `location` (geometryObject — GeoJSON Point string)
- 1,043 items published and accessible via the public API

### 2. Import script (`src/scripts/import-reservoirs.ts`)

- Run once with `npm run import`
- Fetches all reservoirs within Zambia's bounding box from `POST https://api.globalwaterwatch.earth/reservoir/geometry`
- Calculates centroid from each reservoir's MultiPolygon geometry
- POSTs each reservoir to Re:Earth CMS via Integration API (Bearer token)
- **Do not re-run** — data is already in CMS. If re-running is needed, delete all items in the CMS first.

### 3. Express server (`src/server.ts`)

- `GET /api/health` — liveness check
- `GET /api/config` — returns CMS public API settings for the frontend
- `GET /api/reservoirs` — paginates through CMS public API, returns all results combined
- `GET /api/timeseries/:gwwId` — proxies `GET /reservoir/{id}/ts/surface_water_area` from GWW

### 4. React frontend

- **`MapView.tsx`** — MapLibre GL JS map centred on Zambia (`[28.0, -13.5]`, zoom 5.5), OSM raster base. Fetches reservoirs from `/api/reservoirs`, filters with `@turf/boolean-point-in-polygon` against `client/src/data/zambia.ts`, renders as circle layer. Shows loading overlay while fetching. Clicking a circle fires `onReservoirClick(gwwId, name)`.
- **`Modal.tsx`** — centered overlay with backdrop. Click backdrop or ✕ to close. Shows a 4-stat bar (current area, historical max, fill level, 12-month trend) computed client-side from the time series before the chart. Trend compares mean of last 12 vs prior 12 observations (±3% threshold); fill level is current ÷ historical max as a percentage.
- **`TimeSeriesChart.tsx`** — Recharts `LineChart`. X axis is year-denominated (unique ISO date strings as data keys, formatted to year for ticks). Tooltip shows full "Month YYYY". GWW returns `m2` units — converted to `km²` by dividing by 1,000,000.

## Key decisions and gotchas

- **GWW unit is `m2` not `km²`** — divide by 1,000,000 before displaying. The `unit` field in each time series point confirms this.
- **Rectangular bounding box during import** caught reservoirs from DRC, Tanzania, Zimbabwe etc. Frontend filters these out client-side using a simplified Zambia polygon — no need to re-import.
- **Re:Earth CMS publish step** — after importing via Integration API, items must be manually published in the CMS UI (Content tab → select all → Publish) before they appear in the public API. Already done for current data.
- **`useCallback` on `handleReservoirClick`** in `App.tsx` is required — without it the function reference changes on every render, causing `initMap` to re-fire and reset the map.
- **Callback ref pattern** in `MapView.tsx` — used instead of `useEffect` + `useRef` to avoid null checks. React 18 does not support returning cleanup functions from callback refs; cleanup is handled in the `null` branch instead.
- **TypeScript configs** — `tsconfig.json` is for the client (ESNext, JSX, noEmit — used by Vite and IDE). `tsconfig.server.json` is for the server build (CommonJS, outDir: dist/). Always pass `--project tsconfig.server.json` to `ts-node` commands.

## Future expansion ideas

- **Natural lakes and rivers** — GWW only covers man-made reservoirs; natural water bodies (Bangweulu, Mweru, Tanganyika) are absent. Options:
  - **JRC Global Surface Water** (EC Joint Research Centre) — tracks surface water extent for all water bodies globally since 1984, available as GeoTIFFs and via Google Earth Engine
  - **DE Africa WOfS** — Africa-specific Water Observations from Space, publicly available on S3 (`af-south-1`) as Cloud Optimised GeoTIFFs, no auth required (`--no-sign-request`)
  - Both would enable time series charts for natural lakes identical to the current reservoir modal
- **Richer map basemap** — switch from OSM raster to a vector tile basemap (e.g. OpenFreeMap, no API key) to get styled rivers and lakes rendered natively on the map
- **Zambia deforestation tracker** — satellite time series using Global Forest Watch / Hansen dataset
- **Early drought detection for farmers** — alert layer or dashboard highlighting reservoirs with critically low fill levels and declining trends ahead of the dry season
