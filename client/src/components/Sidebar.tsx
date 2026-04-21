/**
 * Sidebar.tsx
 *
 * Panel that slides in from the right when a reservoir is selected.
 * Shows the reservoir name, GWW ID, and time series chart.
 */

import TimeSeriesChart from "./TimeSeriesChart";
import type { TimeSeriesPoint } from "../types";

interface Props {
  name: string;
  gwwId: number;
  timeSeries: TimeSeriesPoint[] | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export default function Sidebar({
  name,
  gwwId,
  timeSeries,
  loading,
  error,
  onClose,
}: Props) {
  return (
    <div className="w-90 h-full bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-700">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">
            {name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">GWW ID: {gwwId}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors shrink-0 mt-0.5 cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Surface water area — 1985 to present
        </p>

        {loading && (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            Loading…
          </div>
        )}

        {error && (
          <div className="bg-red-950 text-red-300 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {timeSeries && timeSeries.length > 0 && (
          <TimeSeriesChart data={timeSeries} />
        )}

        {timeSeries && timeSeries.length === 0 && (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
