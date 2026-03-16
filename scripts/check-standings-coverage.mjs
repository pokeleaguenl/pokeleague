import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tournaments = [
  { id: 18, name: 'Frankfurt', rk9_id: 'FR01mpvNDKVaPxTTkdam' },
  { id: 17, name: 'Monterrey', rk9_id: 'MT01mfOxRw9XtaFtElAm' },
  { id: 16, name: 'Pittsburgh', rk9_id: 'PT01klFH0Nj5f17R5myQ' },
  { id: 14, name: 'Milwaukee', rk9_id: 'MK01mzXPKCuqXfZ1ay6j' },
  { id: 15, name: 'Belo Horizonte', rk9_id: 'BE01wYmCBW1HzjObcfgo' },
  { id: 13, name: 'Lille', rk9_id: 'LL01rJ9jmjd0vvZStqEI' },
  { id: 12, name: 'Brisbane', rk9_id: 'BR01wWjeoRXmsLVtL56s' },
  { id: 11, name: 'Gdansk', rk9_id: 'GD01yAq3nBdy68dkmxVc' },
  { id: 10, name: 'Las Vegas', rk9_id: 'LV01YShqrqjMo62PxZPg' },
  { id: 9, name: 'LAIC', rk9_id: 'LA0126uWiVw5bRySlkA2' },
  { id: 7, name: 'Toronto', rk9_id: 'TO01yAfakDVFFDFAV2AS' },
  { id: 5, name: 'Merida', rk9_id: 'ME01wMEKNaLIfrdxmnhb' },
  { id: 6, name: 'Birmingham', rk9_id: 'BH01mjIWeSb7vxkM9Aer' },
  { id: 4, name: 'Sydney', rk9_id: 'SY01X6aiblBgAp8tfhjx' },
  { id: 3, name: 'Santiago', rk9_id: 'ST01bmgM9jIqCvBYdzy3' },
  { id: 2, name: 'EUIC', rk9_id: 'EU01mU0Z1galE2FATDYs' },
  { id: 1, name: 'Seattle', rk9_id: 'SE01gUuRn8bJqbH9Wnt1' },
];

for (const t of tournaments) {
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', t.rk9_id);
  console.log(`${t.name} (id=${t.id}): ${count} rows`);
}
