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

function toKm2(m2: number) {
  return Math.round((m2 / 1_000_000) * 100) / 100;
}

function computeStats(data: TimeSeriesPoint[]) {
  const isM2 = data[0]?.unit === "m2";
  const values = data.map((d) => (isM2 ? toKm2(d.value) : d.value));

  const current = values[values.length - 1];
  const max = Math.max(...values);
  const fillPct = max > 0 ? Math.round((current / max) * 100) : null;

  // Compare mean of last 12 points vs prior 12 points
  const last12 = values.slice(-12);
  const prior12 = values.slice(-24, -12);
  let trend: "rising" | "falling" | "stable" | null = null;
  if (last12.length >= 6 && prior12.length >= 6) {
    const meanLast = last12.reduce((a, b) => a + b, 0) / last12.length;
    const meanPrior = prior12.reduce((a, b) => a + b, 0) / prior12.length;
    const changePct = ((meanLast - meanPrior) / meanPrior) * 100;
    trend = changePct > 3 ? "rising" : changePct < -3 ? "falling" : "stable";
  }

  return { current, max, fillPct, trend };
}

const trendConfig = {
  rising:  { label: "Rising",  color: "text-emerald-400", arrow: "↑" },
  falling: { label: "Falling", color: "text-red-400",     arrow: "↓" },
  stable:  { label: "Stable",  color: "text-slate-400",   arrow: "→" },
};

export default function Modal({ name, gwwId, timeSeries, loading, error, onClose }: Props) {
  const stats = timeSeries && timeSeries.length > 0 ? computeStats(timeSeries) : null;

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

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Current area", value: `${stats.current.toLocaleString()} km²` },
                { label: "Historical max", value: `${stats.max.toLocaleString()} km²` },
                { label: "Fill level", value: stats.fillPct !== null ? `${stats.fillPct}%` : "—" },
                {
                  label: "12-month trend",
                  value: stats.trend
                    ? `${trendConfig[stats.trend].arrow} ${trendConfig[stats.trend].label}`
                    : "—",
                  color: stats.trend ? trendConfig[stats.trend].color : "text-slate-300",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-medium ${color ?? "text-slate-300"}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

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
