import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get canonical decks with their archetype info
  const { data: decks } = await supabase
    .from("decks")
    .select("*, archetype:fantasy_archetypes(id, slug, name, image_url, image_url_2)")
    .not("image_url", "is", null)
    .order("meta_share", { ascending: false });

  if (!decks) return null;

  // For each deck, sum points across canonical + variant archetypes
  const decksWithPoints = await Promise.all(decks.map(async (deck) => {
    const archetypeId = deck.archetype_id;
    if (!archetypeId) return { ...deck, totalPoints: deck.cost || 0 };

    // Get variant IDs
    const { data: variants } = await supabase
      .from("fantasy_archetypes")
      .select("id")
      .eq("canonical_id", archetypeId);

    const allIds = [archetypeId, ...(variants?.map(v => v.id) || [])];

    // Sum all points
    const { data: scores } = await supabase
      .from("fantasy_archetype_scores_live")
      .select("points")
      .in("archetype_id", allIds);

    const totalPoints = scores?.reduce((sum, s) => sum + (s.points || 0), 0) || 0;
    return { ...deck, totalPoints };
  }));

  // Sort by total points descending
  decksWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Deck <span className="text-yellow-400">Analytics</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Meta performance, efficiency scores, and event history.</p>
      <div className="space-y-2">
        {decksWithPoints.map((deck) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const archetype = (deck as any).archetype;
          const slug = archetype?.slug || deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const image1 = archetype?.image_url || deck.image_url;
          const image2 = archetype?.image_url_2 || deck.image_url_2;

          return (
            <Link key={deck.id} href={`/decks/${slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center flex-shrink-0">
                  {image1 && (
                    <Image src={image1} alt={deck.name} width={40} height={40} className="object-contain rounded" />
                  )}
                  {image2 && (
                    <Image src={image2} alt={deck.name} width={40} height={40} className="object-contain rounded -ml-2" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{deck.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">Tier {deck.tier}</span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-500">{deck.meta_share?.toFixed(1)}% meta</span>
                  </div>
                </div>
              </div>
              <span className="font-bold text-yellow-400 text-sm">
                {deck.totalPoints > 0 ? `${deck.totalPoints}pts` : `$${deck.cost}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
