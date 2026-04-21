# Zambia Reservoir Monitor

A web app that maps all reservoirs in Zambia and shows surface water area time series (1985–present) sourced from [Global Water Watch](https://www.globalwaterwatch.earth) satellite data.

## Features

- Interactive map of ~470 Zambian reservoirs
- Click any reservoir to view its surface water area history
- Stats panel showing current area, historical max, fill level, and 12-month trend
- Data filtered to Zambia's actual borders (not a rectangular bounding box)

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + MapLibre GL JS (`@vis.gl/react-maplibre`) + Recharts + Tailwind CSS v4
- **CMS**: Re:Earth CMS — stores reservoir name, GWW ID, and GeoJSON Point location
- **Data source**: [Global Water Watch API](https://api.globalwaterwatch.earth)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

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

### 3. Run in development

Two terminals:

```bash
npm run dev:server   # Express API on http://localhost:3000
npm run dev:client   # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the Express server.

### 4. Build for production

```bash
npm run build   # Vite build → public/, tsc → dist/
npm start       # Express serves everything on http://localhost:3000
```

## CMS import

Reservoir data is imported from Global Water Watch into Re:Earth CMS using the import script. Only run this against a fresh/empty CMS model:

```bash
npm run import
```

After importing, publish all items in the CMS UI: **Content tab → select all → Publish**.
