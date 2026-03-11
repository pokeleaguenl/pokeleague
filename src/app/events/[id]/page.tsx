import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tournament } = await supabase
    .from("tournaments").select("*").eq("id", id).single();
  if (!tournament) notFound();

  // RK9 standings meta breakdown
  const { data: rk9Meta } = await supabase
    .from("rk9_standings")
    .select("archetype, rank")
    .eq("tournament_id", tournament.rk9_id)
    .not("archetype", "is", null)
    .not("rank", "is", null);

  // Build archetype meta breakdown
  const archetypeCounts: Record<string, { count: number; top8: number; winner: boolean }> = {};
  const totalPlayers = rk9Meta?.length ?? 0;
  for (const row of rk9Meta ?? []) {
    if (!row.archetype) continue;
    if (!archetypeCounts[row.archetype]) archetypeCounts[row.archetype] = { count: 0, top8: 0, winner: false };
    archetypeCounts[row.archetype].count++;
    if (row.rank <= 8) archetypeCounts[row.archetype].top8++;
    if (row.rank === 1) archetypeCounts[row.archetype].winner = true;
  }
  const topArchetypes = Object.entries(archetypeCounts)
    .map(([name, stats]) => ({ name, ...stats, share: parseFloat(((stats.count / totalPlayers) * 100).toFixed(1)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Winner archetype
  const winner = topArchetypes.find(a => a.winner);

  // Archetype image lookup
  const archetypeNames = topArchetypes.map(a => a.name);
  const { data: archetypeImages } = await supabase
    .from("fantasy_archetypes")
    .select("name, image_url, slug")
    .in("name", archetypeNames);
  const imageMap = new Map((archetypeImages ?? []).map(a => [a.name, a]));

  // Get deck results (manual)
  const { data: results } = await supabase
    .from("tournament_results")
    .select("*, deck:decks(id, name, image_url, tier)")
    .eq("tournament_id", id)
    .order("base_points", { ascending: false });

  // My score
  const { data: myScore } = await supabase
    .from("league_scores")
    .select("points_earned")
    .eq("user_id", user.id)
    .eq("tournament_id", id)
    .maybeSingle();

  // Event leaderboard
  const { data: allScores } = await supabase
    .from("league_scores")
    .select("user_id, points_earned")
    .eq("tournament_id", id)
    .order("points_earned", { ascending: false });

  const { data: profiles } = await supabase
    .from("profiles").select("id, display_name, username");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Adjacent events
  const { data: allTournaments } = await supabase
    .from("tournaments").select("id, name").order("event_date");
  const idx = (allTournaments ?? []).findIndex((t) => t.id === parseInt(id));
  const prevEvent = idx > 0 ? allTournaments![idx - 1] : null;
  const nextEvent = idx < (allTournaments ?? []).length - 1 ? allTournaments![idx + 1] : null;

  const isPast = tournament.event_date < new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/events" className="text-gray-500 hover:text-white transition-colors">← All Events</Link>
        <div className="flex gap-3">
          {prevEvent && <Link href={`/events/${prevEvent.id}`} className="text-gray-500 hover:text-yellow-400 transition-colors">← Prev</Link>}
          {nextEvent && <Link href={`/events/${nextEvent.id}`} className="text-gray-500 hover:text-yellow-400 transition-colors">Next →</Link>}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold leading-tight">{tournament.name}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {tournament.event_date}
          {tournament.city ? ` · ${tournament.city}` : ""}
          {` · ${tournament.format}`}
          {totalPlayers > 0 && ` · ${totalPlayers} players`}
        </p>
      </div>

      {/* Winner banner */}
      {winner && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide">Tournament Winner</p>
            <p className="font-bold text-white">{winner.name}</p>
          </div>
          {imageMap.get(winner.name)?.image_url && (
            <Image src={imageMap.get(winner.name)!.image_url!} alt={winner.name}
              width={40} height={40} className="ml-auto object-contain" />
          )}
        </div>
      )}

      {/* My fantasy score */}
      <div className="mb-8 flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Your fantasy points</p>
          <p className={`text-3xl font-black ${myScore?.points_earned ? "text-yellow-400" : "text-gray-600"}`}>
            {myScore?.points_earned ?? 0}
          </p>
        </div>
        <Link href="/squad" className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
          {isPast ? "View Squad →" : "Edit Squad →"}
        </Link>
      </div>

      {/* RK9 Meta breakdown */}
      {topArchetypes.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Tournament Meta</h2>
            {tournament.rk9_url && (
              <a href={tournament.rk9_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                RK9 ↗
              </a>
            )}
          </div>
          <div className="space-y-2">
            {topArchetypes.map((arch, i) => {
              const img = imageMap.get(arch.name);
              const barWidth = Math.max(4, (arch.share / (topArchetypes[0]?.share ?? 1)) * 100);
              return (
                <div key={arch.name} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/30 p-3">
                  <span className="w-5 text-xs text-gray-600 shrink-0">{i + 1}</span>
                  {img?.image_url ? (
                    <Image src={img.image_url} alt={arch.name} width={28} height={28} className="shrink-0 object-contain" />
                  ) : (
                    <div className="w-7 h-7 shrink-0 rounded-full bg-gray-800 flex items-center justify-center text-xs">🃏</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{arch.name}</p>
                      {arch.winner && <span className="text-[9px] rounded bg-yellow-900/50 border border-yellow-400/20 px-1 py-0.5 text-yellow-300 shrink-0">🏆 WIN</span>}
                      {arch.top8 > 0 && <span className="text-[9px] rounded bg-purple-900/50 px-1 py-0.5 text-purple-300 shrink-0">Top 8 ×{arch.top8}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-gray-800">
                        <div className="h-1 rounded-full bg-yellow-400/60 transition-all" style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{arch.share}% · {arch.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fantasy deck performance (manual results) */}
      {results && results.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold">Fantasy Deck Points</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {results.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-gray-800 p-3">
                {r.deck?.image_url && (
                  <Image src={r.deck.image_url} alt={r.deck.name} width={32} height={32} className="shrink-0 object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{r.deck?.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {r.made_day2 && <span className="text-[9px] rounded bg-blue-900/50 px-1 py-0.5 text-blue-300">Day 2 +3</span>}
                    {r.top8 && <span className="text-[9px] rounded bg-purple-900/50 px-1 py-0.5 text-purple-300">Top 8 +10</span>}
                    {r.won && <span className="text-[9px] rounded bg-yellow-900/50 px-1 py-0.5 text-yellow-300">Win +25</span>}
                    {r.win_rate >= 0.6 && <span className="text-[9px] rounded bg-green-900/50 px-1 py-0.5 text-green-300">60%+ WR +20</span>}
                  </div>
                </div>
                <span className="shrink-0 font-bold text-yellow-400">{r.base_points}pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Event leaderboard */}
      {allScores && allScores.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Fantasy Leaderboard</h2>
          <div className="space-y-2">
            {allScores.map((score, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profile = profileMap.get(score.user_id) as any;
              const name = profile?.display_name ?? profile?.username ?? "Anonymous";
              const isMe = score.user_id === user.id;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div key={score.user_id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${isMe ? "border-yellow-400/30 bg-yellow-400/5" : "border-gray-800"}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-sm">{medal}</span>
                    <span className="font-medium text-sm">{name}{isMe ? " (you)" : ""}</span>
                  </div>
                  <span className="font-bold text-yellow-400">{score.points_earned}pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
