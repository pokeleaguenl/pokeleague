import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const CUTOFF_DATE = "2025-09-01";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  live:      { label: "● LIVE",     color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30"  },
  completed: { label: "Completed",  color: "text-gray-500",   bg: "bg-gray-800",      border: "border-gray-700"      },
  upcoming:  { label: "Upcoming",   color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function daysUntil(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr + "T00:00:00Z");
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 0) return `In ${diff} days`;
  return null;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: tournaments }, { data: myScores }] = await Promise.all([
    supabase
      .from("tournaments")
      .select("id, name, event_date, status, city, country")
      .gte("event_date", CUTOFF_DATE)
      .order("event_date", { ascending: true }),
    supabase
      .from("league_scores")
      .select("tournament_id, points_earned")
      .eq("user_id", user.id),
  ]);

  const scoreMap = Object.fromEntries((myScores ?? []).map(s => [s.tournament_id, s.points_earned]));

  const now = new Date().toISOString().split("T")[0];
  const upcoming = (tournaments ?? []).filter(t => t.event_date >= now);
  const past = (tournaments ?? []).filter(t => t.event_date < now).reverse();

  const totalEarned = Object.values(scoreMap).reduce((sum, p) => sum + (p ?? 0), 0);
  const eventsScored = Object.keys(scoreMap).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          Events & <span className="text-yellow-400">Schedule</span>
        </h1>
        <p className="text-sm text-gray-500">2025–2026 Pokémon TCG season</p>
      </div>

      {/* My season summary */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
          <p className="text-2xl font-black text-yellow-400">{totalEarned}</p>
          <p className="text-xs text-gray-500 mt-0.5">Points earned</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-2xl font-black text-white">{eventsScored}</p>
          <p className="text-xs text-gray-500 mt-0.5">Events scored</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
          <p className="text-2xl font-black text-white">{(tournaments ?? []).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total events</p>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            Upcoming · {upcoming.length} events
          </h2>
          <div className="space-y-2">
            {upcoming.map((t, i) => {
              const isNext = i === 0;
              const status = (t.status as string) || "upcoming";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
              const countdown = daysUntil(t.event_date);
              return (
                <Link key={t.id} href={"/events/" + t.id}
                  className={"group flex items-center justify-between rounded-xl border p-4 transition-all hover:border-yellow-400/40 " +
                    (isNext ? "border-yellow-400/30 bg-yellow-400/5" : "border-gray-800 bg-gray-900/20")}>
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Date block */}
                    <div className={"flex-shrink-0 w-12 text-center rounded-lg py-1.5 " + (isNext ? "bg-yellow-400/10" : "bg-gray-800/60")}>
                      <p className={"text-xs font-bold " + (isNext ? "text-yellow-400" : "text-gray-500")}>
                        {new Date(t.event_date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase()}
                      </p>
                      <p className={"text-lg font-black leading-tight " + (isNext ? "text-yellow-300" : "text-gray-300")}>
                        {new Date(t.event_date + "T00:00:00Z").getUTCDate()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      {isNext && <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-0.5">Next Event</p>}
                      <p className="font-bold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-gray-500">
                        {t.city ? t.city + (t.country ? ", " + t.country : "") + " · " : ""}
                        {formatDate(t.event_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 ml-3">
                    {countdown && (
                      <span className="text-xs text-gray-600">{countdown}</span>
                    )}
                    <span className={"text-[10px] font-bold rounded-full px-2 py-0.5 border " + cfg.color + " " + cfg.bg + " " + cfg.border}>
                      {cfg.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            Past Events · {past.length} completed
          </h2>
          <div className="space-y-2">
            {past.map((t) => {
              const myPts = scoreMap[t.id];
              return (
                <Link key={t.id} href={"/events/" + t.id}
                  className="group flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/20 p-4 transition-all hover:border-gray-700">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 w-12 text-center rounded-lg bg-gray-800/60 py-1.5">
                      <p className="text-xs font-bold text-gray-600">
                        {new Date(t.event_date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase()}
                      </p>
                      <p className="text-lg font-black leading-tight text-gray-400">
                        {new Date(t.event_date + "T00:00:00Z").getUTCDate()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-gray-300 group-hover:text-white transition-colors">{t.name}</p>
                      <p className="text-xs text-gray-600">
                        {t.city ? t.city + (t.country ? ", " + t.country : "") + " · " : ""}
                        {formatDate(t.event_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 ml-3">
                    {myPts != null && (
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">
                        +{myPts}pts
                      </span>
                    )}
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 border text-gray-500 bg-gray-800 border-gray-700">
                      Done
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {(!tournaments || tournaments.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-800 p-12 text-center text-gray-600">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-medium">No events scheduled yet.</p>
          <p className="text-sm mt-1">Check back soon or sync from admin.</p>
        </div>
      )}
    </div>
  );
}
