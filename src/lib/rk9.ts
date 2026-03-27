const RK9_URL = "https://rk9.gg/events/pokemon";

export interface RK9Event {
  name: string;
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rk9Id: string;     // TCG tournament ID
  rk9Url: string;    // full TCG tournament URL
  upcoming: boolean;
}

const MONTH_MAP: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04",
  May: "05", June: "06", July: "07", August: "08",
  September: "09", October: "10", November: "11", December: "12",
};

/**
 * Parse a date string like "March 14-15, 2026" or "February 27-March 1, 2026".
 * Returns null if the format is unrecognised — callers must skip null events.
 */
function parseDateRange(raw: string): { start: string; end: string } | null {
  raw = raw.trim();

  // Format: "Month D-D, YYYY"
  const sameMonth = raw.match(/^(\w+)\s+(\d+)-(\d+),\s+(\d{4})$/);
  if (sameMonth) {
    const [, month, startDay, endDay, year] = sameMonth;
    const mm = MONTH_MAP[month];
    if (!mm) return null;
    return {
      start: `${year}-${mm}-${startDay.padStart(2, "0")}`,
      end: `${year}-${mm}-${endDay.padStart(2, "0")}`,
    };
  }

  // Format: "Month D-Month D, YYYY" (cross-month)
  const crossMonth = raw.match(/^(\w+)\s+(\d+)-(\w+)\s+(\d+),\s+(\d{4})$/);
  if (crossMonth) {
    const [, m1, d1, m2, d2, year] = crossMonth;
    const mm1 = MONTH_MAP[m1];
    const mm2 = MONTH_MAP[m2];
    if (!mm1 || !mm2) return null;
    return {
      start: `${year}-${mm1}-${d1.padStart(2, "0")}`,
      end: `${year}-${mm2}-${d2.padStart(2, "0")}`,
    };
  }

  // Format: "Month D, YYYY" (single day)
  const single = raw.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
  if (single) {
    const [, month, day, year] = single;
    const mm = MONTH_MAP[month];
    if (!mm) return null;
    const d = `${year}-${mm}-${day.padStart(2, "0")}`;
    return { start: d, end: d };
  }

  console.warn("[rk9] Unrecognised date format, skipping event:", raw);
  return null;
}

/**
 * Parse a section of HTML (upcoming or past) into events.
 * Iterates <tr>...</tr> blocks manually to handle very large rows.
 */
function parseSection(section: string, upcoming: boolean): RK9Event[] {
  const events: RK9Event[] = [];
  let start = 0;

  while (true) {
    const trStart = section.indexOf("<tr", start);
    if (trStart === -1) break;
    const trEnd = section.indexOf("</tr>", trStart);
    if (trEnd === -1) break;
    const row = section.slice(trStart, trEnd + 5);

    // Date: first <td> containing month name text
    const dateMatch = row.match(/<td[^>]*>\s*([A-Za-z][^<]+?)\s*<\/td>/);
    // Event name from /event/ link
    const nameMatch = row.match(/<a href="\/event\/[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/);
    // City: 4th <td> — the one right after the event name cell closing tag
    // Strategy: get all <td> text contents, city is index 3 (0-based)
    const tdTexts = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );
    const city = tdTexts[3] ?? "";
    // TCG tournament ID
    const tcgMatch = row.match(/href="\/tournament\/([^"]+)"[^>]*>\s*TCG\s*</);

    if (dateMatch && nameMatch && tcgMatch) {
      const parsed = parseDateRange(dateMatch[1].trim());
      if (!parsed) { start = trEnd + 1; continue; }
      const { start: startDate, end: endDate } = parsed;
      events.push({
        name: nameMatch[1].trim(),
        city: city.trim(),
        startDate,
        endDate,
        rk9Id: tcgMatch[1],
        rk9Url: `https://rk9.gg/tournament/${tcgMatch[1]}`,
        upcoming,
      });
    }

    start = trEnd + 1;
  }

  return events;
}

export async function fetchRK9Events(): Promise<RK9Event[]> {
  const res = await fetch(RK9_URL, { next: { revalidate: 3600 } });
  const html = await res.text();

  // Split into upcoming and past sections (handle extra whitespace in headings)
  const upcomingMatch = html.match(/Upcoming\s+Pok[^<]*Events([\s\S]*?)Past\s+Pok[^<]*Events/);
  const pastMatch = html.match(/Past\s+Pok[^<]*Events([\s\S]*?)$/);

  const events: RK9Event[] = [];
  if (upcomingMatch) events.push(...parseSection(upcomingMatch[1], true));
  if (pastMatch) events.push(...parseSection(pastMatch[1], false));

  return events;
}
