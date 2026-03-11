import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./logout-button";

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

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const [{ data: profile }, { data: sq }, { data: upcoming }, { data: recentEvents }] = await Promise.all([
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
    supabase.from("tournaments").select("id, name, event_date, submission_deadline")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date").limit(1).maybeSingle(),
    supabase.from("tournaments").select("id, name, event_date")
      .order("event_date", { ascending: false }).limit(3),
  ]);

  const lastEvent = recentEvents?.[0];
  const { data: lastScore } = lastEvent ? await supabase
    .from("league_scores").select("points_earned")
    .eq("user_id", user.id).eq("tournament_id", lastEvent.id).maybeSingle()
    : { data: null };

  const displayName = profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "Trainer";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const norm = (v: unknown) => (Array.isArray(v) ? v[0] ?? null : v ?? null) as any;
  const squadDecks = sq ? {
    active: norm(sq.active_deck),
    bench: [norm(sq.bench1), norm(sq.bench2), norm(sq.bench3), norm(sq.bench4), norm(sq.bench5)],
    hand: [norm(sq.hand1), norm(sq.hand2), norm(sq.hand3), norm(sq.hand4)],
  } : null;

  const totalCost = squadDecks
    ? [squadDecks.active, ...squadDecks.bench, ...squadDecks.hand]
        .filter(Boolean).reduce((s, d) => s + (d.cost ?? 0), 0)
    : 0;
  const filledSlots = squadDecks
    ? [squadDecks.active, ...squadDecks.bench, ...squadDecks.hand].filter(Boolean).length
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hey, {displayName} 👋</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Season points: <span className="font-bold text-yellow-400">{profile?.total_points ?? 0} pts</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats row */}
      <section className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{profile?.total_points ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Season pts</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{lastScore?.points_earned ?? "—"}</p>
          <p className="text-xs text-gray-500 mt-0.5">Last event</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{filledSlots}/10</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {sq?.locked ? "🔒 Locked" : "Squad slots"}
          </p>
        </div>
      </section>

      {/* Next event banner */}
      {upcoming && (
        <Link href={`/events/${upcoming.id}`}
          className="mb-4 flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 hover:border-yellow-400/50 transition-colors block">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-0.5">Next Event</p>
            <p className="font-semibold">{upcoming.name}</p>
            <p className="text-xs text-gray-400">{upcoming.event_date}</p>
          </div>
          <span className="text-2xl">🗓️</span>
        </Link>
      )}

      {/* Squad preview */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">My Squad</h2>
          <Link href="/squad" className="text-xs text-yellow-400 hover:underline">
            {sq?.locked ? "🔒 Locked" : filledSlots > 0 ? "Edit →" : "Build →"}
          </Link>
        </div>

        {!squadDecks || filledSlots === 0 ? (
          <Link href="/squad"
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 p-8 text-center hover:border-yellow-400/40 transition-colors">
            <span className="text-3xl mb-2">🎴</span>
            <p className="font-semibold text-gray-300">No squad yet</p>
            <p className="text-xs text-gray-500 mt-1">Pick your 10 decks within 200pts</p>
          </Link>
        ) : (
          <div className="rounded-xl border border-white/8 bg-gray-900/30 p-4 space-y-3">
            {/* Active */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-2">⭐ Active — 2×</p>
              {squadDecks.active ? (
                <div className={`flex items-center gap-3 rounded-lg border ${tierBorder[squadDecks.active.tier] || "border-gray-700"} bg-black/20 p-2.5`}>
                  {squadDecks.active.image_url && (
                    <Image src={squadDecks.active.image_url} alt={squadDecks.active.name} width={36} height={36} className="object-contain shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{squadDecks.active.name}</p>
                    <p className="text-xs text-gray-500">{squadDecks.active.cost}pts · Tier {squadDecks.active.tier}</p>
                  </div>
                  {sq?.event_effect === "x3" && (
                    <span className="text-[9px] rounded bg-yellow-400/20 border border-yellow-400/30 px-1.5 py-0.5 text-yellow-300 shrink-0">⚡ ×3</span>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-700 p-2.5 text-center text-xs text-gray-600">Empty</div>
              )}
            </div>

            {/* Bench */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bench — 1×</p>
              <div className="grid grid-cols-5 gap-1.5">
                {squadDecks.bench.map((deck, i) => (
                  <div key={i} className={`flex flex-col items-center rounded-lg border p-1.5 ${deck ? `${tierBorder[deck.tier] || "border-gray-700"} bg-black/20` : "border-dashed border-gray-800"}`}>
                    {deck ? (
                      <>
                        {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={28} height={28} className="object-contain" />}
                        <p className="mt-1 text-center text-[8px] leading-tight text-gray-300 line-clamp-2">{deck.name}</p>
                      </>
                    ) : (
                      <div className="flex h-10 w-full items-center justify-center text-gray-700 text-lg">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hand */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                Hand — {sq?.event_effect === "hand_boost" ? "🃏 1× Boosted" : "0pts"}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {squadDecks.hand.map((deck, i) => (
                  <div key={i} className={`flex flex-col items-center rounded-lg border p-1.5 opacity-60 ${deck ? `${tierBorder[deck.tier] || "border-gray-700"} bg-black/20` : "border-dashed border-gray-800"}`}>
                    {deck ? (
                      <>
                        {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={24} height={24} className="object-contain" />}
                        <p className="mt-1 text-center text-[8px] leading-tight text-gray-400 line-clamp-2">{deck.name}</p>
                      </>
                    ) : (
                      <div className="flex h-8 w-full items-center justify-center text-gray-700 text-lg">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Budget bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">Budget</span>
                <span className={`text-[10px] font-semibold ${totalCost > 180 ? "text-red-400" : "text-gray-400"}`}>
                  {totalCost} / 200 pts
                </span>
              </div>
              <div className="h-1 rounded-full bg-gray-800">
                <div className={`h-1 rounded-full transition-all ${totalCost > 190 ? "bg-red-500" : totalCost > 160 ? "bg-orange-400" : "bg-yellow-400"}`}
                  style={{ width: `${Math.min((totalCost / 200) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/squad" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">🎴</span>
            <span className="font-semibold">Squad</span>
            <span className="text-xs text-gray-500 mt-0.5">{sq?.locked ? "🔒 Locked" : filledSlots > 0 ? `${filledSlots}/10 picks` : "Build squad"}</span>
          </Link>
          <Link href="/decks" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="font-semibold">Meta Decks</span>
            <span className="text-xs text-gray-500 mt-0.5">Browse & analyse</span>
          </Link>
          <Link href="/events" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">📅</span>
            <span className="font-semibold">Events</span>
            <span className="text-xs text-gray-500 mt-0.5">{lastScore?.points_earned != null ? `+${lastScore.points_earned}pts last event` : "Season schedule"}</span>
          </Link>
          <Link href="/leagues" className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-yellow-400/40 transition-colors">
            <span className="text-2xl mb-2">🏅</span>
            <span className="font-semibold">Leagues</span>
            <span className="text-xs text-gray-500 mt-0.5">Play with friends</span>
          </Link>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Resources</h2>
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
