import { useState } from "react";
import { Map, Source, Layer, NavigationControl } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { CircleLayerSpecification, GeoJSONSourceSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import zambiaBoundary from "../data/zambia";
import type { ReservoirsResponse } from "../types";

interface Props {
  onReservoirClick: (gwwId: number, name: string) => void;
  selectedGwwId: number | null;
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

async function loadReservoirs(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch("/api/reservoirs");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: ReservoirsResponse = await res.json();

  const features = data.results.flatMap((r) => {
    try {
      const loc =
        typeof r.location === "string"
          ? JSON.parse(r.location as string)
          : r.location;
      const point = { type: "Point" as const, coordinates: loc.coordinates };
      if (!booleanPointInPolygon(point, zambiaBoundary)) return [];
      return [
        {
          type: "Feature" as const,
          geometry: loc,
          properties: { name: r.name ?? `Reservoir #${r.gww_id}`, gww_id: r.gww_id },
        },
      ];
    } catch {
      return [];
    }
  });

  return { type: "FeatureCollection", features };
}

export default function MapView({ onReservoirClick, selectedGwwId }: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleMapLoad() {
    try {
      const data = await loadReservoirs();
      setGeojson(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load reservoirs");
    } finally {
      setLoading(false);
    }
  }

  function handleClick(e: MapLayerMouseEvent) {
    const f = e.features?.[0];
    if (!f) return;
    const { gww_id, name } = f.properties as { gww_id: number; name: string };
    onReservoirClick(gww_id, name);
  }

  const circleLayer: CircleLayerSpecification = {
    id: "reservoirs-circle",
    type: "circle",
    source: "reservoirs",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3, 10, 7],
      "circle-color": [
        "case",
        ["==", ["get", "gww_id"], selectedGwwId ?? -1],
        "#f59e0b",
        "#38bdf8",
      ],
      "circle-opacity": 0.85,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#0f172a",
    },
  };

  const reservoirCount = geojson?.features.length ?? null;

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{ longitude: 28.0, latitude: -13.5, zoom: 5.5 }}
        mapStyle={MAP_STYLE}
        onLoad={handleMapLoad}
        onClick={handleClick}
        interactiveLayerIds={geojson ? ["reservoirs-circle"] : []}
        cursor={undefined}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-left" />
        {geojson && (
          <Source id="reservoirs" type="geojson" data={geojson}>
            <Layer {...circleLayer} />
          </Source>
        )}
      </Map>

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
