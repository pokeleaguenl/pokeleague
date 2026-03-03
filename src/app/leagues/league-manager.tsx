"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeagueManager() {
  const router = useRouter();
  const [name, setName] = useState("");
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
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✅ Created! Code: ${data.code}`);
      setName("");
      router.refresh();
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setCreating(false);
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
      setMsg(`✅ Joined ${data.league.name}!`);
      setCode("");
      router.refresh();
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setJoining(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New league name"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
        <button onClick={create} disabled={creating}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
          {creating ? "..." : "Create"}
        </button>
      </div>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter league code"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-mono uppercase placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
        <button onClick={join} disabled={joining}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50">
          {joining ? "..." : "Join"}
        </button>
      </div>
      {msg && <p className="text-sm text-gray-400">{msg}</p>}
    </div>
  );
}
