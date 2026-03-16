import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Step 1: Adding is_admin column to profiles ===');

// We'll use Supabase's RPC or direct SQL to add column
// First, let's check if we can find your user
const { data: allProfiles } = await supabase
  .from('profiles')
  .select('id, username, display_name')
  .order('created_at', { ascending: true });

console.log('\nAll users:');
allProfiles?.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.username || p.display_name || 'Unknown'} (id: ${p.id})`);
});

console.log('\n=== Which user ID should be admin? ===');
console.log('We need to:');
console.log('1. Add is_admin boolean column to profiles table');
console.log('2. Set your user as admin');
console.log('');
console.log('Please provide your user ID from the list above.');

process.exit(0);
