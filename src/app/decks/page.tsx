import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export const dynamic = 'force-dynamic';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  S: { label: "S", color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    dot: "bg-red-400"    },
  A: { label: "A", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", dot: "bg-orange-400" },
  B: { label: "B", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", dot: "bg-yellow-400" },
  C: { label: "C", color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  dot: "bg-green-400"  },
  D: { label: "D", color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   dot: "bg-blue-400"   },
};

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase.rpc("get_deck_list_with_points");
  const allDecks = decks ?? [];

  // Group by tier
  const byTier: Record<string, typeof allDecks> = {};
  for (const deck of allDecks) {
    const t = deck.tier || "D";
    if (!byTier[t]) byTier[t] = [];
    byTier[t].push(deck);
  }

  const tierOrder = ["S", "A", "B", "C", "D"];
  const maxMeta = Math.max(...allDecks.map((d: any) => d.meta_share ?? 0), 1);

  // Summary stats
  const totalDecks = allDecks.length;
  const sCnt = byTier["S"]?.length ?? 0;
  const aCnt = byTier["A"]?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          Deck <span className="text-yellow-400">Analytics</span>
        </h1>
        <p className="text-sm text-gray-500">
          {totalDecks} fantasy-eligible decks · updated from RK9 standings
        </p>
      </div>

      {/* Summary pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tierOrder.map(tier => {
          const cfg = TIER_CONFIG[tier];
          const cnt = byTier[tier]?.length ?? 0;
          if (!cnt) return null;
          return (
            <div key={tier} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              Tier {tier} <span className="font-normal opacity-70">· {cnt} decks</span>
            </div>
          );
        })}
      </div>

      {/* Tier sections */}
      <div className="space-y-10">
        {tierOrder.map(tier => {
          const tierDecks = byTier[tier];
          if (!tierDecks?.length) return null;
          const cfg = TIER_CONFIG[tier];
          return (
            <div key={tier}>
              {/* Tier header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-black ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  {tier}
                </div>
                <div>
                  <p className={`text-sm font-bold ${cfg.color}`}>Tier {tier}</p>
                  <p className="text-xs text-gray-600">{tierDecks.length} deck{tierDecks.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Deck cards */}
              <div className="space-y-2">
                {tierDecks
                  .sort((a: any, b: any) => (b.meta_share ?? 0) - (a.meta_share ?? 0))
                  .map((deck: any, idx: number) => {
                    const metaPct = ((deck.meta_share ?? 0) / maxMeta) * 100;
                    return (
                      <Link
                        key={deck.deck_id}
                        href={`/decks/${deck.archetype_slug}`}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 p-4 transition-all hover:border-yellow-400/30 hover:bg-gray-900/80"
                      >
                        {/* Meta share background bar */}
                        <div
                          className="pointer-events-none absolute inset-y-0 left-0 opacity-5 transition-all group-hover:opacity-10"
                          style={{ width: `${metaPct}%`, background: "linear-gradient(90deg, #FBBF24, transparent)" }}
                        />

                        {/* Rank */}
                        <span className="w-5 flex-shrink-0 text-center text-xs font-bold text-gray-700">
                          {idx + 1}
                        </span>

                        {/* Images */}
                        <div className="flex flex-shrink-0 items-center">
                          {deck.image_url && (
                            <Image src={deck.image_url} alt={deck.deck_name} width={44} height={44} className="rounded-lg object-contain" />
                          )}
                          {deck.image_url_2 && (
                            <Image src={deck.image_url_2} alt={deck.deck_name} width={44} height={44} className="-ml-3 rounded-lg object-contain" />
                          )}
                          {!deck.image_url && (
                            <div className="h-11 w-11 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-lg">🃏</div>
                          )}
                        </div>

                        {/* Name + meta bar */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white truncate group-hover:text-yellow-50 transition-colors">
                            {deck.deck_name}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <div className="flex-1 max-w-32 h-1 rounded-full bg-white/5">
                              <div
                                className={`h-1 rounded-full ${cfg.dot} opacity-60`}
                                style={{ width: `${metaPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{deck.meta_share?.toFixed(1)}% meta</span>
                          </div>
                        </div>

                        {/* Cost + points */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-black text-yellow-400">{deck.cost}pts</p>
                          {deck.total_points > 0 && (
                            <p className="text-xs text-gray-600">{deck.total_points} earned</p>
                          )}
                        </div>

                        {/* Arrow */}
                        <span className="flex-shrink-0 text-gray-700 group-hover:text-yellow-400 transition-colors text-sm">→</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
