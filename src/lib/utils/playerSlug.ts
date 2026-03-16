/**
 * Convert a player name to a URL-friendly slug
 * Example: "Rocky Barr" -> "rocky-barr"
 */
export function playerToSlug(playerName: string): string {
  return playerName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}
