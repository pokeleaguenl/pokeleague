"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home",        icon: "🏠" },
  { href: "/squad",     label: "Squad",       icon: "⚔️" },
  { href: "/decks",     label: "Decks",       icon: "🃏" },
  { href: "/events",    label: "Events",      icon: "🏆" },
  { href: "/leaderboard", label: "Rankings",  icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  // Don't show on auth or landing pages
  if (!pathname || pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/8 bg-gray-950/95 backdrop-blur-md">
      <div className="flex items-stretch">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-colors
                ${active ? "text-yellow-400" : "text-gray-600 hover:text-gray-300"}`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? "text-yellow-400" : "text-gray-600"}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-yellow-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
