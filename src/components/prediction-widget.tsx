"use client";

import { useState } from "react";
import Image from "next/image";
import { FANTASY_CONFIG } from "@/lib/fantasy/config";

interface Deck {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
}

interface Props {
  tournamentId: number;
  tournamentName: string;
  decks: Deck[];
  existing: { predicted_deck_id: number; correct: boolean | null; bonus_points: number } | null;
}

const tierColors: Record<string, string> = {
  S: "border-yellow-400/60 bg-yellow-400/5",
  A: "border-purple-500/60 bg-purple-500/5",
  B: "border-blue-500/60 bg-blue-500/5",
  C: "border-green-600/60 bg-green-600/5",
  D: "border-gray-600/40 bg-gray-800/20",
};

export default function PredictionWidget({ tournamentId, tournamentName, decks, existing }: Props) {
  const [selected, setSelected] = useState<number | null>(existing?.predicted_deck_id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existing);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const topDecks = decks
    .filter(d => ["S", "A", "B"].includes(d.tier))
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 12);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck_id: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Already resolved
  if (existing?.correct != null) {
    return (
      <div className={`rounded-xl border p-4 ${existing.correct ? "border-green-500/40 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Your Prediction — {tournamentName}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{decks.find(d => d.id === existing.predicted_deck_id)?.name ?? "—"}</p>
            <p className={`text-xs mt-0.5 ${existing.correct ? "text-green-400" : "text-red-400"}`}>
              {existing.correct ? `✅ Correct! +${FANTASY_CONFIG.PREDICTION_BONUS}pts` : "❌ Missed this one"}
            </p>
          </div>
          {existing.correct && (
            <span className="text-2xl font-black text-green-400">+{existing.bonus_points}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">🎯 Predict the Winner</p>
          <p className="text-xs text-gray-500 mt-0.5">{tournamentName} · +{FANTASY_CONFIG.PREDICTION_BONUS}pts if correct</p>
        </div>
        {saved && selected && (
          <span className="text-[10px] rounded-full bg-blue-400/20 border border-blue-400/30 px-2.5 py-1 text-blue-300 font-bold">✓ Locked in</span>
        )}
      </div>

      <input
        type="text"
        placeholder="Search decks…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-400/50"
      />

      <div className="grid grid-cols-3 gap-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
        {topDecks.map(deck => (
          <button
            key={deck.id}
            onClick={() => { setSelected(deck.id); setSaved(false); }}
            className={`flex flex-col items-center rounded-lg border p-2 text-left transition-all ${
              selected === deck.id
                ? "border-blue-400/60 bg-blue-400/10 ring-1 ring-blue-400/40"
                : `${tierColors[deck.tier] ?? "border-gray-700"} hover:border-white/20`
            }`}
          >
            {deck.image_url && (
              <Image src={deck.image_url} alt={deck.name} width={28} height={28} className="object-contain mb-1" />
            )}
            <p className="text-[9px] text-center leading-tight text-gray-300 line-clamp-2">{deck.name}</p>
          </button>
        ))}
        {topDecks.length === 0 && (
          <p className="col-span-3 text-center text-xs text-gray-600 py-4">No decks match</p>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!selected || saving || saved}
        className="w-full rounded-lg bg-blue-500 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-blue-400 transition-colors"
      >
        {saving ? "Saving…" : saved ? "✓ Prediction saved" : "Lock in Prediction"}
      </button>
    </div>
  );
}
