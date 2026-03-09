import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { calculateRK9Analytics } from "@/lib/fantasy/rk9Analytics";

export default async function DeckAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Find deck by archetype_id matching slug
  const { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("id, name, slug, image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!archetype) notFound();

  // Find deck for this archetype
  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("archetype_id", archetype.id)
    .maybeSingle();

  const deckName = deck?.name || archetype.name;
  const imageUrl = deck?.image_url || archetype.image_url;

  // Calculate analytics from RK9 data using the deck name (more specific than archetype name)
  const analytics = deck
    ? await calculateRK9Analytics(supabase, deck.name)
    : await calculateRK9Analytics(supabase, archetype.name);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/decks" className="mb-4 inline-block text-sm text-gray-500 hover:text-white">
        ← All Decks
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-900/20 to-purple-900/20 p-6">
        <div className="flex items-center gap-4 mb-4">
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={deckName} 
              width={80} 
              height={80} 
              className="rounded-lg object-contain bg-white/5 p-2"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{deckName}</h1>
            {deck && (
              <p className="text-sm text-gray-400 mt-1">
                Tier {deck.tier} • {deck.cost}pts
              </p>
            )}
          </div>
        </div>
        
        {/* Top Stats Banner */}
        {analytics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Fantasy Price</p>
              <p className="text-2xl font-bold text-yellow-400">{deck?.cost || "—"}pts</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Meta Share</p>
              <p className="text-2xl font-bold">{analytics.metaShare}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Players</p>
              <p className="text-2xl font-bold">{analytics.totalPlayers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Best Finish</p>
              <p className="text-2xl font-bold text-yellow-400">#{analytics.bestRank}</p>
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
                <span className="text-sm text-gray-400">Meta Share</span>
                <span className="text-lg font-bold">{analytics.metaShare}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Players</span>
                <span className="text-lg font-bold">{analytics.totalPlayers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Best Finish</span>
                <span className="text-lg font-bold text-yellow-400">#{analytics.bestRank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Average Placement</span>
                <span className="text-lg font-bold">#{analytics.avgRank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Tier</span>
                <span className="text-lg font-bold text-yellow-400">{deck?.tier || "—"}</span>
              </div>
            </div>
          </section>
        )}

        {/* Conversion Rates */}
        {analytics && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Conversion Rates</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 64 Conversion</span>
                <span className="text-lg font-bold">{analytics.top64Conversion}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 32 Conversion</span>
                <span className="text-lg font-bold">{analytics.top32Conversion}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 16 Conversion</span>
                <span className="text-lg font-bold">{analytics.top16Conversion}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 8 Conversion</span>
                <span className="text-lg font-bold text-yellow-400">{analytics.top8Conversion}%</span>
              </div>
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
                <span className="text-lg font-bold text-yellow-400">{analytics.placementBreakdown.top8}</span>
              </div>
            </div>
          </section>
        )}

        {/* Top Finishers */}
        {analytics && analytics.topFinishers.length > 0 && (
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold">Top Finishers</h2>
            <div className="space-y-2">
              {analytics.topFinishers.map((finisher, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{finisher.playerName}</p>
                    <p className="text-xs text-gray-500">{finisher.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">
                      #{finisher.rank}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Representative Decklist */}
        {analytics && analytics.representativeDecklist && (
          <section className="lg:col-span-2 rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/10 to-orange-900/10 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="text-yellow-400">📋</span> Representative Decklist
            </h2>
            <p className="mb-2 text-sm text-gray-400">
              From <span className="font-semibold text-white">{analytics.representativeDecklist.playerName}</span> 
              {' '}(Rank #{analytics.representativeDecklist.rank})
            </p>
            {analytics.representativeDecklist.decklistUrl && (
              <a 
                href={analytics.representativeDecklist.decklistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 inline-block text-sm text-yellow-400 hover:underline"
              >
                View on RK9 →
              </a>
            )}
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-300 whitespace-pre-wrap">
{analytics.representativeDecklist.cardList || "No decklist available"}
            </pre>
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
