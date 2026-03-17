"use client";

import { useState } from "react";
import Link from "next/link";
import { playerToSlug } from "@/lib/utils/playerSlug";

interface Standing {
  player_name: string;
  archetype: string;
  rank: number;
  country: string;
}

interface MobileStandingsProps {
  standings: Standing[];
}

export default function MobileStandings({ standings }: MobileStandingsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayStandings = showAll ? standings : standings.slice(0, 32);

  return (
    <div className="space-y-2">
      {displayStandings.map((player) => (
        <div
          key={`${player.rank}-${player.player_name}`}
          className="rounded-lg bg-white/3 p-3 border border-white/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span
                className={`text-sm font-black flex-shrink-0 ${
                  player.rank === 1
                    ? "text-yellow-400"
                    : player.rank <= 4
                    ? "text-orange-400"
                    : player.rank <= 8
                    ? "text-blue-400"
                    : "text-gray-400"
                }`}
              >
                #{player.rank}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/players/${playerToSlug(player.player_name)}`}
                  className="font-medium hover:text-yellow-400 transition-colors block truncate"
                >
                  {player.player_name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {player.archetype}
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-600 flex-shrink-0">
              {player.country}
            </span>
          </div>
        </div>
      ))}

      {standings.length > 32 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
        >
          {showAll
            ? "Show Less"
            : `Show All ${standings.length} Players`}
        </button>
      )}
    </div>
  );
}
