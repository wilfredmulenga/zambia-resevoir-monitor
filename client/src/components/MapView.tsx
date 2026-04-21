/**
 * MapView.tsx
 *
 * MapLibre GL JS map centred on Zambia showing all CMS reservoir points.
 * Calls onReservoirClick with (gwwId, name) when a reservoir marker is clicked.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import zambiaBoundary from "../data/zambia";
import type { ReservoirsResponse } from "../types";

interface Props {
  onReservoirClick: (gwwId: number, name: string) => void;
  selectedGwwId: number | null;
}

export default function MapView({ onReservoirClick, selectedGwwId }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservoirCount, setReservoirCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("reservoirs-circle")) return;
    map.setPaintProperty("reservoirs-circle", "circle-color", [
      "case",
      ["==", ["get", "gww_id"], selectedGwwId ?? -1],
      "#f59e0b",
      "#38bdf8",
    ]);
  }, [selectedGwwId]);

  const initMap = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        mapRef.current?.remove();
        mapRef.current = null;
        return;
      }

      const map = new maplibregl.Map({
        container: node,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [28.0, -13.5],
        zoom: 5.5,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), "top-left");

      map.on("load", async () => {
        try {
          const res = await fetch("/api/reservoirs");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: ReservoirsResponse = await res.json();
          setLoading(false);

          const features = data.results.flatMap((r) => {
            try {
              const loc =
                typeof r.location === "string"
                  ? JSON.parse(r.location as string)
                  : r.location;
              const point = {
                type: "Point" as const,
                coordinates: loc.coordinates,
              };
              if (!booleanPointInPolygon(point, zambiaBoundary)) return [];
              return [
                {
                  type: "Feature" as const,
                  geometry: loc,
                  properties: {
                    name: r.name ?? `Reservoir #${r.gww_id}`,
                    gww_id: r.gww_id,
                  },
                },
              ];
            } catch {
              return [];
            }
          });

          map.addSource("reservoirs", {
            type: "geojson",
            data: { type: "FeatureCollection", features },
          });

          map.addLayer({
            id: "reservoirs-circle",
            type: "circle",
            source: "reservoirs",
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                4,
                3,
                10,
                7,
              ],
              "circle-color": "#38bdf8",
              "circle-opacity": 0.85,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#0f172a",
            },
          });

          setReservoirCount(features.length);

          map.on("click", "reservoirs-circle", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const { gww_id, name } = f.properties as {
              gww_id: number;
              name: string;
            };
            onReservoirClick(gww_id, name);
          });

          map.on("mouseenter", "reservoirs-circle", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "reservoirs-circle", () => {
            map.getCanvas().style.cursor = "";
          });
        } catch (e) {
          setLoading(false);
          setLoadError(
            e instanceof Error ? e.message : "Failed to load reservoirs",
          );
        }
      });
    },
    [onReservoirClick],
  );

  return (
    <div className="relative w-full h-full">
      <div ref={initMap} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-5 py-3 text-sm text-slate-300">
            Loading reservoirs…
          </div>
        </div>
      )}

      {reservoirCount !== null && (
        <div className="absolute bottom-8 left-3 bg-slate-900/80 text-slate-400 text-xs px-2.5 py-1 rounded-md">
          {reservoirCount.toLocaleString()} reservoirs
        </div>
      )}

      {loadError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-950 text-red-300 text-sm px-4 py-2 rounded-md">
          {loadError}
        </div>
      )}
    </div>
  );
}
