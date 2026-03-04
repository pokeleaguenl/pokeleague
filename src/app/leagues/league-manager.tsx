"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeagueManager() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    if (!name) return;
    setCreating(true); setMsg(null);
    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, is_public: isPublic }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/leagues/${data.code}`);
    } else {
      setMsg(`❌ ${data.error}`);
      setCreating(false);
    }
  }

  async function join() {
    if (!code) return;
    setJoining(true); setMsg(null);
    const res = await fetch("/api/leagues/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/leagues/${data.league.code}`);
    } else {
      setMsg(`❌ ${data.error}`);
      setJoining(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create league */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Create a League</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="League name"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />

        {/* Public/Private toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPublic(false)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !isPublic ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-gray-700 text-gray-500 hover:border-gray-600"
            }`}
          >
            🔒 Private
          </button>
          <button
            onClick={() => setIsPublic(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isPublic ? "border-blue-400 bg-blue-400/10 text-blue-400" : "border-gray-700 text-gray-500 hover:border-gray-600"
            }`}
          >
            🌐 Public
          </button>
          <span className="text-xs text-gray-600">
            {isPublic ? "Anyone can find and join" : "Invite only via code"}
          </span>
        </div>

        <button onClick={create} disabled={creating || !name}
          className="w-full rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
          {creating ? "Creating..." : "Create League"}
        </button>
      </div>

      {/* Join with code */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Join with a Code</h3>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDEF"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-mono uppercase placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
          <button onClick={join} disabled={joining || !code}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50">
            {joining ? "..." : "Join"}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-gray-400">{msg}</p>}
    </div>
  );
}
