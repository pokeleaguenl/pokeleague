"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import DeckBrowser from "./deck-browser";
import VariantPicker, { type Variant } from "./variant-picker";
import { THEMES, DEFAULT_THEME, type Theme } from "@/lib/themes";

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
  { key: "hand_1", label: "Hand 1", zone: "hand" },
  { key: "hand_2", label: "Hand 2", zone: "hand" },
  { key: "hand_3", label: "Hand 3", zone: "hand" },
  { key: "hand_4", label: "Hand 4", zone: "hand" },
];

const BUDGET = 200;

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
  x3Used: boolean;
  handBoostUsed: boolean;
  eventEffect: string | null; // 'x3' | 'hand_boost' | null
}

interface Props {
  allDecks: Deck[];
  initialSquad: Partial<Squad>;
  initialVariants?: Partial<VariantMap>;
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

  const [squad, setSquad] = useState<Squad>({ ...emptySquad, ...initialSquad });
  const [variants, setVariants] = useState<VariantMap>({ ...emptyVariants, ...initialVariants });
  const [effects, setEffects] = useState<StadiumEffects>(initialEffects);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [locked, setLocked] = useState(initialLocked);
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [variantSlot, setVariantSlot] = useState<SlotKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Push current state to history before a change
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
  };

  const toggleEffect = (effect: "x3" | "hand_boost") => {
    if (locked) return;
    if (effect === "x3" && effects.x3Used) return;
    if (effect === "hand_boost" && effects.handBoostUsed) return;
    setEffects((e) => ({
      ...e,
      eventEffect: e.eventEffect === effect ? null : effect,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
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
    };
    await fetch("/api/squad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
    setUnsaved(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLock = async () => {
    if (!locked) {
      // Show confirmation before locking
      setShowLockConfirm(true);
    } else {
      // Unlock
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
    <div className={`relative min-h-screen rounded-2xl ${theme.bg} p-4`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b ${theme.overlay} opacity-60`} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header: theme + budget */}
        <div className="flex items-center justify-between">
          <button onClick={() => setShowThemePicker((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm backdrop-blur-sm hover:bg-black/30">
            <span>{theme.emoji}</span>
            <span className={`font-medium ${theme.accent}`}>{theme.name}</span>
            <span className="text-gray-500 text-xs">▾</span>
          </button>
          <div className="text-right">
            <div className="flex items-center gap-3">
              {unsaved && !locked && (
                <span className="text-[10px] text-orange-400 font-semibold animate-pulse">● Unsaved</span>
              )}
              <span className="text-xs text-gray-500">{filledCount}/10 picks</span>
            </div>
          <p className={`text-xs font-semibold ${remaining < 20 ? "text-red-400" : theme.accent}`}>
              {remaining} / {BUDGET} pts remaining
            </p>
            <div className="mt-1 h-1.5 w-32 rounded-full bg-white/10">
              <div className={`h-1.5 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-orange-400" : "bg-yellow-400"}`}
                style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </div>

        {showThemePicker && (
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => selectTheme(t)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all ${theme.id === t.id ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/10"}`}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-gray-300">{t.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Zone */}
        <div className="flex flex-col items-center gap-1">
          <div className={`text-xs font-semibold uppercase tracking-widest ${theme.accent}`}>⭐ Active Zone — 2× points</div>
        </div>
        <div className="flex justify-center">
          <DeckSlot slot={ACTIVE_SLOT} deck={squad.active} variant={variants.active} locked={locked} theme={theme}
            onOpen={() => !locked && setOpenSlot("active")}
            onRemove={() => handleRemove("active")}
            onVariant={() => !locked && squad.active && setVariantSlot("active")}
            hasVariants={(variantsByDeckId[squad.active?.id ?? 0] ?? []).length > 0}
            remaining={remaining} handBoosted={false}
          />
        </div>

        {/* Bench */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-gray-600 uppercase tracking-widest">Bench — 1×</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BENCH_SLOTS.map((slot) => (
            <DeckSlot key={slot.key} slot={slot} deck={squad[slot.key]} variant={variants[slot.key]} locked={locked} theme={theme}
              onOpen={() => !locked && setOpenSlot(slot.key)}
              onRemove={() => handleRemove(slot.key)}
              onVariant={() => !locked && squad[slot.key] && setVariantSlot(slot.key)}
              hasVariants={(variantsByDeckId[squad[slot.key]?.id ?? 0] ?? []).length > 0}
              remaining={remaining} handBoosted={false}
            />
          ))}
        </div>

        {/* Stadium Effects */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">🏟 Stadium Effects — 1 per event, 1 per season each</p>
          <div className="flex gap-2">
            {/* x3 effect */}
            <button
              disabled={locked || effects.x3Used}
              onClick={() => toggleEffect("x3")}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all
                ${effects.x3Used
                  ? "border-gray-700 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                  : effects.eventEffect === "x3"
                    ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                    : "border-white/10 text-gray-300 hover:border-yellow-400/40 hover:text-yellow-300"}`}
            >
              {effects.x3Used ? "⚡ ×3 Used" : effects.eventEffect === "x3" ? "⚡ ×3 Active!" : "⚡ ×3"}
              {!effects.x3Used && <span className="block text-[9px] text-gray-500 font-normal">Active deck scores 3× this event</span>}
            </button>

            {/* Hand Boost effect */}
            <button
              disabled={locked || effects.handBoostUsed}
              onClick={() => toggleEffect("hand_boost")}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all
                ${effects.handBoostUsed
                  ? "border-gray-700 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                  : effects.eventEffect === "hand_boost"
                    ? "border-blue-400 bg-blue-400/15 text-blue-300"
                    : "border-white/10 text-gray-300 hover:border-blue-400/40 hover:text-blue-300"}`}
            >
              {effects.handBoostUsed ? "🃏 Hand Boost Used" : effects.eventEffect === "hand_boost" ? "🃏 Hand Boost Active!" : "🃏 Hand Boost"}
              {!effects.handBoostUsed && <span className="block text-[9px] text-gray-500 font-normal">Hand scores 1× this event</span>}
            </button>
          </div>
          {effects.eventEffect && !locked && (
            <p className="mt-1.5 text-center text-[10px] text-gray-500">
              Only one Stadium Effect per event. Selecting another will replace this one.
            </p>
          )}
        </div>

        {/* Hand Zone */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className={`text-xs uppercase tracking-widest ${handBoosted ? "text-blue-400 font-semibold" : "text-gray-600"}`}>
            Hand — {handBoosted ? "1× (Boosted!)" : "0pts"}
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {HAND_SLOTS.map((slot) => (
            <DeckSlot key={slot.key} slot={slot} deck={squad[slot.key]} variant={variants[slot.key]} locked={locked} theme={theme}
              onOpen={() => !locked && setOpenSlot(slot.key)}
              onRemove={() => handleRemove(slot.key)}
              onVariant={() => !locked && squad[slot.key] && setVariantSlot(slot.key)}
              hasVariants={(variantsByDeckId[squad[slot.key]?.id ?? 0] ?? []).length > 0}
              remaining={remaining} handBoosted={handBoosted}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <button onClick={handleClear} disabled={locked}
              className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 backdrop-blur-sm">
              Clear
            </button>
            <button
              onClick={handleUndo}
              disabled={locked || history.length === 0}
              title="Undo last change"
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 backdrop-blur-sm"
            >
              ↩ Undo
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || locked}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white border hover:bg-black/40 disabled:opacity-30 backdrop-blur-sm ${unsaved && !locked ? "border-orange-400/50 bg-orange-400/10" : "bg-black/30 border-white/10"}`}>
              {saving ? "Saving..." : saved ? "✅ Saved" : unsaved ? "● Save" : "Save"}
            </button>
            <button onClick={handleLock}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                locked
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : `${theme.accent === "text-yellow-400" ? "bg-yellow-400" : "bg-white/20 border border-white/20"} text-gray-900 hover:opacity-90`
              }`}>
              {locked ? "🔒 Locked" : `Lock In (${filledCount}/10)`}
            </button>
          </div>
        </div>
      </div>

      {/* Lock confirmation modal */}
      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-yellow-400/30 bg-gray-950 p-6">
            <h2 className="text-lg font-bold mb-1">Lock In Squad?</h2>
            {nextEventName ? (
              <p className="text-sm text-gray-400 mb-1">
                You are locking in for: <span className="font-semibold text-yellow-400">{nextEventName}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-1">No upcoming event found — you can still lock in.</p>
            )}
            <p className="text-xs text-gray-600 mb-5">Your squad cannot be changed until after the event deadline passes.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLockConfirm(false)}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 hover:border-gray-500">
                Cancel
              </button>
              <button onClick={confirmLock}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300">
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
  const canAdd = remaining > 0;

  // Hand slots are visually dimmed unless boosted
  const handDimmed = isHand && !handBoosted;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 ${border} backdrop-blur-sm transition-all
        ${deck ? "bg-black/30" : theme.cardBg}
        ${isActive ? "h-44 w-36" : isHand ? "h-24 w-full" : "h-28 w-full"}
        ${!locked && !deck && canAdd ? "cursor-pointer hover:border-white/30 hover:scale-105" : ""}
        ${handDimmed ? "opacity-60" : ""}
      `}
      onClick={deck ? undefined : onOpen}
      style={{ boxShadow: deck ? "0 0 12px 0 rgba(0,0,0,0.4)" : undefined }}
    >
      {deck ? (
        <>
          {isActive && (
            <div className={`absolute inset-0 rounded-xl opacity-20 bg-gradient-to-b ${theme.overlay}`} />
          )}
          <div className={`relative z-10 flex items-center justify-center ${isActive ? "w-20 h-20" : isHand ? "w-10 h-10" : "w-12 h-12"}`}>
            {deck.image_url && (
              <Image src={deck.image_url} alt={deck.name}
                width={isActive ? 64 : isHand ? 28 : 40}
                height={isActive ? 64 : isHand ? 28 : 40}
                className={`object-contain drop-shadow-lg ${isActive ? "animate-pulse-slow" : ""}`}
              />
            )}
            {deck.image_url_2 && (
              <Image src={deck.image_url_2} alt=""
                width={isActive ? 32 : isHand ? 16 : 22}
                height={isActive ? 32 : isHand ? 16 : 22}
                className="absolute bottom-0 right-0 object-contain drop-shadow-md"
              />
            )}
          </div>
          <p className={`relative z-10 mt-1 text-center font-semibold leading-tight px-1 text-white ${isActive ? "text-sm" : "text-[9px]"}`}>
            {deck.name}
          </p>
          <p className={`relative z-10 text-yellow-400 ${isActive ? "text-xs" : "text-[8px]"}`}>
            {deck.cost}pts
          </p>
          {isActive && (
            <span className="relative z-10 mt-0.5 rounded bg-yellow-400/20 px-1 py-0.5 text-[8px] text-yellow-400">2×</span>
          )}
          {isHand && !handBoosted && (
            <span className="relative z-10 mt-0.5 rounded bg-gray-700/50 px-1 py-0.5 text-[7px] text-gray-500">0pts</span>
          )}
          {isHand && handBoosted && (
            <span className="relative z-10 mt-0.5 rounded bg-blue-500/20 px-1 py-0.5 text-[7px] text-blue-300">1×</span>
          )}
          {/* Variant badge */}
          {hasVariants && !locked && (
            <button
              onClick={(e) => { e.stopPropagation(); onVariant(); }}
              className={`relative z-10 mt-0.5 rounded px-1 py-0.5 text-[7px] transition-colors
                ${variant ? "bg-blue-500/30 text-blue-300 hover:bg-blue-500/50" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
            >
              {variant ? `✓ ${variant.split(" ").slice(-1)[0]}` : "+ variant"}
            </button>
          )}
          {hasVariants && locked && variant && (
            <span className="relative z-10 mt-0.5 rounded bg-blue-500/20 px-1 py-0.5 text-[7px] text-blue-300">
              {variant.split(" ").slice(-1)[0]}
            </span>
          )}
          {!locked && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute right-1 top-1 z-20 rounded-full bg-black/50 p-0.5 text-[10px] text-gray-400 hover:text-red-400">
              ✕
            </button>
          )}
        </>
      ) : (
        <div className={`flex flex-col items-center gap-1 ${canAdd ? "text-white/30" : "text-white/10"}`}>
          <span className={isActive ? "text-3xl" : "text-2xl"}>+</span>
          <span className={isActive ? "text-xs" : "text-[9px]"}>{slot.label}</span>
          {isHand && !handBoosted && (
            <span className="text-[8px] text-gray-600">0pts</span>
          )}
          {!canAdd && <span className="text-[8px] text-red-400">Over budget</span>}
        </div>
      )}
    </div>
  );
}
