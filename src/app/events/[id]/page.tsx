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

  // Get all deck results for this tournament
  const { data: results } = await supabase
    .from("tournament_results")
    .select("*, deck:decks(id, name, image_url, tier)")
    .eq("tournament_id", id)
    .order("base_points", { ascending: false });

  // Get user's score for this event
  const { data: myScore } = await supabase
    .from("league_scores")
    .select("points_earned")
    .eq("user_id", user.id)
    .eq("tournament_id", id)
    .maybeSingle();

  // Get all scores for leaderboard
  const { data: allScores } = await supabase
    .from("league_scores")
    .select("user_id, points_earned")
    .eq("tournament_id", id)
    .order("points_earned", { ascending: false });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username");

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Adjacent events for navigation
  const { data: allTournaments } = await supabase
    .from("tournaments").select("id, name").order("event_date");
  const idx = (allTournaments ?? []).findIndex((t) => t.id === parseInt(id));
  const prevEvent = idx > 0 ? allTournaments![idx - 1] : null;
  const nextEvent = idx >= 0 && idx < (allTournaments ?? []).length - 1 ? allTournaments![idx + 1] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Back + navigation */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/events" className="text-gray-500 hover:text-white">← All Events</Link>
        <div className="flex gap-3">
          {prevEvent && <Link href={`/events/${prevEvent.id}`} className="text-gray-500 hover:text-yellow-400">← Prev</Link>}
          {nextEvent && <Link href={`/events/${nextEvent.id}`} className="text-gray-500 hover:text-yellow-400">Next →</Link>}
        </div>
      </div>

      <h1 className="mb-1 text-3xl font-bold">{tournament.name}</h1>
      <p className="mb-6 text-sm text-gray-400">{tournament.event_date} · {tournament.format}</p>

      {/* My score */}
      <div className="mb-8 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Your points this event</p>
          <p className="text-3xl font-bold text-yellow-400">{myScore?.points_earned ?? 0}</p>
        </div>
        <Link href="/squad" className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300">
          View Squad →
        </Link>
      </div>

      {/* Event leaderboard */}
      {allScores && allScores.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Event Leaderboard</h2>
          <div className="space-y-2">
            {allScores.map((score, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profile = profileMap.get(score.user_id) as any;
              const name = profile?.display_name ?? profile?.username ?? "Anonymous";
              const isMe = score.user_id === user.id;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div key={score.user_id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${isMe ? "border-yellow-400/30 bg-yellow-400/5" : "border-gray-800"}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center">{medal}</span>
                    <span className="font-medium">{name}{isMe ? " (you)" : ""}</span>
                  </div>
                  <span className="font-bold text-yellow-400">{score.points_earned}pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Deck results */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Deck Performance</h2>
        {!results || results.length === 0 ? (
          <p className="text-gray-500 text-sm">No results logged yet for this event.</p>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {results.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-gray-800 p-3">
                {r.deck?.image_url && (
                  <Image src={r.deck.image_url} alt={r.deck.name} width={32} height={32} className="shrink-0 object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{r.deck?.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {r.made_day2 && <span className="text-[9px] rounded bg-blue-900/50 px-1 py-0.5 text-blue-300">Day 2 +3</span>}
                    {r.top8 && <span className="text-[9px] rounded bg-purple-900/50 px-1 py-0.5 text-purple-300">Top 8 +10</span>}
                    {r.won && <span className="text-[9px] rounded bg-yellow-900/50 px-1 py-0.5 text-yellow-300">Winner +25</span>}
                    {r.win_rate >= 60 && <span className="text-[9px] rounded bg-green-900/50 px-1 py-0.5 text-green-300">60%+ WR +20</span>}
                  </div>
                </div>
                <span className="shrink-0 font-bold text-yellow-400">{r.base_points}pts</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
