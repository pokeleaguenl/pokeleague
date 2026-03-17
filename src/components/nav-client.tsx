"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const mainLinks = [
  { href: "/dashboard",    icon: "🏠", label: "Home"        },
  { href: "/squad",        icon: "🎴", label: "Squad"       },
  { href: "/decks",        icon: "📊", label: "Decks"       },
  { href: "/meta",         icon: "📈", label: "Meta"        },
  { href: "/matchups",     icon: "⚔️", label: "Matchups"    },
  { href: "/leaderboard",  icon: "🏆", label: "Leaderboard" },
  { href: "/leagues",      icon: "🏅", label: "Leagues"     },
  { href: "/events",       icon: "📅", label: "Events"      },
];

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        {/* Logo */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-black text-lg tracking-tight hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <Image src="/logo.svg" alt="PokéLeague" width={28} height={28} className="rounded-sm" />
          <span className="hidden sm:inline">Poké<span className="text-yellow-400">League</span></span>
        </Link>

        {/* Main links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {(isLoggedIn ? mainLinks : mainLinks.filter(l => l.href === "/decks" || l.href === "/meta" || l.href === "/matchups" || l.href === "/leaderboard")).map(({ href, icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap
                  ${active
                    ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Auth + Rules */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Rules — small subtle link */}
          <Link href="/how-to-score"
            className={`hidden sm:flex items-center rounded-lg px-2 py-1.5 text-xs transition-colors
              ${pathname === "/how-to-score"
                ? "text-yellow-400"
                : "text-gray-600 hover:text-gray-400"
              }`}
          >
            📖 Rules
          </Link>

          {isLoggedIn ? (
            <Link href="/profile"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ml-1
                ${pathname.startsWith("/profile")
                  ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
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
