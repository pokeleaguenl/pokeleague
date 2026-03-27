import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LeagueActions from "./league-actions";

export const dynamic = 'force-dynamic';

interface Deck { id: number; name: string; tier: string; image_url: string | null; }
const tierBorder: Record<string, string> = {
  S: "border-yellow-400/70", A: "border-purple-500/70",
  B: "border-blue-500/70", C: "border-green-600/70", D: "border-gray-600/50",
};

export default async function LeaguePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: league } = await supabase
    .from("leagues").select("*").eq("code", code.toUpperCase()).single();
  if (!league) notFound();

  const { data: membership } = await supabase.from("league_members")
    .select("user_id").eq("league_id", league.id).eq("user_id", user.id).maybeSingle();
  if (!membership && !league.is_global) redirect("/leagues");

  const { data: members } = await supabase.from("league_members")
    .select("user_id").eq("league_id", league.id);
  const memberIds = (members ?? []).map((m) => m.user_id);

  const [{ data: squads }, { data: profiles }, { data: recentScores }] = await Promise.all([
    supabase.from("squads").select(`
      user_id, total_points, locked,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url),
      bench1:decks!squads_bench_1_fkey(id,name,tier,image_url),
      bench2:decks!squads_bench_2_fkey(id,name,tier,image_url),
      bench3:decks!squads_bench_3_fkey(id,name,tier,image_url),
      bench4:decks!squads_bench_4_fkey(id,name,tier,image_url),
      bench5:decks!squads_bench_5_fkey(id,name,tier,image_url)
    `).in("user_id", memberIds).order("total_points", { ascending: false }),
    supabase.from("profiles").select("id, display_name, username").in("id", memberIds),
    supabase.from("league_scores")
      .select("user_id, tournament_id, points_earned")
      .in("user_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .order("tournament_id", { ascending: false })
      .limit(30),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const squadMap = new Map((squads ?? []).map((s) => [s.user_id, s]));

  // Fetch tournament names for activity feed
  const tournamentIds = [...new Set((recentScores ?? []).map(s => s.tournament_id))];
  const { data: tournaments } = tournamentIds.length > 0
    ? await supabase.from("rk9_tournaments").select("id, name").in("id", tournamentIds)
    : { data: [] };
  const tournamentMap = new Map((tournaments ?? []).map(t => [t.id, t.name as string]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const norm = (v: unknown) => (Array.isArray(v) ? (v as any[])[0] ?? null : v ?? null);

  const isOwner = league.owner_id === user.id;

  // Sort: members with squads by points, then members without squads
  const sortedMembers = [...memberIds].sort((a, b) => {
    const sa = squadMap.get(a);
    const sb = squadMap.get(b);
    return (sb?.total_points ?? -1) - (sa?.total_points ?? -1);
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{league.name}</h1>
              {league.is_global && <span className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-bold text-yellow-400">GLOBAL</span>}
              {!league.is_global && <span className="rounded font-mono text-sm text-yellow-400 bg-gray-900 border border-gray-700 px-2 py-0.5">{league.code}</span>}
            </div>
            <p className="text-sm text-gray-400">{memberIds.length} member{memberIds.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Owner actions / Invite */}
      {!league.is_global && (
        <LeagueActions
          code={league.code}
          isOwner={isOwner}
          leagueId={league.id}
          userId={user.id}
        />
      )}

      {/* Recent Activity Feed */}
      {recentScores && recentScores.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentScores.slice(0, 10).map((score, i) => {
              const profile = profileMap.get(score.user_id) as { display_name?: string; username?: string } | undefined;
              const name = profile?.display_name ?? profile?.username ?? "Anonymous";
              const tournamentName = tournamentMap.get(score.tournament_id) ?? `Tournament #${score.tournament_id}`;
              const isMe = score.user_id === user.id;
              return (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${isMe ? "border-yellow-400/20 bg-yellow-400/5" : "border-gray-800 bg-gray-900/20"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">⚡</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-white truncate">{name}</span>
                      <span className="text-gray-500 text-xs"> scored at </span>
                      <span className="text-xs text-gray-400 truncate">{tournamentName}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 ml-3 text-sm font-black ${score.points_earned > 0 ? "text-green-400" : "text-gray-500"}`}>
                    {score.points_earned > 0 ? "+" : ""}{score.points_earned}pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3 mt-6">
        {sortedMembers.map((memberId, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const squad = squadMap.get(memberId) as any;
          const profile = profileMap.get(memberId) as { display_name?: string; username?: string } | undefined;
          const name = profile?.display_name ?? profile?.username ?? "Anonymous";
          const isMe = memberId === user.id;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

          const bench = squad ? [
            norm(squad.bench1), norm(squad.bench2), norm(squad.bench3),
            norm(squad.bench4), norm(squad.bench5)
          ] as (Deck | null)[] : [];

          return (
            <div key={memberId}
              className={`rounded-xl border p-4 transition-colors ${isMe ? "border-yellow-400/40 bg-yellow-400/5" : "border-gray-800 bg-gray-900/20"}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medal}</span>
                  <div>
                    <p className="font-semibold">{name}{isMe ? " (you)" : ""}</p>
                    <p className="text-xs text-gray-500">
                      {squad?.locked ? "🔒 Locked in" : squad?.active_deck ? "⚡ In progress" : "No squad yet"}
                    </p>
                  </div>
                </div>
                <p className={`text-xl font-bold ${squad?.total_points > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                  {squad?.total_points ?? 0}pts
                </p>
              </div>

              {squad ? (
                <div className="space-y-2">
                  {/* Active */}
                  <div className="flex justify-center">
                    <MiniCard deck={norm(squad.active_deck)} isActive />
                  </div>
                  {/* Bench */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {bench.map((d, j) => <MiniCard key={j} deck={d} />)}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-800 py-4 text-center text-xs text-gray-600">
                  No squad built yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCard({ deck, isActive }: { deck: Deck | null; isActive?: boolean }) {
  const border = deck ? (tierBorder[deck.tier] || "border-gray-700") : "border-gray-800";
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border ${border} bg-black/20 p-1.5 ${isActive ? "w-24 mx-auto" : ""}`}>
      {deck ? (
        <>
          {deck.image_url && (
            <Image src={deck.image_url} alt={deck.name}
              width={isActive ? 36 : 24} height={isActive ? 36 : 24}
              className="object-contain" />
          )}
          <p className="mt-0.5 text-center text-[8px] leading-tight line-clamp-2 text-gray-300">{deck.name}</p>
          {isActive && <p className="text-[8px] text-yellow-400 font-semibold">Active ⭐</p>}
        </>
      ) : (
        <div className="flex h-8 w-full items-center justify-center">
          <span className="text-gray-700 text-xs">—</span>
        </div>
      )}
    </div>
  );
}
