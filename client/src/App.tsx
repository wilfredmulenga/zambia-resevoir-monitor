/**
 * App.tsx
 *
 * Root component that renders a full-screen MapLibre map of Zambia reservoirs.
 * Clicking a reservoir fetches its GWW time series and shows it in a sidebar.
 */

import { useCallback, useState } from "react";
import MapView from "./components/MapView";
import Modal from "./components/Modal";
import type { TimeSeriesPoint } from "./types";

export default function App() {
  const [selected, setSelected] = useState<{
    gwwId: number;
    name: string;
  } | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReservoirClick = useCallback(async (gwwId: number, name: string) => {
    setSelected({ gwwId, name });
    setTimeSeries(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timeseries/${gwwId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TimeSeriesPoint[] = await res.json();
      setTimeSeries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load time series");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleClose() {
    setSelected(null);
    setTimeSeries(null);
    setError(null);
  }

  return (
    <div className="w-full h-full">
      <MapView onReservoirClick={handleReservoirClick} selectedGwwId={selected?.gwwId ?? null} />
      {selected && (
        <Modal
          name={selected.name}
          gwwId={selected.gwwId}
          timeSeries={timeSeries}
          loading={loading}
          error={error}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
