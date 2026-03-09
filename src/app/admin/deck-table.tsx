"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Deck {
  id: number;
  name: string;
  meta_share: number;
  cost: number;
  tier: string;
  limitless_id: number | null;
}

export default function DeckTable({ decks }: { decks: Deck[] }) {
  const [items, setItems] = useState(decks);
  const [saving, setSaving] = useState<number | null>(null);

  async function updateDeck(id: number, field: string, value: string) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    setSaving(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("decks")
      .update({ [field]: numValue, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: numValue } : d))
      );
    }
    setSaving(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-gray-500">
        No decks yet. Click &quot;Sync&quot; above to pull from Limitless.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 text-gray-400">
          <tr>
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Deck</th>
            <th className="py-2 pr-4">Tier</th>
            <th className="py-2 pr-4">Meta %</th>
            <th className="py-2 pr-4">Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((deck, i) => (
            <tr key={deck.id} className="border-b border-gray-800/50">
              <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
              <td className="py-3 pr-4 font-medium">{deck.name}</td>
              <td className="py-3 pr-4">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-bold">
                  {deck.tier}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-400">{deck.meta_share}%</td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={deck.cost}
                  onChange={(e) => updateDeck(deck.id, "cost", e.target.value)}
                  className="w-16 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-center text-yellow-400 focus:border-yellow-400 focus:outline-none"
                />
                {saving === deck.id && (
                  <span className="ml-2 text-xs text-gray-500">saving...</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
