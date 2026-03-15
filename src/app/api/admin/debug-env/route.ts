import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/debug-env
 * Debug endpoint to check environment variable availability
 * Admin-only
 */
export async function GET() {
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check all relevant env vars (without exposing full values)
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...",
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      firstChars: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || null,
    },
  };

  // List all env vars that start with NEXT_PUBLIC or SUPABASE (keys only)
  const allEnvKeys = Object.keys(process.env).filter(
    key => key.startsWith("NEXT_PUBLIC") || key.startsWith("SUPABASE")
  );

  return NextResponse.json({
    ok: true,
    envCheck,
    allSupabaseKeys: allEnvKeys,
    timestamp: new Date().toISOString(),
  });
}
