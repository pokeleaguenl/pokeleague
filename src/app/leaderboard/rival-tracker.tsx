"use client";

import { useState, useEffect } from "react";

interface Player { userId: string; displayName: string; points: number; rank: number }

export default function RivalTracker({ players }: { players: Player[] }) {
  const [rivalId, setRivalId] = useState<string | null>(null);

  useEffect(() => {
    setRivalId(localStorage.getItem("pokeleague-rival"));
  }, []);

  const rival = players.find(p => p.userId === rivalId);

  function pin(userId: string) {
    if (rivalId === userId) {
      localStorage.removeItem("pokeleague-rival");
      setRivalId(null);
    } else {
      localStorage.setItem("pokeleague-rival", userId);
      setRivalId(userId);
    }
  }

  if (!rival) return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">🎯</span>
        <div>
          <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">Rival</p>
          <p className="text-sm font-semibold text-white">{rival.displayName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xl font-black text-purple-300">{rival.points} pts</p>
          <p className="text-[10px] text-gray-500">#{rival.rank} globally</p>
        </div>
        <button onClick={() => pin(rival.userId)}
          className="rounded-lg border border-purple-500/30 px-2.5 py-1.5 text-xs text-purple-400 hover:text-white hover:border-purple-400 transition-colors">
          Remove
        </button>
      </div>
    </div>
  );
}

export function RivalPinButton({ userId, displayName }: { userId: string; displayName: string }) {
  const [rivalId, setRivalId] = useState<string | null>(null);

  useEffect(() => {
    setRivalId(localStorage.getItem("pokeleague-rival"));
  }, []);

  function pin() {
    if (rivalId === userId) {
      localStorage.removeItem("pokeleague-rival");
      setRivalId(null);
    } else {
      localStorage.setItem("pokeleague-rival", userId);
      setRivalId(userId);
    }
  }

  const isPinned = rivalId === userId;

  return (
    <button onClick={pin} title={isPinned ? "Remove rival" : `Set ${displayName} as rival`}
      className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold transition-colors
        ${isPinned ? "bg-purple-500/30 text-purple-300 border border-purple-500/40" : "text-gray-600 hover:text-purple-400 border border-transparent hover:border-purple-500/30"}`}>
      {isPinned ? "🎯 Rival" : "🎯"}
    </button>
  );
}
