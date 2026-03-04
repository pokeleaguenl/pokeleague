import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  NL: { name: "Netherlands", flag: "🇳🇱" }, US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" }, DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" }, ES: { name: "Spain", flag: "🇪🇸" },
  IT: { name: "Italy", flag: "🇮🇹" }, JP: { name: "Japan", flag: "🇯🇵" },
  CA: { name: "Canada", flag: "🇨🇦" }, AU: { name: "Australia", flag: "🇦🇺" },
  BR: { name: "Brazil", flag: "🇧🇷" }, MX: { name: "Mexico", flag: "🇲🇽" },
  KR: { name: "South Korea", flag: "🇰🇷" }, PL: { name: "Poland", flag: "🇵🇱" },
  PT: { name: "Portugal", flag: "🇵🇹" }, BE: { name: "Belgium", flag: "🇧🇪" },
  SE: { name: "Sweden", flag: "🇸🇪" }, NO: { name: "Norway", flag: "🇳🇴" },
  DK: { name: "Denmark", flag: "🇩🇰" }, FI: { name: "Finland", flag: "🇫🇮" },
  CH: { name: "Switzerland", flag: "🇨🇭" }, AT: { name: "Austria", flag: "🇦🇹" },
  NZ: { name: "New Zealand", flag: "🇳🇿" }, ZA: { name: "South Africa", flag: "🇿🇦" },
  AR: { name: "Argentina", flag: "🇦🇷" }, CL: { name: "Chile", flag: "🇨🇱" },
  CO: { name: "Colombia", flag: "🇨🇴" }, IN: { name: "India", flag: "🇮🇳" },
  SG: { name: "Singapore", flag: "🇸🇬" }, PH: { name: "Philippines", flag: "🇵🇭" },
};

const tierColors: Record<string, string> = {
  S: "border-yellow-400 bg-yellow-400/10",
  A: "border-purple-500 bg-purple-500/10",
  B: "border-blue-500 bg-blue-500/10",
  C: "border-green-600 bg-green-600/10",
  D: "border-gray-600 bg-gray-600/10",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeckCard({ deck, isActive }: { deck: any; isActive?: boolean }) {
  if (!deck) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 ${isActive ? "h-28 w-20" : "h-20 w-14"}`}>
        <span className="text-gray-700 text-xs">Empty</span>
      </div>
    );
  }
  const colors = tierColors[deck.tier] || "border-gray-700 bg-gray-800/10";
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border ${colors} p-2 ${isActive ? "h-28 w-20" : "h-20 w-14"}`}>
      {deck.image_url && (
        <Image src={deck.image_url} alt={deck.name}
          width={isActive ? 44 : 30} height={isActive ? 44 : 30} className="object-contain" />
      )}
      <p className="mt-1 text-center text-[9px] leading-tight line-clamp-2 text-gray-300">{deck.name}</p>
      {isActive && <p className="text-[9px] text-yellow-400 font-semibold mt-0.5">1.5×</p>}
    </div>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, first_name, last_name, country_code, total_points")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const { data: squadRaw } = await supabase
    .from("squads")
    .select(`
      total_points, locked,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url,cost),
      bench1:decks!squads_bench_1_fkey(id,name,tier,image_url,cost),
      bench2:decks!squads_bench_2_fkey(id,name,tier,image_url,cost),
      bench3:decks!squads_bench_3_fkey(id,name,tier,image_url,cost),
      bench4:decks!squads_bench_4_fkey(id,name,tier,image_url,cost),
      bench5:decks!squads_bench_5_fkey(id,name,tier,image_url,cost)
    `)
    .eq("user_id", profile.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sq = squadRaw as any;
  const squad = sq ? {
    ...sq,
    active_deck: Array.isArray(sq.active_deck) ? sq.active_deck[0] ?? null : sq.active_deck,
    bench1: Array.isArray(sq.bench1) ? sq.bench1[0] ?? null : sq.bench1,
    bench2: Array.isArray(sq.bench2) ? sq.bench2[0] ?? null : sq.bench2,
    bench3: Array.isArray(sq.bench3) ? sq.bench3[0] ?? null : sq.bench3,
    bench4: Array.isArray(sq.bench4) ? sq.bench4[0] ?? null : sq.bench4,
    bench5: Array.isArray(sq.bench5) ? sq.bench5[0] ?? null : sq.bench5,
  } : null;

  const displayName = profile.display_name ?? (`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username);
  const country = profile.country_code ? COUNTRIES[profile.country_code] : null;

  const initials = (profile.first_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Avatar + Info */}
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-2xl font-bold text-yellow-400 border border-yellow-400/30">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          {country && (
            <p className="mt-0.5 text-sm text-gray-400">
              {country.flag} {country.name}
            </p>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
        <p className="text-3xl font-bold text-yellow-400">{profile.total_points ?? 0}</p>
        <p className="text-sm text-gray-400">Fantasy points</p>
      </div>

      {/* Squad */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-200">Current Squad</h2>
          {squad?.locked && <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">🔒 Locked in</span>}
        </div>

        {!squad || (!squad.active_deck && !squad.bench1) ? (
          <p className="text-sm text-gray-500 text-center py-4">No squad set yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Active */}
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Active</p>
              <DeckCard deck={squad.active_deck} isActive />
            </div>
            {/* Bench */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Bench</p>
              <div className="flex gap-2 justify-center">
                {[squad.bench1, squad.bench2, squad.bench3, squad.bench4, squad.bench5].map((d, i) => (
                  <DeckCard key={i} deck={d} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
