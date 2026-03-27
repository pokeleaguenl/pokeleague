import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import EventCountdown from "@/components/event-countdown";

const tierBorder: Record<string, string> = {
  S: "border-yellow-400/60", A: "border-purple-500/60",
  B: "border-blue-500/60", C: "border-green-600/60", D: "border-gray-600/40",
};

function DeckCard({ name, tier, cost, img, delay = "0s" }: { name: string; tier: string; cost: number; img: string; delay?: string }) {
  const tierColor: Record<string, string> = {
    S: "from-yellow-400/30 to-yellow-600/10 border-yellow-400/60",
    A: "from-purple-500/30 to-purple-700/10 border-purple-500/60",
    B: "from-blue-500/30 to-blue-700/10 border-blue-500/60",
    C: "from-green-500/30 to-green-700/10 border-green-600/60",
    D: "from-gray-500/20 to-gray-700/10 border-gray-600/40",
  };
  return (
    <div
      className={`relative flex flex-col items-center rounded-xl border bg-gradient-to-b p-3 backdrop-blur-sm ${tierColor[tier] || tierColor.D}`}
      style={{ animation: `float 4s ease-in-out infinite`, animationDelay: delay }}
    >
      <img src={img} alt={name} className="h-12 w-12 object-contain drop-shadow-lg" />
      <p className="mt-1.5 text-center text-[10px] font-semibold leading-tight text-white">{name}</p>
      <span className="mt-1 text-[9px] font-bold text-yellow-400">{cost}pts</span>
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: topProfiles }, { data: topSquads }, { data: nextEvent }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username, total_points").order("total_points", { ascending: false }).limit(4),
    supabase.from("squads").select(`
      user_id, total_points,
      active_deck:decks!squads_active_deck_id_fkey(id,name,tier,image_url)
    `).order("total_points", { ascending: false }).limit(4),
    supabase.from("tournaments").select("id, name, event_date")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date").limit(1).maybeSingle(),
  ]);

  const medals = ["🥇", "🥈", "🥉", ""];
  const norm = (v: unknown) => (Array.isArray(v) ? (v as unknown[])[0] ?? null : v ?? null) as { name: string; tier: string; image_url: string | null } | null;

  return (
    <main className="relative overflow-hidden bg-gray-950">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #facc15, #fff, #facc15, #fff, #facc15);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
        <div className="absolute top-[60vh] -left-40 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* ── Hero ── */}
      <section className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-2xl scale-150" />
            <Image src="/logo.svg" alt="PokéLeague" width={88} height={88} className="relative rounded-2xl drop-shadow-2xl" priority />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-semibold text-yellow-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
            Season 1 — Now Live
          </div>
        </div>

        <h1 className="text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl">
          <span className="shimmer-text">Poké</span><span className="text-white">League</span>
          <br />
          <span className="text-3xl sm:text-4xl font-bold text-gray-400 tracking-normal">Fantasy Pokémon TCG</span>
        </h1>

        <p className="mt-6 max-w-lg text-lg text-gray-400 leading-relaxed">
          Pick your squad of real tournament decks. Earn points when they perform at live Regionals.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link href="/squad" className="rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
              Build Your Squad →
            </Link>
          ) : (
            <>
              <Link href="/auth/signup" className="rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
                Play for free →
              </Link>
              <Link href="/auth/login" className="rounded-xl border border-gray-700 px-6 py-3.5 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-colors">
                Log in
              </Link>
            </>
          )}
          <Link href="/decks" className="rounded-xl border border-gray-800 px-6 py-3.5 text-sm text-gray-400 hover:text-white transition-colors">
            Browse decks
          </Link>
        </div>

        {/* Floating deck cards */}
        <div className="mt-14 flex flex-wrap items-end justify-center gap-3">
          <DeckCard name="Charizard ex" tier="S" cost={50} img="https://r2.limitlesstcg.net/pokemon/gen9/charizard.png" delay="0s" />
          <DeckCard name="Dragapult ex" tier="S" cost={50} img="https://r2.limitlesstcg.net/pokemon/gen9/dragapult.png" delay="0.6s" />
          <DeckCard name="Gardevoir ex" tier="S" cost={50} img="https://r2.limitlesstcg.net/pokemon/gen9/gardevoir.png" delay="1.2s" />
          <DeckCard name="Gholdengo ex" tier="S" cost={50} img="https://r2.limitlesstcg.net/pokemon/gen9/gholdengo.png" delay="1.8s" />
          <DeckCard name="Grimmsnarl ex" tier="A" cost={39} img="https://r2.limitlesstcg.net/pokemon/gen9/grimmsnarl.png" delay="2.4s" />
        </div>

        <div className="absolute bottom-8 flex flex-col items-center gap-1 text-gray-600">
          <span className="text-xs">scroll</span>
          <span className="animate-bounce text-sm">↓</span>
        </div>
      </section>

      {/* ── Live section: Next Event + Standings ── */}
      <section className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Next event countdown */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Next Event</p>
            {nextEvent ? (
              <EventCountdown
                eventDate={nextEvent.event_date}
                eventName={nextEvent.name}
                eventId={nextEvent.id}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-gray-600">
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </div>

          {/* Live standings */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Current Standings</p>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 overflow-hidden">
              {(topSquads ?? []).length === 0 ? (
                <div className="p-8 text-center text-gray-600 text-sm">No rankings yet — be the first!</div>
              ) : (
                <div>
                  {(topSquads ?? []).map((squad, i) => {
                    const profile = (topProfiles ?? []).find((p: { id: string }) => p.id === squad.user_id);
                    const activeDeck = norm(squad.active_deck);
                    const name = profile?.display_name ?? profile?.username ?? "Trainer";
                    return (
                      <div key={squad.user_id} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? "border-b border-white/5" : ""}`}>
                        <span className="w-6 text-center text-sm shrink-0">{medals[i] || `#${i + 1}`}</span>
                        {activeDeck?.image_url && (
                          <div className={`shrink-0 rounded-lg border ${tierBorder[activeDeck.tier] || "border-gray-700"} bg-black/20 p-1`}>
                            <Image src={activeDeck.image_url} alt={activeDeck.name} width={24} height={24} className="object-contain" />
                          </div>
                        )}
                        <span className="flex-1 font-semibold text-sm truncate">{name}</span>
                        <span className="font-black text-yellow-400 shrink-0">{squad.total_points}pts</span>
                      </div>
                    );
                  })}
                  <div className="px-4 py-2.5 border-t border-white/5">
                    <Link href="/leaderboard" className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                      Full leaderboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight">How it works</h2>
          <p className="mt-2 text-gray-500">Three steps to compete</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { step: "01", title: "Build your squad", desc: "Pick 10 decks within a 200pt budget. 1 Active (2×), 5 Bench (1×), 4 Reserve.", color: "border-yellow-400/20 bg-yellow-400/5", accent: "text-yellow-400" },
            { step: "02", title: "Tournaments score live", desc: "Points auto-calculate from real RK9 standings after every Regional.", color: "border-purple-500/20 bg-purple-500/5", accent: "text-purple-400" },
            { step: "03", title: "Climb the league", desc: "Compete globally. Use Stadium Effects to swing big moments.", color: "border-blue-500/20 bg-blue-500/5", accent: "text-blue-400" },
          ].map((s) => (
            <div key={s.step} className={`rounded-2xl border p-6 ${s.color}`}>
              <div className={`mb-3 text-xs font-black tracking-widest ${s.accent}`}>{s.step}</div>
              <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scoring ── */}
      <section className="relative mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-7 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">Scoring system</h2>
            <Link href="/how-to-score" className="text-xs text-yellow-400 hover:underline">Full rules →</Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Made Day 2", pts: "+3 pts" },
              { label: "Top 8 finish", pts: "+10 pts" },
              { label: "Tournament win", pts: "+25 pts" },
              { label: "60%+ win rate", pts: "+20 pts" },
              { label: "Active deck bonus", pts: "2× pts" },
              { label: "Stadium Effect (×3)", pts: "3× pts" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-sm font-bold text-yellow-400">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="text-4xl font-black tracking-tight">Ready to play?</h2>
        <p className="mt-3 text-gray-400">Free to play. No cards needed. Just pick your meta calls.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link href="/squad" className="rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
              Go to my squad →
            </Link>
          ) : (
            <Link href="/auth/signup" className="rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
              Create free account →
            </Link>
          )}
          <Link href="/decks" className="rounded-xl border border-gray-700 px-6 py-3.5 text-sm text-gray-300 hover:text-white transition-colors">
            View deck list
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800/50 py-8 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} PokéLeague · Not affiliated with The Pokémon Company
      </footer>
    </main>
  );
}
