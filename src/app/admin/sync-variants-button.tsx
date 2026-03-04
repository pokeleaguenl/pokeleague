"use client";
import { useState } from "react";

export default function SyncVariantsButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSync = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/decks/variants/sync", { method: "POST" });
      const json = await res.json();
      setMsg(json.message ?? JSON.stringify(json));
      setStatus(res.ok ? "done" : "error");
    } catch (e) {
      setMsg(String(e));
      setStatus("error");
    }
  };

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className={`rounded-lg border px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50
          ${status === "done" ? "border-green-600 text-green-400" :
            status === "error" ? "border-red-600 text-red-400" :
            "border-blue-600 text-blue-400 hover:border-blue-400"}`}
      >
        {status === "loading" ? "⏳ Syncing variants..." : status === "done" ? "✅ Variants synced" : "🔀 Sync Variants"}
      </button>
      {msg && <p className="mt-1 text-xs text-gray-500">{msg}</p>}
    </div>
  );
}
