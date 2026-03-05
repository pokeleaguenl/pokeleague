"use client";

import { useState } from "react";
import Link from "next/link";

export default function FantasyTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sampleSnapshot = {
    fantasy_event_id: 1,
    payload: {
      archetypes: [
        {
          archetype_slug: "charizard-ex",
          archetype_name: "Charizard ex",
          placement: 1,
          made_day2: true,
          top8: true,
          won: true,
          win_rate: 0.75,
          had_win: true,
        },
        {
          archetype_slug: "pikachu-ex",
          archetype_name: "Pikachu ex",
          placement: 3,
          made_day2: true,
          top8: true,
          won: false,
          win_rate: 0.68,
          had_win: true,
        },
        {
          archetype_slug: "lugia-vstar",
          archetype_name: "Lugia VSTAR",
          placement: 8,
          made_day2: true,
          top8: true,
          won: false,
          win_rate: 0.58,
          had_win: true,
        },
      ],
    },
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

        {/* Step 2: Post Snapshot */}
        <section className="rounded-xl border border-gray-800 p-6">
          <h2 className="mb-3 text-lg font-semibold">Step 2: Post Test Snapshot</h2>
          <p className="mb-4 text-sm text-gray-400">
            Posts a sample standings snapshot for fantasy_event_id = 1.
            <br />
            Writes to: fantasy_standings_snapshots, fantasy_archetype_scores_live, fantasy_team_scores_live
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
            Run this SQL in Supabase to check table counts:
          </p>
          <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-300">
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
        </section>
      </div>
    </div>
  );
}
