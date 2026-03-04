import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LiveEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Find fantasy event by tournament id
  const { data: fantasyEvent } = await supabase
    .from("fantasy_events")
    .select("*, tournament:tournaments(name, event_date, city)")
    .eq("tournament_id", parseInt(id))
    .maybeSingle();

  if (!fantasyEvent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="text-2xl mb-2">📊</p>
        <h1 className="text-xl font-bold mb-2">Live Tracking Not Available</h1>
        <p className="text-sm text-gray-400">This event doesn&apos;t have live fantasy tracking set up yet.</p>
        <Link href={`/events/${id}`} className="mt-4 inline-block text-sm text-yellow-400 hover:underline">← Back to event</Link>
      </div>
    );
  }

  const [{ data: archetypeScores }, { data: teamScores }] = await Promise.all([
    supabase.from("fantasy_archetype_scores_live")
      .select("*, archetype:fantasy_archetypes(slug, name, image_url)")
      .eq("fantasy_event_id", fantasyEvent.id)
      .order("points", { ascending: false }),
    supabase.from("fantasy_team_scores_live")
      .select("*, profile:profiles(display_name, username)")
      .eq("fantasy_event_id", fantasyEvent.id)
      .order("points", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tournament = (Array.isArray(fantasyEvent.tournament) ? fantasyEvent.tournament[0] : fantasyEvent.tournament) as any;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/events/${id}`} className="mb-4 inline-block text-xs text-gray-500 hover:text-white">← Back</Link>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{tournament?.name ?? fantasyEvent.name}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            fantasyEvent.status === "live" ? "bg-green-500/20 text-green-400" :
            fantasyEvent.status === "completed" ? "bg-gray-700 text-gray-400" :
            "bg-yellow-400/20 text-yellow-400"
          }`}>
            {fantasyEvent.status === "live" ? "🔴 Live" : fantasyEvent.status === "completed" ? "Completed" : "Upcoming"}
          </span>
        </div>
        <p className="text-sm text-gray-400">{tournament?.event_date} · {tournament?.city}</p>
      </div>

      {/* Team leaderboard */}
      {teamScores && teamScores.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Fantasy Leaderboard</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {teamScores.map((score: any, i: number) => {
              const profile = Array.isArray(score.profile) ? score.profile[0] : score.profile;
              const name = profile?.display_name ?? profile?.username ?? "Anonymous";
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div key={score.user_id} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center">{medal}</span>
                    <span className="font-medium text-sm">{name}</span>
                  </div>
                  <span className="font-bold text-yellow-400">{score.points}pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Archetype scores */}
      {archetypeScores && archetypeScores.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Archetype Performance</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {archetypeScores.map((score: any, i: number) => {
              const arch = Array.isArray(score.archetype) ? score.archetype[0] : score.archetype;
              return (
                <div key={score.id} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs text-gray-500">{i + 1}</span>
                    <Link href={`/decks/${arch?.slug}`} className="font-medium text-sm hover:text-yellow-400 transition-colors">
                      {arch?.name ?? "Unknown"}
                    </Link>
                  </div>
                  <span className="font-bold text-yellow-400">{score.points}pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(!teamScores || teamScores.length === 0) && (!archetypeScores || archetypeScores.length === 0) && (
        <div className="rounded-xl border border-gray-800 p-8 text-center text-gray-500">
          <p className="text-2xl mb-2">⏳</p>
          <p>No live data yet.</p>
          <p className="text-sm mt-1">Check back once the event is underway.</p>
        </div>
      )}
    </div>
  );
}
