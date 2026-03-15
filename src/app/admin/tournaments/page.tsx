import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TournamentManager from "./tournament-manager";
import { requireAdminPage } from "@/lib/auth/admin";

export default async function AdminTournamentsPage() {
  // Admin auth check
  await requireAdminPage();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: tournaments }, { data: decks }] = await Promise.all([
    supabase.from("tournaments").select("*").order("event_date", { ascending: false }),
    supabase.from("decks").select("*").order("meta_share", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Tournaments <span className="text-yellow-400">Admin</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Create tournaments and log results to award points.</p>
      <TournamentManager tournaments={tournaments ?? []} decks={decks ?? []} />
    </div>
  );
}
