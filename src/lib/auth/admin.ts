import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

/**
 * Check if the current user is an admin
 * Returns the user if admin, null otherwise
 */
export async function checkAdminAuth() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }
  
  // Check if user has admin flag in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (!profile?.is_admin) {
    return null;
  }
  
  return user;
}

/**
 * Middleware for API routes - returns error response if not admin
 * Usage in API routes:
 * 
 * const adminUser = await requireAdmin();
 * if (adminUser instanceof NextResponse) return adminUser;
 */
export async function requireAdmin() {
  const user = await checkAdminAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Middleware for pages - redirects to home if not admin
 * Usage in page components:
 * 
 * await requireAdminPage();
 */
export async function requireAdminPage() {
  const user = await checkAdminAuth();
  
  if (!user) {
    redirect('/');
  }
  
  return user;
}
