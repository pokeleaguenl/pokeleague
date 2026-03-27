import Link from "next/link";
import { FANTASY_CONFIG } from "@/lib/fantasy/config";

export const dynamic = 'force-dynamic';

const SECTION = "mb-10";
const H2 = "text-xl font-black text-white mb-4";
const H3 = "text-sm font-bold text-yellow-400 uppercase tracking-widest mb-3";
const P = "text-sm text-gray-400 leading-relaxed mb-3";

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-2">
          How it <span className="text-yellow-400">Works</span>
        </h1>
        <p className="text-gray-500 text-sm">
          PokéLeague Fantasy — pick the meta, score the tournament, beat your friends.
        </p>
      </div>

      {/* Overview */}
      <section className={SECTION}>
        <h2 className={H2}>The Concept</h2>
        <p className={P}>
          PokéLeague is a fantasy game built around competitive Pokémon TCG. Before each Regional
          Championship, you build a squad of 10 decks from the current meta. When a tournament runs,
          your decks earn points based on how well those archetypes actually performed — the better
          they placed in the real standings, the more points you score.
        </p>
        <p className={P}>
          Over the course of the season, points accumulate on the global leaderboard. Use your Stadium
          Effects wisely, lock in your squad before the deadline, and outpick the meta to climb the ranks.
        </p>
      </section>

      {/* Squad Structure */}
      <section className={SECTION}>
        <h2 className={H2}>Building Your Squad</h2>

        <div className="space-y-4 mb-6">
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-bold text-white text-sm mb-0.5">Active Deck — 1 slot · 2× multiplier</p>
                <p className="text-xs text-gray-400">Your captain. Scores double points every tournament. Choose wisely — it's your highest-leverage pick.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🃏</span>
              <div>
                <p className="font-bold text-white text-sm mb-0.5">Bench — 5 slots · 1× multiplier</p>
                <p className="text-xs text-gray-400">Your main scoring picks. Each deck earns its base points. A balanced bench covering multiple meta threats is key.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-600/30 bg-gray-900/30 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✋</span>
              <div>
                <p className="font-bold text-white text-sm mb-0.5">Reserve — 4 slots · 0× (inactive)</p>
                <p className="text-xs text-gray-400">
                  Reserve decks score nothing by default — they're your contingency picks.
                  Activate them with the <span className="text-blue-400 font-semibold">Hand Boost</span> Stadium Effect to make all 4 score at 1× for one event.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
          <p className={H3}>Budget System</p>
          <p className={P}>
            You have a <span className="text-yellow-400 font-semibold">200-point budget</span> to build your full squad of 10.
            Each deck has a cost reflecting its meta power — S-tier decks cost more than fringe picks.
            Spending smart is the game within the game.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { tier: "S", cost: "28–32", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
              { tier: "A", cost: "20–25", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
              { tier: "B", cost: "14–18", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
              { tier: "C", cost: "8–12", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
              { tier: "D", cost: "5–8", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
            ].map(t => (
              <div key={t.tier} className={`rounded-lg border p-2.5 text-center ${t.bg}`}>
                <p className={`text-lg font-black ${t.color}`}>{t.tier}</p>
                <p className="text-[10px] text-gray-500">{t.cost} pts</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className={SECTION}>
        <h2 className={H2}>How Points Are Scored</h2>
        <p className={P}>
          After each tournament, we import the RK9 standings. Every archetype in your squad that
          appeared at the event earns points based on its best placement finish.
        </p>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 mb-4">
          <p className={H3}>Placement Points (per deck, per tournament)</p>
          <div className="space-y-2">
            {[
              { label: "Tournament Winner", pts: FANTASY_CONFIG.POINTS.TOP1, badge: "🏆", color: "text-yellow-400" },
              { label: "Top 2", pts: FANTASY_CONFIG.POINTS.TOP2, badge: "🥈", color: "text-gray-300" },
              { label: "Top 4", pts: FANTASY_CONFIG.POINTS.TOP4, badge: "🥉", color: "text-orange-400" },
              { label: "Top 8", pts: FANTASY_CONFIG.POINTS.TOP8, badge: "🔵", color: "text-blue-400" },
              { label: "Top 16", pts: FANTASY_CONFIG.POINTS.TOP16, badge: "⚪", color: "text-gray-400" },
              { label: "Top 32", pts: FANTASY_CONFIG.POINTS.TOP32, badge: "⚫", color: "text-gray-500" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span>{row.badge}</span>
                  <span className="text-sm text-gray-300">{row.label}</span>
                </div>
                <span className={`text-sm font-bold ${row.color}`}>+{row.pts} pts</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-600">
            Points are awarded for the best-finishing player running your deck archetype. One deck can only score once per tournament — but the same archetype can score in multiple slots if you picked it multiple times.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5">
          <p className={H3}>Win Rate Bonuses</p>
          <div className="space-y-2">
            {[
              { label: "65%+ win rate at event", pts: FANTASY_CONFIG.POINTS.WIN_RATE_65, color: "text-green-400" },
              { label: "60%+ win rate at event", pts: FANTASY_CONFIG.POINTS.WIN_RATE_60, color: "text-green-400" },
              { label: "55%+ win rate at event", pts: FANTASY_CONFIG.POINTS.WIN_RATE_55, color: "text-green-400" },
              { label: "Had at least 1 win", pts: FANTASY_CONFIG.POINTS.HAD_WIN, color: "text-gray-400" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2">
                <span className="text-sm text-gray-300">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>+{row.pts} pts</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-600">
            Win rate bonuses are applied to the deck's base score before slot multipliers. Only one win rate tier applies per deck.
          </p>
        </div>
      </section>

      {/* Stadium Effects */}
      <section className={SECTION}>
        <h2 className={H2}>Stadium Effects</h2>
        <p className={P}>
          Each season you get <span className="text-yellow-400 font-semibold">{FANTASY_CONFIG.EFFECT_CHARGES} charge points</span> to spend on Stadium Effects.
          You can use one effect per tournament — pick it before the squad lock. Effects expire once used.
        </p>

        <div className="space-y-3">
          {[
            {
              emoji: "⚡",
              name: "3× Overdrive",
              cost: FANTASY_CONFIG.EFFECT_COSTS.x3,
              color: "text-yellow-400",
              border: "border-yellow-400/20",
              bg: "bg-yellow-400/5",
              desc: "Your Active Deck scores at 3× instead of 2× for one tournament. Use it when your pick is the tournament favourite.",
            },
            {
              emoji: "🖐",
              name: "Hand Boost",
              cost: FANTASY_CONFIG.EFFECT_COSTS.hand_boost,
              color: "text-blue-400",
              border: "border-blue-400/20",
              bg: "bg-blue-400/5",
              desc: "Your 4 Reserve slots activate at 1× for one tournament. Turns dead weight into scoring picks.",
            },
            {
              emoji: "💥",
              name: "Bench Blitz",
              cost: FANTASY_CONFIG.EFFECT_COSTS.bench_blitz,
              color: "text-orange-400",
              border: "border-orange-400/20",
              bg: "bg-orange-400/5",
              desc: "All Bench decks score at 1.5× for one tournament. Great for events with a diverse meta.",
            },
            {
              emoji: "🎯",
              name: "Meta Call",
              cost: FANTASY_CONFIG.EFFECT_COSTS.meta_call,
              color: "text-green-400",
              border: "border-green-400/20",
              bg: "bg-green-400/5",
              desc: `Your Active Deck earns +${FANTASY_CONFIG.META_CALL_BONUS} bonus points if it finishes Top 8. Reward for reading the room.`,
            },
            {
              emoji: "🐴",
              name: "Dark Horse",
              cost: FANTASY_CONFIG.EFFECT_COSTS.dark_horse,
              color: "text-purple-400",
              border: "border-purple-400/20",
              bg: "bg-purple-400/5",
              desc: `Your Active Deck earns +${FANTASY_CONFIG.DARK_HORSE_BONUS} bonus points if it finishes Top 8 as a non-top-3 meta deck. High risk, high reward.`,
            },
            {
              emoji: "🔄",
              name: "Captain Swap",
              cost: FANTASY_CONFIG.EFFECT_COSTS.captain_swap,
              color: "text-red-400",
              border: "border-red-400/20",
              bg: "bg-red-400/5",
              desc: "Swap your Active Deck with a Bench deck after the event starts. Last-minute pivoting at a cost.",
            },
          ].map(e => (
            <div key={e.name} className={`rounded-xl border ${e.border} ${e.bg} p-4`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{e.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-bold text-sm ${e.color}`}>{e.name}</p>
                    <span className="text-[10px] text-gray-500 font-bold">{e.cost}⚡ charge{e.cost > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{e.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Squad Lock */}
      <section className={SECTION}>
        <h2 className={H2}>Squad Lock</h2>
        <p className={P}>
          Squads lock automatically before each tournament's Day 1 starts. Once locked, you can't
          change your picks until the event is over. This is intentional — the skill is in reading
          the meta before the information becomes public.
        </p>
        <div className="rounded-xl border border-orange-400/20 bg-orange-400/5 p-4">
          <p className="text-sm text-orange-300 font-semibold mb-1">⚠️ Don't forget to save!</p>
          <p className="text-xs text-gray-400">
            Your squad is only recorded when you hit <strong>Save</strong>. An unsaved squad won't
            count for scoring — even if it was locked. You'll see an orange warning banner on the
            squad page whenever there are unsaved changes.
          </p>
        </div>
      </section>

      {/* Leagues */}
      <section className={SECTION}>
        <h2 className={H2}>Leagues</h2>
        <p className={P}>
          Leagues let you compete within a private group — friends, a Discord community, a local
          game store crew. Each league has its own leaderboard tracking cumulative points across
          the season.
        </p>
        <p className={P}>
          Anyone can create a league and invite others with a join code. Your points carry over
          from the global leaderboard — joining a league doesn't reset your score.
        </p>
      </section>

      {/* Tips */}
      <section className={SECTION}>
        <h2 className={H2}>Strategy Tips</h2>
        <div className="space-y-3">
          {[
            "Load up on meta favourites as your Active + top Bench picks — they earn the most but cost the most budget.",
            "Use cheap C/D-tier rogue picks to fill out your squad without blowing the budget.",
            "Save your 3× Overdrive for a major tournament (Worlds, Internationals) where the stakes are highest.",
            "Track which decks are trending on Limitless TCG before locking your squad.",
            "The Bench Blitz effect is most powerful when 4-5 different archetypes all hit Top 32 at once.",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
              <span className="text-yellow-400 font-bold text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-gray-400 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center">
        <p className="text-xl font-black mb-2">Ready to Play?</p>
        <p className="text-sm text-gray-400 mb-4">Build your squad and pick the meta.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/squad" className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
            Build Squad →
          </Link>
          <Link href="/decks" className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:border-white/30 transition-colors">
            View Decks
          </Link>
        </div>
      </div>
    </div>
  );
}
