import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SyncButton from "./sync-button";
import EventsSyncButton from "./events-sync-button";
import SyncVariantsButton from "./sync-variants-button";
import SeedFantasyButton from "./seed-fantasy-button";
import DeckTable from "./deck-table";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Admin auth check
  await requireAdminPage();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch comprehensive stats
  const [
    { data: decks },
    { count: playerCount },
    { count: squadCount },
    { count: tournamentCount },
    { data: recentTournaments },
    { count: standingsCount },
    { count: aliasCount },
    { count: archetypeCount },
    { count: leagueCount },
    { count: leagueMemberCount },
    { data: recentSquads },
    { data: topPlayers },
  ] = await Promise.all([
    supabase.from("decks").select("*").order("meta_share", { ascending: false }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("squads").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("id, name, event_date, status").order("event_date", { ascending: false }).limit(5),
    supabase.from("rk9_standings").select("*", { count: "exact", head: true }),
    supabase.from("fantasy_archetype_aliases").select("*", { count: "exact", head: true }),
    supabase.from("fantasy_archetypes").select("*", { count: "exact", head: true }),
    supabase.from("leagues").select("*", { count: "exact", head: true }),
    supabase.from("league_members").select("*", { count: "exact", head: true }),
    supabase.from("squads").select("user_id, total_points, updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("squads").select("user_id, total_points").order("total_points", { ascending: false }).limit(10),
  ]);

  // Fetch profiles for top players
  const topPlayerIds = topPlayers?.map(p => p.user_id) || [];
  const { data: topPlayerProfiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", topPlayerIds);

  const profileMap = new Map(topPlayerProfiles?.map(p => [p.id, p]) || []);

  // Calculate data quality stats
  const archetypesWithAliases = aliasCount && archetypeCount 
    ? Math.round((aliasCount / archetypeCount) * 100) 
    : 0;

  const { count: unknownCount } = await supabase
    .from("rk9_standings")
    .select("*", { count: "exact", head: true })
    .eq("archetype", "Unknown");

  const dataQuality = standingsCount && unknownCount !== null
    ? Math.round(((standingsCount - unknownCount) / standingsCount) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black">
          Admin <span className="text-yellow-400">Dashboard</span>
        </h1>
        <p className="mt-2 text-gray-400">
          Platform overview and management tools
        </p>
      </div>

      {/* Key Metrics */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Platform Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Players"
            value={playerCount ?? 0}
            icon="👥"
            color="yellow"
          />
          <StatCard
            label="Active Squads"
            value={squadCount ?? 0}
            icon="⚡"
            color="blue"
          />
          <StatCard
            label="Tournaments"
            value={tournamentCount ?? 0}
            icon="🏆"
            color="purple"
          />
          <StatCard
            label="Leagues"
            value={leagueCount ?? 0}
            icon="🎯"
            color="green"
          />
        </div>
      </section>

      {/* Data Quality */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Data Quality
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Tournament Data</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">
              {standingsCount?.toLocaleString() ?? 0}
            </p>
            <p className="text-xs text-gray-500">Total standings entries</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Classified</span>
                <span className={`font-bold ${dataQuality >= 90 ? 'text-green-400' : dataQuality >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {dataQuality}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Archetype Coverage</p>
              <span className="text-2xl">🎴</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">
              {archetypeCount ?? 0}
            </p>
            <p className="text-xs text-gray-500">Total archetypes</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">With aliases</span>
                <span className="font-bold text-blue-400">
                  {aliasCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">League Activity</p>
              <span className="text-2xl">🎮</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">
              {leagueMemberCount ?? 0}
            </p>
            <p className="text-xs text-gray-500">Total league members</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Avg per league</span>
                <span className="font-bold text-purple-400">
                  {leagueCount && leagueMemberCount ? Math.round(leagueMemberCount / leagueCount) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Tournaments */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
              Recent Tournaments
            </h2>
            <Link href="/admin/tournaments" className="text-sm text-yellow-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentTournaments && recentTournaments.length > 0 ? (
              recentTournaments.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-900/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.event_date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    t.status === "completed" ? "bg-green-400/20 text-green-400 border border-green-400/30" : 
                    t.status === "upcoming" ? "bg-blue-400/20 text-blue-400 border border-blue-400/30" : 
                    "bg-gray-800 text-gray-400"
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No tournaments yet</p>
            )}
          </div>
        </section>

        {/* Top Players */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
              Top Players
            </h2>
          </div>
          <div className="space-y-2">
            {topPlayers && topPlayers.length > 0 ? (
              topPlayers.slice(0, 5).map((player, i) => {
                const profile = profileMap.get(player.user_id);
                return (
                  <div key={player.user_id} className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 ${
                        i === 0 ? 'text-yellow-400' : 
                        i === 1 ? 'text-gray-400' :
                        i === 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium text-sm">
                        {profile?.display_name || profile?.username || 'Unknown'}
                      </span>
                    </div>
                    <span className="font-bold text-yellow-400 text-sm">
                      {player.total_points} pts
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No player data yet</p>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Admin Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SyncButton />
          <EventsSyncButton />
          <SyncVariantsButton />
          <SeedFantasyButton />
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/admin/score-tournament" 
            className="block rounded-lg border border-white/10 bg-gray-900/50 p-4 hover:bg-gray-900/70 hover:border-yellow-400/30 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎯</span>
              <p className="font-semibold group-hover:text-yellow-400 transition-colors">Score Tournament</p>
            </div>
            <p className="text-xs text-gray-500">Manual scoring interface</p>
          </Link>
          
          <Link href="/admin/squads"
            className="block rounded-lg border border-white/10 bg-gray-900/50 p-4 hover:bg-gray-900/70 hover:border-yellow-400/30 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚔️</span>
              <p className="font-semibold group-hover:text-yellow-400 transition-colors">View Squads</p>
            </div>
            <p className="text-xs text-gray-500">See all player squads</p>
          </Link>

          <Link href="/admin/tournaments"
            className="block rounded-lg border border-white/10 bg-gray-900/50 p-4 hover:bg-gray-900/70 hover:border-yellow-400/30 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏆</span>
              <p className="font-semibold group-hover:text-yellow-400 transition-colors">Tournaments</p>
            </div>
            <p className="text-xs text-gray-500">Manage all tournaments</p>
          </Link>
        </div>
      </section>

      {/* Decks Table */}
      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Deck Management
        </h2>
        <DeckTable decks={decks ?? []} />
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'yellow' | 'blue' | 'purple' | 'green';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = {
    yellow: 'border-yellow-400/30 bg-yellow-400/10',
    blue: 'border-blue-400/30 bg-blue-400/10',
    purple: 'border-purple-400/30 bg-purple-400/10',
    green: 'border-green-400/30 bg-green-400/10',
  };

  const textColors = {
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <div className={`rounded-xl border ${colors[color]} p-6`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-4xl font-black ${textColors[color]}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
