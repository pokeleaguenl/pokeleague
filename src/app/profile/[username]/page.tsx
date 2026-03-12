import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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

const tierBorder: Record<string, string> = {
  S:"border-yellow-400/70 bg-yellow-400/5",
  A:"border-purple-500/70 bg-purple-500/5",
  B:"border-blue-500/70 bg-blue-500/5",
  C:"border-green-600/70 bg-green-600/5",
  D:"border-gray-600/50 bg-gray-800/20",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeckCard({ deck, isActive, isHand }: { deck: any; isActive?: boolean; isHand?: boolean }) {
  const border = deck ? (tierBorder[deck.tier] || "border-gray-700") : "border-dashed border-gray-800";
  const size = isActive ? 52 : isHand ? 28 : 36;
  const w = isActive ? "w-24" : isHand ? "w-14" : "w-16";
  const h = isActive ? "h-32" : isHand ? "h-20" : "h-24";
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border ${border} p-1.5 ${w} ${h} ${isHand ? "opacity-60" : ""}`}>
      {deck ? (
        <>
          {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={size} height={size} className="object-contain shrink-0" />}
          <p className="mt-0.5 text-center text-[8px] leading-tight line-clamp-2 text-gray-300">{deck.name}</p>
          {isActive && <p className="text-[8px] text-yellow-400 font-bold mt-0.5">⭐ 2×</p>}
        </>
      ) : (
        <span className="text-gray-700 text-xs">—</span>
      )}
    </div>
  );
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

  // Get leaderboard rank
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, total_points")
    .order("total_points", { ascending: false });
  const rank = allProfiles ? allProfiles.findIndex(p => p.id === profile.id) + 1 : null;

  const [{ data: squadRaw }, { data: scores }] = await Promise.all([
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
    supabase.from("league_scores")
      .select("tournament_id", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

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

  const filledSlots = squad
    ? [squad.active, ...squad.bench, ...squad.hand].filter(Boolean).length
    : 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">

      {/* Header */}
      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-white/8 bg-gray-900/40 p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/30 to-yellow-600/10 border border-yellow-400/30 text-2xl font-black text-yellow-400 shadow-lg shadow-yellow-400/10">
                {initials}
              </div>
              {squad?.locked && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[9px]">🔒</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black leading-tight">{displayName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                @{profile.username}
                {country && <span className="ml-2">{country.flag} {country.name}</span>}
              </p>
            </div>
          </div>
          {isMe && (
            <Link href="/profile"
              className="rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex-shrink-0">
              Edit profile
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{profile.total_points ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Season pts</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
            <p className="text-2xl font-black text-white">
              {rank ? `#${rank}` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Global rank</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
            <p className="text-2xl font-black text-white">{filledSlots}/10</p>
            <p className="text-xs text-gray-500 mt-0.5">Squad slots</p>
          </div>
        </div>
      </div>

      {/* Squad */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Squad</h2>
          {squad?.locked && <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">🔒 Locked</span>}
        </div>

        {!squad || filledSlots === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 py-8 text-center text-gray-600 text-sm">
            No squad built yet
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-gray-900/20 p-4 space-y-4">
            {/* Active */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-2">⭐ Active — 2×</p>
              <div className="flex justify-center">
                <DeckCard deck={squad.active} isActive />
              </div>
            </div>

            {/* Bench */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bench — 1×</p>
              <div className="flex gap-1.5 justify-center">
                {squad.bench.map((d, i) => <DeckCard key={i} deck={d} />)}
              </div>
            </div>

            {/* Hand */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Hand — 0pts</p>
              <div className="flex gap-1.5 justify-center">
                {squad.hand.map((d, i) => <DeckCard key={i} deck={d} isHand />)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Event history */}
      {scores && scores.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Event History</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {scores.map((s: any) => {
              const t = Array.isArray(s.tournaments) ? s.tournaments[0] : s.tournaments;
              return (
                <Link key={s.tournament_id} href={`/events/${s.tournament_id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-800 p-3 hover:border-gray-600 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{t?.name ?? "Event"}</p>
                    <p className="text-xs text-gray-500">{t?.event_date}</p>
                  </div>
                  <span className="font-bold text-yellow-400">+{s.points_earned}pts</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
