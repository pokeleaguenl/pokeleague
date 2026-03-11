import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LeagueManager from "./league-manager";
import CopyCode from "./copy-code";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get all leagues the user is a member of
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  const leagueIds = (memberships ?? []).map((m) => m.league_id);

  const { data: leagues } = leagueIds.length > 0
    ? await supabase.from("leagues").select("*").in("id", leagueIds)
    : { data: [] };

  const globalLeague = (leagues ?? []).find((l) => l.is_global);
  const myLeagues = (leagues ?? []).filter((l) => !l.is_global);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">
        My <span className="text-yellow-400">Leagues</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Create a private league or join one with a code.</p>

      {/* Global League */}
      {globalLeague && (
        <Link href="/leagues/global"
          className="mb-6 flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 hover:border-yellow-400/60 transition-colors block">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold">🌍 Global League</p>
              <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-bold text-yellow-400">EVERYONE</span>
            </div>
            <p className="text-xs text-gray-400">All trainers, one leaderboard</p>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
      )}

      {/* Create / Join */}
      <LeagueManager />

      {/* My leagues */}
      {myLeagues.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Your Leagues</h2>
          <div className="space-y-3">
            {myLeagues.map((league) => {
              const isOwner = league.owner_id === user.id;
              return (
                <Link key={league.id} href={`/leagues/${league.code}`}
                  className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-semibold truncate">{league.name}</p>
                      <span className="text-xs shrink-0">{league.is_public ? "🌐" : "🔒"}</span>
                      {isOwner && <span className="text-[10px] rounded bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 text-yellow-400 shrink-0">Owner</span>}
                    </div>
                    <CopyCode code={league.code} />
                  </div>
                  <span className="ml-3 shrink-0 text-gray-600">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {myLeagues.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-500">
          <p className="text-2xl mb-2">🏅</p>
          <p className="font-medium text-gray-400">No leagues yet</p>
          <p className="text-sm mt-1">Create one above or join with a code</p>
        </div>
      )}
    </div>
  );
}
