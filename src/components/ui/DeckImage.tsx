"use client";

import { useState } from "react";
import Image from "next/image";

interface DeckImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Deck image with automatic fallback to a placeholder if the URL is broken or null.
 */
export default function DeckImage({ src, alt, width, height, className }: DeckImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    // Placeholder: initials inside a rounded square
    const initials = alt
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-800 text-gray-500 font-bold select-none"
        style={{ width, height, fontSize: Math.max(10, width / 3) }}
        aria-label={alt}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
