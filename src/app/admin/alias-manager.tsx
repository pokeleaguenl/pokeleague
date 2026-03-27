"use client";

import { useState, useEffect, useCallback } from "react";

interface UnmatchedEntry { name: string; count: number }
interface Archetype { id: number; name: string; slug: string }

export default function AliasManager() {
  const [unmatched, setUnmatched] = useState<UnmatchedEntry[]>([]);
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [archetypeSearch, setArchetypeSearch] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/aliases");
      const data = await res.json();
      setUnmatched(data.unmatched ?? []);
      setArchetypes(data.archetypes ?? []);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  async function saveAlias(deckName: string) {
    const archId = assignments[deckName];
    if (!archId) return;
    setSaving(s => ({ ...s, [deckName]: true }));
    try {
      const res = await fetch("/api/admin/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: deckName, archetype_id: archId }),
      });
      if (res.ok) {
        setSaved(s => ({ ...s, [deckName]: true }));
        setUnmatched(u => u.filter(e => e.name !== deckName));
      }
    } finally {
      setSaving(s => ({ ...s, [deckName]: false }));
    }
  }

  const filtered = unmatched.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  function filteredArchetypes(deckName: string) {
    const q = (archetypeSearch[deckName] ?? "").toLowerCase();
    if (!q) return archetypes.slice(0, 15);
    return archetypes.filter(a =>
      a.name.toLowerCase().includes(q) || a.slug.includes(q)
    ).slice(0, 15);
  }

  return (
    <div className="rounded-lg border border-orange-700/50 bg-orange-900/10 p-4 space-y-3 col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-300">🗺 Alias Manager</p>
          <p className="text-xs text-gray-500">Map unmatched deck names from RK9 to known archetypes</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-orange-600 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:border-orange-400 disabled:opacity-40"
        >
          {loading ? "Loading…" : loaded ? `Reload (${unmatched.length} left)` : "Load Unmatched"}
        </button>
      </div>

      {loaded && unmatched.length === 0 && (
        <p className="text-sm text-green-400 text-center py-4">All deck names are mapped!</p>
      )}

      {loaded && unmatched.length > 0 && (
        <>
          <input
            type="text"
            placeholder={`Search ${unmatched.length} unmatched names…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-400/50"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(entry => (
              <div key={entry.name} className={`rounded-lg bg-black/20 p-3 border ${saved[entry.name] ? "border-green-500/30" : "border-white/5"}`}>
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-orange-300 truncate">{entry.name}</p>
                    <p className="text-[10px] text-gray-600">{entry.count} occurrences</p>
                  </div>
                  {saved[entry.name] && (
                    <span className="text-green-400 text-xs shrink-0">✓ saved</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search archetypes…"
                    value={archetypeSearch[entry.name] ?? ""}
                    onChange={e => setArchetypeSearch(s => ({ ...s, [entry.name]: e.target.value }))}
                    className="flex-1 rounded bg-black/30 border border-white/10 px-2 py-1 text-[10px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-400/40"
                  />
                  <select
                    value={assignments[entry.name] ?? ""}
                    onChange={e => setAssignments(a => ({ ...a, [entry.name]: parseInt(e.target.value) }))}
                    className="flex-1 rounded bg-black/30 border border-white/10 px-2 py-1 text-[10px] text-gray-200 focus:outline-none focus:border-orange-400/40"
                  >
                    <option value="">— pick archetype —</option>
                    {filteredArchetypes(entry.name).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => saveAlias(entry.name)}
                    disabled={!assignments[entry.name] || saving[entry.name]}
                    className="rounded bg-orange-600 px-3 py-1 text-[10px] font-bold text-white disabled:opacity-40 hover:bg-orange-500"
                  >
                    {saving[entry.name] ? "…" : "Map"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
