"use client";

import { useState } from "react";

export default function ShareSquadButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/30 transition-colors"
    >
      {copied ? "✓ Copied!" : "🔗 Share"}
    </button>
  );
}
