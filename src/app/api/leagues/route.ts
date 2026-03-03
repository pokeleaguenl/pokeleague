import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function generateCode(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const code = generateCode();
  const { data, error } = await supabase
    .from("leagues")
    .insert({ name, code, owner_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-join as member
  await supabase.from("league_members").insert({ league_id: data.id, user_id: user.id });

  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("league_members")
    .select("league:leagues(*)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.map((m) => m.league) ?? []);
}
