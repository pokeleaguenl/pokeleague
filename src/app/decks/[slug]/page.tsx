import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calcMetaEfficiency } from "@/lib/fantasy/metaEfficiency";

export default async function DeckAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Try to find archetype
  const { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("*, aliases:fantasy_archetype_aliases(alias)")
    .eq("slug", slug)
    .maybeSingle();

  // Also look up matching deck from existing decks table
  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .ilike("name", `%${slug.replace(/-/g, " ")}%`)
    .maybeSingle();

  if (!archetype && !deck) notFound();

  // Fetch event history from live scores (real-time) and final scores (completed events)
  const { data: scoreHistory } = archetype ? await supabase
    .from("fantasy_archetype_scores_live")
    .select("*, event:fantasy_events(name, event_date)")
    .eq("archetype_id", archetype.id)
    .order("computed_at", { ascending: false })
    .limit(10) : { data: [] };

  const efficiency = deck
    ? calcMetaEfficiency(deck.cost ?? 0, deck.meta_share ?? 0, deck.cost ?? 1)
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/decks" className="inline-block text-xs text-gray-500 hover:text-white">← All Decks</Link>
        <Link 
          href={`/decks/${slug}/analytics`}
          className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-400/20"
        >
          📊 Full Analytics
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{archetype?.name ?? deck?.name ?? slug}</h1>
        {deck && (
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Tier {deck.tier}</span>
            <span className="text-sm text-gray-400">{deck.meta_share?.toFixed(1)}% meta share</span>
            <span className="text-sm text-yellow-400 font-semibold">{deck.cost}pts cost</span>
          </div>
        )}
      </div>

      {efficiency && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{efficiency.efficiency}</p>
            <p className="text-xs text-gray-500 mt-0.5">Efficiency score</p>
          </div>
          <div className="rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-white">{efficiency.pointsPerCost}</p>
            <p className="text-xs text-gray-500 mt-0.5">Points per cost pt</p>
          </div>
        </div>
      )}

      {scoreHistory && scoreHistory.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Event History</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {scoreHistory.map((s: any) => {
              const event = Array.isArray(s.event) ? s.event[0] : s.event;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
                  <div>
                    <p className="text-sm font-medium">{event?.name ?? "Event"}</p>
                    <p className="text-xs text-gray-500">{event?.event_date}</p>
                  </div>
                  <span className="font-bold text-yellow-400">{s.points}pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(!scoreHistory || scoreHistory.length === 0) && (
        <div className="rounded-xl border border-gray-800 p-6 text-center text-gray-500">
          <p className="text-sm">No event history yet for this archetype.</p>
        </div>
      )}
    </div>
  );
}
