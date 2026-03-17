"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Deck {
  deck_id: number;
  deck_name: string;
  archetype_id: number;
  archetype_slug: string;
  meta_share: number;
  tier: string;
}

interface MatchupSelectorProps {
  decks: Deck[];
}

export default function MatchupSelector({ decks }: MatchupSelectorProps) {
  const [deckA, setDeckA] = useState<string>("");
  const [deckB, setDeckB] = useState<string>("");
  const router = useRouter();

  const handleCompare = () => {
    if (deckA && deckB && deckA !== deckB) {
      router.push(`/matchups/${deckA}-vs-${deckB}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Deck Selection */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6">
          Select Decks to Compare
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deck A */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deck A
            </label>
            <select
              value={deckA}
              onChange={(e) => setDeckA(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            >
              <option value="">Select a deck...</option>
              {decks.map(deck => (
                <option key={deck.archetype_slug} value={deck.archetype_slug}>
                  {deck.deck_name} ({deck.meta_share.toFixed(1)}% meta)
                </option>
              ))}
            </select>
          </div>

          {/* Deck B */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deck B
            </label>
            <select
              value={deckB}
              onChange={(e) => setDeckB(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            >
              <option value="">Select a deck...</option>
              {decks.map(deck => (
                <option 
                  key={deck.archetype_slug} 
                  value={deck.archetype_slug}
                  disabled={deck.archetype_slug === deckA}
                >
                  {deck.deck_name} ({deck.meta_share.toFixed(1)}% meta)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compare Button */}
        <div className="mt-6">
          <button
            onClick={handleCompare}
            disabled={!deckA || !deckB || deckA === deckB}
            className="w-full md:w-auto px-8 py-3 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Compare Matchup
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-6">
        <h3 className="text-sm font-bold text-blue-400 mb-2">💡 How Matchup Analysis Works</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Compares average placement across tournaments where both decks appeared</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Shows top cut rates (% making Top 8/16/32) for each deck</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Higher placement and cut rates suggest better performance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>More tournaments = more reliable data (confidence indicator shown)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
