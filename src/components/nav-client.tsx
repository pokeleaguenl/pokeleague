"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import GlobalSearch from "./global-search";

const mainLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/squad", label: "Squad" },
];

const analyticsLinks = [
  { href: "/decks", label: "Decks" },
  { href: "/meta", label: "Meta Timeline" },
  { href: "/matchups", label: "Matchups" },
];

const competeLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leagues", label: "Leagues" },
  { href: "/events", label: "Events" },
  { href: "/rules", label: "How it Works" },
];

// Simple SVG icons
const Icons = {
  Home: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Squad: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [competeOpen, setCompeteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const competeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (analyticsRef.current && !analyticsRef.current.contains(event.target as Node)) setAnalyticsOpen(false);
      if (competeRef.current && !competeRef.current.contains(event.target as Node)) setCompeteOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const analyticsActive = analyticsLinks.some((l) => isActive(l.href));
  const competeActive = competeLinks.some((l) => isActive(l.href));

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap ${
      active ? "bg-yellow-400/10 text-yellow-400 font-semibold" : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  const dropdownLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
      active ? "bg-yellow-400/10 text-yellow-400 font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 font-black text-lg tracking-tight hover:opacity-80 transition-opacity flex-shrink-0">
              <Image src="/logo.svg" alt="PokéLeague" width={28} height={28} className="rounded-sm" />
              <span className="hidden sm:inline">Poké<span className="text-yellow-400">League</span></span>
            </Link>

            {/* Search — desktop center */}
            <div className="hidden md:block flex-1 max-w-md">
              <GlobalSearch />
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {isLoggedIn && (
                <>
                  <Link href="/dashboard" className={navLinkClass(isActive("/dashboard"))}>
                    <Icons.Home /><span className="hidden lg:inline">Home</span>
                  </Link>
                  <Link href="/squad" className={navLinkClass(isActive("/squad"))}>
                    <Icons.Squad /><span className="hidden lg:inline">Squad</span>
                  </Link>
                </>
              )}

              {/* Analytics dropdown */}
              <div className="relative" ref={analyticsRef}>
                <button onClick={() => { setAnalyticsOpen(!analyticsOpen); setCompeteOpen(false); }}
                  className={navLinkClass(analyticsActive)}>
                  <Icons.Chart /><span className="hidden lg:inline">Analytics</span><Icons.ChevronDown />
                </button>
                {analyticsOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 rounded-xl border border-white/10 bg-gray-900 shadow-2xl py-1 z-50 overflow-hidden">
                    {analyticsLinks.map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setAnalyticsOpen(false)} className={dropdownLinkClass(isActive(href))}>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Compete dropdown */}
              <div className="relative" ref={competeRef}>
                <button onClick={() => { setCompeteOpen(!competeOpen); setAnalyticsOpen(false); }}
                  className={navLinkClass(competeActive)}>
                  <Icons.Trophy /><span className="hidden lg:inline">Compete</span><Icons.ChevronDown />
                </button>
                {competeOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 rounded-xl border border-white/10 bg-gray-900 shadow-2xl py-1 z-50 overflow-hidden">
                    {competeLinks.map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setCompeteOpen(false)} className={dropdownLinkClass(isActive(href))}>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isLoggedIn ? (
                <Link href="/profile" className={navLinkClass(pathname.startsWith("/profile"))}>
                  <Icons.User /><span className="hidden sm:inline">Profile</span>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Log in</Link>
                  <Link href="/auth/signup" className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">Sign up</Link>
                </>
              )}
            </div>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>

          {/* Mobile search */}
          <div className="md:hidden mt-2">
            <GlobalSearch />
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 h-full w-72 bg-gray-950 border-l border-white/10 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 pt-16 space-y-1">
              {isLoggedIn && (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 mb-2">Main</p>
                  {mainLinks.map(({ href, label }) => (
                    <Link key={href} href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href) ? "bg-yellow-400/10 text-yellow-400" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                      {label}
                    </Link>
                  ))}
                </>
              )}

              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 mb-2 mt-4">Analytics</p>
              {analyticsLinks.map(({ href, label }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href) ? "bg-yellow-400/10 text-yellow-400" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                  {label}
                </Link>
              ))}

              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 mb-2 mt-4">Compete</p>
              {competeLinks.map(({ href, label }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href) ? "bg-yellow-400/10 text-yellow-400" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                  {label}
                </Link>
              ))}

              <div className="pt-4 border-t border-white/8 mt-4">
                {isLoggedIn ? (
                  <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    Profile
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/auth/login" className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-center text-gray-300 hover:text-white transition-colors">Log in</Link>
                    <Link href="/auth/signup" className="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-center text-gray-900 hover:bg-yellow-300 transition-colors">Sign up</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
