"use client";

import { useState } from "react";

export default function PopulateArchetypesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePopulate() {
    if (!confirm("Populate fantasy_archetypes from decks table?")) return;
    
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/populate-archetypes", { method: "POST" });
    const data = await res.json();
    setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    setLoading(false);
  }

  return (
    <div>
      <button onClick={handlePopulate} disabled={loading}
        className="rounded-lg border border-blue-700 px-6 py-3 text-sm font-semibold text-blue-400 hover:border-blue-500 hover:text-blue-300 disabled:opacity-50">
        {loading ? "Populating..." : "📚 Populate Archetypes"}
      </button>
      {result && <p className="mt-3 text-sm text-gray-400">{result}</p>}
    </div>
  );
}
