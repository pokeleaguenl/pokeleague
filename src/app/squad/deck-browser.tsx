"use client";

import { useState } from "react";
import Image from "next/image";
import type { Deck } from "./playmat";

const tierColors: Record<string, string> = {
  S: "bg-yellow-400 text-gray-900",
  A: "bg-purple-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-green-600 text-white",
  D: "bg-gray-600 text-white",
};

interface Props {
  decks: Deck[];
  usedIds: Set<number>;
  onSelect: (deck: Deck) => void;
  onClose: () => void;
}

export default function DeckBrowser({ decks, usedIds, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = decks.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-gray-900 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Select a Deck</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <input
          type="text"
          placeholder="Search decks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          autoFocus
        />

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {filtered.map((deck) => {
            const used = usedIds.has(deck.id);
            return (
              <button
                key={deck.id}
                disabled={used}
                onClick={() => !used && onSelect(deck)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors
                  ${used
                    ? "border-gray-800 opacity-30 cursor-not-allowed"
                    : "border-gray-700 hover:border-yellow-400 cursor-pointer"
                  }`}
              >
                {deck.image_url && (
                  <Image src={deck.image_url} alt={deck.name} width={36} height={36} className="shrink-0 object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{deck.name}</p>
                  <p className="text-xs text-gray-500">{deck.meta_share}% meta share</p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${tierColors[deck.tier] || tierColors.D}`}>
                  {deck.tier}
                </span>
                <span className="shrink-0 text-sm font-bold text-yellow-400">{deck.cost}pts</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
