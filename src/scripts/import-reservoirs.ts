/**
 * import-reservoirs.ts
 *
 * One-time import script that:
 * 1. Fetches all reservoirs within Zambia's bounding polygon from the Global Water Watch API
 * 2. Calculates a centroid point from each reservoir's MultiPolygon geometry
 * 3. POSTs each reservoir to Re:Earth CMS as an item in the your model of choice
 *
 * Run with: npm run import
 * Expected output: ~400+ reservoirs imported into CMS
 */

import * as dotenv from "dotenv";
dotenv.config();

import { GWWReservoir, GWWResponseSchema } from "../types";

const CMS_BASE_URL = process.env.CMS_BASE_URL!;
const CMS_WORKSPACE_ID = process.env.CMS_WORKSPACE_ID!;
const CMS_PROJECT_ID = process.env.CMS_PROJECT_ID!;
const CMS_MODEL_ID = process.env.CMS_MODEL_ID!;
const CMS_TOKEN = process.env.CMS_INTEGRATION_TOKEN!;

const GWW_API = "https://api.globalwaterwatch.earth";

const ZAMBIA_POLYGON = {
  type: "Polygon",
  coordinates: [
    [
      [22.0, -8.4],
      [22.5, -8.2],
      [24.0, -8.2],
      [25.3, -8.4],
      [26.0, -8.4],
      [27.0, -8.3],
      [28.0, -8.4],
      [29.0, -8.2],
      [29.5, -8.4],
      [30.2, -8.5],
      [31.0, -8.6],
      [31.5, -8.9],
      [32.0, -9.1],
      [32.7, -9.4],
      [33.2, -9.6],
      [33.5, -10.0],
      [33.7, -10.8],
      [33.7, -11.5],
      [33.5, -12.3],
      [33.2, -12.9],
      [32.9, -13.4],
      [33.1, -14.0],
      [33.0, -14.5],
      [32.6, -15.2],
      [32.2, -15.8],
      [31.8, -16.3],
      [31.2, -16.6],
      [30.4, -16.1],
      [30.0, -16.5],
      [29.5, -17.2],
      [29.0, -17.7],
      [28.5, -17.9],
      [28.0, -18.1],
      [27.0, -18.1],
      [26.0, -18.1],
      [25.3, -17.9],
      [24.4, -17.5],
      [23.9, -17.7],
      [23.3, -17.5],
      [22.5, -17.4],
      [22.0, -16.5],
      [22.0, -8.4],
    ],
  ],
};

function getCentroid(geometry: GWWReservoir["geometry"]): [number, number] {
  const allCoords: number[][] = [];
  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      for (const coord of ring) {
        allCoords.push(coord);
      }
    }
  }
  const lng = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
  const lat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
  return [lng, lat];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchZambiaReservoirs(): Promise<GWWReservoir[]> {
  console.log("[GWW] Fetching reservoirs within Zambia bounding polygon...");
  const res = await fetch(`${GWW_API}/reservoir/geometry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ZAMBIA_POLYGON),
  });
  if (!res.ok) throw new Error(`GWW error: ${res.status} ${await res.text()}`);
  const data = GWWResponseSchema.parse(await res.json());
  console.log(`[GWW] Found ${data.features.length} reservoirs`);
  return data.features;
}

async function postToCMS(reservoir: GWWReservoir): Promise<void> {
  const [lng, lat] = getCentroid(reservoir.geometry);
  const name =
    reservoir.properties.name ||
    reservoir.properties.name_en ||
    `Reservoir #${reservoir.id}`;

  const cmsUrl = `${CMS_BASE_URL}/api/${CMS_WORKSPACE_ID}/projects/${CMS_PROJECT_ID}/models/${CMS_MODEL_ID}/items`;

  const res = await fetch(cmsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CMS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: [
        { key: "name", type: "text", value: name },
        { key: "gww_id", type: "integer", value: reservoir.id },
        {
          key: "location",
          type: "geometryObject",
          value: JSON.stringify({ type: "Point", coordinates: [lng, lat] }),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(
      `CMS error for reservoir ${reservoir.id}: ${res.status} ${await res.text()}`,
    );
  }
}

async function main() {
  const reservoirs = await fetchZambiaReservoirs();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < reservoirs.length; i++) {
    const r = reservoirs[i];
    try {
      await postToCMS(r);
      success++;
      console.log(
        `[CMS] ✓ ${i + 1}/${reservoirs.length} Reservoir #${r.id} (${r.properties.name || "unnamed"})`,
      );
    } catch (err) {
      failed++;
      console.error(`[CMS] ✗ Reservoir #${r.id}:`, err);
    }
    await sleep(200);
  }

  console.log(`\n✅ Import complete: ${success} succeeded, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
