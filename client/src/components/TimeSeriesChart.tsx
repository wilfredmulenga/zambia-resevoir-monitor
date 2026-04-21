/**
 * TimeSeriesChart.tsx
 *
 * Recharts line chart showing surface water area over time for a reservoir.
 * X-axis: month-year (unique per observation), Y-axis: area in km².
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesPoint } from "../types";

interface Props {
  data: TimeSeriesPoint[];
}

function formatMonthYear(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function formatYear(isoString: string) {
  return String(new Date(isoString).getFullYear());
}

export default function TimeSeriesChart({ data }: Props) {
  const rawUnit = data[0]?.unit ?? "";
  const isM2 = rawUnit === "m2";
  const unit = isM2 ? "km²" : rawUnit;

  const chartData = data.map((d) => ({
    date: d.t,
    value: isM2
      ? Math.round((d.value / 1_000_000) * 100) / 100
      : Math.round(d.value * 100) / 100,
  }));

  // Show a tick roughly every 2 years to avoid overcrowding
  const tickInterval = Math.floor(chartData.length / 20);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -8, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tickFormatter={formatYear}
          interval={tickInterval}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={75}
          label={{
            value: unit,
            angle: -90,
            position: "insideLeft",
            fill: "#64748b",
            fontSize: 11,
            dx: 12,
          }}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelFormatter={(val) => formatMonthYear(val as string)}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#38bdf8" }}
          formatter={(v: number) => [
            `${v.toLocaleString()} ${unit}`,
            "Surface area",
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#38bdf8"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: "#38bdf8" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
