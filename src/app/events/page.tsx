import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Only show events from Sept 2025 onwards (skip old 2023/2024/early 2025)
const CUTOFF_DATE = "2025-09-01";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .gte("event_date", CUTOFF_DATE)
    .order("event_date", { ascending: true });

  const now = new Date().toISOString().split("T")[0];

  // Upcoming: sorted nearest first (already asc from query)
  const upcoming = (tournaments ?? []).filter((t) => t.event_date >= now);
  // Past: sorted most recent first
  const past = (tournaments ?? []).filter((t) => t.event_date < now).reverse();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Events & <span className="text-yellow-400">Schedule</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">2025–2026 season. Click an event to see scores and results.</p>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((t, i) => {
              const isNext = i === 0;
              return (
                <Link key={t.id} href={`/events/${t.id}`}
                  className={`flex items-center justify-between rounded-xl border p-4 hover:border-yellow-400/50 transition-colors ${
                    isNext
                      ? "border-yellow-400/40 bg-yellow-400/5"
                      : "border-yellow-400/10 bg-yellow-400/2"
                  }`}>
                  <div>
                    {isNext && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-0.5">Next Event</p>
                    )}
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.event_date}{(t as { city?: string }).city ? ` · ${(t as { city?: string }).city}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${isNext ? "bg-yellow-400/20 text-yellow-400" : "text-gray-600"}`}>
                    {isNext ? "Next →" : "→"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Past Events</h2>
          <div className="space-y-2">
            {past.map((t) => (
              <Link key={t.id} href={`/events/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-gray-600 transition-colors">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.event_date}{(t as { city?: string }).city ? ` · ${(t as { city?: string }).city}` : ""}
                  </p>
                </div>
                <span className="text-gray-600 text-sm">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(!tournaments || tournaments.length === 0) && (
        <div className="rounded-xl border border-gray-800 p-8 text-center text-gray-500">
          <p className="text-2xl mb-2">📅</p>
          <p>No events scheduled yet.</p>
          <p className="text-sm mt-1">Check back soon or sync from admin.</p>
        </div>
      )}
    </div>
  );
}
