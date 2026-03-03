import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("event_date", { ascending: false });

  const now = new Date();

  const upcoming = (tournaments ?? []).filter((t) => new Date(t.event_date) >= now);
  const past = (tournaments ?? []).filter((t) => new Date(t.event_date) < now);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Events & <span className="text-yellow-400">Schedule</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Click an event to see scores and results.</p>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((t) => (
              <Link key={t.id} href={`/events/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 hover:border-yellow-400/50 transition-colors">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.event_date} · {t.format}</p>
                </div>
                <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-400">Upcoming →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Past Events</h2>
          <div className="space-y-2">
            {past.map((t, i) => (
              <Link key={t.id} href={`/events/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 p-4 hover:border-gray-600 transition-colors">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.event_date} · {t.format}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Event {past.length - i}</span>
                  <span className="text-gray-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(!tournaments || tournaments.length === 0) && (
        <div className="rounded-xl border border-gray-800 p-8 text-center text-gray-500">
          <p className="text-2xl mb-2">📅</p>
          <p>No events scheduled yet.</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      )}
    </div>
  );
}
