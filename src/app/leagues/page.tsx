"use client";
// Note: client component needed for copy-to-clipboard functionality

import { useEffect, useState } from "react";
import Link from "next/link";
import LeagueManager from "./league-manager";

interface League {
  id: number;
  name: string;
  code: string;
  owner_id: string | null;
  is_public: boolean;
  is_global: boolean;
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={(e) => { e.preventDefault(); copy(); }}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono transition-colors ${
        copied ? "border-green-500 bg-green-500/10 text-green-400" : "border-gray-600 bg-gray-900 text-yellow-400 hover:border-yellow-400/50"
      }`}>
      <span className="tracking-widest">{code}</span>
      <span className="text-xs">{copied ? "✓ Copied!" : "📋"}</span>
    </button>
  );
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues").then(r => r.json()).then((data) => {
      if (Array.isArray(data)) setLeagues(data);
    });
    // Get current user id for owner check
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d?.id) setUserId(d.id);
    }).catch(() => {});
  }, []);

  // Separate global from custom leagues
  const globalLeague = leagues.find(l => l.is_global);
  const myLeagues = leagues.filter(l => !l.is_global);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        My <span className="text-yellow-400">Leagues</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Create a league or join one with a code.</p>

      {/* Global League card */}
      {globalLeague && (
        <Link href="/leagues/global"
          className="mb-8 flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 hover:border-yellow-400/60 transition-colors block">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold">🌍 Global League</p>
              <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] text-yellow-400 font-semibold">EVERYONE</span>
            </div>
            <p className="text-xs text-gray-400">All trainers, one leaderboard</p>
          </div>
          <span className="text-gray-500">→</span>
        </Link>
      )}

      <LeagueManager />

      {myLeagues.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Your Leagues</h2>
          <div className="space-y-3">
            {myLeagues.map((league) => {
              const isOwner = userId && league.owner_id === userId;
              return (
                <Link key={league.id} href={`/leagues/${league.code}`}
                  className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-yellow-400/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{league.name}</p>
                      <span className="shrink-0 text-xs">
                        {league.is_public ? "🌐" : "🔒"}
                      </span>
                    </div>
                    {isOwner ? (
                      <CopyCode code={league.code} />
                    ) : (
                      <p className="text-xs text-gray-500">
                        Code: <span className="font-mono text-yellow-400">{league.code}</span>
                      </p>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 text-gray-500">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
