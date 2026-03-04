import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      bench5:decks!squads_bench_5_fkey(*)
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    active_deck_id, bench_1, bench_2, bench_3, bench_4, bench_5,
    active_variant, bench_1_variant, bench_2_variant, bench_3_variant, bench_4_variant, bench_5_variant,
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
      active_variant: active_variant ?? null,
      bench_1_variant: bench_1_variant ?? null,
      bench_2_variant: bench_2_variant ?? null,
      bench_3_variant: bench_3_variant ?? null,
      bench_4_variant: bench_4_variant ?? null,
      bench_5_variant: bench_5_variant ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
