"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props { initialUsername: string; initialDisplayName: string; totalPoints: number; }

export default function ProfileForm({ initialUsername, initialDisplayName, totalPoints }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username || null,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    setMsg(error ? `❌ ${error.message}` : "✅ Profile saved!");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-800 p-4 text-center">
        <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
        <p className="text-sm text-gray-400">Total points earned</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name shown on leaderboard"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none" />
        </div>
        <button onClick={save} disabled={saving}
          className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {msg && <p className="text-sm text-center text-gray-400">{msg}</p>}
      </div>
    </div>
  );
}
