"use client";
import { useState } from "react";

interface Tournament {
  id: number;
  name: string;
  event_date: string;
  status: string;
  rk9_id: string | null;
  standingsCount: number;
  alreadyScored: boolean;
}

export default function ScoreTournamentClient({ tournaments }: { tournaments: Tournament[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScoring() {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Fetch standings from rk9_standings
      const standingsRes = await fetch(`/api/fantasy/admin/get-standings?tournament_id=${selected}`, { credentials: 'include' });
      const standingsData = await standingsRes.json();

      if (!standingsData.standings?.length) {
        setError(`No standings found for this tournament (${standingsData.count ?? 0} records). Run the scraper first.`);
        setLoading(false);
        return;
      }

      // Run scoring pipeline
      const res = await fetch("/api/fantasy/admin/ingest-event", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: selected,
          standings: standingsData.standings,
          force: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scoring failed");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedT = tournaments.find(t => t.id === selected);

  return (
    <div className="space-y-6">
      {/* Tournament list */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-900/60 px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Tournament</p>
        </div>
        <div className="divide-y divide-gray-800/50 max-h-96 overflow-y-auto">
          {tournaments.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={"w-full flex items-center justify-between px-4 py-3 text-left transition-colors " +
                (selected === t.id ? "bg-yellow-400/10 border-l-2 border-yellow-400" : "hover:bg-white/3")}>
              <div>
                <p className={"text-sm font-semibold " + (selected === t.id ? "text-yellow-400" : "text-white")}>{t.name}</p>
                <p className="text-xs text-gray-500">{t.event_date}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {t.standingsCount > 0 ? (
                  <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                    {t.standingsCount} standings
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
                    No data
                  </span>
                )}
                {t.alreadyScored && (
                  <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">
                    Scored
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action panel */}
      {selected && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <p className="font-bold mb-1">{selectedT?.name}</p>
          <p className="text-sm text-gray-500 mb-4">
            {selectedT?.standingsCount} standings available
            {selectedT?.alreadyScored ? " · Already scored (will re-score)" : ""}
          </p>
          <button onClick={runScoring} disabled={loading || !selectedT?.standingsCount}
            className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? "Running pipeline..." : "▶ Run Scoring Pipeline"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 space-y-3">
          <p className="font-bold text-green-400">✅ Scoring complete</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xl font-black text-white">{result.archetypes_scored}</p>
              <p className="text-xs text-gray-500">Archetypes scored</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xl font-black text-white">{result.teams_scored}</p>
              <p className="text-xs text-gray-500">Teams scored</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xl font-black text-white">{result.unmatched_decks?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Unmatched decks</p>
            </div>
          </div>
          {result.unmatched_decks?.length > 0 && (
            <div className="rounded-lg bg-yellow-400/5 border border-yellow-400/20 p-3">
              <p className="text-xs font-bold text-yellow-400 mb-1">Unmatched decks:</p>
              <p className="text-xs text-gray-400">{result.unmatched_decks.join(", ")}</p>
            </div>
          )}
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">View pipeline log</summary>
            <pre className="mt-2 text-[10px] text-gray-500 bg-black/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
              {result.log?.join("\n")}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
