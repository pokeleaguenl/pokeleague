import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-800/80 bg-gray-950/90 px-4 py-3 backdrop-blur-sm">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity">
        <span>⚡</span>
        <span>Poké<span className="text-yellow-400">League</span></span>
        <span className="ml-1 text-xs font-normal text-gray-500 hidden sm:inline">Home</span>
      </Link>
      <div className="flex items-center gap-1 text-sm">
        <NavLink href="/squad">🎴 Squad</NavLink>
        <NavLink href="/events">📊 Points</NavLink>
        <NavLink href="/leaderboard">🏆</NavLink>
        <NavLink href="/leagues">🏅</NavLink>
        <NavLink href="/profile">👤</NavLink>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="rounded-lg px-2 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
      {children}
    </Link>
  );
}
