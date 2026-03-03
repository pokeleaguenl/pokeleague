export default function HowToScore() {
  const scoring = [
    { event: "Made Day 2", points: "+3", icon: "📅" },
    { event: "Top 8 Finish", points: "+10", icon: "🏅" },
    { event: "Tournament Win", points: "+25", icon: "🏆" },
    { event: "Win Rate >60%", points: "+20", icon: "📈" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        How to <span className="text-yellow-400">Score</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        Points are awarded when decks in your squad perform well at real-world Pokémon TCG tournaments.
      </p>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Points Per Deck</h2>
        <div className="space-y-3">
          {scoring.map((s) => (
            <div key={s.event} className="flex items-center justify-between rounded-lg border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <p className="font-medium">{s.event}</p>
              </div>
              <span className="rounded-lg bg-yellow-400/10 px-3 py-1 font-bold text-yellow-400">{s.points}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Active Deck Multiplier</h2>
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
          <p className="text-2xl font-bold text-yellow-400">1.5×</p>
          <p className="mt-1 text-sm text-gray-300">
            Your <strong>Active deck</strong> earns 1.5× the normal points. Choose wisely.
          </p>
          <p className="mt-2 text-xs text-gray-500">Example: Dragapult ex wins a tournament (+25pts). If it&apos;s your active deck, you get 37pts.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Squad Composition</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>🎴 Each squad has <strong>6 decks</strong>: 1 Active + 5 Bench</p>
          <p>💰 Decks cost points based on their <strong>meta share</strong> (higher tier = more expensive)</p>
          <p>🔒 <strong>Lock in your squad</strong> before the tournament starts to be eligible for points</p>
          <p>🔄 You can edit your squad between events (unlocked squads only)</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Tournaments</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>📍 Points are awarded for <strong>Regional Championships</strong>, <strong>International Championships</strong>, and <strong>World Championships</strong></p>
          <p>📊 Results are sourced from Limitless TCG and updated after each event</p>
        </div>
      </section>
    </div>
  );
}
