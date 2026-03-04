import Link from "next/link";

const links = [
  { href: "/squad", icon: "🎴", label: "Squad" },
  { href: "/events", icon: "📊", label: "Points" },
  { href: "/leaderboard", icon: "🏆", label: "Rankings" },
  { href: "/leagues", icon: "🏅", label: "Leagues" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export default function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-yellow-400">⚡</span>
          <span>Poké<span className="text-yellow-400">League</span></span>
        </Link>
        <div className="flex items-center gap-0.5">
          {links.map(({ href, icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              <span className="text-base">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
