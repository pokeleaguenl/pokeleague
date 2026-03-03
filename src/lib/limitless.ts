const BASE_URL = "https://limitlesstcg.com";
const API_URL = "https://play.limitlesstcg.com/api";

export interface MetaDeck {
  rank: number;
  name: string;
  limitlessId: number;
  metaShare: number; // percentage, e.g. 20.76
  points: number; // limitless ranking points
}

/**
 * Scrape the meta deck rankings from Limitless.
 * Returns decks sorted by meta share (highest first).
 */
export async function fetchMetaDecks(): Promise<MetaDeck[]> {
  const res = await fetch(
    `${BASE_URL}/decks?format=standard&time=3months`,
    { next: { revalidate: 3600 } } // cache for 1 hour
  );
  const html = await res.text();

  const decks: MetaDeck[] = [];
  // Match rows: deck link with id, name, points, share%
  const rowRegex =
    /\/decks\/(\d+)[^>]*>([^<]+)<[\s\S]*?(\d[\d,]*)\s*\n\s*([\d.]+)%/g;
  let match;
  let rank = 1;

  while ((match = rowRegex.exec(html)) !== null) {
    decks.push({
      rank: rank++,
      name: match[2].trim(),
      limitlessId: parseInt(match[1]),
      points: parseInt(match[3].replace(",", "")),
      metaShare: parseFloat(match[4]),
    });
  }

  return decks;
}

/**
 * Calculate a cost (1-50) based on meta share percentage.
 * Higher meta share = higher cost.
 */
export function calculateCost(metaShare: number): number {
  if (metaShare >= 15) return 50;
  if (metaShare >= 10) return 40;
  if (metaShare >= 7) return 30;
  if (metaShare >= 4) return 20;
  if (metaShare >= 2) return 15;
  if (metaShare >= 1) return 10;
  return 5;
}

/**
 * Assign a tier based on meta share.
 */
export function calculateTier(metaShare: number): string {
  if (metaShare >= 10) return "S";
  if (metaShare >= 5) return "A";
  if (metaShare >= 2) return "B";
  if (metaShare >= 0.5) return "C";
  return "D";
}

export { API_URL };
