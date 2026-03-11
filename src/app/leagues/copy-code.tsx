"use client";
import { useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={(e) => {
      e.preventDefault();
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors ${
        copied ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-gray-700 text-yellow-400 hover:border-yellow-400/40"
      }`}>
      <span className="tracking-widest">{code}</span>
      <span>{copied ? "✓" : "📋"}</span>
    </button>
  );
}
