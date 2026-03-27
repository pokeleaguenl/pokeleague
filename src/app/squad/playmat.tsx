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

interface SlotDef {
  key: SlotKey;
  label: string;
  zone: "active" | "bench" | "hand";
}

const ACTIVE_SLOT: SlotDef = { key: "active", label: "Active", zone: "active" };
const BENCH_SLOTS: SlotDef[] = [
  { key: "bench_1", label: "Bench 1", zone: "bench" },
  { key: "bench_2", label: "Bench 2", zone: "bench" },
  { key: "bench_3", label: "Bench 3", zone: "bench" },
  { key: "bench_4", label: "Bench 4", zone: "bench" },
  { key: "bench_5", label: "Bench 5", zone: "bench" },
];
const HAND_SLOTS: SlotDef[] = [
  { key: "hand_1", label: "Reserve 1", zone: "hand" },
  { key: "hand_2", label: "Reserve 2", zone: "hand" },
  { key: "hand_3", label: "Reserve 3", zone: "hand" },
  { key: "hand_4", label: "Reserve 4", zone: "hand" },
];

const BUDGET = SQUAD_BUDGET;

type Squad = Record<SlotKey, Deck | null>;
type VariantMap = Record<SlotKey, string | null>;

const tierBorders: Record<string, string> = {
  S: "border-yellow-400",
  A: "border-purple-500",
  B: "border-blue-500",
  C: "border-green-600",
  D: "border-gray-600",
};

