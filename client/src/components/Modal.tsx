/**
 * Modal.tsx
 *
 * Centered overlay modal shown when a reservoir is selected.
 * Displays the reservoir name and its GWW surface water area time series chart.
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

export default function Modal({ name, gwwId, timeSeries, loading, error, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">GWW ID: {gwwId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer mt-0.5 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            Surface water area — 1985 to present
          </p>

          {loading && (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">
              Loading…
            </div>
          )}

          {error && (
            <div className="bg-red-950 text-red-300 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {timeSeries && timeSeries.length > 0 && (
            <TimeSeriesChart data={timeSeries} />
          )}

          {timeSeries && timeSeries.length === 0 && (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
