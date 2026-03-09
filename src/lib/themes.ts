export interface Theme {
  id: string;
  name: string;
  emoji: string;
  bg: string;           // Tailwind bg gradient classes
  border: string;       // accent border color
  accent: string;       // text accent
  cardBg: string;       // slot card bg
  overlay: string;      // subtle overlay on playmat
}

export const THEMES: Theme[] = [
  {
    id: "fire",
    name: "Fire",
    emoji: "🔥",
    bg: "bg-gradient-to-br from-red-950 via-orange-950 to-gray-950",
    border: "border-orange-500",
    accent: "text-orange-400",
    cardBg: "bg-red-950/60",
    overlay: "from-orange-900/20 to-red-900/10",
  },
  {
    id: "water",
    name: "Water",
    emoji: "💧",
    bg: "bg-gradient-to-br from-blue-950 via-cyan-950 to-gray-950",
    border: "border-cyan-400",
    accent: "text-cyan-400",
    cardBg: "bg-blue-950/60",
    overlay: "from-cyan-900/20 to-blue-900/10",
  },
  {
    id: "psychic",
    name: "Psychic",
    emoji: "🔮",
    bg: "bg-gradient-to-br from-purple-950 via-pink-950 to-gray-950",
    border: "border-pink-400",
    accent: "text-pink-400",
    cardBg: "bg-purple-950/60",
    overlay: "from-pink-900/20 to-purple-900/10",
  },
  {
    id: "lightning",
    name: "Lightning",
    emoji: "⚡",
    bg: "bg-gradient-to-br from-yellow-950 via-amber-950 to-gray-950",
    border: "border-yellow-400",
    accent: "text-yellow-400",
    cardBg: "bg-yellow-950/60",
    overlay: "from-yellow-900/20 to-amber-900/10",
  },
  {
    id: "grass",
    name: "Grass",
    emoji: "🌿",
    bg: "bg-gradient-to-br from-green-950 via-emerald-950 to-gray-950",
    border: "border-green-400",
    accent: "text-green-400",
    cardBg: "bg-green-950/60",
    overlay: "from-green-900/20 to-emerald-900/10",
  },
  {
    id: "darkness",
    name: "Darkness",
    emoji: "🌑",
    bg: "bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950",
    border: "border-purple-600",
    accent: "text-purple-400",
    cardBg: "bg-slate-900/80",
    overlay: "from-purple-900/10 to-slate-900/20",
  },
  {
    id: "metal",
    name: "Metal",
    emoji: "🔩",
    bg: "bg-gradient-to-br from-slate-800 via-zinc-900 to-gray-950",
    border: "border-slate-400",
    accent: "text-slate-300",
    cardBg: "bg-zinc-900/60",
    overlay: "from-slate-700/20 to-zinc-800/10",
  },
  {
    id: "fighting",
    name: "Fighting",
    emoji: "🥊",
    bg: "bg-gradient-to-br from-amber-950 via-stone-900 to-gray-950",
    border: "border-amber-600",
    accent: "text-amber-400",
    cardBg: "bg-amber-950/60",
    overlay: "from-amber-900/20 to-stone-900/10",
  },
];

export const DEFAULT_THEME = THEMES[3]; // Lightning (yellow - matches brand)
