import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/test-alias-insert
 * Debug endpoint to test alias insertion in isolation
 * Tests both regular client and admin client
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, any> = {};

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  results.env = {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceRoleKey,
    urlValue: supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : null,
    keyLength: serviceRoleKey?.length || 0,
  };

  console.log("[test-alias] Environment check:", results.env);

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({
      error: "Missing environment variables",
      ...results,
    }, { status: 500 });
  }

  // Create admin client
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // Test 1: Check if charizard-ex archetype exists
  console.log("[test-alias] Checking for charizard-ex archetype...");
  const { data: archetype, error: archetypeError } = await supabase
    .from("fantasy_archetypes")
    .select("id, slug, name")
    .eq("slug", "charizard-ex")
    .maybeSingle();

  results.archetype = {
    found: !!archetype,
    data: archetype,
    error: archetypeError ? {
      message: archetypeError.message,
      code: archetypeError.code,
    } : null,
  };

  console.log("[test-alias] Archetype lookup result:", results.archetype);

  if (!archetype) {
    return NextResponse.json({
      error: "Archetype charizard-ex not found. Run seed-fantasy first.",
      ...results,
    }, { status: 404 });
  }

  // Test 2: Try inserting a test alias using admin client
  const testAlias = {
    alias: "test-charizard-debug",
    archetype_id: archetype.id,
  };

  console.log("[test-alias] Attempting insert with admin client:", testAlias);

  const { data: inserted, error: insertError } = await adminClient
    .from("fantasy_archetype_aliases")
    .insert(testAlias)
    .select();

  results.insert = {
    success: !!inserted,
    data: inserted,
    error: insertError ? {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    } : null,
  };

  console.log("[test-alias] Insert result:", results.insert);

  // Test 3: Try upsert with admin client
  const testAliasUpsert = {
    alias: "test-charizard-upsert",
    archetype_id: archetype.id,
  };

  console.log("[test-alias] Attempting upsert with admin client:", testAliasUpsert);

  const { data: upserted, error: upsertError } = await adminClient
    .from("fantasy_archetype_aliases")
    .upsert(testAliasUpsert, { onConflict: "alias" })
    .select();

  results.upsert = {
    success: !!upserted,
    data: upserted,
    error: upsertError ? {
      message: upsertError.message,
      code: upsertError.code,
      details: upsertError.details,
      hint: upsertError.hint,
    } : null,
  };

  console.log("[test-alias] Upsert result:", results.upsert);

  // Test 4: Check if test aliases were inserted
  const { data: testAliases } = await supabase
    .from("fantasy_archetype_aliases")
    .select("*")
    .in("alias", ["test-charizard-debug", "test-charizard-upsert"]);

  results.verification = {
    found: testAliases?.length || 0,
    aliases: testAliases,
  };

  console.log("[test-alias] Verification result:", results.verification);

  return NextResponse.json({
    ok: !insertError && !upsertError,
    message: "Alias insert test complete",
    results,
  });
}

/**
 * DELETE /api/admin/test-alias-insert
 * Cleanup test aliases
 */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  const { error } = await adminClient
    .from("fantasy_archetype_aliases")
    .delete()
    .like("alias", "test-charizard%");

  return NextResponse.json({
    ok: !error,
    message: error ? error.message : "Test aliases cleaned up",
  });
}
