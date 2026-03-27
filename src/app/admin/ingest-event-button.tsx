"use client";

import { useState } from "react";

interface Tournament {
  id: number;
  name: string;
  event_date: string;
  rk9_id: string | null;
}

export default function IngestEventButton({ tournaments }: { tournaments: Tournament[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [force, setForce] = useState(false);
  const [showLog, setShowLog] = useState(false);

  async function handleIngest() {
    if (!selectedId) { setResult("❌ Select a tournament first"); return; }
    if (!confirm(`Ingest standings for this tournament? ${force ? "(force re-ingest)" : ""}`)) return;

    setLoading(true);
    setResult(null);
    setLog([]);

    const res = await fetch("/api/fantasy/admin/ingest-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournament_id: parseInt(selectedId), force }),
    });
    const data = await res.json();

    if (res.ok) {
      setResult(`✅ ${data.message} · ${data.archetypes_scored} archetypes · ${data.teams_scored} squads scored${data.scoring_warnings > 0 ? ` · ⚠️ ${data.scoring_warnings} warnings` : ""}`);
    } else {
      setResult(`❌ ${data.error}`);
    }
    if (data.log) setLog(data.log);
    setShowLog(true);
    setLoading(false);
  }

  const withRk9 = tournaments.filter(t => t.rk9_id);

  return (
    <div className="col-span-2">
      <div className="rounded-lg border border-blue-700/50 bg-blue-900/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-blue-300">⚡ Ingest Tournament Standings</p>
        <p className="text-xs text-gray-500">Auto-fetches standings from RK9 data and scores all squads.</p>

        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-400"
        >
          <option value="">— Select tournament —</option>
          {withRk9.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.event_date})
            </option>
          ))}
          {tournaments.filter(t => !t.rk9_id).map(t => (
            <option key={t.id} value={t.id} disabled>
              {t.name} (no RK9 data)
            </option>
          ))}
        </select>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)}
              className="rounded" />
            Force re-ingest
          </label>
          <button onClick={handleIngest} disabled={loading || !selectedId}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-300 hover:border-blue-400 hover:text-blue-200 disabled:opacity-40">
            {loading ? "Ingesting..." : "Run Ingest"}
          </button>
        </div>

        {result && <p className="text-sm">{result}</p>}

        {log.length > 0 && (
          <div>
            <button onClick={() => setShowLog(v => !v)}
              className="text-xs text-gray-500 hover:text-gray-300">
              {showLog ? "▼ Hide log" : "▶ Show log"} ({log.length} lines)
            </button>
            {showLog && (
              <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-black/40 p-3 text-[11px] text-gray-400 whitespace-pre-wrap">
                {log.join("\n")}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
