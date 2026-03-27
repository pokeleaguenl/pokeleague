import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic';

const COUNTRIES: Record<string, string> = {
  NL:"🇳🇱",US:"🇺🇸",GB:"🇬🇧",DE:"🇩🇪",FR:"🇫🇷",ES:"🇪🇸",IT:"🇮🇹",JP:"🇯🇵",
  CA:"🇨🇦",AU:"🇦🇺",BR:"🇧🇷",MX:"🇲🇽",KR:"🇰🇷",PL:"🇵🇱",PT:"🇵🇹",BE:"🇧🇪",
  SE:"🇸🇪",NO:"🇳🇴",DK:"🇩🇰",FI:"🇫🇮",CH:"🇨🇭",AT:"🇦🇹",NZ:"🇳🇿",ZA:"🇿🇦",
  AR:"🇦🇷",CL:"🇨🇱",CO:"🇨🇴",IN:"🇮🇳",SG:"🇸🇬",PH:"🇵🇭",
};

const tierBorder: Record<string, string> = {
  S:"border-yellow-400/60",A:"border-purple-500/60",
  B:"border-blue-500/60",C:"border-green-600/60",D:"border-gray-600/40",
};

type Profile = { id: string; display_name: string | null; username: string | null; total_points: number; country_code: string | null };
type DeckRef = { id: number; name: string; tier: string; image_url: string | null } | null;

const podiumConfig = [
  { medal: "🥇", borderClass: "border-yellow-400/50", bgClass: "bg-yellow-400/5", glowClass: "shadow-yellow-400/10", ptColor: "text-yellow-400", size: "large" },
  { medal: "🥈", borderClass: "border-gray-400/40", bgClass: "bg-gray-400/5", glowClass: "shadow-gray-400/10", ptColor: "text-gray-300", size: "medium" },
  { medal: "🥉", borderClass: "border-orange-600/40", bgClass: "bg-orange-600/5", glowClass: "shadow-orange-600/10", ptColor: "text-orange-400", size: "medium" },
];

