import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isSquadLocked } from "@/lib/fantasy/squadLock";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("squads")
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
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Include lock status in response
  const lockStatus = await isSquadLocked(supabase);
  
  return NextResponse.json({
    squad: data,
    lockStatus,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if squads are locked
  const lockStatus = await isSquadLocked(supabase);
  
  if (lockStatus.locked) {
    return NextResponse.json(
      { 
        error: "Squad modifications are locked",
        message: lockStatus.reason,
        nextEvent: lockStatus.nextEvent,
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    active_deck_id, bench_1, bench_2, bench_3, bench_4, bench_5,
    hand_1, hand_2, hand_3, hand_4,
    active_variant, bench_1_variant, bench_2_variant, bench_3_variant, bench_4_variant, bench_5_variant,
    hand_1_variant, hand_2_variant, hand_3_variant, hand_4_variant,
    event_effect,
  } = body;

  const { data, error } = await supabase
    .from("squads")
    .upsert({
      user_id: user.id,
      active_deck_id: active_deck_id ?? null,
      bench_1: bench_1 ?? null,
      bench_2: bench_2 ?? null,
      bench_3: bench_3 ?? null,
      bench_4: bench_4 ?? null,
      bench_5: bench_5 ?? null,
      hand_1: hand_1 ?? null,
      hand_2: hand_2 ?? null,
      hand_3: hand_3 ?? null,
      hand_4: hand_4 ?? null,
      active_variant: active_variant ?? null,
      bench_1_variant: bench_1_variant ?? null,
      bench_2_variant: bench_2_variant ?? null,
      bench_3_variant: bench_3_variant ?? null,
      bench_4_variant: bench_4_variant ?? null,
      bench_5_variant: bench_5_variant ?? null,
      hand_1_variant: hand_1_variant ?? null,
      hand_2_variant: hand_2_variant ?? null,
      hand_3_variant: hand_3_variant ?? null,
      hand_4_variant: hand_4_variant ?? null,
      event_effect: event_effect ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
