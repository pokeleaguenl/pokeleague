import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Playmat from "./playmat";
import { isSquadLocked } from "@/lib/fantasy/squadLock";
import LockCountdown from "./lock-countdown";
import LockedBanner from "./locked-banner";

export const dynamic = 'force-dynamic';

export default async function SquadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const today = new Date().toISOString().split("T")[0];

  // Check lock status
  const lockStatus = await isSquadLocked(supabase);

  const [{ data: rpcDecks, error: rpcError }, { data: squadRaw }, { data: nextEvent }] = await Promise.all([
    supabase.rpc("get_deck_list_with_points"),
    supabase.from("squads")
      .select(`
        *,
        active_deck:decks!squads_active_deck_id_fkey(*),
        bench1:decks!squads_bench_1_fkey(*),
        bench2:decks!squads_bench_2_fkey(*),
        bench3:decks!squads_bench_3_fkey(*),
        bench4:decks!squads_bench_4_fkey(*),
        bench5:decks!squads_bench_5_fkey(*),
        hand1:decks!squads_hand_1_fkey(*),
        hand2:decks!squads_hand_2_fkey(*),
        hand3:decks!squads_hand_3_fkey(*),
        hand4:decks!squads_hand_4_fkey(*)
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("tournaments")
      .select("id, name, event_date")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (rpcError) {
    console.error("[squad/page] Failed to load decks:", rpcError.message);
  }

  // Map RPC results to Deck shape
  const decks = (rpcDecks ?? []).map((d: Record<string, unknown>) => ({
    id: d.deck_id as number,
    name: d.deck_name as string,
    tier: d.tier as string,
    cost: d.cost as number,
    meta_share: d.meta_share as number,
    image_url: d.image_url as string | null,
    image_url_2: d.image_url_2 as string | null,
    total_points: d.total_points as number,
  }));

  const variantResult = await supabase.from("deck_variants").select("*");
  const allVariants = variantResult.data ?? [];

  type SquadRow = Record<string, unknown>;
  const sq = squadRaw as SquadRow | null;
  const norm = (val: unknown) => (Array.isArray(val) ? val[0] ?? null : val ?? null);

  const initialSquad = {
    active: sq ? norm(sq.active_deck) : null,
    bench_1: sq ? norm(sq.bench1) : null,
    bench_2: sq ? norm(sq.bench2) : null,
    bench_3: sq ? norm(sq.bench3) : null,
    bench_4: sq ? norm(sq.bench4) : null,
    bench_5: sq ? norm(sq.bench5) : null,
    hand_1: sq ? norm(sq.hand1) : null,
    hand_2: sq ? norm(sq.hand2) : null,
    hand_3: sq ? norm(sq.hand3) : null,
    hand_4: sq ? norm(sq.hand4) : null,
  };

  const sv = (v: unknown) => (typeof v === "string" ? v : null);
  const initialVariants = sq ? {
    active: sv(sq.active_variant),
    bench_1: sv(sq.bench_1_variant),
    bench_2: sv(sq.bench_2_variant),
    bench_3: sv(sq.bench_3_variant),
    bench_4: sv(sq.bench_4_variant),
    bench_5: sv(sq.bench_5_variant),
    hand_1: sv(sq.hand_1_variant),
    hand_2: sv(sq.hand_2_variant),
    hand_3: sv(sq.hand_3_variant),
    hand_4: sv(sq.hand_4_variant),
  } : {};

  const variantsByDeckId: Record<number, { id: number; deck_id: number; name: string; limitless_value: string }[]> = {};
  for (const v of allVariants) {
    if (!variantsByDeckId[v.deck_id]) variantsByDeckId[v.deck_id] = [];
    variantsByDeckId[v.deck_id].push(v);
  }

  const stadiumEffects = sq ? {
    x3Used: (sq.x3_effect_used as boolean) ?? false,
    handBoostUsed: (sq.hand_boost_used as boolean) ?? false,
    benchBlitzUsed: (sq.bench_blitz_used as boolean) ?? false,
    metaCallUsed: (sq.meta_call_used as boolean) ?? false,
    darkHorseUsed: (sq.dark_horse_used as boolean) ?? false,
    captainSwapUsed: (sq.captain_swap_used as boolean) ?? false,
    eventEffect: (sq.event_effect as string) ?? null,
    effectCharges: (sq.effect_charges as number) ?? 5,
  } : {
    x3Used: false, handBoostUsed: false, benchBlitzUsed: false,
    metaCallUsed: false, darkHorseUsed: false, captainSwapUsed: false,
    eventEffect: null, effectCharges: 5,
  };

  const lastSaved = sq?.updated_at ? new Date(sq.updated_at as string).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : null;

  return (
    <div className="mx-auto max-w-2xl px-3 py-4">
      <div className="mb-4 px-1">
        <h1 className="text-2xl font-bold">My <span className="text-yellow-400">Squad</span></h1>
        <p className="text-xs text-gray-400 mt-1">
          1 Active (2×) · 5 Bench (1×) · 4 Reserve · 200pt budget. Use Stadium Effects to boost your score.
        </p>
        {nextEvent && (
          <p className="text-xs text-yellow-400/70 mt-0.5">
            Next event: <span className="font-semibold text-yellow-400">{nextEvent.name}</span> — {nextEvent.event_date}
          </p>
        )}
      </div>

      {/* Lock status banners */}
      {lockStatus.locked && lockStatus.nextEvent && (
        <div className="mb-4 px-2">
          <LockedBanner 
            eventName={lockStatus.nextEvent.name}
            lockTime={lockStatus.nextEvent.lockTime.toISOString()}
          />
        </div>
      )}

      {!lockStatus.locked && lockStatus.nextEvent && (
        <div className="mb-4 px-2">
          <LockCountdown 
            eventName={lockStatus.nextEvent.name}
            lockTime={lockStatus.nextEvent.lockTime.toISOString()}
          />
        </div>
      )}

      <Playmat
        allDecks={decks}
        initialSquad={initialSquad}
        initialVariants={initialVariants}
        variantsByDeckId={variantsByDeckId}
        stadiumEffects={stadiumEffects}
        nextEventName={nextEvent?.name ?? null}
        locked={lockStatus.locked}
        lastSaved={lastSaved}
      />
    </div>
  );
}