export default async function Leaderboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: squads }, { data: profiles }] = await Promise.all([
    supabase.from("squads").select(`
      user_id, total_points, locked,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url),
      bench1:decks!squads_bench_1_fkey(id,name,tier,image_url),
      bench2:decks!squads_bench_2_fkey(id,name,tier,image_url),
      bench3:decks!squads_bench_3_fkey(id,name,tier,image_url),
      bench4:decks!squads_bench_4_fkey(id,name,tier,image_url),
      bench5:decks!squads_bench_5_fkey(id,name,tier,image_url)
    `).order("total_points", { ascending: false }),
    supabase.from("profiles").select("id, display_name, username, total_points, country_code"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: Profile) => [p.id, p]));
  const norm = (v: unknown): DeckRef => (Array.isArray(v) ? (v as DeckRef[])[0] ?? null : (v as DeckRef) ?? null);
  const ranked = (squads ?? []).map((s) => ({
    ...s,
    active_deck: norm(s.active_deck),
    bench: [norm(s.bench1), norm(s.bench2), norm(s.bench3), norm(s.bench4), norm(s.bench5)],
  }));

  const myRank = user ? ranked.findIndex((s) => s.user_id === user.id) : -1;
  const topScore = ranked[0]?.total_points ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2">
        <h1 className="text-4xl font-black tracking-tight">
          Leader<span className="text-yellow-400">board</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Season 1 global rankings · {ranked.length} trainer{ranked.length !== 1 ? "s" : ""}</p>
      </div>

      {myRank >= 0 && (
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-0.5">Your Standing</p>
            <p className="text-sm text-gray-300">
              {ranked[myRank]?.total_points ?? 0} pts ·{" "}
              {topScore > 0 ? `${Math.round(((ranked[myRank]?.total_points ?? 0) / topScore) * 100)}% of leader` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-yellow-400">#{myRank + 1}</span>
            <span className="text-sm text-gray-500">of {ranked.length}</span>
          </div>
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 p-16 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-bold text-gray-400 text-lg">No squads yet — be the first!</p>
          <Link href="/squad" className="mt-5 inline-block rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
            Build Squad →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((squad, i) => {
            const profile = profileMap.get(squad.user_id) as Profile | undefined;
            const name = profile?.display_name ?? profile?.username ?? "Anonymous";
            const isMe = user?.id === squad.user_id;
            const profileHref = profile?.username ? `/profile/${profile.username}` : null;
            const flag = profile?.country_code ? COUNTRIES[profile.country_code] : null;
            const isPodium = i < 3;
            const pod = isPodium ? podiumConfig[i] : null;

            return (
              <div
                key={squad.user_id}
                className={`rounded-2xl border transition-all ${
                  isMe
                    ? "border-yellow-400/40 bg-yellow-400/5"
                    : isPodium
                    ? `${pod!.borderClass} ${pod!.bgClass} shadow-xl ${pod!.glowClass}`
                    : "border-gray-800 bg-gray-900/20"
                } ${i === 0 ? "p-6" : "p-4"}`}
              >
                {/* #1 gets a special hero layout */}
                {i === 0 ? (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-5xl">🥇</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mt-1">Champion</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {profileHref ? (
                              <Link href={profileHref} className="text-xl font-black hover:text-yellow-400 transition-colors">{name}</Link>
                            ) : (
                              <span className="text-xl font-black">{name}</span>
                            )}
                            {isMe && <span className="text-[10px] rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-yellow-400 font-bold">you</span>}
                            {flag && <span className="text-lg">{flag}</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{profile?.username ? `@${profile.username}` : ""}
                            {squad.locked ? " · 🔒 locked" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-yellow-400">{squad.total_points}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {squad.active_deck ? (
                        <div className={`flex flex-col items-center rounded-xl border-2 ${tierBorder[squad.active_deck.tier] || "border-gray-700"} bg-black/20 p-2 w-16 shrink-0`}>
                          {squad.active_deck.image_url && <Image src={squad.active_deck.image_url} alt={squad.active_deck.name} width={36} height={36} className="object-contain" />}
                          <p className="text-[7px] text-yellow-400 font-bold mt-1">⭐ Active</p>
                        </div>
                      ) : (
                        <div className="w-16 h-14 rounded-xl border border-dashed border-gray-800 shrink-0" />
                      )}
                      <div className="h-10 w-px bg-gray-800 shrink-0 mx-1" />
                      <div className="flex gap-1.5 flex-wrap">
                        {squad.bench.map((deck, j) => (
                          deck ? (
                            <div key={j} className={`flex items-center justify-center rounded-lg border ${tierBorder[deck.tier] || "border-gray-700"} bg-black/20 p-1.5 w-11 h-11`}>
                              {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={26} height={26} className="object-contain" />}
                            </div>
                          ) : (
                            <div key={j} className="w-11 h-11 rounded-lg border border-dashed border-gray-800" />
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* #2-3 and rest */
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 text-center ${isPodium ? "text-2xl" : "text-sm font-black text-gray-500"}`}>
                          {isPodium ? pod!.medal : `#${i + 1}`}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {profileHref ? (
                              <Link href={profileHref} className="font-bold hover:text-yellow-400 transition-colors">{name}</Link>
                            ) : (
                              <span className="font-bold">{name}</span>
                            )}
                            {isMe && <span className="text-[10px] rounded-full bg-yellow-400/20 border border-yellow-400/30 px-1.5 py-0.5 text-yellow-400 font-bold">you</span>}
                            {flag && <span>{flag}</span>}
                          </div>
                          <p className="text-xs text-gray-500">
                            {profile?.username ? `@${profile.username}` : ""}
                            {squad.locked ? " · 🔒 locked" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-xl font-black ${isPodium ? pod!.ptColor : "text-yellow-400"}`}>{squad.total_points}</p>
                          <p className="text-[10px] text-gray-600">pts</p>
                        </div>
                        {profileHref && (
                          <Link href={profileHref} className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-500 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors">→</Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {squad.active_deck ? (
                        <div className={`flex flex-col items-center rounded-lg border ${tierBorder[squad.active_deck.tier] || "border-gray-700"} bg-black/20 p-1 w-12 shrink-0`}>
                          {squad.active_deck.image_url && <Image src={squad.active_deck.image_url} alt={squad.active_deck.name} width={28} height={28} className="object-contain" />}
                          <p className="text-[7px] text-yellow-400 font-bold">⭐</p>
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded-lg border border-dashed border-gray-800 shrink-0" />
                      )}
                      <div className="h-8 w-px bg-gray-800 shrink-0" />
                      <div className="flex gap-1">
                        {squad.bench.map((deck, j) => (
                          deck ? (
                            <div key={j} className={`flex items-center justify-center rounded-lg border ${tierBorder[deck.tier] || "border-gray-700"} bg-black/20 p-1 w-10 h-9`}>
                              {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={22} height={22} className="object-contain" />}
                            </div>
                          ) : (
                            <div key={j} className="w-10 h-9 rounded-lg border border-dashed border-gray-800" />
                          )
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
