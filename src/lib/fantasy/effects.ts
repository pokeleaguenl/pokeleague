import { FANTASY_CONFIG } from "./config";

export type EffectType = "x3" | "hand_boost" | "bench_blitz" | "meta_call" | "dark_horse" | "captain_swap";

export interface EffectDef {
  id: EffectType;
  label: string;
  emoji: string;
  cost: number;           // charges used when activated
  usedColumn: string;     // DB column tracking permanent use
  color: string;          // Tailwind border/accent color
  description: string;
  strategicTip: string;
}

export const EFFECTS: EffectDef[] = [
  {
    id: "x3",
    label: "×3 Active",
    emoji: "⚡",
    cost: FANTASY_CONFIG.EFFECT_COSTS.x3,
    usedColumn: "x3_effect_used",
    color: "yellow",
    description: "Active deck earns 3× points this event",
    strategicTip: "Best used when your active deck is heavily represented in the meta",
  },
  {
    id: "hand_boost",
    label: "Hand Boost",
    emoji: "🃏",
    cost: FANTASY_CONFIG.EFFECT_COSTS.hand_boost,
    usedColumn: "hand_boost_used",
    color: "blue",
    description: "Reserve decks score 1× for this event",
    strategicTip: "Use when you have expensive decks locked in Reserve",
  },
  {
    id: "bench_blitz",
    label: "Bench Blitz",
    emoji: "🔥",
    cost: FANTASY_CONFIG.EFFECT_COSTS.bench_blitz,
    usedColumn: "bench_blitz_used",
    color: "orange",
    description: "All bench decks score 1.5× this event",
    strategicTip: "Best when you have 4–5 strong decks on your bench",
  },
  {
    id: "meta_call",
    label: "Meta Call",
    emoji: "🎯",
    cost: FANTASY_CONFIG.EFFECT_COSTS.meta_call,
    usedColumn: "meta_call_used",
    color: "green",
    description: `If your Active deck wins the tournament, earn +${FANTASY_CONFIG.META_CALL_BONUS} bonus points`,
    strategicTip: "Low risk, high reward — use before a predictable meta",
  },
  {
    id: "dark_horse",
    label: "Dark Horse",
    emoji: "🐴",
    cost: FANTASY_CONFIG.EFFECT_COSTS.dark_horse,
    usedColumn: "dark_horse_used",
    color: "purple",
    description: `If a C/D tier deck in your squad makes top 16, earn +${FANTASY_CONFIG.DARK_HORSE_BONUS} bonus points`,
    strategicTip: "Gamble on a budget deck breaking out at a large event",
  },
  {
    id: "captain_swap",
    label: "Captain Swap",
    emoji: "🔄",
    cost: FANTASY_CONFIG.EFFECT_COSTS.captain_swap,
    usedColumn: "captain_swap_used",
    color: "pink",
    description: "Your top-scoring bench deck acts as Active (2×) for this event",
    strategicTip: "Hindsight play — your best bench deck becomes your captain after results",
  },
];

export const EFFECT_MAP = new Map(EFFECTS.map(e => [e.id, e]));

export const EFFECT_COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  yellow: { border: "border-yellow-400/60", bg: "bg-yellow-400/10", text: "text-yellow-300", badge: "bg-yellow-400/30 text-yellow-400" },
  blue:   { border: "border-blue-400/60",   bg: "bg-blue-400/10",   text: "text-blue-300",   badge: "bg-blue-400/30 text-blue-400" },
  orange: { border: "border-orange-400/60", bg: "bg-orange-400/10", text: "text-orange-300", badge: "bg-orange-400/30 text-orange-400" },
  green:  { border: "border-green-400/60",  bg: "bg-green-400/10",  text: "text-green-300",  badge: "bg-green-400/30 text-green-400" },
  purple: { border: "border-purple-400/60", bg: "bg-purple-400/10", text: "text-purple-300", badge: "bg-purple-400/30 text-purple-400" },
  pink:   { border: "border-pink-400/60",   bg: "bg-pink-400/10",   text: "text-pink-300",   badge: "bg-pink-400/30 text-pink-400" },
};
