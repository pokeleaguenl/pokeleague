"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

interface TournamentStat {
  tournamentName: string;
  eventDate: string | null;
  entries: number;
  bestRank: number;
  top8: number;
  metaShare: number;
}

interface TooltipPayload {
  value: number;
  name: string;
  payload: TournamentStat & { shortName: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs shadow-xl min-w-[160px]">
      <p className="font-bold text-white mb-1.5">{d.tournamentName}</p>
      <div className="space-y-0.5 text-gray-400">
        <p><span className="text-yellow-400 font-bold">{d.metaShare}%</span> meta share</p>
        <p><span className="text-white font-semibold">{d.entries}</span> entries</p>
        {d.top8 > 0 && <p><span className="text-purple-400 font-semibold">{d.top8}×</span> Top 8</p>}
        {d.bestRank <= 8 && <p>Best: <span className="text-yellow-400 font-bold">#{d.bestRank}</span></p>}
      </div>
    </div>
  );
}

export default function TournamentMetaChart({ breakdown }: { breakdown: TournamentStat[] }) {
  if (breakdown.length < 2) return null;

  const data = [...breakdown]
    .sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    })
    .map(t => ({
      ...t,
      shortName: t.tournamentName
        .replace("Regional Championships", "Regionals")
        .replace("Regional Championship", "Regionals")
        .replace("International Championships", "Intls")
        .replace("World Championships", "Worlds")
        .split(" ").slice(0, 2).join(" "),
    }));

  const maxShare = Math.max(...data.map(d => d.metaShare), 1);

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6 lg:col-span-2 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-white">Meta Share by Tournament</h2>
        <span className="text-xs text-gray-500">{data.length} events</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">How popular this deck was across each tournament — bars glow purple on Top 8 finishes</p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="shortName"
            tick={{ fill: "#6b7280", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickFormatter={v => `${v}%`}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(maxShare * 1.2)]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="metaShare" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.top8 > 0 ? "#a855f7" : "#facc15"}
                fillOpacity={entry.top8 > 0 ? 0.85 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-400/50" />
          Meta presence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-500/85" />
          Top 8 finish
        </span>
      </div>
    </section>
  );
}
