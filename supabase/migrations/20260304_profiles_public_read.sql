-- Allow public (anon) read access to profiles so public profile pages work
-- Without this, viewing another user's profile returns 404 due to RLS blocking the query
CREATE POLICY IF NOT EXISTS "Public read profiles" ON profiles
  FOR SELECT USING (true);
