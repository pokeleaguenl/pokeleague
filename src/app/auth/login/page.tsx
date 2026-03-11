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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/squad");
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black">
            Poké<span className="text-yellow-400">League</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Welcome back, Trainer</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-8 backdrop-blur-sm">
          <h1 className="mb-6 text-xl font-bold">Log in</h1>

          <div className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
            />

            {error && (
              <p className="rounded-xl bg-red-900/40 px-4 py-2.5 text-sm text-red-300 border border-red-800/50">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors disabled:opacity-50 shadow-lg shadow-yellow-400/10"
            >
              {loading ? "Logging in..." : "Log in →"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          No account?{" "}
          <Link href="/auth/signup" className="text-yellow-400 hover:underline font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
