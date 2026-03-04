"use client";

import type { Theme } from "@/lib/themes";

export interface Variant {
  id: number;
  deck_id: number;
  name: string;
  limitless_value: string;
}

interface Props {
  variants: Variant[];
  currentVariant: string | null;
  onSelect: (variantName: string | null) => void;
  onClose: () => void;
  theme: Theme;
  deckName: string;
}

export default function VariantPicker({ variants, currentVariant, onSelect, onClose, theme, deckName }: Props) {
  if (variants.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-t-2xl p-4 sm:rounded-2xl ${theme.bg} border border-white/10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Pick a Variant</h2>
            <p className={`text-xs ${theme.accent}`}>{deckName} — which build?</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {/* No preference option */}
          <button
            onClick={() => onSelect(null)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all
              ${!currentVariant
                ? `border-yellow-400/60 bg-yellow-400/10`
                : "border-white/10 hover:border-white/30 hover:bg-white/5 cursor-pointer"}`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">Any variant</p>
              <p className="text-xs text-gray-500">No preference — matches all builds</p>
            </div>
            {!currentVariant && <span className="text-yellow-400 text-sm">✓</span>}
          </button>

          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(v.name)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all
                ${currentVariant === v.name
                  ? `border-yellow-400/60 bg-yellow-400/10`
                  : "border-white/10 hover:border-yellow-400/40 hover:bg-white/5 cursor-pointer"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{v.name}</p>
                {v.limitless_value === "0" && (
                  <p className="text-xs text-gray-500">No partner (solo build)</p>
                )}
              </div>
              {currentVariant === v.name && <span className="text-yellow-400 shrink-0 text-sm">✓</span>}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-gray-600 text-center">
          Picking the correct variant earns a +25% bonus on your squad points
        </p>
      </div>
    </div>
  );
}
