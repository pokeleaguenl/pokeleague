"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If auto-confirmed (no email verification), redirect immediately
    if (data.session) {
      router.push("/squad");
      router.refresh();
      return;
    }

    setMessage("Check your email for a confirmation link!");
    setLoading(false);
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
          <p className="mt-2 text-sm text-gray-500">Create your trainer account</p>
        </div>

        {/* What you get */}
        <div className="mb-6 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: "🎴", label: "Build squad" },
            { icon: "⚡", label: "Earn points" },
            { icon: "🏆", label: "Climb ranks" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-white/8 bg-white/3 py-3 px-2">
              <div className="text-xl">{f.icon}</div>
              <div className="mt-1 text-[10px] text-gray-400">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-8 backdrop-blur-sm">
          <h1 className="mb-6 text-xl font-bold">Create account</h1>

          {message ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <p className="font-semibold text-white mb-1">Check your inbox</p>
              <p className="text-sm text-gray-400">{message}</p>
              <Link href="/auth/login" className="mt-4 inline-block text-sm text-yellow-400 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
              />
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
                minLength={6}
                placeholder="Password (min 6 chars)"
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
                {loading ? "Creating account..." : "Create account →"}
              </button>

              <p className="text-center text-[10px] text-gray-600">
                Free forever. No card required.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-yellow-400 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
