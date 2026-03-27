"use client";

import { useState } from "react";

interface Tournament {
  id: number;
  name: string;
  event_date: string;
  rk9_id: string | null;
}

interface IngestResult {
  id: number;
  name: string;
  status: "ok" | "skipped" | "error";
  message: string;
  archetypes?: number;
  teams?: number;
  warnings?: number;
}

export default function IngestEventButton({ tournaments }: { tournaments: Tournament[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [force, setForce] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [allResults, setAllResults] = useState<IngestResult[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const withRk9 = tournaments.filter(t => t.rk9_id);

  async function ingestOne(id: number, name: string): Promise<IngestResult> {
    const res = await fetch("/api/fantasy/admin/ingest-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournament_id: id, force }),
    });
    const data = await res.json();

    if (res.ok) {
      return {
        id, name, status: "ok",
        message: data.message,
        archetypes: data.archetypes_scored,
        teams: data.teams_scored,
        warnings: data.scoring_warnings ?? 0,
      };
    } else if (res.status === 200 && data.ok === false) {
      // Already ingested, skipped
      return { id, name, status: "skipped", message: data.message };
    } else {
      return { id, name, status: "error", message: data.error ?? "Unknown error" };
    }
  }

  async function handleIngestOne() {
    if (!selectedId) { setResult("❌ Select a tournament first"); return; }
    setLoading(true);
    setResult(null);
    setLog([]);
    setAllResults([]);

    const t = tournaments.find(t => t.id === parseInt(selectedId))!;
    const r = await ingestOne(t.id, t.name);

    if (r.status === "ok") {
      setResult(`✅ ${r.message} · ${r.archetypes} archetypes · ${r.teams} squads${r.warnings ? ` · ⚠️ ${r.warnings} warnings` : ""}`);
    } else if (r.status === "skipped") {
      setResult(`⏭ ${r.message}`);
    } else {
      setResult(`❌ ${r.message}`);
    }

    // Fetch log separately if needed — single ingest already shows in result
    setShowLog(false);
    setLoading(false);
  }

  async function handleIngestAll() {
    if (withRk9.length === 0) { setResult("❌ No tournaments with RK9 data"); return; }
    if (!confirm(`Ingest all ${withRk9.length} tournaments with RK9 data?${force ? " (force re-ingest all)" : " (skips already ingested)"}`)) return;

    setLoading(true);
    setResult(null);
    setLog([]);
    setAllResults([]);
    setShowLog(true);

    const results: IngestResult[] = [];
    for (let i = 0; i < withRk9.length; i++) {
      const t = withRk9[i];
      setProgress({ current: i + 1, total: withRk9.length });
      const r = await ingestOne(t.id, t.name);
      results.push(r);
      setAllResults([...results]);
    }

    setProgress(null);
    const ok = results.filter(r => r.status === "ok").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;
    setResult(`Done — ${ok} ingested, ${skipped} skipped, ${errors} errors`);
    setLoading(false);
  }

  return (
    <div className="col-span-2">
      <div className="rounded-lg border border-blue-700/50 bg-blue-900/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-blue-300">⚡ Ingest Tournament Standings</p>
        <p className="text-xs text-gray-500">
          Auto-fetches standings from RK9 data and scores all squads.
          {withRk9.length > 0 && <span className="text-blue-400/70"> {withRk9.length} tournaments available.</span>}
        </p>

        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-400 disabled:opacity-50"
        >
          <option value="">— Select one tournament —</option>
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

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)}
              disabled={loading} className="rounded" />
            Force re-ingest
          </label>

          <button onClick={handleIngestOne} disabled={loading || !selectedId}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-300 hover:border-blue-400 hover:text-blue-200 disabled:opacity-40">
            {loading ? "Running..." : "Ingest Selected"}
          </button>

          <button onClick={handleIngestAll} disabled={loading || withRk9.length === 0}
            className="rounded-lg border border-purple-600 bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-300 hover:border-purple-400 hover:text-purple-200 disabled:opacity-40">
            {loading && progress
              ? `Ingesting ${progress.current}/${progress.total}...`
              : `Ingest All (${withRk9.length})`}
          </button>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-purple-500 transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}

        {result && <p className="text-sm">{result}</p>}

        {/* Ingest All results table */}
        {allResults.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {allResults.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 text-xs">
                <span className="text-gray-300 truncate flex-1 mr-2">{r.name}</span>
                <span className={
                  r.status === "ok" ? "text-green-400 shrink-0" :
                  r.status === "skipped" ? "text-gray-500 shrink-0" :
                  "text-red-400 shrink-0"
                }>
                  {r.status === "ok"
                    ? `✅ ${r.archetypes} archetypes · ${r.teams} squads${r.warnings ? ` · ⚠️${r.warnings}` : ""}`
                    : r.status === "skipped" ? "⏭ skipped"
                    : `❌ ${r.message}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Single ingest log */}
        {log.length > 0 && (
          <div>
            <button onClick={() => setShowLog(v => !v)} className="text-xs text-gray-500 hover:text-gray-300">
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
