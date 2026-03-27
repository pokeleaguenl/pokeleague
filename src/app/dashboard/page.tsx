import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./logout-button";
import { PointsHistory } from "@/components/points-history";
import EventCountdown from "@/components/event-countdown";

export const dynamic = 'force-dynamic';

const RESOURCES = [
  { label: "Limitless TCG", url: "https://limitlesstcg.com", icon: "📊" },
  { label: "Trainer Hill", url: "https://trainerhill.com", icon: "🏔️" },
  { label: "Pokedata", url: "https://pokedata.ovh", icon: "📈" },
  { label: "RK9", url: "https://rk9.gg", icon: "🏟️" },
];

const tierBorder: Record<string, string> = {
  S: "border-yellow-400/70", A: "border-purple-500/70",
  B: "border-blue-500/70", C: "border-green-600/70", D: "border-gray-600/50",
};

const tierBg: Record<string, string> = {
  S: "bg-yellow-400/5", A: "bg-purple-500/5",
  B: "bg-blue-500/5", C: "bg-green-600/5", D: "bg-gray-800/30",
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const [{ data: profile }, { data: sq }, { data: upcoming }, { data: allProfiles }, { data: recentEvents }] = await Promise.all([
    supabase.from("profiles").select("display_name, username, total_points").eq("id", user.id).single(),
    supabase.from("squads").select(`
      total_points, locked, event_effect,
      active_deck:decks!squads_active_deck_id_fkey(id, name, image_url, tier, cost),
      bench1:decks!squads_bench_1_fkey(id, name, image_url, tier, cost),
      bench2:decks!squads_bench_2_fkey(id, name, image_url, tier, cost),
      bench3:decks!squads_bench_3_fkey(id, name, image_url, tier, cost),
      bench4:decks!squads_bench_4_fkey(id, name, image_url, tier, cost),
      bench5:decks!squads_bench_5_fkey(id, name, image_url, tier, cost),
      hand1:decks!squads_hand_1_fkey(id, name, image_url, tier, cost),
      hand2:decks!squads_hand_2_fkey(id, name, image_url, tier, cost),
      hand3:decks!squads_hand_3_fkey(id, name, image_url, tier, cost),
      hand4:decks!squads_hand_4_fkey(id, name, image_url, tier, cost)
    `).eq("user_id", user.id).maybeSingle(),
    supabase.from("tournaments").select("id, name, event_date")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date").limit(1).maybeSingle(),
    supabase.from("profiles").select("id, total_points").order("total_points", { ascending: false }),
    supabase.from("tournaments").select("id, name, event_date")
      .order("event_date", { ascending: false }).limit(3),
  ]);

  const lastEvent = recentEvents?.[0];
  const { data: lastScore } = lastEvent ? await supabase
    .from("league_scores").select("points_earned")
    .eq("user_id", user.id).eq("tournament_id", lastEvent.id).maybeSingle()
    : { data: null };

  const displayName = profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "Trainer";
  const rank = allProfiles ? allProfiles.findIndex((p: { id: string }) => p.id === user.id) + 1 : null;

  const norm = (v: unknown) => (Array.isArray(v) ? v[0] ?? null : v ?? null) as { id: number; name: string; image_url: string | null; tier: string; cost: number } | null;
  const squadDecks = sq ? {
    active: norm(sq.active_deck),
    bench: [norm(sq.bench1), norm(sq.bench2), norm(sq.bench3), norm(sq.bench4), norm(sq.bench5)],
    hand: [norm(sq.hand1), norm(sq.hand2), norm(sq.hand3), norm(sq.hand4)],
  } : null;

  const totalCost = squadDecks
    ? [squadDecks.active, ...squadDecks.bench, ...squadDecks.hand]
        .filter(Boolean).reduce((s, d) => s + (d!.cost ?? 0), 0)
    : 0;
  const filledSlots = squadDecks
    ? [squadDecks.active, ...squadDecks.bench, ...squadDecks.hand].filter(Boolean).length
    : 0;

  const rankLabel = rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : rank === 3 ? "🥉 #3" : rank ? `#${rank}` : "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Hey, <span className="text-yellow-400">{displayName}</span>
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Season 1 · {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats row — bigger numbers, clearer labels */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
          <p className="text-3xl font-black text-yellow-400">{profile?.total_points ?? 0}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mt-1">Season pts</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-3xl font-black text-white">{rankLabel}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mt-1">Global rank</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-3xl font-black text-white">{filledSlots}<span className="text-lg text-gray-600">/10</span></p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mt-1">
            {sq?.locked ? "🔒 Locked" : "Squad picks"}
          </p>
        </div>
      </section>

      {/* Next event — HERO */}
      {upcoming ? (
        <EventCountdown
          eventDate={upcoming.event_date}
          eventName={upcoming.name}
          eventId={upcoming.id}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-800 p-5 text-center">
          <p className="text-gray-500 text-sm">No upcoming events scheduled</p>
        </div>
      )}

      {/* Last event score callout */}
      {lastScore?.points_earned != null && lastEvent && (
        <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">Last Tournament</p>
            <p className="text-sm font-semibold text-gray-200 mt-0.5">{lastEvent.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-green-400">+{lastScore.points_earned}</p>
            <p className="text-[10px] text-gray-600">points earned</p>
          </div>
        </div>
      )}

      {/* Squad preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">My Squad</h2>
          <Link href="/squad" className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
            {sq?.locked ? "🔒 Locked" : filledSlots > 0 ? "Edit squad →" : "Build squad →"}
          </Link>
        </div>

        {!squadDecks || filledSlots === 0 ? (
          <Link href="/squad"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-10 text-center hover:border-yellow-400/40 transition-colors">
            <span className="text-4xl mb-3">🎴</span>
            <p className="font-bold text-gray-300">No squad yet</p>
            <p className="text-xs text-gray-500 mt-1">Pick 10 decks within 200pts budget</p>
            <span className="mt-4 rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-gray-900">Build Squad →</span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-gray-900/30 overflow-hidden">
            {/* Active deck — prominent */}
            <div className="p-4 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">⭐ Active — 2× points</p>
              {squadDecks.active ? (
                <div className={`flex items-center gap-3 rounded-xl border ${tierBorder[squadDecks.active.tier] || "border-gray-700"} ${tierBg[squadDecks.active.tier] || ""} p-3`}>
                  {squadDecks.active.image_url && (
                    <Image src={squadDecks.active.image_url} alt={squadDecks.active.name} width={44} height={44} className="object-contain shrink-0 drop-shadow-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{squadDecks.active.name}</p>
                    <p className="text-xs text-gray-500">Tier {squadDecks.active.tier} · {squadDecks.active.cost}pts</p>
                  </div>
                  {sq?.event_effect === "x3" && (
                    <span className="text-[9px] rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-1 text-yellow-300 font-bold shrink-0">⚡ ×3</span>
                  )}
                  <span className="shrink-0 rounded-full bg-yellow-400/15 px-2 py-1 text-[10px] font-black text-yellow-400">2×</span>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-700 p-3 text-center text-xs text-gray-600">Empty — set your Active deck</div>
              )}
            </div>

            {/* Bench */}
            <div className="p-4 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Bench — 1× each</p>
              <div className="grid grid-cols-5 gap-1.5">
                {squadDecks.bench.map((deck, i) => (
                  <div key={i} className={`flex flex-col items-center rounded-lg border p-1.5 ${deck ? `${tierBorder[deck.tier] || "border-gray-700"} bg-black/20` : "border-dashed border-gray-800"}`}>
                    {deck ? (
                      <>
                        {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={28} height={28} className="object-contain" />}
                        <p className="mt-1 text-center text-[8px] leading-tight text-gray-300 line-clamp-2">{deck.name}</p>
                      </>
                    ) : (
                      <div className="flex h-10 w-full items-center justify-center text-gray-700">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hand + budget */}
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">
                Reserve — {sq?.event_effect === "hand_boost" ? "🃏 1× Boosted!" : "0pts"}
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {squadDecks.hand.map((deck, i) => (
                  <div key={i} className={`flex flex-col items-center rounded-lg border p-1.5 opacity-50 ${deck ? `${tierBorder[deck.tier] || "border-gray-700"} bg-black/20` : "border-dashed border-gray-800"}`}>
                    {deck ? (
                      <>
                        {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={22} height={22} className="object-contain" />}
                        <p className="mt-1 text-center text-[7px] leading-tight text-gray-400 line-clamp-2">{deck.name}</p>
                      </>
                    ) : (
                      <div className="flex h-7 w-full items-center justify-center text-gray-700 text-sm">+</div>
                    )}
                  </div>
                ))}
              </div>
              {/* Budget bar */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600">Budget used</span>
                <span className={`text-[10px] font-bold ${totalCost > 190 ? "text-red-400" : totalCost > 170 ? "text-orange-400" : "text-gray-400"}`}>
                  {totalCost} / 200 pts
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${totalCost > 190 ? "bg-red-500" : totalCost > 160 ? "bg-orange-400" : "bg-yellow-400"}`}
                  style={{ width: `${Math.min((totalCost / 200) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions — 2 column, consistent height */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/squad", emoji: "🎴", label: "My Squad", sub: sq?.locked ? "🔒 Locked" : filledSlots > 0 ? `${filledSlots}/10 picks` : "Build squad" },
            { href: "/decks", emoji: "📊", label: "Meta Decks", sub: "Browse & analyse" },
            { href: "/events", emoji: "📅", label: "Events", sub: lastScore?.points_earned != null ? `+${lastScore.points_earned}pts last event` : "Season schedule" },
            { href: "/leaderboard", emoji: "🏆", label: "Leaderboard", sub: rank ? `You are ${rankLabel} globally` : "See global rankings" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/30 hover:bg-gray-900/60 transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{a.emoji}</span>
              <span className="font-bold text-sm">{a.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{a.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tournament History */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-400">Tournament History</h2>
        <PointsHistory userId={user.id} />
      </section>

      {/* Resources */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-400">Resources</h2>
        <div className="grid grid-cols-2 gap-2">
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-gray-800 p-3 hover:border-gray-600 hover:bg-gray-900/30 transition-all">
              <span className="text-lg">{r.icon}</span>
              <span className="text-sm font-medium">{r.label}</span>
              <span className="ml-auto text-gray-600 text-xs">↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
