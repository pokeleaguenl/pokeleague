import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { playerToSlug } from "@/lib/utils/playerSlug";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const results: any[] = [];

  try {
    // Search decks
    const { data: decks } = await supabase
      .rpc('get_deck_list_with_points')
      .ilike('deck_name', `%${query}%`)
      .limit(5);

    if (decks) {
      results.push(...decks.map((d: any) => ({
        type: 'deck',
        name: d.deck_name,
        href: `/decks/${d.archetype_slug}`,
        meta: `${d.meta_share?.toFixed(1)}% meta`
      })));
    }

    // Search players
    const { data: players } = await supabase
      .from('rk9_standings')
      .select('player_name')
      .ilike('player_name', `%${query}%`)
      .limit(100);

    if (players) {
      // Get unique player names
      const uniquePlayers = [...new Set(players.map(p => p.player_name))].slice(0, 5);
      results.push(...uniquePlayers.map(name => ({
        type: 'player',
        name: name,
        href: `/players/${playerToSlug(name)}`
      })));
    }

    // Search tournaments
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id, name, event_date')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (tournaments) {
      results.push(...tournaments.map(t => ({
        type: 'tournament',
        name: t.name,
        href: `/tournaments/${t.id}`,
        meta: new Date(t.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
