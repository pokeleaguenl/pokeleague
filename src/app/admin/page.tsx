import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SyncButton from "./sync-button";
import EventsSyncButton from "./events-sync-button";
import SyncVariantsButton from "./sync-variants-button";
import DeckTable from "./deck-table";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase
    .from("decks")
    .select("*")
    .order("meta_share", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Admin <span className="text-yellow-400">Panel</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        Sync data and manage the league.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <SyncButton />
        <EventsSyncButton />
        <SyncVariantsButton />
        <Link href="/admin/tournaments"
          className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white">
          🏆 Manage Tournaments
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Deck Costs</h2>
        <DeckTable decks={decks ?? []} />
      </div>
    </div>
  );
}
