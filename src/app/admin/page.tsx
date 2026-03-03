import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyncButton from "./sync-button";
import DeckTable from "./deck-table";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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
        Sync decks from Limitless and adjust costs.
      </p>

      <SyncButton />

      <div className="mt-8">
        <DeckTable decks={decks ?? []} />
      </div>
    </div>
  );
}
