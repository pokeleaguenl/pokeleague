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
}

interface SlotKey {
  key: "active" | "bench_1" | "bench_2" | "bench_3" | "bench_4" | "bench_5";
  label: string;
  isActive?: boolean;
}

const SLOTS: SlotKey[] = [
  { key: "active", label: "Active", isActive: true },
  { key: "bench_1", label: "Bench 1" },
  { key: "bench_2", label: "Bench 2" },
  { key: "bench_3", label: "Bench 3" },
  { key: "bench_4", label: "Bench 4" },
  { key: "bench_5", label: "Bench 5" },
];

const BUDGET = 100;

type Squad = Record<SlotKey["key"], Deck | null>;
type VariantMap = Record<SlotKey["key"], string | null>;

const tierBorders: Record<string, string> = {
  S: "border-yellow-400",
  A: "border-purple-500",
  B: "border-blue-500",
  C: "border-green-600",
  D: "border-gray-600",
};

interface Props {
  allDecks: Deck[];
  initialSquad: Partial<Squad>;
  initialVariants?: Partial<VariantMap>;
  variantsByDeckId: Record<number, Variant[]>;
  locked: boolean;
}

export default function Playmat({ allDecks, initialSquad, initialVariants, variantsByDeckId, locked: initialLocked }: Props) {
  const [squad, setSquad] = useState<Squad>({
    active: initialSquad.active ?? null,
    bench_1: initialSquad.bench_1 ?? null,
    bench_2: initialSquad.bench_2 ?? null,
    bench_3: initialSquad.bench_3 ?? null,
    bench_4: initialSquad.bench_4 ?? null,
    bench_5: initialSquad.bench_5 ?? null,
  });
  const [variants, setVariants] = useState<VariantMap>({
    active: initialVariants?.active ?? null,
    bench_1: initialVariants?.bench_1 ?? null,
    bench_2: initialVariants?.bench_2 ?? null,
    bench_3: initialVariants?.bench_3 ?? null,
    bench_4: initialVariants?.bench_4 ?? null,
    bench_5: initialVariants?.bench_5 ?? null,
  });
  const [locked, setLocked] = useState(initialLocked);
  const [openSlot, setOpenSlot] = useState<SlotKey["key"] | null>(null);
  const [variantSlot, setVariantSlot] = useState<SlotKey["key"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pokeleague-theme");
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) setTheme(found);
    }
  }, []);

  function selectTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem("pokeleague-theme", t.id);
    setShowThemePicker(false);
  }

  const totalCost = Object.values(squad)
    .filter(Boolean)
    .reduce((sum, d) => sum + d!.cost, 0);
  const remaining = BUDGET - totalCost;
  const budgetPct = Math.min((totalCost / BUDGET) * 100, 100);
  const filledCount = Object.values(squad).filter(Boolean).length;

  const handleSelectDeck = useCallback((deck: Deck) => {
    if (!openSlot || locked) return;
    const currentSlotDeck = squad[openSlot];
    const currentSlotCost = currentSlotDeck?.cost ?? 0;
    const newCost = totalCost - currentSlotCost + deck.cost;
    if (newCost > BUDGET) return;

    const newSquad = { ...squad };
    (Object.keys(newSquad) as SlotKey["key"][]).forEach((k) => {
      if (newSquad[k]?.id === deck.id) newSquad[k] = null;
    });
    newSquad[openSlot] = deck;
    setSquad(newSquad);

    // Clear variant when deck changes
    setVariants((v) => ({ ...v, [openSlot]: null }));
    setOpenSlot(null);

    // If deck has variants, immediately open variant picker
    const deckVariants = variantsByDeckId[deck.id] ?? [];
    if (deckVariants.length > 0) {
      setVariantSlot(openSlot);
    }
  }, [openSlot, squad, locked, totalCost, variantsByDeckId]);

  const handleSelectVariant = useCallback((variantName: string | null) => {
    if (!variantSlot) return;
    setVariants((v) => ({ ...v, [variantSlot]: variantName }));
    setVariantSlot(null);
  }, [variantSlot]);

  const handleRemove = (key: SlotKey["key"]) => {
    if (locked) return;
    setSquad((s) => ({ ...s, [key]: null }));
    setVariants((v) => ({ ...v, [key]: null }));
  };

  const handleClear = () => {
    if (locked) return;
    setSquad({ active: null, bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null });
    setVariants({ active: null, bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null });
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
      active_variant: variants.active,
      bench_1_variant: variants.bench_1,
      bench_2_variant: variants.bench_2,
      bench_3_variant: variants.bench_3,
      bench_4_variant: variants.bench_4,
      bench_5_variant: variants.bench_5,
    };
    await fetch("/api/squad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLock = async () => {
    const newLocked = !locked;
    setLocked(newLocked);
    if (newLocked) await handleSave();
  };

  const usedIds = new Set(Object.values(squad).filter(Boolean).map((d) => d!.id));

  const activeVariantSlotDeck = variantSlot ? squad[variantSlot] : null;
  const activeVariants = activeVariantSlotDeck ? (variantsByDeckId[activeVariantSlotDeck.id] ?? []) : [];

  return (
    <div className={`relative min-h-screen rounded-2xl ${theme.bg} p-4`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b ${theme.overlay} opacity-60`} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowThemePicker((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm backdrop-blur-sm hover:bg-black/30"
          >
            <span>{theme.emoji}</span>
            <span className={`font-medium ${theme.accent}`}>{theme.name}</span>
            <span className="text-gray-500 text-xs">▾</span>
          </button>
          <div className="text-right">
            <p className={`text-xs font-semibold ${remaining < 10 ? "text-red-400" : theme.accent}`}>
              {remaining} / {BUDGET} pts remaining
            </p>
            <div className="mt-1 h-1.5 w-32 rounded-full bg-white/10">
              <div
                className={`h-1.5 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-orange-400" : "bg-yellow-400"}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {showThemePicker && (
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => selectTheme(t)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all
                  ${theme.id === t.id ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/10"}`}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-gray-300">{t.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <div className={`text-xs font-semibold uppercase tracking-widest ${theme.accent}`}>
            ⭐ Active Zone — 1.5× points
          </div>
        </div>

        <div className="flex justify-center">
          <DeckSlot slot={SLOTS[0]} deck={squad.active} variant={variants.active} locked={locked} theme={theme}
            onOpen={() => !locked && setOpenSlot("active")}
            onRemove={() => handleRemove("active")}
            onVariant={() => !locked && squad.active && setVariantSlot("active")}
            hasVariants={(variantsByDeckId[squad.active?.id ?? 0] ?? []).length > 0}
            remaining={remaining}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-gray-600 uppercase tracking-widest">Bench</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {SLOTS.slice(1).map((slot) => (
            <DeckSlot key={slot.key} slot={slot} deck={squad[slot.key]} variant={variants[slot.key]} locked={locked} theme={theme}
              onOpen={() => !locked && setOpenSlot(slot.key)}
              onRemove={() => handleRemove(slot.key)}
              onVariant={() => !locked && squad[slot.key] && setVariantSlot(slot.key)}
              hasVariants={(variantsByDeckId[squad[slot.key]?.id ?? 0] ?? []).length > 0}
              remaining={remaining}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button onClick={handleClear} disabled={locked}
            className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 backdrop-blur-sm">
            Clear All
          </button>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || locked}
              className="rounded-lg bg-black/30 px-4 py-2 text-sm font-medium text-white border border-white/10 hover:bg-black/40 disabled:opacity-30 backdrop-blur-sm">
              {saving ? "Saving..." : saved ? "✅ Saved" : "Save"}
            </button>
            <button onClick={handleLock}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                locked ? "bg-red-600 text-white hover:bg-red-500" : `${theme.accent === "text-yellow-400" ? "bg-yellow-400" : "bg-white/20 border border-white/20"} text-gray-900 hover:opacity-90`
              }`}>
              {locked ? "🔒 Locked" : `Lock In (${filledCount}/6)`}
            </button>
          </div>
        </div>
      </div>

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

function DeckSlot({ slot, deck, variant, locked, theme, onOpen, onRemove, onVariant, hasVariants, remaining }: {
  slot: SlotKey;
  deck: Deck | null;
  variant: string | null;
  locked: boolean;
  theme: Theme;
  onOpen: () => void;
  onRemove: () => void;
  onVariant: () => void;
  hasVariants: boolean;
  remaining: number;
}) {
  const border = deck ? (tierBorders[deck.tier] || "border-gray-600") : `border-white/10`;
  const isActive = slot.isActive;
  const canAdd = remaining > 0;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 ${border} backdrop-blur-sm transition-all
        ${deck ? "bg-black/30" : `${theme.cardBg}`}
        ${isActive ? "h-44 w-36" : "h-28 w-full"}
        ${!locked && !deck && canAdd ? "cursor-pointer hover:border-white/30 hover:scale-105" : ""}
      `}
      onClick={deck ? undefined : onOpen}
      style={{ boxShadow: deck ? `0 0 12px 0 rgba(0,0,0,0.4)` : undefined }}
    >
      {deck ? (
        <>
          {isActive && (
            <div className={`absolute inset-0 rounded-xl opacity-20 bg-gradient-to-b ${theme.overlay}`} />
          )}
          {deck.image_url && (
            <Image src={deck.image_url} alt={deck.name}
              width={isActive ? 72 : 44} height={isActive ? 72 : 44}
              className={`relative z-10 object-contain drop-shadow-lg ${isActive ? "animate-pulse-slow" : ""}`}
            />
          )}
          <p className={`relative z-10 mt-1 text-center font-semibold leading-tight ${isActive ? "text-sm" : "text-[9px]"} px-1 text-white`}>
            {deck.name}
          </p>
          <p className={`relative z-10 text-yellow-400 ${isActive ? "text-xs" : "text-[8px]"}`}>
            {deck.cost}pts
          </p>
          {isActive && (
            <span className="relative z-10 mt-0.5 rounded bg-yellow-400/20 px-1 py-0.5 text-[8px] text-yellow-400">1.5×</span>
          )}
          {/* Variant badge */}
          {hasVariants && !locked && (
            <button
              onClick={(e) => { e.stopPropagation(); onVariant(); }}
              className={`relative z-10 mt-0.5 rounded px-1 py-0.5 text-[8px] transition-colors
                ${variant
                  ? "bg-blue-500/30 text-blue-300 hover:bg-blue-500/50"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
            >
              {variant ? `✓ ${variant.split(" ").slice(-1)[0]}` : "+ variant"}
            </button>
          )}
          {hasVariants && locked && variant && (
            <span className="relative z-10 mt-0.5 rounded bg-blue-500/20 px-1 py-0.5 text-[8px] text-blue-300">
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
          {!canAdd && <span className="text-[8px] text-red-400">Over budget</span>}
        </div>
      )}
    </div>
  );
}
