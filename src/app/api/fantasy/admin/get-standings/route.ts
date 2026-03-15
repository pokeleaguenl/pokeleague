import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Check admin auth
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const url = new URL(req.url);
  const tournamentId = url.searchParams.get("tournamentId");

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rk9_standings")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("rank", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ standings: data });
}
