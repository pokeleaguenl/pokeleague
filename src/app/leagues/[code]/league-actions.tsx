"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  code: string;
  isOwner: boolean;
  leagueId: number;
  userId: string;
}

export default function LeagueActions({ code, isOwner, leagueId, userId }: Props) {
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const router = useRouter();

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveLeague = async () => {
    setLeaving(true);
    await fetch("/api/leagues/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ league_id: leagueId, user_id: userId }),
    });
    router.push("/leagues");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/30 p-4">
      <div>
        <p className="text-xs text-gray-500 mb-1">Invite code</p>
        <button onClick={copyCode}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors ${
            copied ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-gray-700 text-yellow-400 hover:border-yellow-400/50"
          }`}>
          <span className="tracking-widest">{code}</span>
          <span className="text-xs">{copied ? "✓ Copied!" : "📋"}</span>
        </button>
      </div>

      {!isOwner && (
        <>
          {showLeave ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Leave league?</span>
              <button onClick={leaveLeague} disabled={leaving}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                {leaving ? "Leaving..." : "Yes, leave"}
              </button>
              <button onClick={() => setShowLeave(false)}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLeave(true)}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              Leave league
            </button>
          )}
        </>
      )}
    </div>
  );
}
