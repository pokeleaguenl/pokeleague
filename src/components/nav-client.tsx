"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const mainLinks = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/squad", icon: "🎴", label: "Squad" },
];

const analyticsLinks = [
  { href: "/decks", icon: "📊", label: "Decks" },
  { href: "/meta", icon: "📈", label: "Meta Timeline" },
  { href: "/matchups", icon: "⚔️", label: "Matchups" },
];

const competeLinks = [
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/leagues", icon: "🏅", label: "Leagues" },
  { href: "/events", icon: "📅", label: "Events" },
];

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [competeOpen, setCompeteOpen] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const competeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (analyticsRef.current && !analyticsRef.current.contains(event.target as Node)) {
        setAnalyticsOpen(false);
      }
      if (competeRef.current && !competeRef.current.contains(event.target as Node)) {
        setCompeteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if any analytics route is active
  const analyticsActive = analyticsLinks.some(link => 
    pathname === link.href || pathname.startsWith(link.href + "/")
  );

  // Check if any compete route is active
  const competeActive = competeLinks.some(link => 
    pathname === link.href || pathname.startsWith(link.href + "/")
  );

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
        <div className="flex items-center gap-0.5">
          {isLoggedIn ? (
            <>
              {/* Home & Squad */}
              {mainLinks.map(({ href, icon, label }) => {
                const active = pathname === href;
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

              {/* Analytics Dropdown */}
              <div className="relative" ref={analyticsRef}>
                <button
                  onClick={() => setAnalyticsOpen(!analyticsOpen)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap
                    ${analyticsActive
                      ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span className="text-base leading-none">📊</span>
                  <span className="hidden md:inline">Analytics</span>
                  <span className="text-xs">▼</span>
                </button>
                
                {analyticsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-white/10 bg-gray-900 shadow-xl py-1 z-50">
                    {analyticsLinks.map(({ href, icon, label }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setAnalyticsOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                            ${active
                              ? "bg-yellow-400/10 text-yellow-400 font-medium"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compete Dropdown */}
              <div className="relative" ref={competeRef}>
                <button
                  onClick={() => setCompeteOpen(!competeOpen)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap
                    ${competeActive
                      ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span className="text-base leading-none">🏆</span>
                  <span className="hidden md:inline">Compete</span>
                  <span className="text-xs">▼</span>
                </button>
                
                {competeOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-white/10 bg-gray-900 shadow-xl py-1 z-50">
                    {competeLinks.map(({ href, icon, label }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setCompeteOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                            ${active
                              ? "bg-yellow-400/10 text-yellow-400 font-medium"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Public links - Analytics dropdown only */}
              <div className="relative" ref={analyticsRef}>
                <button
                  onClick={() => setAnalyticsOpen(!analyticsOpen)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap
                    ${analyticsActive
                      ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span className="text-base leading-none">📊</span>
                  <span className="hidden md:inline">Analytics</span>
                  <span className="text-xs">▼</span>
                </button>
                
                {analyticsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-white/10 bg-gray-900 shadow-xl py-1 z-50">
                    {analyticsLinks.map(({ href, icon, label }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setAnalyticsOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                            ${active
                              ? "bg-yellow-400/10 text-yellow-400 font-medium"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Leaderboard for public */}
              <Link
                href="/leaderboard"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap
                  ${pathname === "/leaderboard"
                    ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="text-base leading-none">🏆</span>
                <span className="hidden md:inline">Leaderboard</span>
              </Link>
            </>
          )}
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
