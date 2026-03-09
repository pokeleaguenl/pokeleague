"use client";

import { useState } from "react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/decks/sync", { method: "POST" });
    const data = await res.json();
    setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    setLoading(false);
    if (res.ok) window.location.reload();
  }

  return (
    <div>
      <button onClick={handleSync} disabled={loading}
        className="rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
        {loading ? "Syncing decks..." : "🔄 Sync decks from Limitless"}
      </button>
      {result && <p className="mt-3 text-sm text-gray-400">{result}</p>}
    </div>
  );
}
