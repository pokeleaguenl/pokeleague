"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLeagueForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("League name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/leagues/${data.code}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create league");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* League Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          League Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sunday Squad Showdown"
          maxLength={50}
          className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
        />
        <p className="mt-1 text-xs text-gray-500">{name.length}/50 characters</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this league about?"
          rows={3}
          maxLength={200}
          className="w-full rounded-lg border border-gray-700 bg-black/20 px-4 py-3 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">{description.length}/200 characters</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-700 px-4 py-3 font-medium text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 rounded-lg bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create League"}
        </button>
      </div>
    </form>
  );
}
