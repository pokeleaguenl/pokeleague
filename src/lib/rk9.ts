const RK9_URL = "https://rk9.gg/events/pokemon";

export interface RK9Event {
  name: string;
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rk9Id: string;     // tournament ID from TCG link
  rk9Url: string;    // full TCG tournament URL
  upcoming: boolean;
}

const MONTH_MAP: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04",
  May: "05", June: "06", July: "07", August: "08",
  September: "09", October: "10", November: "11", December: "12",
};

/**
 * Parse a date string like "March 14-15, 2026" or "February 27-March 1, 2026"
 * Returns { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
 */
function parseDateRange(raw: string): { start: string; end: string } {
  raw = raw.trim();

  // Format: "Month D-D, YYYY"
  const sameMonth = raw.match(/^(\w+)\s+(\d+)-(\d+),\s+(\d{4})$/);
  if (sameMonth) {
    const [, month, startDay, endDay, year] = sameMonth;
    const mm = MONTH_MAP[month] ?? "01";
    return {
      start: `${year}-${mm}-${startDay.padStart(2, "0")}`,
      end: `${year}-${mm}-${endDay.padStart(2, "0")}`,
    };
  }

  // Format: "Month D-Month D, YYYY" (cross-month)
  const crossMonth = raw.match(/^(\w+)\s+(\d+)-(\w+)\s+(\d+),\s+(\d{4})$/);
  if (crossMonth) {
    const [, m1, d1, m2, d2, year] = crossMonth;
    return {
      start: `${year}-${MONTH_MAP[m1] ?? "01"}-${d1.padStart(2, "0")}`,
      end: `${year}-${MONTH_MAP[m2] ?? "01"}-${d2.padStart(2, "0")}`,
    };
  }

  // Format: "Month D, YYYY" (single day)
  const single = raw.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
  if (single) {
    const [, month, day, year] = single;
    const mm = MONTH_MAP[month] ?? "01";
    const d = `${year}-${mm}-${day.padStart(2, "0")}`;
    return { start: d, end: d };
  }

  // Fallback
  const today = new Date().toISOString().split("T")[0];
  return { start: today, end: today };
}

export async function fetchRK9Events(): Promise<RK9Event[]> {
  const res = await fetch(RK9_URL, { next: { revalidate: 3600 } });
  const html = await res.text();

  const events: RK9Event[] = [];

  // Split into upcoming and past sections
  const upcomingMatch = html.match(/Upcoming Pokémon Events([\s\S]*?)Past Pokémon Events/);
  const pastMatch = html.match(/Past Pokémon Events([\s\S]*?)$/);

  function parseSection(section: string, upcoming: boolean) {
    // Each event row: date cell, event name link, city cell, links
    const rowRegex =
      /<tr[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*><a href="\/event\/[^"]*">([\s\S]*?)<\/a><\/td>\s*<td[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/g;

    let match;
    while ((match = rowRegex.exec(section)) !== null) {
      const rawDate = match[1].replace(/<[^>]+>/g, "").trim();
      const name = match[2].replace(/<[^>]+>/g, "").trim();
      const city = match[3].replace(/<[^>]+>/g, "").trim();
      const linksHtml = match[4];

      // Must have a TCG link
      const tcgMatch = linksHtml.match(/href="\/tournament\/([^"]+)"[^>]*>\s*TCG\s*</);
      if (!tcgMatch) continue;

      const rk9Id = tcgMatch[1];
      const { start, end } = parseDateRange(rawDate);

      events.push({
        name,
        city,
        startDate: start,
        endDate: end,
        rk9Id,
        rk9Url: `https://rk9.gg/tournament/${rk9Id}`,
        upcoming,
      });
    }
  }

  if (upcomingMatch) parseSection(upcomingMatch[1], true);
  if (pastMatch) parseSection(pastMatch[1], false);

  return events;
}
