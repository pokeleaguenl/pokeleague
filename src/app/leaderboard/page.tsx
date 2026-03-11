import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const norm = (v: unknown) => (Array.isArray(v) ? (v as any[])[0] ?? null : v ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ranked = ((squads ?? []) as any[]).map((s) => ({
    ...s,
    active_deck: norm(s.active_deck),
    bench: [norm(s.bench1), norm(s.bench2), norm(s.bench3), norm(s.bench4), norm(s.bench5)],
  }));

  const myRank = user ? ranked.findIndex((s) => s.user_id === user.id) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">
        Leader<span className="text-yellow-400">board</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Global season rankings · {ranked.length} trainers</p>

      {myRank >= 0 && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3">
          <p className="text-sm text-gray-300">Your rank</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-yellow-400">#{myRank + 1}</span>
            <span className="text-sm text-gray-400">of {ranked.length}</span>
          </div>
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-12 text-center">
          <p className="text-3xl mb-3">🏆</p>
          <p className="font-medium text-gray-400">No squads yet — be the first!</p>
          <Link href="/squad" className="mt-4 inline-block rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-gray-900 hover:bg-yellow-300">
            Build Squad →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((squad, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profile = profileMap.get(squad.user_id) as any;
            const name = profile?.display_name ?? profile?.username ?? "Anonymous";
            const isMe = user?.id === squad.user_id;
            const profileHref = profile?.username ? `/profile/${profile.username}` : null;
            const flag = profile?.country_code ? COUNTRIES[profile.country_code] : null;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const podiumBorder = i === 0 ? "border-yellow-400/40" : i === 1 ? "border-gray-400/30" : i === 2 ? "border-orange-600/30" : "border-gray-800";

            return (
              <div key={squad.user_id}
                className={`rounded-xl border p-4 transition-colors ${isMe ? "border-yellow-400/50 bg-yellow-400/5" : podiumBorder}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 text-center font-black text-gray-400">
                      {medal ?? <span className="text-sm">#{i + 1}</span>}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {profileHref ? (
                          <Link href={profileHref} className="font-semibold hover:text-yellow-400 transition-colors">{name}</Link>
                        ) : (
                          <span className="font-semibold">{name}</span>
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
                      <p className="text-xl font-black text-yellow-400">{squad.total_points}</p>
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
                    {squad.bench.map((deck: {tier:string;image_url:string;name:string}|null, j: number) => (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
