import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query by paginating through results.
 * Supabase defaults to 1000 rows per request — this loops until exhausted.
 *
 * Usage:
 *   const rows = await fetchAll(supabase
 *     .from("rk9_standings")
 *     .select("player_name, rank, archetype")
 *     .eq("tournament_id", rk9_id)
 *     .order("rank", { ascending: true })
 *   );
 */
export async function fetchAll<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: any
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await baseQuery.range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}
