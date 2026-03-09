const BASE_URL = "https://limitlesstcg.com";
const API_URL = "https://play.limitlesstcg.com/api";

export interface MetaDeck {
  rank: number;
  name: string;
  limitlessId: number;
  imageUrl: string;
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
  // Match table rows: rank, image(s), deck link (may contain <span> tags), points, share%
  const rowRegex =
    /<td>(\d+)<\/td>\s*<td>((?:<img[^>]*>)+)<\/td>\s*<td><a href="\/decks\/(\d+)">([\s\S]*?)<\/a><\/td>\s*<td>([\d,]+)<\/td>\s*<td>([\d.]+)%<\/td>/g;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    // Strip HTML tags from deck name (e.g. <span class="annotation">ex</span>)
    const name = match[4].replace(/<[^>]+>/g, "").trim();
    // Extract first image URL from the image cell
    const imgMatch = match[2].match(/src="([^"]*)"/);
    const imageUrl = imgMatch ? imgMatch[1] : "";
    decks.push({
      rank: parseInt(match[1]),
      name,
      limitlessId: parseInt(match[3]),
      imageUrl,
      points: parseInt(match[5].replace(",", "")),
      metaShare: parseFloat(match[6]),
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

export interface DeckVariant {
  name: string;
  limitlessValue: string;
}

/**
 * Scrape variant options for a deck from its Limitless page.
 */
export async function fetchDeckVariants(limitlessId: number): Promise<DeckVariant[]> {
  const res = await fetch(
    `${BASE_URL}/decks/${limitlessId}?format=standard&time=3months`,
    { next: { revalidate: 3600 } }
  );
  const html = await res.text();

  const variants: DeckVariant[] = [];
  const selectMatch = html.match(/<select id="variant-select"[^>]*>([\s\S]*?)<\/select>/);
  if (!selectMatch) return variants;

  const optionRegex = /<option value="([^"]*)"[^>]*>\s*([^<]+?)\s*<\/option>/g;
  let match;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const value = match[1].trim();
    const name = match[2].trim();
    if (value !== 'null') {
      variants.push({ name, limitlessValue: value });
    }
  }

  return variants;
}
