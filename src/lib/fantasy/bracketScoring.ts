import { FANTASY_CONFIG } from "./config";
import type { ArchetypeResult } from "./types";

/**
 * Calculate base points for an archetype using granular placement tiers.
 * Optional totalPlayers applies a log-scale tournament size multiplier.
 */
export function calcArchetypeBasePoints(
  result: ArchetypeResult,
  totalPlayers?: number
): number {
  let pts = 0;

  // Placement — pick highest applicable tier only
  if (result.won || result.best_rank === 1) {
    pts += FANTASY_CONFIG.POINTS.TOP1;
  } else if (result.top2 || (result.best_rank != null && result.best_rank <= 2)) {
    pts += FANTASY_CONFIG.POINTS.TOP2;
  } else if (result.top4 || (result.best_rank != null && result.best_rank <= 4)) {
    pts += FANTASY_CONFIG.POINTS.TOP4;
  } else if (result.top8) {
    pts += FANTASY_CONFIG.POINTS.TOP8;
  } else if (result.top16 || (result.top16_count != null && result.top16_count > 0)) {
    pts += FANTASY_CONFIG.POINTS.TOP16;
  } else if (result.made_day2) {
    pts += FANTASY_CONFIG.POINTS.TOP32;
  }

  // Win rate — pick highest applicable tier
  if (result.win_rate >= 0.65) {
    pts += FANTASY_CONFIG.POINTS.WIN_RATE_65;
  } else if (result.win_rate >= 0.60) {
    pts += FANTASY_CONFIG.POINTS.WIN_RATE_60;
  } else if (result.win_rate >= 0.55) {
    pts += FANTASY_CONFIG.POINTS.WIN_RATE_55;
  }

  if (result.had_win) pts += FANTASY_CONFIG.POINTS.HAD_WIN;

  // Tournament size multiplier: clamp(log2(players/200 + 1) + 0.5, 0.8, 2.0)
  if (totalPlayers && totalPlayers > 0) {
    const raw = Math.log2(totalPlayers / FANTASY_CONFIG.TOURNAMENT_SIZE_BASE + 1) + 0.5;
    const mult = Math.min(Math.max(raw, 0.8), 2.0);
    pts = Math.round(pts * mult);
  }

  return pts;
}

/**
 * Apply slot multiplier based on zone and active stadium effect.
 */
export function applyMultiplier(
  basePoints: number,
  zone: "active" | "bench" | "hand",
  stadiumEffect: string | null
): number {
  if (zone === "active") {
    const mult = stadiumEffect === "x3"
      ? FANTASY_CONFIG.ACTIVE_X3_MULTIPLIER
      : FANTASY_CONFIG.ACTIVE_MULTIPLIER;
    return Math.round(basePoints * mult);
  }
  if (zone === "bench") {
    const mult = stadiumEffect === "bench_blitz"
      ? FANTASY_CONFIG.BENCH_BLITZ_MULTIPLIER
      : FANTASY_CONFIG.BENCH_MULTIPLIER;
    return Math.round(basePoints * mult);
  }
  if (zone === "hand") {
    return stadiumEffect === "hand_boost" ? basePoints : 0;
  }
  return 0;
}
