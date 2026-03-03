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

    if (res.ok) {
      setResult(`✅ ${data.message}`);
    } else {
      setResult(`❌ ${data.error}`);
    }

    setLoading(false);
    // Reload to show updated table
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-50"
      >
        {loading ? "Syncing from Limitless..." : "🔄 Sync decks from Limitless"}
      </button>
      {result && (
        <p className="mt-3 text-sm text-gray-400">{result}</p>
      )}
    </div>
  );
}
