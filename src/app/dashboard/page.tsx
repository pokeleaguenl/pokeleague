import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./logout-button";

const RESOURCES = [
  { label: "Limitless TCG", url: "https://limitlesstcg.com", desc: "Meta rankings & decklists" },
  { label: "Trainer Hill", url: "https://trainerhill.com", desc: "In-depth matchup analysis" },
  { label: "Pokedata", url: "https://pokedata.ovh", desc: "Player history" },
  { label: "RK9", url: "https://rk9.gg", desc: "Tournament pairings" },
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const [{ data: profile }, { data: squad }, { data: upcoming }] = await Promise.all([
    supabase.from("profiles").select("display_name, username, total_points").eq("id", user.id).single(),
    supabase.from("squads").select("total_points, locked, active_deck_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("tournaments").select("*").eq("status", "upcoming").order("event_date").limit(1).maybeSingle(),
  ]);

  const displayName = profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "Trainer";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hey, {displayName} 👋</h1>
          <p className="mt-1 text-sm text-gray-400">
            Total points: <span className="font-bold text-yellow-400">{profile?.total_points ?? 0}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Upcoming event */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Next Event</h2>
        {upcoming ? (
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
            <p className="font-semibold">{upcoming.name}</p>
            <p className="text-sm text-gray-400">{upcoming.event_date}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 p-4 text-sm text-gray-500">
            No upcoming events. Check back soon.
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/squad" className="flex flex-col rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
            <span className="text-2xl mb-1">🎴</span>
            <span className="font-semibold">My Squad</span>
            <span className="text-xs text-gray-500 mt-0.5">
              {squad?.locked ? "🔒 Locked in" : squad?.active_deck_id ? "In progress" : "Build your squad"}
            </span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
            <span className="text-2xl mb-1">🏆</span>
            <span className="font-semibold">Leaderboard</span>
            <span className="text-xs text-gray-500 mt-0.5">
              {squad?.total_points ? `${squad.total_points} pts earned` : "See the rankings"}
            </span>
          </Link>
          <Link href="/decks" className="flex flex-col rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
            <span className="text-2xl mb-1">📊</span>
            <span className="font-semibold">Meta Decks</span>
            <span className="text-xs text-gray-500 mt-0.5">Current meta & costs</span>
          </Link>
          <Link href="/how-to-score" className="flex flex-col rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
            <span className="text-2xl mb-1">❓</span>
            <span className="font-semibold">How to Score</span>
            <span className="text-xs text-gray-500 mt-0.5">Points system explained</span>
          </Link>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Resources</h2>
        <div className="space-y-2">
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-gray-800 p-3 hover:border-gray-600 transition-colors">
              <div>
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-gray-500">{r.desc}</p>
              </div>
              <span className="text-gray-600">↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
