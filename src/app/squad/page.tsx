import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Playmat from "./playmat";

export default async function SquadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const [{ data: decks }, { data: squadRaw }] = await Promise.all([
    supabase.from("decks").select("*").order("meta_share", { ascending: false }),
    supabase.from("squads")
      .select(`
        *,
        active_deck:decks!squads_active_deck_id_fkey(*),
        bench1:decks!squads_bench_1_fkey(*),
        bench2:decks!squads_bench_2_fkey(*),
        bench3:decks!squads_bench_3_fkey(*),
        bench4:decks!squads_bench_4_fkey(*),
        bench5:decks!squads_bench_5_fkey(*)
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sq = squadRaw as any;
  const initialSquad = {
    active: sq ? (Array.isArray(sq.active_deck) ? sq.active_deck[0] ?? null : sq.active_deck) : null,
    bench_1: sq ? (Array.isArray(sq.bench1) ? sq.bench1[0] ?? null : sq.bench1) : null,
    bench_2: sq ? (Array.isArray(sq.bench2) ? sq.bench2[0] ?? null : sq.bench2) : null,
    bench_3: sq ? (Array.isArray(sq.bench3) ? sq.bench3[0] ?? null : sq.bench3) : null,
    bench_4: sq ? (Array.isArray(sq.bench4) ? sq.bench4[0] ?? null : sq.bench4) : null,
    bench_5: sq ? (Array.isArray(sq.bench5) ? sq.bench5[0] ?? null : sq.bench5) : null,
  };

  return (
    <div className="mx-auto max-w-xl px-2 py-4">
      <div className="mb-4 px-2">
        <h1 className="text-2xl font-bold">My <span className="text-yellow-400">Squad</span></h1>
        <p className="text-xs text-gray-400 mt-1">Pick 1 active (1.5×) + 5 bench decks within 100pts. Lock in before the tournament.</p>
      </div>
      <Playmat
        allDecks={decks ?? []}
        initialSquad={initialSquad}
        locked={sq?.locked ?? false}
      />
    </div>
  );
}
