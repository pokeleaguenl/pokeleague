"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainLinks = [
  { href: "/squad",        icon: "🎴", label: "Squad" },
  { href: "/events",       icon: "📅", label: "Events" },
  { href: "/decks",        icon: "📊", label: "Decks" },
  { href: "/leagues",      icon: "🏅", label: "Leagues" },
  { href: "/how-to-score", icon: "📖", label: "Rules" },
];

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-yellow-400">⚡</span>
          <span>Poké<span className="text-yellow-400">League</span></span>
        </Link>

        {/* Main links */}
        <div className="flex items-center gap-0.5">
          {mainLinks.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors
                  ${active
                    ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}>
                <span className="text-base">{icon}</span>
                <span className="hidden sm:inline">{label}</span>
                {active && <span className="hidden sm:block h-1 w-1 rounded-full bg-yellow-400" />}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-1.5">
          {isLoggedIn ? (
            <Link href="/profile"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors
                ${pathname === "/profile"
                  ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
              <span>👤</span>
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <>
              <Link href="/auth/login"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/auth/signup"
                className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
