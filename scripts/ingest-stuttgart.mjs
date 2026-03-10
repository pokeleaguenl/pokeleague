import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch Stuttgart standings from rk9_standings
const { data: standings, error } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank, wins, losses')
  .eq('tournament_id', 'SG0167ss5UCjklsDaPrA')
  .eq('round', 18)
  .not('archetype', 'is', null)
  .order('rank', { ascending: true });

if (error) { console.error('Error:', error.message); process.exit(1); }

console.log(`Found ${standings.length} standings entries`);

// Convert to ingest format
const ingestStandings = standings.map(s => ({
  player_name: s.player_name,
  deck_name: s.archetype,
  placement: s.rank,
  wins: s.wins ?? undefined,
  losses: s.losses ?? undefined,
}));

// POST to ingest endpoint
const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('supabase.co', 'vercel.app').replace('https://bmmkjbjnszysxppiekhv.', 'https://pokeleague.')}`, {});

// Use Supabase directly instead - call ingest logic manually
const BASE_URL = 'https://pokeleague.vercel.app';

console.log('Posting to ingest endpoint...');
const response = await fetch(`${BASE_URL}/api/fantasy/admin/ingest-event`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournament_id: 8,
    standings: ingestStandings,
    force: true
  })
});

const result = await response.json();
console.log('Status:', response.status);
console.log(JSON.stringify(result, null, 2));
