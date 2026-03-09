import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./logout-button";

const RESOURCES = [
  { label: "Limitless TCG", url: "https://limitlesstcg.com", icon: "📊" },
  { label: "Trainer Hill", url: "https://trainerhill.com", icon: "🏔️" },
  { label: "Pokedata", url: "https://pokedata.ovh", icon: "📈" },
  { label: "RK9", url: "https://rk9.gg", icon: "🏟️" },
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const [{ data: profile }, { data: squad }, { data: upcoming }, { data: recentEvents }] = await Promise.all([
    supabase.from("profiles").select("display_name, username, total_points").eq("id", user.id).single(),
    supabase.from("squads").select("total_points, locked, active_deck_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("tournaments").select("*").eq("status", "upcoming").order("event_date").limit(1).maybeSingle(),
    supabase.from("tournaments").select("id, name, event_date").order("event_date", { ascending: false }).limit(3),
  ]);

  // Get user's score for the most recent event
  const lastEvent = recentEvents?.[0];
  const { data: lastScore } = lastEvent ? await supabase
    .from("league_scores")
    .select("points_earned")
    .eq("user_id", user.id)
    .eq("tournament_id", lastEvent.id)
    .maybeSingle() : { data: null };

  const displayName = profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "Trainer";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hey, {displayName} 👋</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Total: <span className="font-bold text-yellow-400">{profile?.total_points ?? 0} pts</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Status bar */}
      <section className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{profile?.total_points ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total pts</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{lastScore?.points_earned ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Last event</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">
            {squad?.locked ? "🔒" : squad?.active_deck_id ? "⚡" : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {squad?.locked ? "Locked" : squad?.active_deck_id ? "In progress" : "No squad"}
          </p>
        </div>
      </section>

      {/* Upcoming event banner */}
      {upcoming && (
        <Link href={`/events/${upcoming.id}`} className="mb-4 flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 hover:border-yellow-400/50 transition-colors block">
          <div>
            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-0.5">Next Event</p>
            <p className="font-semibold">{upcoming.name}</p>
            <p className="text-xs text-gray-400">{upcoming.event_date}</p>
          </div>
          <span className="text-2xl">🗓️</span>
        </Link>
      )}

      {/* Main actions */}
      <section className="mb-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/squad" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">🎴</span>
            <span className="font-semibold">Pick Squad</span>
            <span className="text-xs text-gray-500 mt-0.5">
              {squad?.locked ? "🔒 Locked in" : squad?.active_deck_id ? "Edit squad" : "Build your squad"}
            </span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">🏆</span>
            <span className="font-semibold">Leaderboard</span>
            <span className="text-xs text-gray-500 mt-0.5">Global rankings</span>
          </Link>
          <Link href="/events" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="font-semibold">Points</span>
            <span className="text-xs text-gray-500 mt-0.5">
              {lastScore?.points_earned != null ? `+${lastScore.points_earned}pts last event` : "View event scores"}
            </span>
          </Link>
          <Link href="/leagues" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">🏅</span>
            <span className="font-semibold">Leagues</span>
            <span className="text-xs text-gray-500 mt-0.5">Play with friends</span>
          </Link>
        </div>
      </section>

      {/* Schedule */}
      {recentEvents && recentEvents.length > 0 && (
        <section className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Schedule</h2>
            <Link href="/events" className="text-xs text-yellow-400 hover:underline">See all →</Link>
          </div>
          <div className="space-y-2">
            {recentEvents.map((t) => (
              <Link key={t.id} href={`/events/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-800 p-3 hover:border-gray-600 transition-colors">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-gray-500">{t.event_date}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Resources */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Resources</h2>
        <div className="grid grid-cols-2 gap-2">
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-800 p-3 hover:border-gray-600 transition-colors">
              <span>{r.icon}</span>
              <span className="text-sm font-medium">{r.label}</span>
              <span className="ml-auto text-gray-600 text-xs">↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
