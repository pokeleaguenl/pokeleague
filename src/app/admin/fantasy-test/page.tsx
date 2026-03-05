"use client";

import { useState } from "react";
import Link from "next/link";

export default function FantasyTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [debugCounts, setDebugCounts] = useState<Record<string, number> | null>(null);
  const [tournamentId, setTournamentId] = useState("1");

  const sampleSnapshot = {
    fantasy_event_id: 1,
    standings: [
      { player_name: "Player A", deck_name: "Charizard ex", placement: 1, wins: 9, losses: 0 },
      { player_name: "Player B", deck_name: "Pikachu ex", placement: 2, wins: 8, losses: 1 },
      { player_name: "Player C", deck_name: "Lugia VSTAR", placement: 3, wins: 7, losses: 2 },
      { player_name: "Player D", deck_name: "Miraidon ex", placement: 4, wins: 7, losses: 2 },
      { player_name: "Player E", deck_name: "Raging Bolt ex", placement: 5, wins: 6, losses: 3 },
    ],
    source: "manual_test",
  };

  async function runSeed() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seed-fantasy", { method: "POST" });
      const data = await res.json();
      setResult(res.ok ? `✅ ${data.message}\n\n${data.log?.join("\n") || ""}` : `❌ ${data.error}`);
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  async function postSnapshot() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fantasy/admin/update-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleSnapshot),
      });
      const data = await res.json();
      setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  async function checkCounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/fantasy/admin/debug-pipeline");
      const data = await res.json();
      if (res.ok) {
        setDebugCounts(data.counts);
        setResult("✅ Pipeline counts loaded");
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  async function checkEnv() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/debug-env");
      const data = await res.json();
      setResult(
        res.ok 
          ? `Environment Check:\n\n${JSON.stringify(data, null, 2)}`
          : `❌ ${data.error}`
      );
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  async function testAliasInsert() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-alias-insert", { method: "POST" });
      const data = await res.json();
      setResult(
        res.ok 
          ? `✅ Test passed!\n\n${JSON.stringify(data.results, null, 2)}`
          : `❌ Test failed: ${data.error}\n\n${JSON.stringify(data.results || data, null, 2)}`
      );
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  async function ingestTournament() {
    setLoading(true);
    setResult(null);
    try {
      const sampleStandings = [
        { player_name: "Player A", deck_name: "Charizard ex", placement: 1, wins: 9, losses: 0 },
        { player_name: "Player B", deck_name: "Pikachu ex", placement: 2, wins: 8, losses: 1 },
        { player_name: "Player C", deck_name: "Lugia VSTAR", placement: 3, wins: 7, losses: 2 },
        { player_name: "Player D", deck_name: "Miraidon ex", placement: 4, wins: 7, losses: 2 },
        { player_name: "Player E", deck_name: "Raging Bolt ex", placement: 5, wins: 6, losses: 3 },
      ];

      const res = await fetch("/api/fantasy/admin/ingest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: parseInt(tournamentId),
          standings: sampleStandings,
          force: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✅ ${data.message}\n\nLog:\n${data.log?.join("\n") || ""}`);
      } else {
        setResult(`❌ ${data.error}\n\n${data.log?.join("\n") || ""}`);
      }
    } catch (err) {
      setResult(`❌ Error: ${String(err)}`);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin" className="mb-4 inline-block text-sm text-gray-500 hover:text-white">
        ← Back to Admin
      </Link>

      <h1 className="mb-2 text-3xl font-bold">
        Fantasy <span className="text-yellow-400">Data Pipeline Test</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        Seed data and test snapshot ingestion
      </p>

      <div className="space-y-6">
        {/* Step 0: Debug Environment */}
        <section className="rounded-xl border border-purple-800 bg-purple-900/10 p-6">
          <h2 className="mb-3 text-lg font-semibold text-purple-400">Step 0A: Debug Environment</h2>
          <p className="mb-4 text-sm text-gray-400">
            Checks what environment variables are actually available at runtime.
            <br />
            Use this to verify SUPABASE_SERVICE_ROLE_KEY is set correctly.
          </p>
          <button
            onClick={checkEnv}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Checking..." : "🔍 Check Environment"}
          </button>
        </section>

        {/* Step 0B: Debug Alias Insert */}
        <section className="rounded-xl border border-red-800 bg-red-900/10 p-6">
          <h2 className="mb-3 text-lg font-semibold text-red-400">Step 0B: Debug Alias Insert</h2>
          <p className="mb-4 text-sm text-gray-400">
            Tests alias insertion with admin client to identify RLS/Postgres errors.
            <br />
            Checks: environment variables, archetype lookup, insert, and upsert operations.
          </p>
          <button
            onClick={testAliasInsert}
            disabled={loading}
            className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Testing..." : "🔍 Test Alias Insert"}
          </button>
        </section>

        {/* Step 1: Seed */}
        <section className="rounded-xl border border-gray-800 p-6">
          <h2 className="mb-3 text-lg font-semibold">Step 1: Seed Data</h2>
          <p className="mb-4 text-sm text-gray-400">
            Creates fantasy_archetypes, aliases, and fantasy_events from existing decks/tournaments.
          </p>
          <button
            onClick={runSeed}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Seeding..." : "🌱 Run Seed"}
          </button>
        </section>

        {/* Step 2A: Ingest Tournament (Automated) */}
        <section className="rounded-xl border border-green-800 bg-green-900/10 p-6">
          <h2 className="mb-3 text-lg font-semibold text-green-400">Step 2A: Ingest Tournament (Recommended)</h2>
          <p className="mb-4 text-sm text-gray-400">
            Automated pipeline: creates fantasy_event, converts standings, computes analytics.
            <br />
            Idempotent: skips if snapshot already exists (use force=true to override).
          </p>
          <div className="mb-4">
            <label className="mb-2 block text-xs text-gray-400">Tournament ID:</label>
            <input
              type="number"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              placeholder="Enter tournament ID"
            />
          </div>
          <button
            onClick={ingestTournament}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Ingesting..." : "🚀 Ingest Tournament"}
          </button>
        </section>

        {/* Step 2B: Post Snapshot (Manual) */}
        <section className="rounded-xl border border-gray-800 p-6">
          <h2 className="mb-3 text-lg font-semibold">Step 2B: Post Test Snapshot (Manual)</h2>
          <p className="mb-4 text-sm text-gray-400">
            Posts a sample standings snapshot directly to fantasy_event_id = 1.
            <br />
            Use this if you already have a fantasy_event created.
          </p>
          <details className="mb-4">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-white">
              View sample payload
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
              {JSON.stringify(sampleSnapshot, null, 2)}
            </pre>
          </details>
          <button
            onClick={postSnapshot}
            disabled={loading}
            className="rounded-lg bg-yellow-600 px-6 py-3 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Posting..." : "📤 Post Snapshot"}
          </button>
        </section>

        {/* Result */}
        {result && (
          <section className="rounded-xl border border-green-800/50 bg-green-900/10 p-6">
            <h3 className="mb-2 text-sm font-semibold text-green-400">Result</h3>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-gray-300">
              {result}
            </pre>
          </section>
        )}

        {/* Verification */}
        <section className="rounded-xl border border-gray-800 p-6">
          <h2 className="mb-3 text-lg font-semibold">Step 3: Verify Data</h2>
          <p className="mb-4 text-sm text-gray-400">
            Check pipeline table counts:
          </p>
          <button
            onClick={checkCounts}
            disabled={loading}
            className="mb-4 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "🔍 Check Counts"}
          </button>

          {debugCounts && (
            <div className="rounded bg-gray-900 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-400">Pipeline Counts</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(debugCounts).map(([table, count]) => (
                  <div key={table} className="flex justify-between">
                    <span className="text-gray-400">{table}:</span>
                    <span className={count > 0 ? "text-green-400 font-bold" : "text-gray-500"}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-white">
              Or run SQL manually in Supabase
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
{`SELECT 'archetypes' as table_name, COUNT(*) as count FROM fantasy_archetypes
UNION ALL
SELECT 'aliases', COUNT(*) FROM fantasy_archetype_aliases
UNION ALL
SELECT 'events', COUNT(*) FROM fantasy_events
UNION ALL
SELECT 'snapshots', COUNT(*) FROM fantasy_standings_snapshots
UNION ALL
SELECT 'scores_live', COUNT(*) FROM fantasy_archetype_scores_live
UNION ALL
SELECT 'team_scores_live', COUNT(*) FROM fantasy_team_scores_live;`}
            </pre>
          </details>
        </section>
      </div>
    </div>
  );
}
