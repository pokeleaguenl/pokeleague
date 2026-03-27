"use client";

import { useState } from "react";
import Image from "next/image";
import type { Deck } from "./playmat";
import type { Theme } from "@/lib/themes";

const tierColors: Record<string, string> = {
  S: "bg-yellow-400 text-gray-900",
  A: "bg-purple-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-green-600 text-white",
  D: "bg-gray-600 text-white",
};

const tierBorder: Record<string, string> = {
  S: "border-yellow-400/40",
  A: "border-purple-500/30",
  B: "border-blue-500/30",
  C: "border-green-600/30",
  D: "border-gray-600/20",
};

const TIERS = ["All", "S", "A", "B", "C", "D"];
type SortKey = "points" | "cost_asc" | "cost_desc" | "meta";

export default function DeckBrowser({ decks, usedIds, remaining, currentSlotCost, onSelect, onClose, theme }: {
  decks: Deck[];
  usedIds: Set<number>;
  remaining: number;
  currentSlotCost: number;
  onSelect: (deck: Deck) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sort, setSort] = useState<SortKey>("points");

  const effectiveBudget = remaining + currentSlotCost;
  const budgetPct = Math.min((effectiveBudget / 200) * 100, 100);
  const budgetColor = effectiveBudget < 15 ? "text-red-400" : effectiveBudget < 40 ? "text-orange-400" : theme.accent;
  const barColor = effectiveBudget < 15 ? "bg-red-500" : effectiveBudget < 40 ? "bg-orange-400" : "bg-yellow-400";

  const filtered = decks
    .filter((d) => d.meta_share >= 0.5)
    .filter((d) => tierFilter === "All" || d.tier === tierFilter)
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "points") return (b.total_points ?? 0) - (a.total_points ?? 0);
      if (sort === "cost_asc") return a.cost - b.cost;
      if (sort === "cost_desc") return b.cost - a.cost;
      if (sort === "meta") return b.meta_share - a.meta_share;
      return 0;
    });

  const affordableCount = filtered.filter((d) => !usedIds.has(d.id) && d.cost <= effectiveBudget).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-t-2xl sm:rounded-2xl ${theme.bg} border border-white/10 flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-white/8 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-black">Pick a Deck</h2>
              <p className="text-xs text-gray-500 mt-0.5">{affordableCount} decks you can afford</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
          </div>

          {/* Budget bar — prominent */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-400">Budget available</span>
              <span className={`text-lg font-black ${budgetColor}`}>{effectiveBudget} pts</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${budgetPct}%` }} />
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search decks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
            autoFocus
          />

          {/* Tier tabs + sort */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all
                  ${tierFilter === t
                    ? t === "All" ? "bg-white/20 text-white" : `${tierColors[t]}`
                    : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
              >
                {t}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-yellow-400"
              >
                <option value="points">Sort: Fantasy pts</option>
                <option value="cost_asc">Sort: Cheapest</option>
                <option value="cost_desc">Sort: Priciest</option>
                <option value="meta">Sort: Meta share</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-right text-[10px] text-gray-600">{filtered.length} decks</p>
        </div>

        {/* Deck list */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">No decks match your search</p>
          )}
          {filtered.map((deck) => {
            const used = usedIds.has(deck.id);
            const tooExpensive = !used && deck.cost > effectiveBudget;
            const disabled = used || tooExpensive;
            const canAfford = !disabled;

            return (
              <button
                key={deck.id}
                disabled={disabled}
                onClick={() => canAfford && onSelect(deck)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all
                  ${used
                    ? "border-white/5 opacity-20 cursor-not-allowed"
                    : tooExpensive
                    ? "border-red-900/30 bg-red-950/10 opacity-40 cursor-not-allowed"
                    : `${tierBorder[deck.tier] || "border-white/10"} hover:border-yellow-400/50 hover:bg-white/5 cursor-pointer active:scale-[0.98]`
                  }`}
              >
                {/* Dual images */}
                <div className="relative shrink-0 w-11 h-11">
                  {deck.image_url && (
                    <Image src={deck.image_url} alt={deck.name} width={38} height={38}
                      className="absolute left-0 top-0 object-contain drop-shadow-md" />
                  )}
                  {deck.image_url_2 && (
                    <Image src={deck.image_url_2} alt="" width={24} height={24}
                      className="absolute right-0 bottom-0 object-contain drop-shadow-md" />
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-sm">{deck.name}</p>
                  <p className="text-[11px] text-gray-500">{deck.meta_share}% meta share</p>
                </div>

                {/* Fantasy pts */}
                {(deck.total_points ?? 0) > 0 && (
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-green-400">{deck.total_points}</span>
                    <p className="text-[9px] text-gray-600">season pts</p>
                  </div>
                )}

                {/* Tier badge */}
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-black ${tierColors[deck.tier] || tierColors.D}`}>
                  {deck.tier}
                </span>

                {/* Cost — big and clear */}
                <div className="shrink-0 text-right min-w-[44px]">
                  <span className={`text-base font-black ${tooExpensive ? "text-red-400" : "text-yellow-400"}`}>
                    {deck.cost}
                  </span>
                  <p className="text-[9px] text-gray-600">pts</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
