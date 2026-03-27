"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  S: "#f87171",
  A: "#fb923c",
  B: "#facc15",
  C: "#4ade80",
  D: "#60a5fa",
};

interface Deck {
  deck_name: string;
  tier: string;
  meta_share: number;
  archetype_slug: string;
}

interface TooltipPayload {
  value: number;
  payload: { tier: string; name: string };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { tier } = payload[0].payload;
  const color = TIER_COLORS[tier] || "#9ca3af";
  return (
    <div className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{label}</p>
      <p style={{ color }}>{payload[0].value.toFixed(1)}% meta share</p>
      <p className="text-gray-500">Tier {tier}</p>
    </div>
  );
}

export default function MetaSnapshotChart({ decks }: { decks: Deck[] }) {
  const top12 = [...decks]
    .filter(d => d.meta_share > 0)
    .sort((a, b) => (b.meta_share || 0) - (a.meta_share || 0))
    .slice(0, 12)
    .map(d => ({
      name: d.deck_name.length > 22 ? d.deck_name.slice(0, 21) + "…" : d.deck_name,
      fullName: d.deck_name,
      meta: d.meta_share,
      tier: d.tier,
      slug: d.archetype_slug,
    }));

  if (top12.length === 0) return null;

  return (
    <div className="mb-10 rounded-2xl border border-white/10 bg-gray-900/60 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-white">Meta Snapshot</h2>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          {(["S", "A", "B", "C"] as const).map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: TIER_COLORS[t] }} />
              Tier {t}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5">Top 12 decks by meta share across all ingested tournaments</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={top12} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickFormatter={v => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#d1d5db", fontSize: 11 }}
            width={145}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="meta" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {top12.map((entry, i) => (
              <Cell key={i} fill={TIER_COLORS[entry.tier] || "#9ca3af"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2">
        {top12.slice(0, 6).map(d => (
          <Link
            key={d.slug}
            href={`/decks/${d.slug}`}
            className="rounded-lg border border-white/5 bg-white/3 px-2.5 py-1 text-[10px] text-gray-400 hover:border-yellow-400/30 hover:text-yellow-400 transition-all"
          >
            {d.fullName}
          </Link>
        ))}
      </div>
    </div>
  );
}
