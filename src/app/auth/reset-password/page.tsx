"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black">Poké<span className="text-yellow-400">League</span></Link>
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-3xl mb-3">📧</p>
              <p className="font-bold text-white mb-1">Check your email</p>
              <p className="text-sm text-gray-400">We sent a reset link to {email}</p>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-bold">Forgot password?</h1>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="email" required placeholder="Email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors" />
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors disabled:opacity-50">
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-yellow-400 hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
