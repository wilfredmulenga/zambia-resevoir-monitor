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
zambia-water-map/
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
- **`Modal.tsx`** — centered overlay with backdrop. Click backdrop or ✕ to close.
- **`TimeSeriesChart.tsx`** — Recharts `LineChart`. X axis is year-denominated (unique ISO date strings as data keys, formatted to year for ticks). Tooltip shows full "Month YYYY". GWW returns `m2` units — converted to `km²` by dividing by 1,000,000.

## Key decisions and gotchas

- **GWW unit is `m2` not `km²`** — divide by 1,000,000 before displaying. The `unit` field in each time series point confirms this.
- **Rectangular bounding box during import** caught reservoirs from DRC, Tanzania, Zimbabwe etc. Frontend filters these out client-side using a simplified Zambia polygon — no need to re-import.
- **Re:Earth CMS publish step** — after importing via Integration API, items must be manually published in the CMS UI (Content tab → select all → Publish) before they appear in the public API. Already done for current data.
- **`useCallback` on `handleReservoirClick`** in `App.tsx` is required — without it the function reference changes on every render, causing `initMap` to re-fire and reset the map.
- **Callback ref pattern** in `MapView.tsx` — used instead of `useEffect` + `useRef` to avoid null checks. React 18 does not support returning cleanup functions from callback refs; cleanup is handled in the `null` branch instead.
- **TypeScript configs** — `tsconfig.json` is for the client (ESNext, JSX, noEmit — used by Vite and IDE). `tsconfig.server.json` is for the server build (CommonJS, outDir: dist/). Always pass `--project tsconfig.server.json` to `ts-node` commands.

## TODO

- [ ] Write README.md with setup instructions, environment variables, and how to run
- [ ] Explore Zambia deforestation tracker using satellite time series (Global Forest Watch / Hansen dataset)
- [ ] Enrich the reservoir modal — investigate what additional data is available from GWW or other sources (e.g. reservoir capacity, dam name, operator, catchment area, drought/flood alerts)
