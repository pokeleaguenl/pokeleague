"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PlacementData {
  top8Conversion: number;
  top16Conversion: number;
  top32Conversion: number;
  top64Conversion: number;
  placementBreakdown: {
    top8: number;
    top16: number;
    top32: number;
    top64: number;
  };
  totalPlayers: number;
}

const BARS = [
  { key: "top8",  label: "Top 8",  convKey: "top8Conversion",  color: "#facc15" },
  { key: "top16", label: "Top 16", convKey: "top16Conversion", color: "#fb923c" },
  { key: "top32", label: "Top 32", convKey: "top32Conversion", color: "#60a5fa" },
  { key: "top64", label: "Top 64", convKey: "top64Conversion", color: "#6b7280" },
];

interface TooltipPayload {
  payload: { label: string; count: number; pct: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{d.label}</p>
      <p className="text-gray-400">{d.count} finishes · {d.pct}% conversion</p>
    </div>
  );
}

export default function PlacementChart({ data }: { data: PlacementData }) {
  const chartData = BARS.map(b => ({
    label: b.label,
    count: data.placementBreakdown[b.key as keyof typeof data.placementBreakdown],
    pct: data[b.convKey as keyof PlacementData] as number,
    color: b.color,
  }));

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
      <h2 className="mb-1 text-base font-bold text-white">Placement Distribution</h2>
      <p className="text-xs text-gray-500 mb-5">Finishes across {data.totalPlayers} tracked entries</p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rates below chart */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {chartData.map((d, i) => (
          <div key={i} className="text-center">
            <p className="text-[10px] text-gray-500">{d.label}</p>
            <p className="text-sm font-bold" style={{ color: BARS[i].color }}>{d.pct}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
