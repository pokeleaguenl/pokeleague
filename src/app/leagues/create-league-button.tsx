"use client";

import { useRouter } from "next/navigation";

export default function CreateLeagueButton() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Create a private league and invite your friends to compete
      </p>
      <button
        onClick={() => router.push("/leagues/create")}
        className="w-full rounded-lg border-2 border-yellow-400/30 bg-yellow-400/10 px-4 py-2.5 font-bold text-yellow-400 hover:bg-yellow-400/20 transition-colors"
      >
        + Create League
      </button>
    </div>
  );
}
