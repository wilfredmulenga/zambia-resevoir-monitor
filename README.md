# Zambia Reservoir Monitor

A web app that maps all reservoirs in Zambia and shows surface water area time series (1985–present) sourced from [Global Water Watch](https://www.globalwaterwatch.earth) satellite data.

## Use cases

- **Drought early warning** — fill level and 12-month trend shows which reservoirs are critically low ahead of a dry season

## Features

- Interactive map of ~470 Zambian reservoirs
- Click any reservoir to view its surface water area history
- Stats panel showing current area, historical max, fill level, and 12-month trend
- Data filtered to Zambia's actual borders (not a rectangular bounding box)

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + MapLibre GL JS (`@vis.gl/react-maplibre`) + Recharts + Tailwind CSS v4
- **CMS**: [Re:Earth CMS](https://cms.reearth.io) — stores reservoir name, GWW ID, and GeoJSON Point location
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

## CMS setup

This project uses [Re:Earth CMS](https://cms.reearth.io) to store and serve reservoir data. See the [CMS User Manual](https://eukarya.notion.site/CMS-User-Manual-1ff16e0fb16580869d1efbc9c15aff12) for full documentation.

### 1. Create a model

In your Re:Earth CMS project, create a new model and add the following fields:

| Field key | Type            | Description                        |
|-----------|-----------------|------------------------------------|
| `name`    | Text            | Reservoir name                     |
| `gww_id`  | Integer         | Global Water Watch reservoir ID    |
| `location`| Geometry Object | GeoJSON Point (centroid location)  |

### 2. Generate an integration token

Go to **Project Settings → Integrations** and create a token. Add it to your `.env` as `CMS_INTEGRATION_TOKEN`.

### 3. Run the import

Populate the model by running the import script against the GWW API. Only run this against a fresh/empty model:

```bash
npm run import
```

### 4. Publish the content

After importing, items are in draft state. Go to **Content tab → select all → Publish** to make them accessible via the public API.
