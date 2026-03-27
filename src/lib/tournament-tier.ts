// Detect Pokémon TCG tournament tier from the tournament name

export type TournamentTier = "worlds" | "international" | "special" | "regional" | "challenge";

export const TIER_META: Record<TournamentTier, {
  label: string; icon: string;
  border: string; bg: string; text: string;
}> = {
  worlds:        { label: "World Championship", icon: "🌍", border: "border-yellow-400/60", bg: "bg-yellow-400/10", text: "text-yellow-400"  },
  international: { label: "International",       icon: "🌐", border: "border-purple-500/60", bg: "bg-purple-500/10", text: "text-purple-400" },
  special:       { label: "Special Event",       icon: "⭐", border: "border-blue-400/60",   bg: "bg-blue-400/10",   text: "text-blue-400"   },
  regional:      { label: "Regional",            icon: "🏆", border: "border-orange-500/50", bg: "bg-orange-500/8",  text: "text-orange-400" },
  challenge:     { label: "Challenge",           icon: "🎯", border: "border-white/10",      bg: "bg-white/3",       text: "text-gray-400"   },
};

export function getTournamentTier(name: string): TournamentTier {
  const lower = name.toLowerCase();
  if (lower.includes("world")) return "worlds";
  if (lower.includes("international") || lower.includes("euic") || lower.includes("naic") || lower.includes("ocic") || lower.includes("latin america")) return "international";
  if (lower.includes("special") || lower.includes("major") || lower.includes("open")) return "special";
  if (lower.includes("regional") || lower.includes("regionals")) return "regional";
  return "challenge";
}
