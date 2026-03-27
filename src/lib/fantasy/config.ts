export const FANTASY_CONFIG = {
  SEASON_CUTOFF: "2025-09-01",
  SOURCE_RK9: "rk9",

  // Slot multipliers
  ACTIVE_MULTIPLIER: 2,
  ACTIVE_X3_MULTIPLIER: 3,
  BENCH_MULTIPLIER: 1,
  BENCH_BLITZ_MULTIPLIER: 1.5,
  HAND_MULTIPLIER: 0,
  HAND_BOOST_MULTIPLIER: 1,

  // Effect charge costs per use
  EFFECT_COSTS: {
    x3: 2,
    hand_boost: 1,
    bench_blitz: 2,
    meta_call: 1,
    dark_horse: 1,
    captain_swap: 2,
  } as Record<string, number>,

  // Starting charge budget per season
  EFFECT_CHARGES: 5,

  // Granular placement points
  POINTS: {
    TOP1: 25,
    TOP2: 18,
    TOP4: 12,
    TOP8: 8,
    TOP16: 5,
    TOP32: 3,
    WIN_RATE_65: 20,
    WIN_RATE_60: 12,
    WIN_RATE_55: 6,
    HAD_WIN: 1,
    // Legacy aliases
    DAY2: 3,
    WIN: 25,
    WIN_RATE_60_OLD: 12,
    TOP8_OLD: 8,
  },

  // Tournament size reference (1.0× at 200 players)
  TOURNAMENT_SIZE_BASE: 200,

  // Conditional effect bonuses
  META_CALL_BONUS: 15,
  DARK_HORSE_BONUS: 20,

  // Prediction correct answer bonus
  PREDICTION_BONUS: 10,

  // Catch-up multiplier for bottom 25% of leaderboard
  CATCHUP_MULTIPLIER: 1.1,

  // XP awards
  XP: {
    SAVE_SQUAD: 10,
    SCORE_POINTS: 1,
    CORRECT_PREDICTION: 50,
    FILL_SQUAD: 25,
    EARN_ACHIEVEMENT: 100,
  },

  WIN_BONUS: 1,
} as const;
