"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-bold">
          Log in to Poké<span className="text-yellow-400">League</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-400 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-yellow-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
