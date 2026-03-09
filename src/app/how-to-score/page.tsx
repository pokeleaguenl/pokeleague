export default function HowToScore() {
  const scoring = [
    { event: "Made Day 2", points: "+3 pts", icon: "📅" },
    { event: "Top 8 Finish", points: "+10 pts", icon: "🏅" },
    { event: "Tournament Win", points: "+25 pts", icon: "🏆" },
    { event: "Win Rate >60%", points: "+20 pts", icon: "📈" },
    { event: "Had at least 1 win", points: "+1 pt", icon: "⚔️" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        How to <span className="text-yellow-400">Score</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        Points are awarded when decks in your squad perform well at real-world Pokémon TCG tournaments.
      </p>

      {/* Squad structure */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Squad Structure</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-3">
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span className="font-semibold text-sm">Active (1 deck)</span>
            </div>
            <span className="font-bold text-yellow-400">2× points</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
            <div className="flex items-center gap-2">
              <span>🎴</span>
              <span className="font-semibold text-sm">Bench (5 decks)</span>
            </div>
            <span className="font-bold text-white">1× points</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/30 p-3">
            <div className="flex items-center gap-2">
              <span>🃏</span>
              <span className="font-semibold text-sm">Hand (4 decks)</span>
            </div>
            <span className="font-bold text-gray-500">0pts (unless Hand Boost)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Total squad: 10 decks within a 200pt budget</p>
      </section>

      {/* Points per deck */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Points Per Deck</h2>
        <div className="space-y-2">
          {scoring.map((s) => (
            <div key={s.event} className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{s.icon}</span>
                <p className="text-sm font-medium">{s.event}</p>
              </div>
              <span className="rounded-lg bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-400">{s.points}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
          <p className="text-xs font-semibold text-gray-400 mb-1">Points calculation order:</p>
          <p className="text-xs text-gray-500">① Base points → ② +1 win bonus → ③ Apply multiplier (2× / 3× / 0×)</p>
        </div>
      </section>

      {/* Stadium Effects */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">🏟 Stadium Effects</h2>
        <p className="mb-3 text-xs text-gray-400">Each effect can be used <strong>once per season</strong>. You can only activate <strong>one per event</strong>.</p>
        <div className="space-y-3">
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-yellow-300">⚡ ×3</span>
              <span className="text-xs text-gray-400">Once per season</span>
            </div>
            <p className="text-sm text-gray-300">Your Active deck scores <strong>3×</strong> instead of 2× for that event.</p>
            <p className="mt-1 text-xs text-gray-500">Best saved for a tournament where your Active deck is most likely to win big.</p>
          </div>
          <div className="rounded-xl border border-blue-400/30 bg-blue-400/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-blue-300">🃏 Hand Boost</span>
              <span className="text-xs text-gray-400">Once per season</span>
            </div>
            <p className="text-sm text-gray-300">All 4 Hand decks score <strong>1× normal points</strong> for that event.</p>
            <p className="mt-1 text-xs text-gray-500">Great when your Hand has strong decks that you think will perform.</p>
          </div>
        </div>
      </section>

      {/* Variants */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">🔀 Variants</h2>
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
          <p className="text-sm text-gray-300">Pick the <strong>specific build</strong> of your deck (e.g. &quot;Dragapult Dusknoir&quot; vs &quot;Dragapult Pidgeot&quot;) for an additional <strong>+25% bonus</strong> on that deck&apos;s points if it matches.</p>
        </div>
      </section>

      {/* Transfers */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">🔄 Transfers</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
            <span>Transfer points gained per event</span>
            <span className="font-bold text-yellow-400">+1</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
            <span>Maximum saved transfer points</span>
            <span className="font-bold text-white">3</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-800 p-3">
            <span>Decks swapped per transfer point</span>
            <span className="font-bold text-white">1 in / 1 out</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Transfers change your permanent squad. Swapping between Active/Bench/Hand is free and doesn&apos;t cost transfer points.</p>
      </section>

      {/* Lock-in */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">🔒 Lock-in</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>Lock your squad before the event deadline to be eligible for points.</p>
          <p>If your squad is saved but not locked, the last saved version is submitted automatically.</p>
          <p>Locking also confirms your Active/Bench/Hand positions and Stadium Effect choice.</p>
        </div>
      </section>

      {/* Privacy */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">👁 Privacy</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>🙈 <strong>Squads are hidden</strong> until the submission deadline passes — no one can see what you picked.</p>
          <p>📊 After the event: full score breakdowns are visible.</p>
          <p>🏅 Historic event squads are always visible in the event history.</p>
        </div>
      </section>
    </div>
  );
}
