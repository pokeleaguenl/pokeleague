"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  { emoji: "🎴", title: "Build your squad", desc: "Pick 1 active deck (2×) + 5 bench + 4 reserve within a 200pt budget." },
  { emoji: "🔒", title: "Lock before the event", desc: "Squads lock automatically before each tournament starts. Save early!" },
  { emoji: "🏆", title: "Score points", desc: "Earn points based on how well your decks place in real RK9 standings." },
];

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/8 to-transparent p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-black text-lg text-yellow-400">Welcome, Trainer! 🎉</p>
          <p className="text-sm text-gray-400 mt-0.5">Here's how PokéLeague works — get started in 3 steps.</p>
        </div>
        <button onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors p-1">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-black/20 p-3">
            <span className="text-2xl shrink-0">{step.emoji}</span>
            <div>
              <p className="text-sm font-bold text-white">{i + 1}. {step.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/squad"
          className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
          Build Squad →
        </Link>
        <Link href="/rules"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/30 transition-colors">
          Read the rules
        </Link>
      </div>
    </div>
  );
}
