import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";

interface Deck { id: number; name: string; tier: string; image_url: string | null; }
const tierColors: Record<string, string> = {
  S: "border-yellow-400", A: "border-purple-500", B: "border-blue-500", C: "border-green-600", D: "border-gray-600",
};

export default async function LeaguePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: league } = await supabase.from("leagues").select("*").eq("code", code.toUpperCase()).single();
  if (!league) notFound();

  // Check membership
  const { data: membership } = await supabase.from("league_members")
    .select("user_id").eq("league_id", league.id).eq("user_id", user.id).maybeSingle();
  if (!membership) redirect("/leagues");

  // Get all members
  const { data: members } = await supabase.from("league_members")
    .select("user_id").eq("league_id", league.id);
  const memberIds = (members ?? []).map((m) => m.user_id);

  const [{ data: squads }, { data: profiles }] = await Promise.all([
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
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  // Normalize Supabase joined arrays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedSquads = ((squads ?? []) as any[]).map((s) => ({
    ...s,
    active_deck: Array.isArray(s.active_deck) ? s.active_deck[0] ?? null : s.active_deck,
    bench1: Array.isArray(s.bench1) ? s.bench1[0] ?? null : s.bench1,
    bench2: Array.isArray(s.bench2) ? s.bench2[0] ?? null : s.bench2,
    bench3: Array.isArray(s.bench3) ? s.bench3[0] ?? null : s.bench3,
    bench4: Array.isArray(s.bench4) ? s.bench4[0] ?? null : s.bench4,
    bench5: Array.isArray(s.bench5) ? s.bench5[0] ?? null : s.bench5,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{league.name}</h1>
        <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-sm text-yellow-400">{league.code}</span>
      </div>
      <p className="mb-8 text-sm text-gray-400">{memberIds.length} member{memberIds.length !== 1 ? "s" : ""}</p>

      {(!squads || squads.length === 0) ? (
        <p className="text-gray-500">No squads yet. Members need to set up their squad first.</p>
      ) : (
        <div className="space-y-4">
          {normalizedSquads.map((squad, i) => {
            const profile = profileMap.get(squad.user_id) as { display_name?: string; username?: string } | undefined;
            const name = profile?.display_name ?? profile?.username ?? "Anonymous";
            const bench = [squad.bench1, squad.bench2, squad.bench3, squad.bench4, squad.bench5] as (Deck | null)[];
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

            return (
              <div key={squad.user_id} className={`rounded-xl border p-4 ${squad.user_id === user.id ? "border-yellow-400/40 bg-yellow-400/5" : "border-gray-800"}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">{medal}</span>
                    <div>
                      <p className="font-semibold">{name}{squad.user_id === user.id ? " (you)" : ""}</p>
                      {(squad as { locked: boolean }).locked && <span className="text-xs text-green-400">🔒 Locked in</span>}
                    </div>
                  </div>
                  <p className="text-xl font-bold text-yellow-400">{squad.total_points}pts</p>
                </div>
                <div className="mb-1 flex justify-center">
                  <MiniCard deck={squad.active_deck as Deck | null} isActive />
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {bench.map((d, j) => <MiniCard key={j} deck={d} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniCard({ deck, isActive }: { deck: Deck | null; isActive?: boolean }) {
  const border = deck ? (tierColors[deck.tier] || "border-gray-700") : "border-gray-800";
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border ${border} bg-gray-900 p-1 ${isActive ? "w-24" : ""}`}>
      {deck ? (
        <>
          {deck.image_url && <Image src={deck.image_url} alt={deck.name} width={isActive ? 36 : 24} height={isActive ? 36 : 24} className="object-contain" />}
          <p className="mt-0.5 text-center text-[9px] leading-tight line-clamp-2">{deck.name}</p>
          {isActive && <p className="text-[9px] text-yellow-400">Active</p>}
        </>
      ) : (
        <div className="h-7 w-full flex items-center justify-center">
          <span className="text-[9px] text-gray-700">—</span>
        </div>
      )}
    </div>
  );
}
