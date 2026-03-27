"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DeckImage from "@/components/ui/DeckImage";

interface Deck {
  deck_id: number;
  deck_name: string;
  archetype_slug: string;
  tier: string;
  meta_share: number;
  image_url: string | null;
  total_points: number;
}

interface DeckFiltersProps {
  decks: Deck[];
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  S: { label: "S", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", dot: "bg-red-400" },
  A: { label: "A", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", dot: "bg-orange-400" },
  B: { label: "B", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", dot: "bg-yellow-400" },
  C: { label: "C", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", dot: "bg-green-400" },
  D: { label: "D", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", dot: "bg-blue-400" },
};

export default function DeckFilters({ decks }: DeckFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"meta" | "name" | "points">("meta");

  // Filter and sort decks
  const filteredDecks = useMemo(() => {
    let result = decks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => d.deck_name.toLowerCase().includes(query));
    }

    // Tier filter
    if (selectedTiers.length > 0) {
      result = result.filter(d => selectedTiers.includes(d.tier));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "meta") {
        return (b.meta_share || 0) - (a.meta_share || 0);
      } else if (sortBy === "points") {
        return (b.total_points || 0) - (a.total_points || 0);
      } else {
        return a.deck_name.localeCompare(b.deck_name);
      }
    });

    return result;
  }, [decks, searchQuery, selectedTiers, sortBy]);

  // Group by tier
  const byTier = useMemo(() => {
    const grouped: Record<string, Deck[]> = {};
    for (const deck of filteredDecks) {
      const tier = deck.tier || "D";
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(deck);
    }
    return grouped;
  }, [filteredDecks]);

  const toggleTier = (tier: string) => {
    setSelectedTiers(prev =>
      prev.includes(tier)
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    );
  };

  const maxMeta = Math.max(...decks.map(d => d.meta_share ?? 0), 1);
  const tierOrder = ["S", "A", "B", "C", "D"];

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks..."
            className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
          />
        </div>

        {/* Tier and Sort filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tier buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tier:</span>
            {tierOrder.map(tier => {
              const cfg = TIER_CONFIG[tier];
              const isSelected = selectedTiers.includes(tier);
              const count = decks.filter(d => d.tier === tier).length;
              
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                      : "border-gray-700 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  {tier}
                  <span className="font-normal opacity-70">({count})</span>
                </button>
              );
            })}
            {selectedTiers.length > 0 && (
              <button
                onClick={() => setSelectedTiers([])}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-gray-700 bg-black/20 px-3 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
            >
              <option value="meta">Meta Share</option>
              <option value="points">Fantasy Points</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 text-sm text-gray-500">
        Showing {filteredDecks.length} of {decks.length} decks
      </div>

      {/* Deck list */}
      {filteredDecks.length > 0 ? (
        <div className="space-y-10">
          {tierOrder.map(tier => {
            const tierDecks = byTier[tier];
            if (!tierDecks?.length) return null;
            const cfg = TIER_CONFIG[tier];

            return (
              <div key={tier}>
                {/* Tier header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-black ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    {tier}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Tier {tier}</h2>
                    <p className="text-xs text-gray-500">{tierDecks.length} decks</p>
                  </div>
                </div>

                {/* Deck grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {tierDecks.map((deck) => {
                    const metaPct = ((deck.meta_share ?? 0) / maxMeta) * 100;

                    return (
                      <Link
                        key={deck.deck_id}
                        href={`/decks/${deck.archetype_slug}`}
                        className={`group block rounded-xl border p-4 transition-all hover:scale-[1.02] ${cfg.bg} ${cfg.border} hover:border-yellow-400/50`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Deck image */}
                          <div className="flex-shrink-0">
                            <DeckImage
                              src={deck.image_url}
                              alt={deck.deck_name}
                              width={48}
                              height={48}
                              className="rounded-lg"
                            />
                          </div>

                          {/* Deck info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors mb-1 truncate">
                              {deck.deck_name}
                            </h3>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{deck.meta_share?.toFixed(2)}% meta</span>
                              <span>•</span>
                              <span>{deck.total_points} pts</span>
                            </div>

                            {/* Meta bar */}
                            <div className="mt-2 h-1 w-full rounded-full bg-white/5">
                              <div
                                className={`h-full rounded-full ${cfg.dot}`}
                                style={{ width: `${Math.min(metaPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-800">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-xl font-bold mb-2">No decks found</p>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
