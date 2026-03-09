"use client";

import { useState } from "react";

export default function Clean2023Button() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClean() {
    if (!confirm("Delete all tournaments with '2023' in the name?")) return;
    
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/clean-2023-events", { method: "DELETE" });
    const data = await res.json();
    setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    setLoading(false);
    if (res.ok) setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div>
      <button onClick={handleClean} disabled={loading}
        className="rounded-lg border border-red-700 px-6 py-3 text-sm font-semibold text-red-400 hover:border-red-500 hover:text-red-300 disabled:opacity-50">
        {loading ? "Cleaning..." : "🗑️ Clean 2023 Events"}
      </button>
      {result && <p className="mt-3 text-sm text-gray-400">{result}</p>}
    </div>
  );
}