interface StadiumEffects {
  // Per-effect permanent use flags
  x3Used: boolean;
  handBoostUsed: boolean;
  benchBlitzUsed: boolean;
  metaCallUsed: boolean;
  darkHorseUsed: boolean;
  captainSwapUsed: boolean;
  // Currently queued effect for this event
  eventEffect: string | null;
  // Remaining charge budget
  effectCharges: number;
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

interface HistoryEntry {
  squad: Squad;
  variants: VariantMap;
}

export default function Playmat({
  allDecks,
  initialSquad,
  initialVariants,
  variantsByDeckId,
  stadiumEffects: initialEffects,
  nextEventName,
  locked: initialLocked,
  lastSaved,
}: Props) {
  const emptySquad: Squad = {
    active: null,
    bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null,
    hand_1: null, hand_2: null, hand_3: null, hand_4: null,
  };
  const emptyVariants: VariantMap = {
    active: null,
    bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null,
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
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const pushHistory = useCallback((currentSquad: Squad, currentVariants: VariantMap) => {
    setHistory((h) => [...h.slice(-9), { squad: currentSquad, variants: currentVariants }]);
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
    setTheme(t);
    localStorage.setItem("pokeleague-theme", t.id);
    setShowThemePicker(false);
  }

  const totalCost = Object.values(squad).filter(Boolean).reduce((sum, d) => sum + d!.cost, 0);
  const remaining = BUDGET - totalCost;
  const budgetPct = Math.min((totalCost / BUDGET) * 100, 100);
  const filledCount = Object.values(squad).filter(Boolean).length;

  const handleSelectDeck = useCallback((deck: Deck) => {
    if (!openSlot || locked) return;
    const currentSlotDeck = squad[openSlot];
    const currentSlotCost = currentSlotDeck?.cost ?? 0;
    const newCost = totalCost - currentSlotCost + deck.cost;
    if (newCost > BUDGET) return;

    pushHistory(squad, variants);
    const newSquad = { ...squad };
    (Object.keys(newSquad) as SlotKey[]).forEach((k) => {
      if (newSquad[k]?.id === deck.id) newSquad[k] = null;
    });
    newSquad[openSlot] = deck;
    setSquad(newSquad);
    setVariants((v) => ({ ...v, [openSlot]: null }));
    setOpenSlot(null);
    setUnsaved(true);

    const deckVariants = variantsByDeckId[deck.id] ?? [];
    if (deckVariants.length > 0) {
      setVariantSlot(openSlot);
    }
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

  const isEffectUsed = (effectId: EffectType): boolean => {
    const map: Record<EffectType, boolean> = {
      x3: effects.x3Used,
      hand_boost: effects.handBoostUsed,
      bench_blitz: effects.benchBlitzUsed,
      meta_call: effects.metaCallUsed,
      dark_horse: effects.darkHorseUsed,
      captain_swap: effects.captainSwapUsed,
    };
    return map[effectId];
  };

  const chargesUsedThisEvent = effects.eventEffect
    ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0)
    : 0;
  const availableCharges = effects.effectCharges - chargesUsedThisEvent;

  const toggleEffect = (effectId: EffectType) => {
    if (locked) return;
    if (isEffectUsed(effectId)) return;
    const cost = FANTASY_CONFIG.EFFECT_COSTS[effectId] ?? 1;
    // If toggling on, check we have enough charges (count charges excluding current selection)
    const currentCost = effects.eventEffect ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0) : 0;
    const chargesAfterRemovingCurrent = effects.effectCharges - currentCost;
    if (effects.eventEffect !== effectId && cost > chargesAfterRemovingCurrent) return;
    setEffects((e) => ({ ...e, eventEffect: e.eventEffect === effectId ? null : effectId }));
    setUnsaved(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(false);
    const body = {
      active_deck_id: squad.active?.id ?? null,
      bench_1: squad.bench_1?.id ?? null,
      bench_2: squad.bench_2?.id ?? null,
      bench_3: squad.bench_3?.id ?? null,
      bench_4: squad.bench_4?.id ?? null,
      bench_5: squad.bench_5?.id ?? null,
      hand_1: squad.hand_1?.id ?? null,
      hand_2: squad.hand_2?.id ?? null,
      hand_3: squad.hand_3?.id ?? null,
      hand_4: squad.hand_4?.id ?? null,
      active_variant: variants.active,
      bench_1_variant: variants.bench_1,
      bench_2_variant: variants.bench_2,
      bench_3_variant: variants.bench_3,
      bench_4_variant: variants.bench_4,
      bench_5_variant: variants.bench_5,
      hand_1_variant: variants.hand_1,
      hand_2_variant: variants.hand_2,
      hand_3_variant: variants.hand_3,
      hand_4_variant: variants.hand_4,
      event_effect: effects.eventEffect,
      effect_charges: effects.effectCharges,
    };
    try {
      const res = await fetch("/api/squad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setUnsaved(false);
      toast("Squad saved!", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError(true);
      toast("Save failed — try again", "error");
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    if (!locked) {
      setShowLockConfirm(true);
    } else {
      setLocked(false);
    }
  };

  const confirmLock = async () => {
    setShowLockConfirm(false);
    setLocked(true);
    await handleSave();
  };

  const usedIds = new Set(Object.values(squad).filter(Boolean).map((d) => d!.id));
  const activeVariantSlotDeck = variantSlot ? squad[variantSlot] : null;
  const activeVariants = activeVariantSlotDeck ? (variantsByDeckId[activeVariantSlotDeck.id] ?? []) : [];
  const handBoosted = effects.eventEffect === "hand_boost";

  return (
    <div className={`relative rounded-2xl ${theme.bg} p-4`}>
      {/* Background overlays */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b ${theme.overlay} opacity-60`} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 flex flex-col gap-4">

        {/* ── Unsaved warning ── */}
        {unsaved && !locked && (
          <div className="rounded-xl border border-orange-400/60 bg-orange-400/10 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-orange-400 text-sm">Unsaved Changes — </span>
                <span className="text-xs text-orange-200/70">hit <strong>Save</strong> below or your squad won&apos;t count for scoring.</span>
              </div>
              {lastSaved && (
                <span className="text-[10px] text-orange-300/40 shrink-0 hidden sm:block">Last saved: {lastSaved}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Header: theme picker + budget ── */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowThemePicker((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm backdrop-blur-sm hover:bg-black/30 transition-colors"
          >
            <span>{theme.emoji}</span>
            <span className={`font-medium ${theme.accent}`}>{theme.name}</span>
            <span className="text-gray-600 text-xs">{showThemePicker ? "▴" : "▾"}</span>
          </button>

          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{filledCount}/10 picks</span>
              <span className={`text-sm font-bold ${remaining < 20 ? "text-red-400" : remaining < 50 ? "text-orange-400" : theme.accent}`}>
                {remaining} <span className="text-gray-600 font-normal text-xs">/ {BUDGET} pts left</span>
              </span>
            </div>
            <div className="h-1.5 w-36 rounded-full bg-white/10">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-orange-400" : "bg-yellow-400"}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Theme picker grid */}
        {showThemePicker && (
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur-sm">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTheme(t)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all ${theme.id === t.id ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"}`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-gray-300">{t.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            ACTIVE ZONE
        ══════════════════════════════════════ */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${theme.accent}`}>⭐ Active Deck</span>
            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">2× Points</span>
          </div>
          <DeckSlot
            slot={ACTIVE_SLOT}
            deck={squad.active}
            variant={variants.active}
            locked={locked}
            theme={theme}
            onOpen={() => !locked && setOpenSlot("active")}
            onRemove={() => handleRemove("active")}
            onVariant={() => !locked && squad.active && setVariantSlot("active")}
            hasVariants={(variantsByDeckId[squad.active?.id ?? 0] ?? []).length > 0}
            remaining={remaining}
            handBoosted={false}
          />
        </div>

        {/* ══════════════════════════════════════
            BENCH
        ══════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Bench <span className="text-gray-700">· 1×</span>
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {BENCH_SLOTS.map((slot) => (
              <DeckSlot
                key={slot.key}
                slot={slot}
                deck={squad[slot.key]}
                variant={variants[slot.key]}
                locked={locked}
                theme={theme}
                onOpen={() => !locked && setOpenSlot(slot.key)}
                onRemove={() => handleRemove(slot.key)}
                onVariant={() => !locked && squad[slot.key] && setVariantSlot(slot.key)}
                hasVariants={(variantsByDeckId[squad[slot.key]?.id ?? 0] ?? []).length > 0}
                remaining={remaining}
                handBoosted={false}
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            RESERVE
        ══════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span
              className={`text-xs font-semibold uppercase tracking-widest cursor-help transition-colors ${handBoosted ? "text-blue-400" : "text-gray-500"}`}
              title="Reserve decks score 0pts normally. Use Hand Boost to activate them at 1× for one event."
            >
              Reserve
              {handBoosted
                ? <span className="ml-1.5 rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[9px] text-blue-300 normal-case not-italic">1× Boosted!</span>
                : <span className="text-gray-700"> · 0× (inactive)</span>
              }
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {HAND_SLOTS.map((slot) => (
              <DeckSlot
                key={slot.key}
                slot={slot}
                deck={squad[slot.key]}
                variant={variants[slot.key]}
                locked={locked}
                theme={theme}
                onOpen={() => !locked && setOpenSlot(slot.key)}
                onRemove={() => handleRemove(slot.key)}
                onVariant={() => !locked && squad[slot.key] && setVariantSlot(slot.key)}
                hasVariants={(variantsByDeckId[squad[slot.key]?.id ?? 0] ?? []).length > 0}
                remaining={remaining}
                handBoosted={handBoosted}
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            STADIUM EFFECTS
        ══════════════════════════════════════ */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🏟</span>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Stadium Effects</p>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: FANTASY_CONFIG.EFFECT_CHARGES }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i < availableCharges ? "bg-yellow-400" : "bg-gray-700"
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-600 ml-1">{availableCharges}/{FANTASY_CONFIG.EFFECT_CHARGES} charges</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {EFFECTS.map((effect) => {
              const used = isEffectUsed(effect.id);
              const active = effects.eventEffect === effect.id;
              const colors = EFFECT_COLOR_CLASSES[effect.color];
              const costAfterRemovingCurrent = effects.effectCharges - (effects.eventEffect && effects.eventEffect !== effect.id ? (FANTASY_CONFIG.EFFECT_COSTS[effects.eventEffect] ?? 0) : 0);
              const canAfford = active || effect.cost <= costAfterRemovingCurrent;

              return (
                <button
                  key={effect.id}
                  disabled={locked || used || (!active && !canAfford)}
                  onClick={() => toggleEffect(effect.id)}
                  title={effect.strategicTip}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all
                    ${used
                      ? "border-gray-700/40 bg-gray-900/20 opacity-40 cursor-not-allowed"
                      : !active && !canAfford
                        ? "border-gray-700/40 opacity-40 cursor-not-allowed"
                        : active
                          ? `${colors.border} ${colors.bg}`
                          : "border-white/10 hover:border-white/30 cursor-pointer"
                    }`}
                >
                  <div className="flex items-center gap-1 w-full">
                    <span className="text-sm">{effect.emoji}</span>
                    <span className={`text-xs font-bold flex-1 min-w-0 truncate ${used ? "text-gray-600" : active ? colors.text : "text-gray-300"}`}>
                      {effect.label}
                    </span>
                    {used
                      ? <span className="rounded bg-gray-700 px-1 py-0.5 text-[8px] text-gray-500 font-bold shrink-0">USED</span>
                      : active
                        ? <span className={`rounded px-1 py-0.5 text-[8px] font-bold shrink-0 ${colors.badge}`}>ON</span>
                        : <span className="rounded bg-white/10 px-1 py-0.5 text-[8px] text-gray-500 shrink-0">{effect.cost}⚡</span>
                    }
                  </div>
                  {!used && (
                    <p className="text-[9px] text-gray-600 leading-tight">{effect.description}</p>
                  )}
                </button>
              );
            })}
          </div>

          {effects.eventEffect && !locked && (
            <p className="mt-2 text-center text-[10px] text-gray-600">
              One effect active per event · selecting another replaces it · charges reset next season
            </p>
          )}
        </div>

        {/* ══════════════════════════════════════
            ACTIONS
        ══════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={locked || filledCount === 0}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 backdrop-blur-sm transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleUndo}
              disabled={locked || history.length === 0}
              title="Undo last change"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 backdrop-blur-sm transition-colors"
            >
              ↩ Undo
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || locked}
              className={`rounded-lg px-5 py-2 text-sm font-semibold border transition-all disabled:opacity-40 backdrop-blur-sm
                ${saveError
                  ? "border-red-400/60 bg-red-500/20 text-red-300"
                  : saved
                    ? "border-green-400/60 bg-green-500/20 text-green-300 animate-save-glow"
                    : unsaved && !locked
                      ? "border-yellow-400/70 bg-yellow-500/20 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.15)]"
                      : "border-white/10 bg-black/30 text-gray-400"
                }`}
            >
              {saving ? "Saving…" : saveError ? "❌ Failed" : saved ? "✓ Saved" : unsaved ? "Save ●" : "Save"}
            </button>

            <button
              onClick={handleLock}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all
                ${locked
                  ? "bg-red-600/80 border border-red-500/60 text-white hover:bg-red-500/80"
                  : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                }`}
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
            {nextEventName ? (
              <p className="text-sm text-gray-400 mb-1">
                Locking in for: <span className="font-semibold text-yellow-400">{nextEventName}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-1">No upcoming event found — you can still lock in.</p>
            )}
            <p className="text-xs text-gray-600 mb-5">Your squad cannot be changed until the event deadline passes.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLockConfirm(false)}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLock}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors"
              >
                🔒 Lock In
              </button>
            </div>
          </div>
        </div>
      )}

      {openSlot && (
        <DeckBrowser
          decks={allDecks}
          usedIds={usedIds}
          remaining={remaining}
          currentSlotCost={squad[openSlot]?.cost ?? 0}
          onSelect={handleSelectDeck}
          onClose={() => setOpenSlot(null)}
          theme={theme}
        />
      )}

      {variantSlot && activeVariants.length > 0 && (
        <VariantPicker
          variants={activeVariants}
          currentVariant={variants[variantSlot]}
          onSelect={handleSelectVariant}
          onClose={() => setVariantSlot(null)}
          theme={theme}
          deckName={squad[variantSlot]?.name ?? ""}
        />
      )}
    </div>
  );
}

function DeckSlot({
  slot, deck, variant, locked, theme, onOpen, onRemove, onVariant, hasVariants, remaining, handBoosted,
}: {
  slot: SlotDef;
  deck: Deck | null;
  variant: string | null;
  locked: boolean;
  theme: Theme;
  onOpen: () => void;
  onRemove: () => void;
  onVariant: () => void;
  hasVariants: boolean;
  remaining: number;
  handBoosted: boolean;
}) {
  const border = deck ? (tierBorders[deck.tier] || "border-gray-600") : "border-white/10";
  const isActive = slot.zone === "active";
  const isHand = slot.zone === "hand";
  const canAdd = remaining > 0 || !!deck;

  const handDimmed = isHand && !handBoosted;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 ${border} backdrop-blur-sm transition-all
        ${deck ? "bg-black/30" : theme.cardBg}
        ${isActive ? "h-48 w-40" : isHand ? "h-24 w-full" : "h-32 w-full"}
        ${!locked && canAdd ? "cursor-pointer hover:border-white/40 hover:scale-[1.03] hover:shadow-lg" : ""}
        ${handDimmed ? "opacity-55" : ""}
      `}
      onClick={locked ? undefined : onOpen}
      style={{ boxShadow: deck ? "0 0 12px 0 rgba(0,0,0,0.4)" : undefined }}
    >
      {deck ? (
        <>
          {isActive && (
            <div className={`absolute inset-0 rounded-xl opacity-20 bg-gradient-to-b ${theme.overlay}`} />
          )}
          <div className={`relative z-10 flex items-center justify-center animate-slot-pop ${isActive ? "w-20 h-20" : isHand ? "w-10 h-10" : "w-14 h-14"}`}>
            {deck.image_url && (
              <Image
                src={deck.image_url}
                alt={deck.name}
                width={isActive ? 72 : isHand ? 32 : 48}
                height={isActive ? 72 : isHand ? 32 : 48}
                className={`object-contain drop-shadow-lg ${isActive ? "animate-pulse-slow" : ""}`}
              />
            )}
            {deck.image_url_2 && (
              <Image
                src={deck.image_url_2}
                alt=""
                width={isActive ? 34 : isHand ? 18 : 24}
                height={isActive ? 34 : isHand ? 18 : 24}
                className="absolute bottom-0 right-0 object-contain drop-shadow-md"
              />
            )}
          </div>

          <p className={`relative z-10 mt-1 text-center font-semibold leading-tight px-1 text-white ${isActive ? "text-sm" : isHand ? "text-[10px]" : "text-[11px]"}`}>
            {deck.name}
          </p>
          <p className={`relative z-10 text-yellow-400 ${isActive ? "text-xs" : "text-[10px]"}`}>
            {deck.cost}pts
          </p>

          {isActive && (
            <span className="relative z-10 mt-0.5 rounded bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">2×</span>
          )}
          {isHand && !handBoosted && (
            <span className="relative z-10 mt-0.5 rounded bg-gray-700/50 px-1 py-0.5 text-[8px] text-gray-500">0pts</span>
          )}
          {isHand && handBoosted && (
            <span className="relative z-10 mt-0.5 rounded bg-blue-500/20 px-1 py-0.5 text-[8px] text-blue-300 font-semibold">1×</span>
          )}

          {/* Variant badge */}
          {hasVariants && !locked && (
            <button
              onClick={(e) => { e.stopPropagation(); onVariant(); }}
              className={`relative z-10 mt-0.5 rounded px-1 py-0.5 text-[8px] transition-colors
                ${variant ? "bg-blue-500/30 text-blue-300 hover:bg-blue-500/50" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
            >
              {variant ? `✓ ${variant.split(" ").slice(-1)[0]}` : "+ variant"}
            </button>
          )}
          {hasVariants && locked && variant && (
            <span className="relative z-10 mt-0.5 rounded bg-blue-500/20 px-1 py-0.5 text-[8px] text-blue-300">
              {variant.split(" ").slice(-1)[0]}
            </span>
          )}

          {/* Remove button */}
          {!locked && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute right-1 top-1 z-20 rounded-full bg-black/60 p-0.5 text-[10px] text-gray-400 hover:text-red-400 hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          )}

          {/* Click to swap hint */}
          {!locked && !isActive && (
            <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 z-10 pointer-events-none">
              <span className="text-[10px] text-white/80 font-medium">Tap to swap</span>
            </div>
          )}
        </>
      ) : (
        <div className={`flex flex-col items-center gap-1 ${canAdd ? "text-white/25" : "text-white/10"}`}>
          <span className={`font-light ${isActive ? "text-4xl" : "text-2xl"}`}>+</span>
          {isActive ? (
            <span className="text-xs text-center px-2 leading-tight">Pick Active Deck</span>
          ) : isHand ? (
            <span className="text-[9px]">{slot.label.replace("Reserve ", "R")}</span>
          ) : (
            <span className="text-[10px]">{slot.label}</span>
          )}
          {isHand && !handBoosted && (
            <span className="text-[8px] text-gray-700">0pts</span>
          )}
          {!canAdd && <span className="text-[8px] text-red-400">Budget</span>}
        </div>
      )}
    </div>
  );
}
