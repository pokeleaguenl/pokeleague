import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ShareSquadButton from "./share-squad-button";

export const dynamic = 'force-dynamic';

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  NL:{name:"Netherlands",flag:"🇳🇱"},US:{name:"United States",flag:"🇺🇸"},
  GB:{name:"United Kingdom",flag:"🇬🇧"},DE:{name:"Germany",flag:"🇩🇪"},
  FR:{name:"France",flag:"🇫🇷"},ES:{name:"Spain",flag:"🇪🇸"},
  IT:{name:"Italy",flag:"🇮🇹"},JP:{name:"Japan",flag:"🇯🇵"},
  CA:{name:"Canada",flag:"🇨🇦"},AU:{name:"Australia",flag:"🇦🇺"},
  BR:{name:"Brazil",flag:"🇧🇷"},MX:{name:"Mexico",flag:"🇲🇽"},
  KR:{name:"South Korea",flag:"🇰🇷"},PL:{name:"Poland",flag:"🇵🇱"},
  PT:{name:"Portugal",flag:"🇵🇹"},BE:{name:"Belgium",flag:"🇧🇪"},
  SE:{name:"Sweden",flag:"🇸🇪"},NO:{name:"Norway",flag:"🇳🇴"},
  DK:{name:"Denmark",flag:"🇩🇰"},FI:{name:"Finland",flag:"🇫🇮"},
  CH:{name:"Switzerland",flag:"🇨🇭"},AT:{name:"Austria",flag:"🇦🇹"},
  NZ:{name:"New Zealand",flag:"🇳🇿"},ZA:{name:"South Africa",flag:"🇿🇦"},
  AR:{name:"Argentina",flag:"🇦🇷"},CL:{name:"Chile",flag:"🇨🇱"},
  CO:{name:"Colombia",flag:"🇨🇴"},IN:{name:"India",flag:"🇮🇳"},
  SG:{name:"Singapore",flag:"🇸🇬"},PH:{name:"Philippines",flag:"🇵🇭"},
};

const TIER_META: Record<string, { border: string; bg: string; text: string; label: string }> = {
  S: { border: "border-red-400/50",    bg: "bg-red-400/10",    text: "text-red-400",    label: "S" },
  A: { border: "border-orange-400/50", bg: "bg-orange-400/10", text: "text-orange-400", label: "A" },
  B: { border: "border-yellow-400/50", bg: "bg-yellow-400/10", text: "text-yellow-400", label: "B" },
  C: { border: "border-green-500/50",  bg: "bg-green-500/10",  text: "text-green-400",  label: "C" },
  D: { border: "border-gray-600/50",   bg: "bg-gray-800/20",   text: "text-gray-400",   label: "D" },
};

const RANK_TITLES: [number, string][] = [
  [1,   "🏆 Champion"],
  [3,   "🥇 Elite Trainer"],
  [10,  "⭐ Expert Trainer"],
  [25,  "🎯 Skilled Trainer"],
  [50,  "🃏 Rising Trainer"],
  [100, "🌱 Rookie Trainer"],
];
function getRankTitle(rank: number | null) {
  if (!rank) return "Trainer";
  for (const [threshold, title] of RANK_TITLES) {
    if (rank <= threshold) return title;
  }
  return "Trainer";
}

