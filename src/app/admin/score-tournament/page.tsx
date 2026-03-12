import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ScoreTournamentClient from "./score-client";

export const dynamic = "force-dynamic";

export default async function ScoreTournamentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, event_date, status, rk9_id")
    .order("event_date", { ascending: false })
    .limit(20);

  // Get standings counts per tournament
  const counts: Record<number, number> = {};
  for (const t of tournaments ?? []) {
    const { count } = await supabase
      .from("rk9_standings")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", t.rk9_id ?? "");
    counts[t.id] = count ?? 0;
  }

  // Get already-scored tournaments
  const { data: scoredEvents } = await supabase
    .from("fantasy_events")
    .select("tournament_id");
  const scoredIds = new Set((scoredEvents ?? []).map(e => e.tournament_id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-white transition-colors">Admin</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-black">Score <span className="text-yellow-400">Tournament</span></h1>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        Select a tournament to run the full fantasy scoring pipeline. Requires standings data in the database.
      </p>

      <ScoreTournamentClient
        tournaments={(tournaments ?? []).map(t => ({
          ...t,
          standingsCount: counts[t.id] ?? 0,
          alreadyScored: scoredIds.has(t.id),
        }))}
      />
    </div>
  );
}
