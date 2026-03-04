/**
 * Calculate meta efficiency score for an archetype.
 * Higher meta share = more expensive but more reliable.
 * Efficiency = points_per_meta_share_point
 */
export function calcMetaEfficiency(
  points: number,
  metaShare: number,
  cost: number
): { efficiency: number; pointsPerCost: number } {
  const efficiency = metaShare > 0 ? points / metaShare : 0;
  const pointsPerCost = cost > 0 ? points / cost : 0;
  return {
    efficiency: Math.round(efficiency * 100) / 100,
    pointsPerCost: Math.round(pointsPerCost * 100) / 100,
  };
}
