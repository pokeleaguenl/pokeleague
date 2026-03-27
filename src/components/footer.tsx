import Link from "next/link";

const LINKS = [
  { label: "How it Works", href: "/rules" },
  { label: "Decks", href: "/decks" },
  { label: "Events", href: "/events" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Leagues", href: "/leagues" },
];

const EXTERNAL = [
  { label: "Limitless TCG", href: "https://limitlesstcg.com" },
  { label: "RK9.gg", href: "https://rk9.gg" },
  { label: "Trainer Hill", href: "https://trainerhill.com" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-gray-950/80 pb-24 md:pb-6">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-black">
              Poké<span className="text-yellow-400">League</span>
            </Link>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed max-w-[200px]">
              Fantasy Pokémon TCG. Pick the meta, score the tournament, beat your rivals.
            </p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-lg">🎴</span>
              <span className="text-lg">⚡</span>
              <span className="text-lg">🏆</span>
            </div>
          </div>

          {/* Site links */}
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Navigate</p>
            <ul className="space-y-2">
              {LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* External resources */}
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-600">Resources</p>
            <ul className="space-y-2">
              {EXTERNAL.map(l => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
                    {l.label}
                    <span className="text-gray-700 text-xs">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-700">
          <p>© {new Date().getFullYear()} PokéLeague · Fan-made fantasy platform · Not affiliated with Nintendo or The Pokémon Company</p>
          <div className="flex gap-4">
            <Link href="/rules" className="hover:text-gray-400 transition-colors">Rules</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
