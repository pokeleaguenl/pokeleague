import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

interface Deck { id: number; name: string; tier: string; image_url: string | null; cost: number; }
interface Profile { id: string; display_name: string | null; username: string | null; total_points: number; }
interface Squad {
  user_id: string;
  total_points: number;
  locked: boolean;
  active_deck: Deck | null;
  bench1: Deck | null;
  bench2: Deck | null;
  bench3: Deck | null;
  bench4: Deck | null;
  bench5: Deck | null;
}

const tierColors: Record<string, string> = {
  S: "border-yellow-400", A: "border-purple-500", B: "border-blue-500", C: "border-green-600", D: "border-gray-600",
};

export default async function Leaderboard() {
  const supabase = await createClient();

  const [{ data: squads }, { data: profiles }] = await Promise.all([
    supabase.from("squads").select(`
      user_id, total_points, locked,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url,cost),
      bench1:decks!squads_bench_1_fkey(id,name,tier,image_url,cost),
      bench2:decks!squads_bench_2_fkey(id,name,tier,image_url,cost),
      bench3:decks!squads_bench_3_fkey(id,name,tier,image_url,cost),
      bench4:decks!squads_bench_4_fkey(id,name,tier,image_url,cost),
      bench5:decks!squads_bench_5_fkey(id,name,tier,image_url,cost)
    `).order("total_points", { ascending: false }),
    supabase.from("profiles").select("id, display_name, username, total_points"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: Profile) => [p.id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ranked = ((squads ?? []) as any[]).map((s) => ({
    ...s,
    active_deck: Array.isArray(s.active_deck) ? s.active_deck[0] ?? null : s.active_deck,
    bench1: Array.isArray(s.bench1) ? s.bench1[0] ?? null : s.bench1,
    bench2: Array.isArray(s.bench2) ? s.bench2[0] ?? null : s.bench2,
    bench3: Array.isArray(s.bench3) ? s.bench3[0] ?? null : s.bench3,
    bench4: Array.isArray(s.bench4) ? s.bench4[0] ?? null : s.bench4,
    bench5: Array.isArray(s.bench5) ? s.bench5[0] ?? null : s.bench5,
  })) as Squad[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Leader<span className="text-yellow-400">board</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Rankings based on total fantasy points earned.</p>

      {ranked.length === 0 ? (
        <p className="text-gray-500">No squads yet. Be the first to lock in!</p>
      ) : (
        <div className="space-y-4">
          {ranked.map((squad, i) => {
            const profile = profileMap.get(squad.user_id);
            const name = profile?.display_name ?? profile?.username ?? "Anonymous";
            const bench = [squad.bench1, squad.bench2, squad.bench3, squad.bench4, squad.bench5];
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const profileHref = profile?.username ? `/profile/${profile.username}` : null;

            return (
              <div key={squad.user_id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg font-bold text-gray-400">
                      {medal ?? `#${i + 1}`}
                    </span>
                    <div>
                      {profileHref ? (
                        <Link href={profileHref} className="font-semibold hover:text-yellow-400 transition-colors">
                          {name}
                          <span className="ml-1.5 text-xs text-gray-600 font-normal">@{profile?.username}</span>
                        </Link>
                      ) : (
                        <p className="font-semibold">{name}</p>
                      )}
                      {squad.locked && <span className="text-xs text-green-400">🔒 Locked in</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-400">{squad.total_points}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                    {profileHref && (
                      <Link href={profileHref}
                        className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors">
                        View →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Squad visual */}
                <div className="mt-2">
                  <div className="mb-2 flex justify-center">
                    <MiniDeckCard deck={squad.active_deck} label="Active" isActive />
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {bench.map((deck, j) => (
                      <MiniDeckCard key={j} deck={deck} label={`B${j + 1}`} />
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

function MiniDeckCard({ deck, label, isActive }: { deck: Deck | null; label: string; isActive?: boolean }) {
  const border = deck ? (tierColors[deck.tier] || "border-gray-700") : "border-gray-800";
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border ${border} bg-gray-900 p-1 ${isActive ? "w-24" : ""}`}>
      {deck ? (
        <>
          {deck.image_url && (
            <Image src={deck.image_url} alt={deck.name} width={isActive ? 40 : 28} height={isActive ? 40 : 28} className="object-contain" />
          )}
          <p className="mt-0.5 text-center text-[9px] leading-tight line-clamp-2">{deck.name}</p>
          {isActive && <p className="text-[9px] text-yellow-400">1.5×</p>}
        </>
      ) : (
        <div className="flex h-8 w-full items-center justify-center">
          <span className="text-[10px] text-gray-700">{label}</span>
        </div>
      )}
    </div>
  );
}
