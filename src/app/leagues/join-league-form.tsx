"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinLeagueForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });

      if (res.ok) {
        router.push(`/leagues/${code.toUpperCase().trim()}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join league");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter 6-letter code"
        maxLength={6}
        className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-2.5 font-mono text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 font-bold text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Joining..." : "Join League"}
      </button>
    </form>
  );
}
