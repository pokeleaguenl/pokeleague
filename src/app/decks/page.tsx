import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch decks with their archetypes
  const { data: decks } = await supabase
    .from("decks")
    .select("*, archetype:fantasy_archetypes(slug, image_url)")
    .order("meta_share", { ascending: false });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Deck <span className="text-yellow-400">Analytics</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Meta performance, efficiency scores, and event history.</p>

      <div className="space-y-2">
        {(decks ?? []).map((deck) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const archetype = Array.isArray((deck as any).archetype) 
            ? (deck as any).archetype[0] 
            : (deck as any).archetype;
          
          const slug = archetype?.slug || deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const imageUrl = deck.image_url || archetype?.image_url;
          
          return (
            <Link 
              key={deck.id} 
              href={`/decks/${slug}`}
              className="flex items-center gap-3 rounded-xl border border-gray-800 p-4 hover:border-yellow-400/40 transition-colors"
            >
              {imageUrl && (
                <Image 
                  src={imageUrl} 
                  alt={deck.name} 
                  width={48} 
                  height={48} 
                  className="rounded-lg object-contain bg-white/5 p-1 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{deck.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">Tier {deck.tier}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{deck.meta_share?.toFixed(1)}% meta</span>
                </div>
              </div>
              <span className="font-bold text-yellow-400 text-sm shrink-0">{deck.cost}pts</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
