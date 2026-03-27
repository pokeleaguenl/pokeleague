"use client";

import { useState } from "react";
import Link from "next/link";
import { playerToSlug } from "@/lib/utils/playerSlug";

interface Standing { player_name: string; archetype: string; rank: number; country: string }

const PAGE_SIZE = 50;

export default function StandingsTable({ standings }: { standings: Standing[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-white/10 bg-gray-900/50 p-5 text-left hover:bg-gray-900/70 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            View All Standings
          </span>
          <span className="text-xs text-gray-500">{standings.length} players ▾</span>
        </div>
      </button>
    );
  }

  const filtered = standings.filter(s =>
    !search ||
    s.player_name.toLowerCase().includes(search.toLowerCase()) ||
    s.archetype?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) { setSearch(val); setPage(1); }

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
          All Standings <span className="text-gray-600 font-normal">({standings.length})</span>
        </h2>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-600 hover:text-gray-400">
          ▴ Collapse
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search player or deck…"
        value={search}
        onChange={e => handleSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-400/40"
      />

      <div className="space-y-0.5">
        {paged.map(player => {
          const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : null;
          return (
            <div key={player.rank}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 ${player.rank <= 8 ? "bg-white/3" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 w-10 text-xs font-bold ${
                  player.rank === 1 ? "text-yellow-400" : player.rank <= 4 ? "text-orange-400" :
                  player.rank <= 8 ? "text-blue-400" : "text-gray-600"
                }`}>
                  {medal ?? `#${player.rank}`}
                </span>
                <Link href={`/players/${playerToSlug(player.player_name)}`}
                  className="font-medium hover:text-yellow-400 transition-colors truncate">
                  {player.player_name}
                </Link>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[180px]">{player.archetype}</span>
                <span className="text-xs text-gray-600 w-6 text-right">{player.country}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30 hover:text-white transition-colors">
            ← Prev
          </button>
          <span>Page {page} of {totalPages} · {filtered.length} results</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30 hover:text-white transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
