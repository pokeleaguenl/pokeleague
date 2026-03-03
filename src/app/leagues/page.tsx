import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeagueManager from "./league-manager";
import Link from "next/link";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league:leagues(id, name, code, owner_id)")
    .eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagues = ((memberships ?? []) as any[]).map((m) => (Array.isArray(m.league) ? m.league[0] : m.league) as { id: number; name: string; code: string; owner_id: string });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        My <span className="text-yellow-400">Leagues</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Create a private league or join one with a code.</p>

      <LeagueManager />

      {leagues.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Your Leagues</h2>
          <div className="space-y-3">
            {leagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.code}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
                <div>
                  <p className="font-semibold">{league.name}</p>
                  <p className="text-xs text-gray-500">Code: <span className="font-mono text-yellow-400">{league.code}</span></p>
                </div>
                <span className="text-gray-500">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
