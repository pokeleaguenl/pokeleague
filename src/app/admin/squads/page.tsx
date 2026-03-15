import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireAdminPage } from "@/lib/auth/admin";

export default async function AdminSquadsPage() {
  // Admin auth check
  await requireAdminPage();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: squadsRaw } = await supabase
    .from("squads")
    .select(`
      user_id, locked, event_effect, updated_at, total_points,
      active_deck:decks!squads_active_deck_id_fkey(id, name, tier, image_url),
      bench1:decks!squads_bench_1_fkey(id, name, tier),
      bench2:decks!squads_bench_2_fkey(id, name, tier),
      bench3:decks!squads_bench_3_fkey(id, name, tier),
      bench4:decks!squads_bench_4_fkey(id, name, tier),
      bench5:decks!squads_bench_5_fkey(id, name, tier),
      hand1:decks!squads_hand_1_fkey(id, name, tier),
      hand2:decks!squads_hand_2_fkey(id, name, tier),
      hand3:decks!squads_hand_3_fkey(id, name, tier),
      hand4:decks!squads_hand_4_fkey(id, name, tier),
      profile:profiles!squads_user_id_fkey(username, display_name, total_points, country_code)
    `)
    .order("total_points", { ascending: false });

  const norm = (v: unknown) => (Array.isArray(v) ? (v as any[])[0] ?? null : v ?? null);

  const squads = (squadsRaw ?? []).map((s: any) => {
    const profile = norm(s.profile);
    const active = norm(s.active_deck);
    const bench = [norm(s.bench1), norm(s.bench2), norm(s.bench3), norm(s.bench4), norm(s.bench5)];
    const hand = [norm(s.hand1), norm(s.hand2), norm(s.hand3), norm(s.hand4)];
    const filled = [active, ...bench, ...hand].filter(Boolean).length;
    return { ...s, profile, active, bench, hand, filled };
  });

  const lockedCount = squads.filter(s => s.locked).length;
  const fullSquads = squads.filter(s => s.filled >= 10).length;
  const avgFilled = squads.length > 0
    ? (squads.reduce((sum, s) => sum + s.filled, 0) / squads.length).toFixed(1)
    : "0";

  const tierColor: Record<string, string> = {
    S: "text-red-400", A: "text-orange-400", B: "text-yellow-400",
    C: "text-green-400", D: "text-blue-400",
  };
  const effectLabel: Record<string, string> = {
    x3: "x3", hand_boost: "Hand",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-white transition-colors">
          Admin
        </Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-black">Squad <span className="text-yellow-400">Viewer</span></h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-yellow-400">{squads.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total squads</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-3xl font-black text-green-400">{lockedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Locked in</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-white">{fullSquads}</p>
          <p className="text-xs text-gray-500 mt-1">Full (10/10)</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-3xl font-black text-white">{avgFilled}</p>
          <p className="text-xs text-gray-500 mt-1">Avg slots filled</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-900/60 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">All Squads</h2>
          <span className="text-xs text-gray-600">{squads.length} total</span>
        </div>

        {squads.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-sm">No squads built yet.</div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {squads.map((s, idx) => (
              <div key={s.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
                <span className="w-5 flex-shrink-0 text-xs font-bold text-gray-700 text-center">{idx + 1}</span>

                <div className="w-36 flex-shrink-0 min-w-0">
                  <Link href={"/profile/" + (s.profile?.username ?? "")}
                    className="text-sm font-semibold hover:text-yellow-400 transition-colors truncate block">
                    {s.profile?.display_name || s.profile?.username || "Unknown"}
                  </Link>
                  <p className="text-xs text-gray-600 truncate">{"@" + (s.profile?.username ?? "")}</p>
                </div>

                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-sm font-black text-yellow-400">{s.profile?.total_points ?? 0}</p>
                  <p className="text-[10px] text-gray-600">pts</p>
                </div>

                <div className="w-32 flex-shrink-0 min-w-0">
                  {s.active ? (
                    <div className="flex items-center gap-1.5">
                      {s.active.image_url && (
                        <Image src={s.active.image_url} alt={s.active.name} width={22} height={22}
                          className="rounded object-contain flex-shrink-0" />
                      )}
                      <span className={"text-xs truncate font-medium " + (tierColor[s.active.tier] || "text-gray-400")}>
                        {s.active.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-700">No active deck</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {s.bench.map((d: any, i: number) => d ? (
                    <span key={i} className={"text-[10px] rounded px-1.5 py-0.5 bg-white/5 border border-white/5 truncate max-w-[72px] " + (tierColor[d.tier] || "text-gray-400")}>
                      {d.name.split(" ")[0]}
                    </span>
                  ) : (
                    <span key={i} className="text-[10px] rounded px-1.5 py-0.5 border border-dashed border-white/5 text-gray-700">—</span>
                  ))}
                </div>

                <div className="flex flex-shrink-0 items-center gap-1.5">
                  {s.event_effect && (
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-semibold">
                      {effectLabel[s.event_effect] || s.event_effect}
                    </span>
                  )}
                  <span className={"text-[10px] rounded-full px-2 py-0.5 border font-semibold " + (
                    s.locked
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-gray-800 border-gray-700 text-gray-500"
                  )}>
                    {s.locked ? "Locked" : (s.filled + "/10")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
