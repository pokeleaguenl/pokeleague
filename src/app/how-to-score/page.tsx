export default function HowToScore() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">
        How to <span className="text-yellow-400">Score</span>
      </h1>
      <p className="mb-10 text-sm text-gray-400">
        Pick 10 real Pokémon TCG decks. Earn points when they perform at official tournaments.
      </p>

      {/* Squad structure */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Squad Structure</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
            <div>
              <p className="font-bold text-yellow-300">⭐ Active — 1 deck</p>
              <p className="text-xs text-gray-400 mt-0.5">Your star pick. Scores double points.</p>
            </div>
            <span className="text-2xl font-black text-yellow-400">2×</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/20 p-4">
            <div>
              <p className="font-semibold">🎴 Bench — 5 decks</p>
              <p className="text-xs text-gray-500 mt-0.5">Your core picks. Score normal points.</p>
            </div>
            <span className="text-2xl font-black text-white">1×</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/20 p-4 opacity-70">
            <div>
              <p className="font-semibold text-gray-400">🃏 Hand — 4 decks</p>
              <p className="text-xs text-gray-500 mt-0.5">Reserve decks. Score 0pts unless Hand Boost is active.</p>
            </div>
            <span className="text-2xl font-black text-gray-600">0×</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">10 decks total · 200pt budget · free to rearrange Active / Bench / Hand</p>
      </section>

      {/* Points per deck */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Points Per Deck Per Event</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/20 overflow-hidden divide-y divide-gray-800">
          {[
            { icon: "⚔️", label: "Had at least 1 win", pts: "+1" },
            { icon: "📅", label: "Made Day 2", pts: "+3" },
            { icon: "📈", label: "Win rate &gt;60%", pts: "+20" },
            { icon: "🏅", label: "Top 8 finish", pts: "+10" },
            { icon: "🏆", label: "Tournament win", pts: "+25" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg w-7 text-center">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              <span className="font-bold text-yellow-400">{s.pts}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-600">Points stack — a deck that wins and has &gt;60% WR earns +25 +20 +10 +3 +1 = <span className="text-yellow-400 font-semibold">59 pts</span> before multiplier</p>
      </section>

      {/* Worked example */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Example Event</h2>
        <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-4 space-y-3 text-sm">
          <p className="text-gray-400 text-xs">Imagine your Active deck wins the tournament with a 70% win rate:</p>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Had a win</span><span className="text-yellow-400">+1</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Made Day 2</span><span className="text-yellow-400">+3</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Win rate &gt;60%</span><span className="text-yellow-400">+20</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Top 8</span><span className="text-yellow-400">+10</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tournament win</span><span className="text-yellow-400">+25</span></div>
            <div className="border-t border-gray-700 pt-1 flex justify-between"><span className="text-gray-300">Base points</span><span className="text-white font-bold">59</span></div>
            <div className="flex justify-between"><span className="text-gray-300">Active 2× multiplier</span><span className="text-white font-bold">× 2</span></div>
            <div className="border-t border-gray-700 pt-1 flex justify-between text-base"><span className="text-yellow-400 font-bold">Your points from Active</span><span className="text-yellow-400 font-black">118 pts</span></div>
          </div>
        </div>
      </section>

      {/* Stadium Effects */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Stadium Effects — Once Per Season</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-yellow-300">⚡ ×3 Boost</p>
              <span className="text-[10px] rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-yellow-400 font-bold">1× per season</span>
            </div>
            <p className="text-sm text-gray-300">Your Active deck scores <strong>3×</strong> instead of 2× for one event.</p>
            <p className="mt-1 text-xs text-gray-500">Best saved for when your Active is likely to go deep.</p>
          </div>
          <div className="rounded-xl border border-blue-400/30 bg-blue-400/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-blue-300">🃏 Hand Boost</p>
              <span className="text-[10px] rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-blue-300 font-bold">1× per season</span>
            </div>
            <p className="text-sm text-gray-300">All 4 Hand decks score <strong>1×</strong> normal points for one event.</p>
            <p className="mt-1 text-xs text-gray-500">Great when your Hand has strong decks you expect to perform.</p>
          </div>
        </div>
      </section>

      {/* Transfers */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Transfers</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/20 overflow-hidden divide-y divide-gray-800 mb-3">
          {[
            ["Transfer points earned per event", "+1"],
            ["Max saved transfer points", "3"],
            ["Cost to swap a deck", "1 point"],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-gray-300">{label}</span>
              <span className="font-bold text-yellow-400">{val}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">Swapping decks between Active / Bench / Hand is always free — it only costs a transfer point to swap a deck <em>out of your squad entirely</em>.</p>
      </section>

      {/* Lock-in & Privacy */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Lock-in & Privacy</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex gap-3 rounded-xl border border-gray-800 p-3">
            <span>🔒</span>
            <p>Lock your squad before the event deadline to earn points. Your last saved squad is auto-submitted if not locked.</p>
          </div>
          <div className="flex gap-3 rounded-xl border border-gray-800 p-3">
            <span>🙈</span>
            <p>Squads are <strong>hidden until the deadline</strong> — no one can see your picks beforehand.</p>
          </div>
          <div className="flex gap-3 rounded-xl border border-gray-800 p-3">
            <span>📊</span>
            <p>After the event, full score breakdowns and all squads become visible.</p>
          </div>
        </div>
      </section>

      {/* Variants */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Variants</h2>
        <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-4 text-sm text-gray-300">
          <p>Pick the <strong>specific build</strong> of a deck (e.g. &quot;Dragapult Dusknoir&quot; vs &quot;Dragapult Pidgeot&quot;) for a <strong className="text-purple-300">+25% bonus</strong> on that deck&apos;s points if it matches the actual tournament winner&apos;s build.</p>
        </div>
      </section>
    </div>
  );
}
