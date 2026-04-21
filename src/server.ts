/**
 * server.ts
 *
 * Express server that:
 * 1. Serves the static frontend from /public
 * 2. Proxies /api/reservoirs to the CMS public API (handles pagination)
 * 3. Proxies /api/timeseries/:gwwId to Global Water Watch for on-demand time series data
 */

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { CMSPublicResponseSchema, GWWTimeSeriesSchema } from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

const CMS_CONFIG = {
  baseUrl: process.env.CMS_BASE_URL || "https://api.cms.reearth.io",
  workspaceAlias: process.env.CMS_WORKSPACE_ALIAS!,
  projectAlias: process.env.CMS_PROJECT_ALIAS!,
  modelId: process.env.CMS_MODEL_ID!,
};

const GWW_API = "https://api.globalwaterwatch.earth";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Reservoirs (all pages from CMS public API) ────────────────────────────────

app.get("/api/reservoirs", async (_req, res) => {
  const { baseUrl, workspaceAlias, projectAlias, modelId } = CMS_CONFIG;
  const endpoint = `${baseUrl}/api/p/${workspaceAlias}/${projectAlias}/${modelId}`;

  try {
    const allResults: unknown[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${endpoint}?page=${page}&perPage=100`);
      if (!response.ok) throw new Error(`CMS error: ${response.status}`);
      const data = CMSPublicResponseSchema.parse(await response.json());
      allResults.push(...data.results);
      hasMore = data.hasMore;
      page++;
    }

    res.json({ results: allResults, totalCount: allResults.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] /api/reservoirs error:", message);
    res.status(500).json({ error: message });
  }
});

// ── Time series (on-demand from GWW) ─────────────────────────────────────────

app.get("/api/timeseries/:gwwId", async (req, res) => {
  const { gwwId } = req.params;

  try {
    const response = await fetch(
      `${GWW_API}/reservoir/${gwwId}/ts/surface_water_area`,
    );
    if (!response.ok) throw new Error(`GWW error: ${response.status}`);
    const data = GWWTimeSeriesSchema.parse(await response.json());
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API] /api/timeseries/${gwwId} error:`, message);
    res.status(500).json({ error: message });
  }
});

// ── Fallback ──────────────────────────────────────────────────────────────────

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("  Zambia Reservoir Monitor");
  console.log("========================================");
  console.log(`  http://localhost:${PORT}`);
  console.log("");
  console.log("  Endpoints:");
  console.log("    GET /api/health");
  console.log("    GET /api/reservoirs");
  console.log("    GET /api/timeseries/:gwwId");
  console.log("========================================");
  console.log("");
});
