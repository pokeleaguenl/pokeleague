import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase.rpc("get_deck_list_with_points");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Deck <span className="text-yellow-400">Analytics</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Meta performance, efficiency scores, and event history.</p>
      <div className="space-y-2">
        {(decks ?? []).map((deck: any) => (
          <Link key={deck.deck_id} href={`/decks/${deck.archetype_slug}`}
            className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center flex-shrink-0">
                {deck.image_url && (
                  <Image src={deck.image_url} alt={deck.deck_name} width={40} height={40} className="object-contain rounded" />
                )}
                {deck.image_url_2 && (
                  <Image src={deck.image_url_2} alt={deck.deck_name} width={40} height={40} className="object-contain rounded -ml-2" />
                )}
              </div>
              <div>
                <p className="font-semibold">{deck.deck_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">Tier {deck.tier}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{deck.meta_share?.toFixed(1)}% meta</span>
                </div>
              </div>
            </div>
            <span className="font-bold text-yellow-400 text-sm">
              {deck.total_points > 0 ? `${deck.total_points}pts` : `$${deck.cost}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
