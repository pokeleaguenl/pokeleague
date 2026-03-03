"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import DeckBrowser from "./deck-browser";

export interface Deck {
  id: number;
  name: string;
  tier: string;
  cost: number;
  meta_share: number;
  image_url: string | null;
}

interface SlotId {
  key: "active" | "bench_1" | "bench_2" | "bench_3" | "bench_4" | "bench_5";
  label: string;
  isActive?: boolean;
}

const SLOTS: SlotId[] = [
  { key: "active", label: "Active", isActive: true },
  { key: "bench_1", label: "Bench 1" },
  { key: "bench_2", label: "Bench 2" },
  { key: "bench_3", label: "Bench 3" },
  { key: "bench_4", label: "Bench 4" },
  { key: "bench_5", label: "Bench 5" },
];

type Squad = Record<SlotId["key"], Deck | null>;

const tierColors: Record<string, string> = {
  S: "border-yellow-400",
  A: "border-purple-500",
  B: "border-blue-500",
  C: "border-green-600",
  D: "border-gray-600",
};

interface Props {
  allDecks: Deck[];
  initialSquad: Partial<Squad>;
  locked: boolean;
}

export default function Playmat({ allDecks, initialSquad, locked: initialLocked }: Props) {
  const [squad, setSquad] = useState<Squad>({
    active: initialSquad.active ?? null,
    bench_1: initialSquad.bench_1 ?? null,
    bench_2: initialSquad.bench_2 ?? null,
    bench_3: initialSquad.bench_3 ?? null,
    bench_4: initialSquad.bench_4 ?? null,
    bench_5: initialSquad.bench_5 ?? null,
  });
  const [locked, setLocked] = useState(initialLocked);
  const [openSlot, setOpenSlot] = useState<SlotId["key"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filledCount = Object.values(squad).filter(Boolean).length;

  const handleSelectDeck = useCallback((deck: Deck) => {
    if (!openSlot || locked) return;
    // Remove deck from any other slot first
    const newSquad = { ...squad };
    (Object.keys(newSquad) as SlotId["key"][]).forEach((k) => {
      if (newSquad[k]?.id === deck.id) newSquad[k] = null;
    });
    newSquad[openSlot] = deck;
    setSquad(newSquad);
    setOpenSlot(null);
  }, [openSlot, squad, locked]);

  const handleRemove = (key: SlotId["key"]) => {
    if (locked) return;
    setSquad((s) => ({ ...s, [key]: null }));
  };

  const handleClear = () => {
    if (locked) return;
    setSquad({ active: null, bench_1: null, bench_2: null, bench_3: null, bench_4: null, bench_5: null });
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
    };
    await fetch("/api/squad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLock = async () => {
    const newLocked = !locked;
    setLocked(newLocked);
    // Save with current squad when locking
    if (newLocked) await handleSave();
  };

  const usedIds = new Set(Object.values(squad).filter(Boolean).map((d) => d!.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Active slot */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Active (1.5×)</p>
        <DeckSlot
          slot={SLOTS[0]}
          deck={squad.active}
          locked={locked}
          onOpen={() => !locked && setOpenSlot("active")}
          onRemove={() => handleRemove("active")}
        />
      </div>

      {/* Bench row */}
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-gray-500">Bench</p>
        <div className="grid grid-cols-5 gap-2">
          {SLOTS.slice(1).map((slot) => (
            <DeckSlot
              key={slot.key}
              slot={slot}
              deck={squad[slot.key]}
              locked={locked}
              onOpen={() => !locked && setOpenSlot(slot.key)}
              onRemove={() => handleRemove(slot.key)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleClear}
          disabled={locked}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-30"
        >
          Clear All
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || locked}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-30"
          >
            {saving ? "Saving..." : saved ? "✅ Saved" : "Save"}
          </button>
          <button
            onClick={handleLock}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              locked
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
            }`}
          >
            {locked ? "🔒 Locked" : `Lock In (${filledCount}/6)`}
          </button>
        </div>
      </div>

      {/* Deck browser modal */}
      {openSlot && (
        <DeckBrowser
          decks={allDecks}
          usedIds={usedIds}
          onSelect={handleSelectDeck}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  );
}

function DeckSlot({ slot, deck, locked, onOpen, onRemove }: {
  slot: SlotId;
  deck: Deck | null;
  locked: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const borderColor = deck ? (tierColors[deck.tier] || "border-gray-600") : "border-gray-700";
  const isActive = slot.isActive;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 ${borderColor} bg-gray-900 transition-all
        ${isActive ? "h-40 w-32" : "h-28 w-full"}
        ${!locked && !deck ? "cursor-pointer hover:border-yellow-400/50" : ""}
        ${!locked && deck ? "cursor-pointer" : ""}
      `}
      onClick={deck ? undefined : onOpen}
    >
      {deck ? (
        <>
          {deck.image_url && (
            <Image
              src={deck.image_url}
              alt={deck.name}
              width={isActive ? 64 : 44}
              height={isActive ? 64 : 44}
              className="object-contain"
            />
          )}
          <p className={`mt-1 text-center font-medium leading-tight ${isActive ? "text-sm" : "text-[10px]"} px-1`}>
            {deck.name}
          </p>
          <p className={`text-yellow-400 ${isActive ? "text-xs" : "text-[9px]"}`}>
            {deck.cost}pts
          </p>
          {!locked && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute right-1 top-1 rounded-full bg-gray-800 p-0.5 text-[10px] text-gray-400 hover:text-red-400"
            >
              ✕
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-gray-600">
          <span className={isActive ? "text-3xl" : "text-2xl"}>+</span>
          <span className={isActive ? "text-xs" : "text-[10px]"}>{slot.label}</span>
        </div>
      )}
    </div>
  );
}
