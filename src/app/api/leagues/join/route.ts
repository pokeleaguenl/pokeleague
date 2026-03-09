import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("code", code.toUpperCase())
    .single();

  if (leagueError || !league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const { error } = await supabase
    .from("league_members")
    .upsert({ league_id: league.id, user_id: user.id }, { onConflict: "league_id,user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, league });
}
