import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SyncButton from "./sync-button";
import EventsSyncButton from "./events-sync-button";
import SyncVariantsButton from "./sync-variants-button";
import SeedFantasyButton from "./seed-fantasy-button";
import DeckTable from "./deck-table";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: decks },
    { count: playerCount },
    { count: squadCount },
    { count: tournamentCount },
    { data: recentTournaments },
  ] = await Promise.all([
    supabase.from("decks").select("*").order("meta_share", { ascending: false }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("squads").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("id, name, event_date, status").order("event_date", { ascending: false }).limit(5),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin <span className="text-yellow-400">Panel</span></h1>
        <p className="mt-1 text-sm text-gray-400">Manage tournaments, sync data, and monitor the league.</p>
      </div>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-yellow-400">{playerCount ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Players</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-white">{squadCount ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Squads built</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-white">{tournamentCount ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Tournaments</p>
        </div>
      </section>

      {/* Tournament management */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Tournaments</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/20 divide-y divide-gray-800">
          {(recentTournaments ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-gray-500">{t.event_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] rounded-full px-2 py-0.5 border font-semibold ${
                  t.status === "completed" ? "bg-green-900/30 border-green-500/30 text-green-400"
                  : t.status === "live" ? "bg-yellow-400/20 border-yellow-400/30 text-yellow-400"
                  : "bg-gray-800 border-gray-700 text-gray-400"
                }`}>{t.status ?? "upcoming"}</span>
                <Link href={`/admin/tournaments`}
                  className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">Edit →</Link>
              </div>
            </div>
          ))}
          <div className="px-4 py-3">
            <Link href="/admin/tournaments"
              className="text-sm text-yellow-400 hover:underline">Manage all tournaments →</Link>
          </div>
        </div>
      </section>

      {/* Data sync */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Data Sync</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-4">
          <p className="text-xs text-gray-500 mb-4">Sync external data sources into the database.</p>
          <div className="flex flex-wrap gap-3">
            <SyncButton />
            <EventsSyncButton />
            <SyncVariantsButton />
            <SeedFantasyButton />
          </div>
        </div>
      </section>

      {/* Dev tools */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Dev Tools</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/fantasy-test"
            className="rounded-xl border border-purple-700/50 bg-purple-900/20 px-4 py-2.5 text-sm font-semibold text-purple-400 hover:border-purple-500 transition-colors">
            🧪 Fantasy Scoring Test
          </Link>
          <Link href="/leaderboard"
            className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500 transition-colors">
            🏆 View Leaderboard
          </Link>
          <Link href="/events"
            className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500 transition-colors">
            📅 View Events
          </Link>
        </div>
      </section>

      {/* Deck costs table */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Deck Costs & Tiers</h2>
          <p className="text-xs text-gray-600">{(decks ?? []).length} decks</p>
        </div>
        <DeckTable decks={decks ?? []} />
      </section>
    </div>
  );
}
