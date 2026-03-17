"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { playerToSlug } from "@/lib/utils/playerSlug";

interface SearchResult {
  type: 'deck' | 'player' | 'tournament';
  name: string;
  href: string;
  meta?: string; // Additional info (e.g., "10.6% meta" for decks)
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search decks, players, tournaments..."
          className="w-full rounded-lg border border-gray-700 bg-gray-900/50 pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">🔍</span>
        
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
            Searching...
          </span>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-gray-900 shadow-xl z-50">
          {results.length > 0 ? (
            <div className="py-1">
              {/* Group by type */}
              {['deck', 'player', 'tournament'].map(type => {
                const typeResults = results.filter(r => r.type === type);
                if (typeResults.length === 0) return null;

                const typeLabels = {
                  deck: '📊 Decks',
                  player: '👤 Players',
                  tournament: '📅 Tournaments'
                };

                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {typeLabels[type as keyof typeof typeLabels]}
                    </div>
                    {typeResults.map((result, i) => (
                      <button
                        key={`${result.type}-${i}`}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-gray-300">{result.name}</span>
                        {result.meta && (
                          <span className="text-xs text-gray-600">{result.meta}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {isLoading ? 'Searching...' : 'No results found'}
            </div>
          )}
        </div>
      )}

      {/* Keyboard hint */}
      {isOpen && query.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-white/10 bg-gray-900 shadow-xl p-4 z-50">
          <p className="text-xs text-gray-500 text-center">
            Type to search decks, players, and tournaments
          </p>
        </div>
      )}
    </div>
  );
}
