import { createClient } from "@/lib/supabase/server";

interface Deck {
  id: number;
  name: string;
  meta_share: number;
  cost: number;
  tier: string;
}

const tierColors: Record<string, string> = {
  S: "bg-yellow-400 text-gray-900",
  A: "bg-purple-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-green-600 text-white",
  D: "bg-gray-600 text-white",
};

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("*")
    .order("meta_share", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Meta <span className="text-yellow-400">Decks</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        Current Standard meta from Limitless TCG. Higher meta share = higher
        cost.
      </p>

      {!decks || decks.length === 0 ? (
        <p className="text-gray-500">
          No decks yet. An admin needs to sync from Limitless first.
        </p>
      ) : (
        <div className="space-y-3">
          {(decks as Deck[]).map((deck, i) => (
            <div
              key={deck.id}
              className="flex items-center gap-4 rounded-lg border border-gray-800 p-4"
            >
              <span className="w-6 text-right text-sm text-gray-500">
                {i + 1}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${tierColors[deck.tier] || tierColors.D}`}
              >
                {deck.tier}
              </span>
              <div className="flex-1">
                <p className="font-medium">{deck.name}</p>
                <p className="text-xs text-gray-500">
                  {deck.meta_share}% meta share
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-400">
                  {deck.cost}
                  <span className="ml-1 text-xs text-gray-500">pts</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
