"use client";

import { useState } from "react";

export default function SeedFantasyButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSeed() {
    if (!confirm("Seed fantasy archetypes, aliases, and events from existing data?")) return;
    
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/seed-fantasy", { method: "POST" });
    const data = await res.json();
    setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    setLoading(false);
  }

  return (
    <div>
      <button onClick={handleSeed} disabled={loading}
        className="rounded-lg border border-green-700 px-6 py-3 text-sm font-semibold text-green-400 hover:border-green-500 hover:text-green-300 disabled:opacity-50">
        {loading ? "Seeding..." : "🌱 Seed Fantasy Data"}
      </button>
      {result && <p className="mt-3 text-sm text-gray-400">{result}</p>}
    </div>
  );
}
