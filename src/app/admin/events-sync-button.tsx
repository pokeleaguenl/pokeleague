"use client";

import { useState } from "react";

export default function EventsSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/events/sync", { method: "POST" });
    const data = await res.json();
    setResult(res.ok ? `✅ ${data.message}` : `❌ ${data.error}: ${data.details ?? ""}`);
    setLoading(false);
    if (res.ok) window.location.reload();
  }

  return (
    <div>
      <button onClick={handleSync} disabled={loading}
        className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-50">
        {loading ? "Syncing events..." : "🗓️ Sync TCG events from RK9"}
      </button>
      {result && <p className="mt-3 text-sm text-gray-400">{result}</p>}
    </div>
  );
}
