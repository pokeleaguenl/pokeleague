"use client";

import { useState } from "react";

interface Tournament { id: number; name: string; event_date: string; status: string; }
interface Deck { id: number; name: string; tier: string; }

interface Props { tournaments: Tournament[]; decks: Deck[]; }

export default function TournamentManager({ tournaments: initial, decks }: Props) {
  const [tournaments, setTournaments] = useState(initial);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [creating, setCreating] = useState(false);

  // Result logging state
  const [selectedT, setSelectedT] = useState<number | null>(null);
  const [deckId, setDeckId] = useState("");
  const [day2, setDay2] = useState(false);
  const [top8, setTop8] = useState(false);
  const [won, setWon] = useState(false);
  const [winRate, setWinRate] = useState("");
  const [hadWin, setHadWin] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [autoScoring, setAutoScoring] = useState(false);
  const [autoScoreMsg, setAutoScoreMsg] = useState<string | null>(null);
  const [fantasyScoring, setFantasyScoring] = useState(false);
  const [fantasyMsg, setFantasyMsg] = useState<string | null>(null);

  async function createTournament() {
    if (!name || !date) return;
    setCreating(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, event_date: date }),
    });
    const data = await res.json();
    if (res.ok) {
      setTournaments((t) => [data, ...t]);
      setName(""); setDate("");
    }
    setCreating(false);
  }

  async function submitResult() {
    if (!selectedT || !deckId) return;
    setLogging(true);
    setLogMessage(null);
    const res = await fetch(`/api/tournaments/${selectedT}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deck_id: parseInt(deckId), made_day2: day2, top8, won, win_rate: parseFloat(winRate) || 0, had_win: hadWin }),
    });
    const data = await res.json();
    setLogMessage(res.ok ? `✅ Logged! Base points: ${data.base_points}` : `❌ ${data.error}`);
    setLogging(false);
  }

  async function runAutoScore() {
    if (!selectedT) return;
    setAutoScoring(true); setAutoScoreMsg(null);
    const res = await fetch(`/api/tournaments/${selectedT}/auto-score`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setAutoScoreMsg(`✅ Auto-scored ${data.scored} decks. ${data.unmatched} unmatched.`);
    } else {
      setAutoScoreMsg(`❌ ${data.error}`);
    }
    setAutoScoring(false);
  }

  async function runFantasyScoring() {
    if (!selectedT) return;
    setFantasyScoring(true); setFantasyMsg(null);
    const res = await fetch(`/api/tournaments/${selectedT}/score-fantasy`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setFantasyMsg(`✅ Scored ${data.scored}/${data.total_squads} squads.`);
    } else {
      setFantasyMsg(`❌ ${data.error}`);
    }
    setFantasyScoring(false);
  }

  return (
    <div className="space-y-10">
      {/* Create tournament */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Create Tournament</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none" />
          <button onClick={createTournament} disabled={creating}
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </section>

      {/* Log results */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Log Deck Result</h2>
        <div className="space-y-3 rounded-xl border border-gray-800 p-4">
          <select value={selectedT ?? ""} onChange={(e) => setSelectedT(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none">
            <option value="">Select tournament</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.event_date})</option>)}
          </select>
          <select value={deckId} onChange={(e) => setDeckId(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none">
            <option value="">Select deck</option>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="number" min={0} max={100} value={winRate} onChange={(e) => setWinRate(e.target.value)}
            placeholder="Win rate % (0-100)"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none" />
          <div className="flex flex-wrap gap-4 text-sm">
            {[["Made Day 2 (+3)", day2, setDay2], ["Top 8 (+10)", top8, setTop8], ["Won (+25)", won, setWon], ["Had a Win (+1)", hadWin, setHadWin]].map(([label, val, setter]) => (
              <label key={label as string} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={val as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                  className="accent-yellow-400" />
                {label as string}
              </label>
            ))}
            <span className="text-gray-500 text-xs">Win rate &gt;60% = +20pts</span>
          </div>
          <button onClick={submitResult} disabled={logging || !selectedT || !deckId}
            className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
            {logging ? "Logging..." : "Log Result"}
          </button>
          {logMessage && <p className="text-sm text-gray-400">{logMessage}</p>}
        </div>
      </section>

      {/* Auto-score from RK9 */}
      <section className="rounded-xl border border-blue-900/40 bg-blue-900/10 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-blue-300">🤖 Auto-Score from RK9 Data</h2>
          <p className="text-xs text-gray-500 mt-0.5">Reads RK9 standings, maps archetypes to decks, logs results automatically.</p>
        </div>
        <select value={selectedT ?? ""} onChange={(e) => setSelectedT(parseInt(e.target.value))}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none">
          <option value="">Select tournament</option>
          {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.event_date})</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={runAutoScore} disabled={autoScoring || !selectedT}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {autoScoring ? "Scoring..." : "1. Auto-Score Decks"}
          </button>
          <button onClick={runFantasyScoring} disabled={fantasyScoring || !selectedT}
            className="flex-1 rounded-lg bg-yellow-400 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
            {fantasyScoring ? "Scoring..." : "2. Score Fantasy Points"}
          </button>
        </div>
        {autoScoreMsg && <p className="text-sm text-gray-300">{autoScoreMsg}</p>}
        {fantasyMsg && <p className="text-sm text-gray-300">{fantasyMsg}</p>}
      </section>

      {/* Tournament list */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Tournaments</h2>
        {tournaments.length === 0 ? <p className="text-gray-500">No tournaments yet.</p> : (
          <div className="space-y-2">
            {tournaments.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-800 p-3 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="text-gray-500">{t.event_date}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
