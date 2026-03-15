import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import JoinLeagueForm from "./join-league-form";
import CreateLeagueButton from "./create-league-button";

export const dynamic = 'force-dynamic';

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get all leagues
  const { data: allLeagues } = await supabase
    .from("leagues")
    .select("*")
    .order("created_at", { ascending: false });

  // Get user's league memberships
  const { data: myMemberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  const myLeagueIds = new Set(myMemberships?.map(m => m.league_id) || []);
  const myLeagues = allLeagues?.filter(l => myLeagueIds.has(l.id) || l.is_global) || [];
  const otherLeagues = allLeagues?.filter(l => !myLeagueIds.has(l.id) && !l.is_global) || [];

  // Get member counts for each league
  const leagueIds = allLeagues?.map(l => l.id) || [];
  const { data: allMembers } = await supabase
    .from("league_members")
    .select("league_id")
    .in("league_id", leagueIds);

  const memberCounts = (allMembers || []).reduce((acc, m) => {
    acc[m.league_id] = (acc[m.league_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">
          <span className="text-white">Leagues</span> <span className="text-yellow-400">🏆</span>
        </h1>
        <p className="text-gray-400">
          Compete with friends and rivals across tournaments
        </p>
      </div>

      {/* Actions Row */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Join by Code */}
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
          <h2 className="text-sm font-bold text-gray-400 mb-3">Join a League</h2>
          <JoinLeagueForm />
        </div>

        {/* Create League */}
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
          <h2 className="text-sm font-bold text-gray-400 mb-3">Start Your Own</h2>
          <CreateLeagueButton />
        </div>
      </div>

      {/* My Leagues */}
      {myLeagues.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>My Leagues</span>
            <span className="text-sm font-normal text-gray-500">({myLeagues.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {myLeagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                memberCount={memberCounts[league.id] || 0}
                isMember={true}
                userId={user.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discover Leagues */}
      {otherLeagues.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>Discover</span>
            <span className="text-sm font-normal text-gray-500">({otherLeagues.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {otherLeagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                memberCount={memberCounts[league.id] || 0}
                isMember={false}
                userId={user.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {myLeagues.length === 0 && otherLeagues.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-800">
          <p className="text-6xl mb-4">🏆</p>
          <p className="text-xl font-bold mb-2">No leagues yet</p>
          <p className="text-gray-500 mb-6">Create the first one or join using a code!</p>
        </div>
      )}
    </div>
  );
}

interface LeagueCardProps {
  league: any;
  memberCount: number;
  isMember: boolean;
  userId: string;
}

function LeagueCard({ league, memberCount, isMember, userId }: LeagueCardProps) {
  const isOwner = league.owner_id === userId;

  return (
    <Link
      href={`/leagues/${league.code}`}
      className="block rounded-xl border border-white/10 bg-gray-900/50 p-6 hover:border-yellow-400/30 hover:bg-gray-900/70 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold group-hover:text-yellow-400 transition-colors line-clamp-1">
              {league.name}
            </h3>
            {league.is_global && (
              <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                GLOBAL
              </span>
            )}
          </div>
          {league.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{league.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <span className="text-gray-400">👥</span>
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        <span>•</span>
        <span>
          Created {new Date(league.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          {isMember && (
            <span className="rounded-full bg-green-400/20 border border-green-400/30 px-2 py-0.5 text-[10px] font-bold text-green-400">
              JOINED
            </span>
          )}
          {isOwner && (
            <span className="rounded-full bg-blue-400/20 border border-blue-400/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              OWNER
            </span>
          )}
        </div>
        {!league.is_global && (
          <span className="font-mono text-xs text-yellow-400/70 group-hover:text-yellow-400">
            {league.code}
          </span>
        )}
      </div>
    </Link>
  );
}
