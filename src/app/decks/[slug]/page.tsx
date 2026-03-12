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

  const { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!archetype) notFound();

  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("archetype_id", archetype.id)
    .maybeSingle();

  const deckName = deck?.name || archetype.name;
  const image1 = archetype.image_url || deck?.image_url || null;
  const image2 = archetype.image_url_2 || deck?.image_url_2 || null;

  const rk9 = deck
    ? await calculateRK9Analytics(supabase, deck.name)
    : await calculateRK9Analytics(supabase, archetype.name);

  const tierColors: Record<string, string> = {
    S: "text-red-400 bg-red-400/10 border-red-400/30",
    A: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    B: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    C: "text-green-400 bg-green-400/10 border-green-400/30",
    D: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  };
  const tierClass = deck?.tier ? (tierColors[deck.tier] || "text-gray-400 bg-gray-400/10 border-gray-400/30") : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/decks" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
        ← All Decks
      </Link>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-gray-900/60 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-5">
          {/* Images */}
          <div className="flex items-center flex-shrink-0">
            {image1 && (
              <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                <Image src={image1} alt={deckName} width={80} height={80} className="object-contain" />
              </div>
            )}
            {image2 && (
              <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10 -ml-4">
                <Image src={image2} alt={deckName} width={80} height={80} className="object-contain" />
              </div>
            )}
          </div>
          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black mb-2">{deckName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {deck?.tier && (
                <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${tierClass}`}>
                  Tier {deck.tier}
                </span>
              )}
              {deck?.cost && (
                <span className="inline-flex items-center rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-0.5 text-xs font-bold text-yellow-400">
                  {deck.cost} pts
                </span>
              )}
              {deck?.meta_share && (
                <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
                  {deck.meta_share.toFixed(1)}% meta share
                </span>
              )}
              {rk9 && (
                <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
                  {rk9.tournamentsPlayed} events played
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top stat row */}
        {rk9 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-white/5 pt-5">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Meta Share</p>
              <p className="text-2xl font-black text-yellow-400">{rk9.metaShare}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Entries</p>
              <p className="text-2xl font-black">{rk9.totalEntries}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Best Finish</p>
              <p className="text-2xl font-black text-yellow-400">#{rk9.bestRank}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Rank</p>
              <p className="text-2xl font-black">#{rk9.avgRank}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Event Wins</p>
              <p className="text-2xl font-black text-yellow-400">{rk9.placementBreakdown.wins}</p>
            </div>
          </div>
        )}
      </div>

      {rk9 ? (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Conversion Rates */}
          <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-base font-bold text-white">Placement Conversion</h2>
            <p className="text-xs text-gray-500 mb-4">% of entries finishing in each bracket — across {rk9.tournamentsPlayed} tournaments</p>
            <div className="space-y-3">
              {[
                { label: "Top 8",  pct: rk9.top8Conversion,  count: rk9.placementBreakdown.top8,  color: "bg-yellow-400" },
                { label: "Top 16", pct: rk9.top16Conversion, count: rk9.placementBreakdown.top16, color: "bg-orange-400" },
                { label: "Top 32", pct: rk9.top32Conversion, count: rk9.placementBreakdown.top32, color: "bg-blue-400" },
                { label: "Top 64", pct: rk9.top64Conversion, count: rk9.placementBreakdown.top64, color: "bg-gray-500" },
              ].map(({ label, pct, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-bold">{pct}% <span className="text-gray-600 font-normal">({count})</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className={`h-1.5 rounded-full ${color} transition-all`} style={{width: `${Math.min(pct * 2, 100)}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Finishers */}
          <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-base font-bold text-white">Top Finishers</h2>
            <div className="space-y-2">
              {rk9.topFinishers.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2.5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black w-8 ${f.rank === 1 ? "text-yellow-400" : "text-gray-500"}`}>
                      #{f.rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{f.playerName}</p>
                      <p className="text-xs text-gray-500">{f.tournamentName}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{f.country}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Per-tournament breakdown */}
          <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6 lg:col-span-2">
            <h2 className="mb-4 text-base font-bold text-white">Tournament Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-white/5">
                    <th className="text-left pb-2 font-medium">Tournament</th>
                    <th className="text-right pb-2 font-medium">Players</th>
                    <th className="text-right pb-2 font-medium">Meta%</th>
                    <th className="text-right pb-2 font-medium">Best</th>
                    <th className="text-right pb-2 font-medium">T8</th>
                    <th className="text-right pb-2 font-medium">T16</th>
                    <th className="text-right pb-2 font-medium">T32</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rk9.perTournament.map((t, i) => (
                    <tr key={i} className="hover:bg-white/3 transition-colors">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-200">{t.tournamentName}</p>
                        <p className="text-xs text-gray-600">{t.eventDate ? new Date(t.eventDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""}</p>
                      </td>
                      <td className="text-right py-2.5 text-gray-400">{t.players}</td>
                      <td className="text-right py-2.5">
                        <span className="text-yellow-400 font-semibold">{t.metaShare}%</span>
                      </td>
                      <td className="text-right py-2.5 font-bold">#{t.bestRank}</td>
                      <td className="text-right py-2.5">{t.top8 > 0 ? <span className="text-yellow-400 font-bold">{t.top8}</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="text-right py-2.5">{t.top16 > 0 ? <span className="text-orange-400">{t.top16}</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="text-right py-2.5">{t.top32 > 0 ? <span className="text-blue-400">{t.top32}</span> : <span className="text-gray-700">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 p-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-400 font-medium">No tournament data yet</p>
          <p className="mt-2 text-sm text-gray-600">Data will appear once RK9 standings are ingested.</p>
        </div>
      )}
    </div>
  );
}
