import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { calculateDeckAnalytics } from "@/lib/fantasy/deckAnalytics";

export default async function DeckAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Find archetype
  const { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Find deck data
  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .ilike("name", `%${slug.replace(/-/g, " ")}%`)
    .maybeSingle();

  if (!archetype && !deck) notFound();

  // Calculate analytics
  const analytics = archetype
    ? await calculateDeckAnalytics(supabase, archetype.id, deck || undefined)
    : null;

  const deckName = archetype?.name || deck?.name || slug;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/decks" className="mb-4 inline-block text-sm text-gray-500 hover:text-white">
        ← All Decks
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-900/20 to-purple-900/20 p-6">
        <h1 className="mb-4 text-3xl font-bold">{deckName}</h1>
        
        {/* Top Stats Banner */}
        {analytics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="text-center">
              <p className="text-xs text-gray-400">Fantasy Price</p>
              <p className="text-2xl font-bold text-yellow-400">${deck?.cost || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Fantasy Points</p>
              <p className="text-2xl font-bold">{analytics.fantasyPoints}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Points/Event</p>
              <p className="text-2xl font-bold">{analytics.pointsPerEvent}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Recent Form</p>
              <p className="text-2xl font-bold">{analytics.recentForm}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Selected By</p>
              <p className="text-2xl font-bold text-gray-500">—</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Core Competitive Metrics */}
        {analytics && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Core Competitive Metrics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Win Rate</span>
                <span className="text-lg font-bold text-gray-500">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Meta Share</span>
                <span className="text-lg font-bold">{analytics.metaShare.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Meta Rank</span>
                <span className="text-lg font-bold text-yellow-400">#{deck?.tier || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Day 2 Conversion</span>
                <span className="text-lg font-bold">
                  {analytics.day2Conversion !== null ? `${analytics.day2Conversion}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 32 Conversion</span>
                <span className="text-lg font-bold">
                  {analytics.top32Conversion !== null ? `${analytics.top32Conversion}%` : "—"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Tournament Results */}
        {analytics && analytics.tournamentResults.length > 0 && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Tournament Results</h2>
            <div className="space-y-2">
              {analytics.tournamentResults.slice(0, 4).map((result, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{result.eventName}</p>
                    <p className="text-xs text-gray-500">{result.eventDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">
                      {result.placement === 1 ? "1st" : 
                       result.placement === 2 ? "2nd" : 
                       result.placement === 3 ? "3rd" : 
                       `${result.placement}th`}
                    </p>
                    <p className="text-xs text-gray-500">{result.points}pts</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Meta Efficiency */}
        {analytics && (
          <section className="rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/10 to-orange-900/10 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="text-yellow-400">⭐</span> Meta Efficiency
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 32 Share</span>
                <span className="font-bold">{analytics.metaEfficiency.top32Share}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Meta Share</span>
                <span className="font-bold">{analytics.metaEfficiency.metaShare.toFixed(1)}%</span>
              </div>
              <div className="my-4 text-center">
                <p className="text-4xl font-bold text-yellow-400">{analytics.metaEfficiency.score}</p>
                <p className="text-xs text-gray-400">Meta Efficiency</p>
              </div>
              <p className="text-xs text-gray-300">
                {analytics.metaEfficiency.description}
              </p>
            </div>
          </section>
        )}

        {/* Placement Breakdown */}
        {analytics && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Placement Breakdown</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 64</span>
                <span className="text-lg font-bold">{analytics.placementBreakdown.top64}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 32</span>
                <span className="text-lg font-bold">{analytics.placementBreakdown.top32}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 16</span>
                <span className="text-lg font-bold">{analytics.placementBreakdown.top16}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 8</span>
                <span className="text-lg font-bold">{analytics.placementBreakdown.top8}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Finals (Top 4)</span>
                <span className="text-lg font-bold text-yellow-400">{analytics.placementBreakdown.finals}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                <span className="text-sm font-semibold text-gray-300">Wins</span>
                <span className="text-xl font-bold text-yellow-400">{analytics.placementBreakdown.wins}</span>
              </div>
            </div>
          </section>
        )}

        {/* Coming Soon Sections */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/30 p-6 opacity-50">
          <h2 className="mb-4 text-lg font-semibold">Fantasy Ownership</h2>
          <p className="text-sm text-gray-500">Coming soon: Selected by %, Captain rate, Transfers in/out</p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/30 p-6 opacity-50">
          <h2 className="mb-4 text-lg font-semibold">Meta Radar & Matchups</h2>
          <p className="text-sm text-gray-500">Coming soon: Power/Consistency/Form spider chart, Matchup analysis</p>
        </section>
      </div>

      {/* No Data State */}
      {!analytics && (
        <div className="rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500">No analytics data available yet for this deck.</p>
          <p className="mt-2 text-sm text-gray-600">Data will appear after tournament results are ingested.</p>
        </div>
      )}
    </div>
  );
}
