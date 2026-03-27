/**
 * Compute the status of a tournament event based on its dates.
 * - "upcoming" if startDate is in the future
 * - "live"     if today falls within [startDate, endDate]
 * - "completed" if endDate is in the past
 */
export function computeEventStatus(
  startDate: string,
  endDate?: string | null
): "upcoming" | "live" | "completed" {
  const today = new Date().toISOString().split("T")[0];
  const end = endDate ?? startDate;

  if (end < today) return "completed";
  if (startDate <= today && end >= today) return "live";
  return "upcoming";
}
