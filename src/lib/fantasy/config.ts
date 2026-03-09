export const FANTASY_CONFIG = {
  SEASON_CUTOFF: "2025-09-01",
  SOURCE_RK9: "rk9",
  
  // Scoring weights (for future use in analytics)
  ACTIVE_MULTIPLIER: 2,
  ACTIVE_X3_MULTIPLIER: 3,
  BENCH_MULTIPLIER: 1,
  HAND_MULTIPLIER: 0, // 1 if hand_boost
  WIN_BONUS: 1,
  
  // Point values
  POINTS: {
    DAY2: 3,
    TOP8: 10,
    WIN: 25,
    WIN_RATE_60: 20,
  },
} as const;
