"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import DeckBrowser from "./deck-browser";
import VariantPicker, { type Variant } from "./variant-picker";
import { THEMES, DEFAULT_THEME, type Theme } from "@/lib/themes";
import { SQUAD_BUDGET } from "@/lib/constants";
import { useToast } from "@/components/toast";
import { EFFECTS, EFFECT_COLOR_CLASSES, type EffectType } from "@/lib/fantasy/effects";
import { FANTASY_CONFIG } from "@/lib/fantasy/config";

export interface Deck {
  id: number;
  name: string;
  tier: string;
  cost: number;
  meta_share: number;
  image_url: string | null;
  image_url_2: string | null;
  total_points?: number;
}

type SlotKey =
  | "active"
  | "bench_1" | "bench_2" | "bench_3" | "bench_4" | "bench_5"
  | "hand_1" | "hand_2" | "hand_3" | "hand_4";

const BENCH_SLOTS: SlotKey[] = ["bench_1", "bench_2", "bench_3", "bench_4", "bench_5"];
const HAND_SLOTS: SlotKey[] = ["hand_1", "hand_2", "hand_3", "hand_4"];

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/40"    },
  A: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/40" },
  B: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/40" },
  C: { text: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/40"  },
  D: { text: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/40"   },
};

const TIER_BORDER: Record<string, string> = {
  S: "border-red-400/50", A: "border-orange-400/50", B: "border-yellow-400/50",
  C: "border-green-500/50", D: "border-gray-600/50",
};

const BUDGET = SQUAD_BUDGET;

type Squad = Record<SlotKey, Deck | null>;
type VariantMap = Record<SlotKey, string | null>;

interface StadiumEffects {
  x3Used: boolean; handBoostUsed: boolean; benchBlitzUsed: boolean;
  metaCallUsed: boolean; darkHorseUsed: boolean; captainSwapUsed: boolean;
  eventEffect: string | null; effectCharges: number;
}

interface Props {
  allDecks: Deck[];
  initialSquad: Partial<Squad>;
  initialVariants?: Partial<VariantMap>;
  lastSaved: string | null;
  variantsByDeckId: Record<number, Variant[]>;
  stadiumEffects: StadiumEffects;
  nextEventName: string | null;
  locked: boolean;
}

interface HistoryEntry { squad: Squad; variants: VariantMap; }

export default function Playmat({
  allDecks, initialSquad, initialVariants, variantsByDeckId,
  stadiumEffects: initialEffects, nextEventName, locked: initialLocked, lastSaved,
}: Props) {
  const emptySquad: Squad = {
    active: null, bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null,
    hand_1: null, hand_2: null, hand_3: null, hand_4: null,
  };
  const emptyVariants: VariantMap = {
    active: null, bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null,
    hand_1: null, hand_2: null, hand_3: null, hand_4: null,
  };

  const toast = useToast();
  const [squad, setSquad] = useState<Squad>({ ...emptySquad, ...initialSquad });
  const [variants, setVariants] = useState<VariantMap>({ ...emptyVariants, ...initialVariants });
  const [effects, setEffects] = useState<StadiumEffects>(initialEffects);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locked, setLocked] = useState(initialLocked);
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [variantSlot, setVariantSlot] = useState<SlotKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const pushHistory = useCallback((s: Squad, v: VariantMap) => {
    setHistory((h) => [...h.slice(-9), { squad: s, variants: v }]);
  }, []);

  const handleUndo = () => {
    if (history.length === 0 || locked) return;
    const prev = history[history.length - 1];
    setSquad(prev.squad);
    setVariants(prev.variants);
    setHistory((h) => h.slice(0, -1));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("pokeleague-theme");
    if (savedTheme) {
      const found = THEMES.find((t) => t.id === savedTheme);
      if (found) setTheme(found);
    }
  }, []);

  function selectTheme(t: Theme) {
    setTheme(t); localStorage.setItem("pokeleague-theme", t.id); setShowThemePicker(false);
  }

  const totalCost = Object.values(squad).filter(Boolean).reduce((s, d) => s + d!.cost, 0);
  const remaining = BUDGET - totalCost;
  const budgetPct = Math.min((totalCost / BUDGET) * 100, 100);
  const filledCount = Object.values(squad).filter(Boolean).length;

  const handleSelectDeck = useCallback((deck: Deck) => {
    if (!openSlot || locked) return;
    const currentCost = squad[openSlot]?.cost ?? 0;
    if (totalCost - currentCost + deck.cost > BUDGET) return;
    pushHistory(squad, variants);
    const newSquad = { ...squad };
    (Object.keys(newSquad) as SlotKey[]).forEach((k) => { if (newSquad[k]?.id === deck.id) newSquad[k] = null; });
    newSquad[openSlot] = deck;
    setSquad(newSquad);
    setVariants((v) => ({ ...v, [openSlot]: null }));
    setOpenSlot(null);
    setUnsaved(true);
    if ((variantsByDeckId[deck.id] ?? []).length > 0) setVariantSlot(openSlot);
  }, [openSlot, squad, variants, locked, totalCost, variantsByDeckId, pushHistory]);

  const handleSelectVariant = useCallback((variantName: string | null) => {
    if (!variantSlot) return;
    setVariants((v) => ({ ...v, [variantSlot]: variantName }));
    setVariantSlot(null);
  }, [variantSlot]);

  const handleRemove = (key: SlotKey) => {
    if (locked) return;
    pushHistory(squad, variants);
    setSquad((s) => ({ ...s, [key]: null }));
    setVariants((v) => ({ ...v, [key]: null }));
    setUnsaved(true);
  };

  const handleClear = () => {
    if (locked) return;
    pushHistory(squad, variants);
    setSquad(emptySquad);
    setVariants(emptyVariants);
    setUnsaved(true);
  };

  const isEffectUsed = (id: EffectType): boolean => ({
    x3: effects.x3Used, hand_boost: effects.handBoostUsed, bench_blitz: effects.benchBlitzUsed,
    meta_call: effects.metaCallUsed, dark_horse: effects.darkHorseUsed, captain_swap: effects.captainSwapUsed,
  }[id]);

  const chargesUsedThisEvent = effects.eventEffect ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0) : 0;
  const availableCharges = effects.effectCharges - chargesUsedThisEvent;

  const toggleEffect = (effectId: EffectType) => {
    if (locked || isEffectUsed(effectId)) return;
    const cost = FANTASY_CONFIG.EFFECT_COSTS[effectId] ?? 1;
    const currentCost = effects.eventEffect ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0) : 0;
    if (effects.eventEffect !== effectId && cost > effects.effectCharges - currentCost) return;
    setEffects((e) => ({ ...e, eventEffect: e.eventEffect === effectId ? null : effectId }));
    setUnsaved(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(false);
    try {
      const res = await fetch("/api/squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active_deck_id: squad.active?.id ?? null,
          bench_1: squad.bench_1?.id ?? null, bench_2: squad.bench_2?.id ?? null,
          bench_3: squad.bench_3?.id ?? null, bench_4: squad.bench_4?.id ?? null,
          bench_5: squad.bench_5?.id ?? null,
          hand_1: squad.hand_1?.id ?? null, hand_2: squad.hand_2?.id ?? null,
          hand_3: squad.hand_3?.id ?? null, hand_4: squad.hand_4?.id ?? null,
          active_variant: variants.active, bench_1_variant: variants.bench_1,
          bench_2_variant: variants.bench_2, bench_3_variant: variants.bench_3,
          bench_4_variant: variants.bench_4, bench_5_variant: variants.bench_5,
          hand_1_variant: variants.hand_1, hand_2_variant: variants.hand_2,
          hand_3_variant: variants.hand_3, hand_4_variant: variants.hand_4,
          event_effect: effects.eventEffect, effect_charges: effects.effectCharges,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true); setUnsaved(false);
      toast("Squad saved!", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError(true);
      toast("Save failed — try again", "error");
      setTimeout(() => setSaveError(false), 3000);
    } finally { setSaving(false); }
  };

  const handleLock = async () => { if (!locked) setShowLockConfirm(true); else setLocked(false); };
  const confirmLock = async () => { setShowLockConfirm(false); setLocked(true); await handleSave(); };

  const usedIds = new Set(Object.values(squad).filter(Boolean).map((d) => d!.id));
  const activeVariants = variantSlot && squad[variantSlot] ? (variantsByDeckId[squad[variantSlot]!.id] ?? []) : [];
  const handBoosted = effects.eventEffect === "hand_boost";

  const open = (key: SlotKey) => { if (!locked) setOpenSlot(key); };

  return (
    <div className={`relative rounded-2xl ${theme.bg} p-4 md:p-6`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b ${theme.overlay} opacity-60`} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 space-y-5">

        {/* ── Unsaved warning ── */}
        {unsaved && !locked && (
          <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0">⚠️</span>
              <span className="text-sm font-semibold text-orange-300">Unsaved changes — hit Save before the squad lock.</span>
              {lastSaved && <span className="ml-auto text-[10px] text-orange-400/40 hidden sm:block">Last: {lastSaved}</span>}
            </div>
          </div>
        )}

        {/* ── Top bar: theme + budget ── */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setShowThemePicker((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm hover:bg-black/30 transition-colors">
            <span>{theme.emoji}</span>
            <span className={`font-medium ${theme.accent}`}>{theme.name}</span>
            <span className="text-gray-600 text-xs">{showThemePicker ? "▴" : "▾"}</span>
          </button>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{filledCount}/10 picks</span>
              <span className={`text-sm font-bold ${remaining < 20 ? "text-red-400" : remaining < 50 ? "text-orange-400" : theme.accent}`}>
                {remaining} <span className="font-normal text-gray-600 text-xs">/ {BUDGET} left</span>
              </span>
            </div>
            <div className="h-1.5 w-36 rounded-full bg-white/10">
              <div className={`h-1.5 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-orange-400" : "bg-yellow-400"}`}
                style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </div>

        {/* Theme picker */}
        {showThemePicker && (
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/50 p-3">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => selectTheme(t)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all ${theme.id === t.id ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"}`}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-gray-300">{t.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════
            ACTIVE DECK
        ══════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-black uppercase tracking-widest ${theme.accent}`}>⭐ Active</span>
            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">2× Points</span>
          </div>
          <ActiveSlot
            deck={squad.active}
            variant={variants.active}
            locked={locked}
            theme={theme}
            onOpen={() => open("active")}
            onRemove={() => handleRemove("active")}
            onVariant={() => !locked && squad.active && setVariantSlot("active")}
            hasVariants={(variantsByDeckId[squad.active?.id ?? 0] ?? []).length > 0}
          />
        </div>

        {/* ══════════════════════════════════
            BENCH (5 slots)
        ══════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Bench <span className="text-gray-700">· 1× each</span></span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">
            {BENCH_SLOTS.map((key, i) => (
              <RowSlot
                key={key}
                label={`Bench ${i + 1}`}
                deck={squad[key]}
                variant={variants[key]}
                locked={locked}
                theme={theme}
                onOpen={() => open(key)}
                onRemove={() => handleRemove(key)}
                onVariant={() => !locked && squad[key] && setVariantSlot(key)}
                hasVariants={(variantsByDeckId[squad[key]?.id ?? 0] ?? []).length > 0}
                dimmed={false}
                badge="1×"
                badgeClass="bg-white/10 text-gray-500"
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════
            RESERVE (4 slots)
        ══════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className={`text-xs font-semibold uppercase tracking-widest ${handBoosted ? "text-blue-400" : "text-gray-500"}`}>
              Reserve
              {handBoosted
                ? <span className="ml-1.5 rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[9px] text-blue-300 normal-case">1× Boosted!</span>
                : <span className="text-gray-700"> · 0× inactive</span>}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HAND_SLOTS.map((key, i) => (
              <RowSlot
                key={key}
                label={`Reserve ${i + 1}`}
                deck={squad[key]}
                variant={variants[key]}
                locked={locked}
                theme={theme}
                onOpen={() => open(key)}
                onRemove={() => handleRemove(key)}
                onVariant={() => !locked && squad[key] && setVariantSlot(key)}
                hasVariants={(variantsByDeckId[squad[key]?.id ?? 0] ?? []).length > 0}
                dimmed={!handBoosted}
                badge={handBoosted ? "1×" : "0×"}
                badgeClass={handBoosted ? "bg-blue-500/20 text-blue-300" : "bg-gray-800 text-gray-600"}
              />
            ))}
          </div>
          {!handBoosted && (
            <p className="mt-1.5 text-center text-[10px] text-gray-600">
              Use <span className="text-blue-400">Hand Boost</span> stadium effect to activate reserve decks at 1×
            </p>
          )}
        </div>

        {/* ══════════════════════════════════
            STADIUM EFFECTS (collapsible)
        ══════════════════════════════════ */}
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <button
            onClick={() => setShowEffects(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🏟</span>
              <span className="text-sm font-semibold text-gray-300">Stadium Effects</span>
              {effects.eventEffect && (
                <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">Active</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: FANTASY_CONFIG.EFFECT_CHARGES }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < availableCharges ? "bg-yellow-400" : "bg-gray-700"}`} />
                ))}
                <span className="text-[10px] text-gray-500 ml-1">{availableCharges}/{FANTASY_CONFIG.EFFECT_CHARGES}</span>
              </div>
              <span className="text-gray-600 text-xs">{showEffects ? "▴" : "▾"}</span>
            </div>
          </button>

          {showEffects && (
            <div className="px-4 pb-4 border-t border-white/5">
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {EFFECTS.map((effect) => {
                  const used = isEffectUsed(effect.id);
                  const active = effects.eventEffect === effect.id;
                  const colors = EFFECT_COLOR_CLASSES[effect.color];
                  const currentCost = effects.eventEffect && effects.eventEffect !== effect.id
                    ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0) : 0;
                  const canAfford = active || effect.cost <= effects.effectCharges - currentCost;

                  return (
                    <button
                      key={effect.id}
                      disabled={locked || used || (!active && !canAfford)}
                      onClick={() => toggleEffect(effect.id)}
                      className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all
                        ${used ? "border-gray-700/40 opacity-40 cursor-not-allowed"
                          : !active && !canAfford ? "border-gray-700/40 opacity-40 cursor-not-allowed"
                          : active ? `${colors.border} ${colors.bg}`
                          : "border-white/10 hover:border-white/30 cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{effect.emoji}</span>
                          <span className={`text-xs font-bold truncate ${used ? "text-gray-600" : active ? colors.text : "text-gray-300"}`}>
                            {effect.label}
                          </span>
                        </div>
                        {used
                          ? <span className="shrink-0 rounded bg-gray-700 px-1 py-0.5 text-[8px] text-gray-500 font-bold">USED</span>
                          : active
                            ? <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ${colors.badge}`}>ON</span>
                            : <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[8px] text-gray-500">{effect.cost}⚡</span>
                        }
                      </div>
                      {!used && <p className="text-[10px] text-gray-500 leading-snug">{effect.description}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════
            ACTIONS
        ══════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex gap-2">
            <button onClick={handleClear} disabled={locked || filledCount === 0}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
              Clear
            </button>
            <button onClick={handleUndo} disabled={locked || history.length === 0}
              title="Undo last change"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
              ↩ Undo
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || locked}
              className={`rounded-lg px-5 py-2 text-sm font-semibold border transition-all disabled:opacity-40
                ${saveError ? "border-red-400/60 bg-red-500/20 text-red-300"
                  : saved ? "border-green-400/60 bg-green-500/20 text-green-300"
                  : unsaved && !locked ? "border-yellow-400/70 bg-yellow-500/20 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.15)]"
                  : "border-white/10 bg-black/30 text-gray-400"}`}
            >
              {saving ? "Saving…" : saveError ? "❌ Failed" : saved ? "✓ Saved" : unsaved ? "Save ●" : "Save"}
            </button>
            <button onClick={handleLock}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all
                ${locked ? "bg-red-600/80 border border-red-500/60 text-white hover:bg-red-500/80"
                  : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"}`}
            >
              {locked ? "🔒 Locked" : `Lock In (${filledCount}/10)`}
            </button>
          </div>
        </div>

      </div>

      {/* ── Lock confirmation modal ── */}
      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-yellow-400/30 bg-gray-950 p-6">
            <h2 className="text-lg font-bold mb-1">Lock In Squad?</h2>
            {nextEventName
              ? <p className="text-sm text-gray-400 mb-1">For: <span className="font-semibold text-yellow-400">{nextEventName}</span></p>
              : <p className="text-sm text-gray-400 mb-1">No upcoming event — you can still lock in.</p>}
            <p className="text-xs text-gray-600 mb-5">Squad cannot be changed until the event deadline passes.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLockConfirm(false)}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 hover:border-gray-500 transition-colors">
                Cancel
              </button>
              <button onClick={confirmLock}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors">
                🔒 Lock In
              </button>
            </div>
          </div>
        </div>
      )}

      {openSlot && (
        <DeckBrowser decks={allDecks} usedIds={usedIds} remaining={remaining}
          currentSlotCost={squad[openSlot]?.cost ?? 0} onSelect={handleSelectDeck}
          onClose={() => setOpenSlot(null)} theme={theme} />
      )}

      {variantSlot && activeVariants.length > 0 && (
        <VariantPicker variants={activeVariants} currentVariant={variants[variantSlot]}
          onSelect={handleSelectVariant} onClose={() => setVariantSlot(null)}
          theme={theme} deckName={squad[variantSlot]?.name ?? ""} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Active slot — large horizontal card
// ──────────────────────────────────────────────────────────────
function ActiveSlot({ deck, variant, locked, theme, onOpen, onRemove, onVariant, hasVariants }: {
  deck: Deck | null; variant: string | null; locked: boolean; theme: Theme;
  onOpen: () => void; onRemove: () => void; onVariant: () => void; hasVariants: boolean;
}) {
  const tc = deck ? (TIER_COLORS[deck.tier] || TIER_COLORS.D) : null;
  const border = deck ? (TIER_BORDER[deck.tier] || "border-gray-600/50") : "border-white/10";

  return (
    <div
      onClick={!locked ? onOpen : undefined}
      className={`flex items-center gap-4 rounded-2xl border-2 ${border} bg-black/30 p-4 transition-all
        ${!locked ? "cursor-pointer hover:border-white/40 hover:bg-black/40" : ""}`}
      style={{ minHeight: "88px" }}
    >
      {deck ? (
        <>
          {/* Images */}
          <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
            {deck.image_url && (
              <Image src={deck.image_url} alt={deck.name} width={56} height={56} className="object-contain drop-shadow-lg" />
            )}
            {deck.image_url_2 && (
              <Image src={deck.image_url_2} alt="" width={26} height={26} className="absolute -bottom-1 -right-1 object-contain drop-shadow-md" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-white text-base leading-tight">{deck.name}</p>
              {tc && (
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black ${tc.text} ${tc.bg} ${tc.border}`}>
                  {deck.tier}
                </span>
              )}
              <span className="rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">2×</span>
            </div>
            <p className="text-sm text-yellow-400 font-semibold">{deck.cost} pts</p>
            {hasVariants && !locked && (
              <button onClick={(e) => { e.stopPropagation(); onVariant(); }}
                className={`mt-1 rounded px-2 py-0.5 text-[10px] transition-colors
                  ${variant ? "bg-blue-500/30 text-blue-300 hover:bg-blue-500/50" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>
                {variant ? `✓ ${variant}` : "+ variant"}
              </button>
            )}
            {hasVariants && locked && variant && (
              <span className="mt-1 inline-block rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">{variant}</span>
            )}
          </div>

          {/* Remove */}
          {!locked && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="shrink-0 rounded-full bg-black/60 p-1.5 text-gray-400 hover:text-red-400 hover:bg-black/80 transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 2L6 6m0 0L2 10m4-4L2 2m4 4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </>
      ) : (
        <div className={`flex items-center gap-3 text-white/20 ${!locked ? "hover:text-white/40" : ""} transition-colors w-full`}>
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-3xl font-light text-white/20">+</span>
          </div>
          <p className={`text-sm font-medium ${theme.accent} opacity-40`}>Pick your Active Deck</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Row slot — for bench and reserve
// ──────────────────────────────────────────────────────────────
function RowSlot({ label, deck, variant, locked, theme, onOpen, onRemove, onVariant, hasVariants, dimmed, badge, badgeClass }: {
  label: string; deck: Deck | null; variant: string | null; locked: boolean; theme: Theme;
  onOpen: () => void; onRemove: () => void; onVariant: () => void; hasVariants: boolean;
  dimmed: boolean; badge: string; badgeClass: string;
}) {
  const tc = deck ? (TIER_COLORS[deck.tier] || TIER_COLORS.D) : null;
  const border = deck ? (TIER_BORDER[deck.tier] || "border-gray-600/40") : "border-white/5";

  return (
    <div
      onClick={!locked ? onOpen : undefined}
      className={`flex items-center gap-3 rounded-xl border ${border} bg-black/20 px-3 py-2.5 transition-all
        ${!locked ? "cursor-pointer hover:border-white/30 hover:bg-black/30" : ""}
        ${dimmed && !deck ? "opacity-40" : dimmed ? "opacity-60" : ""}`}
    >
      {deck ? (
        <>
          {/* Image */}
          <div className="shrink-0 w-9 h-9 relative flex items-center justify-center">
            {deck.image_url
              ? <Image src={deck.image_url} alt={deck.name} width={34} height={34} className="object-contain" />
              : <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 text-xs">?</div>
            }
          </div>

          {/* Name + tier */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-white truncate">{deck.name}</span>
              {tc && (
                <span className={`rounded border px-1 py-0.5 text-[9px] font-black ${tc.text} ${tc.bg} ${tc.border}`}>
                  {deck.tier}
                </span>
              )}
              {hasVariants && !locked && (
                <button onClick={(e) => { e.stopPropagation(); onVariant(); }}
                  className={`rounded px-1 py-0.5 text-[9px] transition-colors
                    ${variant ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-gray-500 hover:text-gray-300"}`}>
                  {variant ? `✓ ${variant.split(" ").slice(-1)[0]}` : "+ var"}
                </button>
              )}
            </div>
            <p className="text-xs text-yellow-400/70">{deck.cost} pts</p>
          </div>

          {/* Badge + remove */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${badgeClass}`}>{badge}</span>
            {!locked && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="rounded-full bg-black/40 p-1 text-gray-500 hover:text-red-400 hover:bg-black/60 transition-colors">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 12 12">
                  <path d="M9 3L3 9M3 3l6 6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2.5 w-full">
          <div className="w-9 h-9 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0">
            <span className="text-white/20 text-lg">+</span>
          </div>
          <span className="text-xs text-gray-600">{label}</span>
          <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold ${badgeClass}`}>{badge}</span>
        </div>
      )}
    </div>
  );
}
