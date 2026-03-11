import { FANTASY_CONFIG } from "./config";
import type { ArchetypeResult } from "./types";

/**
 * Calculate base points for an archetype result.
 * Order: base → +1 win bonus → (multiplier applied externally)
 */
export function calcArchetypeBasePoints(result: ArchetypeResult): number {
  let pts = 0;
  if (result.made_day2) pts += FANTASY_CONFIG.POINTS.DAY2;
  if (result.top8) pts += FANTASY_CONFIG.POINTS.TOP8;
  if (result.won) pts += FANTASY_CONFIG.POINTS.WIN;
  if (result.win_rate >= 0.6) pts += FANTASY_CONFIG.POINTS.WIN_RATE_60;
  if (result.had_win) pts += FANTASY_CONFIG.WIN_BONUS;
  return pts;
}

/**
 * Apply slot multiplier.
 * Active Deck: x2 (or x3 with stadium effect)
 * Bench: x1
 * Hand: x0 (or x1 with hand_boost)
 */
export function applyMultiplier(
  basePoints: number,
  zone: "active" | "bench" | "hand",
  stadiumEffect: "x3" | "hand_boost" | null
): number {
  if (zone === "active") {
    const mult = stadiumEffect === "x3"
      ? FANTASY_CONFIG.ACTIVE_X3_MULTIPLIER
      : FANTASY_CONFIG.ACTIVE_MULTIPLIER;
    return Math.round(basePoints * mult);
  }
  if (zone === "bench") return basePoints;
  if (zone === "hand") {
    return stadiumEffect === "hand_boost" ? basePoints : 0;
  }
  return 0;
}