// Simple mock achievements based on data we have
function deriveAchievements(totalPoints: number, eventCount: number, bestScore: number) {
  const earned: { emoji: string; label: string; desc: string }[] = [];
  if (totalPoints >= 1)   earned.push({ emoji: "🎴", label: "First Pick",    desc: "Scored your first fantasy points" });
  if (totalPoints >= 50)  earned.push({ emoji: "🔥", label: "On Fire",       desc: "Earned 50+ season points" });
  if (totalPoints >= 200) earned.push({ emoji: "💎", label: "Diamond League",desc: "Earned 200+ season points" });
  if (eventCount >= 3)    earned.push({ emoji: "🗓️",  label: "Regular",       desc: "Scored in 3+ events" });
  if (bestScore >= 30)    earned.push({ emoji: "🏅", label: "Big Score",     desc: "30+ points from a single event" });
  return earned;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, first_name, last_name, country_code, total_points")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const isMe = me?.id === profile.id;

  const [{ data: allProfiles }, { data: squadRaw }, { data: scores }] = await Promise.all([
    supabase.from("profiles").select("id, total_points").order("total_points", { ascending: false }),
    supabase.from("squads").select(`
      total_points, locked, event_effect,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url,cost),
      bench1:decks!squads_bench_1_fkey(id,name,tier,image_url,cost),
      bench2:decks!squads_bench_2_fkey(id,name,tier,image_url,cost),
      bench3:decks!squads_bench_3_fkey(id,name,tier,image_url,cost),
      bench4:decks!squads_bench_4_fkey(id,name,tier,image_url,cost),
      bench5:decks!squads_bench_5_fkey(id,name,tier,image_url,cost),
      hand1:decks!squads_hand_1_fkey(id,name,tier,image_url,cost),
      hand2:decks!squads_hand_2_fkey(id,name,tier,image_url,cost),
      hand3:decks!squads_hand_3_fkey(id,name,tier,image_url,cost),
      hand4:decks!squads_hand_4_fkey(id,name,tier,image_url,cost)
    `).eq("user_id", profile.id).maybeSingle(),
    supabase.from("league_scores")
      .select("points_earned, tournament_id, tournaments(id, name, event_date)")
      .eq("user_id", profile.id)
      .order("points_earned", { ascending: false })
      .limit(10),
  ]);

  const rank = allProfiles ? allProfiles.findIndex(p => p.id === profile.id) + 1 : null;
  const rankTitle = getRankTitle(rank);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const norm = (v: unknown) => (Array.isArray(v) ? (v as any[])[0] ?? null : v ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sq = squadRaw as any;
  const squad = sq ? {
    locked: sq.locked,
    event_effect: sq.event_effect,
    active: norm(sq.active_deck),
    bench: [norm(sq.bench1), norm(sq.bench2), norm(sq.bench3), norm(sq.bench4), norm(sq.bench5)],
    hand: [norm(sq.hand1), norm(sq.hand2), norm(sq.hand3), norm(sq.hand4)],
  } : null;

  const displayName = profile.display_name
    ?? (`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username);
  const country = profile.country_code ? COUNTRIES[profile.country_code] : null;
  const initials = (profile.first_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase();

  const filledSlots = squad ? [squad.active, ...squad.bench, ...squad.hand].filter(Boolean).length : 0;
  const bestScore = scores ? Math.max(...scores.map((s: { points_earned: number }) => s.points_earned ?? 0), 0) : 0;
  const achievements = deriveAchievements(profile.total_points ?? 0, scores?.length ?? 0, bestScore);

  const allDecks = squad ? [squad.active, ...squad.bench, ...squad.hand].filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-10">

      {/* ── Trainer Card ── */}
      <div className="relative mb-6 rounded-2xl border border-yellow-400/20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #facc15 0%, transparent 50%), radial-gradient(circle at 80% 20%, #60a5fa 0%, transparent 50%)" }} />

        <div className="relative p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-400/30 to-yellow-600/10 text-2xl font-black text-yellow-400 shadow-lg shadow-yellow-400/20">
                  {initials}
                </div>
                {squad?.locked && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[9px]">🔒</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black leading-tight text-white">{displayName}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  @{profile.username}
                  {country && <span className="ml-2">{country.flag}</span>}
                </p>
                <p className="mt-1 text-xs font-bold text-yellow-400">{rankTitle}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isMe && (
                <Link href="/profile"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/30 transition-colors">
                  Edit
                </Link>
              )}
              <ShareSquadButton username={profile.username ?? username} />
            </div>
          </div>

          {/* Stats — trainer card style */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-yellow-400/20 bg-black/30 p-3 text-center">
              <p className="text-2xl font-black text-yellow-400">{profile.total_points ?? 0}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Season pts</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
              <p className="text-2xl font-black text-white">{rank ? `#${rank}` : "—"}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Rank</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
              <p className="text-2xl font-black text-white">{filledSlots}<span className="text-base text-gray-500">/10</span></p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Picks</p>
            </div>
          </div>

          {/* Active deck highlight */}
          {squad?.active && (
            <div className={`mt-3 flex items-center gap-3 rounded-xl border ${TIER_META[squad.active.tier]?.border ?? "border-white/10"} bg-black/30 p-3`}>
              {squad.active.image_url && (
                <Image src={squad.active.image_url} alt={squad.active.name} width={40} height={40} className="object-contain shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-400 font-black uppercase tracking-wide mb-0.5">⭐ Active · 2× points</p>
                <p className="font-bold text-white text-sm truncate">{squad.active.name}</p>
              </div>
              <span className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-black ${TIER_META[squad.active.tier]?.text ?? "text-gray-400"} ${TIER_META[squad.active.tier]?.bg ?? ""} ${TIER_META[squad.active.tier]?.border ?? ""}`}>
                Tier {squad.active.tier}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a, i) => (
              <div key={i} title={a.desc}
                className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2">
                <span className="text-base">{a.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-yellow-300">{a.label}</p>
                  <p className="text-[10px] text-gray-500">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Full squad ── */}
      {allDecks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
            Full Squad
            {squad?.locked && <span className="ml-2 text-green-400">🔒 Locked</span>}
          </h2>
          <div className="space-y-1.5">
            {/* Active */}
            {squad?.active && (
              <DeckRow deck={squad.active} zone="active" />
            )}
            {/* Bench */}
            {squad?.bench.filter(Boolean).map((d, i) => (
              <DeckRow key={i} deck={d} zone="bench" />
            ))}
            {/* Reserve */}
            {squad?.hand.filter(Boolean).map((d, i) => (
              <DeckRow key={i} deck={d} zone="reserve" />
            ))}
          </div>
        </section>
      )}

      {/* ── Event history ── */}
      {scores && scores.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Event History</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {scores.map((s: any) => {
              const t = Array.isArray(s.tournaments) ? s.tournaments[0] : s.tournaments;
              const pts = s.points_earned ?? 0;
              return (
                <Link key={s.tournament_id} href={`/events/${s.tournament_id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-800 p-3 hover:border-gray-600 transition-colors group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-yellow-400 transition-colors">{t?.name ?? "Event"}</p>
                    <p className="text-xs text-gray-500">{t?.event_date}</p>
                  </div>
                  <span className={`font-bold text-sm ${pts > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                    {pts > 0 ? `+${pts}` : "0"} pts
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeckRow({ deck, zone }: { deck: any; zone: "active" | "bench" | "reserve" }) {
  const tm = TIER_META[deck.tier] ?? TIER_META.D;
  const zoneConfig = {
    active:  { label: "2×", badge: "bg-yellow-400/20 text-yellow-400", dim: false },
    bench:   { label: "1×", badge: "bg-white/10 text-gray-500",        dim: false },
    reserve: { label: "0×", badge: "bg-gray-800 text-gray-600",        dim: true  },
  }[zone];

  return (
    <div className={`flex items-center gap-3 rounded-xl border ${tm.border} bg-black/20 px-3 py-2 ${zoneConfig.dim ? "opacity-50" : ""}`}>
      {deck.image_url && (
        <Image src={deck.image_url} alt={deck.name} width={28} height={28} className="object-contain shrink-0" />
      )}
      <span className="flex-1 text-sm font-medium text-white truncate">{deck.name}</span>
      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black ${tm.text} ${tm.bg} ${tm.border}`}>{tm.label}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${zoneConfig.badge}`}>{zoneConfig.label}</span>
    </div>
  );
}
