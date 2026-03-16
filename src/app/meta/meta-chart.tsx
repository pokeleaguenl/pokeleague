"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  event_date: string;
}

interface DeckData {
  name: string;
  slug: string;
  countsByTournament: Record<string, number>;
}

interface MetaChartProps {
  deckData: DeckData[];
  tournaments: Tournament[];
}

const CHART_COLORS = [
  '#facc15', // yellow-400
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#a855f7', // purple-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

export default function MetaChart({ deckData, tournaments }: MetaChartProps) {
  const [selectedDecks, setSelectedDecks] = useState<string[]>(
    deckData.slice(0, 5).map(d => d.name) // Default to top 5
  );

  const toggleDeck = (deckName: string) => {
    setSelectedDecks(prev =>
      prev.includes(deckName)
        ? prev.filter(n => n !== deckName)
        : [...prev, deckName]
    );
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return tournaments.map(tournament => {
      const dataPoint: any = {
        date: tournament.event_date,
        name: tournament.name.replace(/Pokémon/g, '').replace(/Regional Championships|International Championships/g, '').trim().substring(0, 20),
        fullName: tournament.name,
      };

      for (const deck of deckData) {
        if (selectedDecks.includes(deck.name)) {
          dataPoint[deck.name] = deck.countsByTournament[tournament.id] || 0;
        }
      }

      return dataPoint;
    });
  }, [tournaments, deckData, selectedDecks]);

  return (
    <div className="space-y-6">
      {/* Deck Toggles */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Select Decks to Display
        </h2>
        <div className="flex flex-wrap gap-2">
          {deckData.map((deck, i) => {
            const isSelected = selectedDecks.includes(deck.name);
            const color = CHART_COLORS[i % CHART_COLORS.length];

            return (
              <button
                key={deck.name}
                onClick={() => toggleDeck(deck.name)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: isSelected ? color : 'transparent', border: `2px solid ${color}` }}
                />
                {deck.name}
              </button>
            );
          })}
        </div>
        {selectedDecks.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">Select at least one deck to display the chart</p>
        )}
      </div>

      {/* Chart */}
      {selectedDecks.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6">
            Tournament Entries Over Time
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{ value: 'Entries', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#facc15', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {selectedDecks.map((deckName, i) => {
                const color = CHART_COLORS[i % CHART_COLORS.length];
                return (
                  <Line
                    key={deckName}
                    type="monotone"
                    dataKey={deckName}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Deck Links */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          View Deck Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deckData.map(deck => (
            <Link
              key={deck.slug}
              href={`/decks/${deck.slug}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3 hover:bg-black/40 hover:border-yellow-400/30 transition-all group"
            >
              <span className="font-medium group-hover:text-yellow-400 transition-colors">
                {deck.name}
              </span>
              <span className="text-gray-600 group-hover:text-yellow-400 transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
