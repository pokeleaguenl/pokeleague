import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase
    .from("decks")
    .select("*")
    .not("image_url", "is", null)
    .order("meta_share", { ascending: false });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Deck <span className="text-yellow-400">Analytics</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Meta performance, efficiency scores, and event history.</p>

      <div className="space-y-2">
        {(decks ?? []).map((deck) => {
          const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          return (
            <Link key={deck.id} href={`/decks/${slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
              <div className="flex items-center gap-3">
                {deck.image_url && (
                  <img src={deck.image_url} alt={deck.name} className="h-10 w-10 object-contain rounded" />
                )}
                <div>
                  <p className="font-semibold">{deck.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">Tier {deck.tier}</span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-500">{deck.meta_share?.toFixed(1)}% meta</span>
                  </div>
                </div>
              </div>
              <span className="font-bold text-yellow-400 text-sm">{deck.cost}pts</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
