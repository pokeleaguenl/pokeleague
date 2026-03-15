import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * DELETE /api/admin/clean-2023-events
 * Removes tournaments with "2023" in the name that have incorrect future dates
 * Requires authenticated user
 */
export async function DELETE() {
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find events with "2023" in the name
  const { data: badEvents, error: findError } = await supabase
    .from("tournaments")
    .select("id, name, event_date")
    .ilike("name", "%2023%");

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!badEvents || badEvents.length === 0) {
    return NextResponse.json({ message: "No 2023 events found", deleted: 0 });
  }

  // Delete them
  const ids = badEvents.map((t) => t.id);
  const { error: deleteError } = await supabase
    .from("tournaments")
    .delete()
    .in("id", ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Deleted ${ids.length} bad 2023 events`,
    deleted: badEvents,
  });
}
