"use client";

import { useState } from "react";

/* ───── Hero ───── */
function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to Supabase later
    setSubmitted(true);
  }

  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
        Poké<span className="text-yellow-400">League</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-400">
        Draft your dream deck, compete with friends, and climb the leaderboard.
      </p>

      {submitted ? (
        <p className="mt-8 rounded-lg bg-green-900/40 px-6 py-3 text-green-300">
          You&apos;re on the list! We&apos;ll be in touch. ⚡
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-300 active:bg-yellow-500"
          >
            Join the waitlist
          </button>
        </form>
      )}
    </section>
  );
}

/* ───── How It Works ───── */
function HowItWorks() {
  const steps = [
    {
      emoji: "🃏",
      title: "Draft your cards",
      desc: "Pick from the latest sets to build your fantasy roster.",
    },
    {
      emoji: "⚔️",
      title: "Compete weekly",
      desc: "Your cards earn points based on real tournament results.",
    },
    {
      emoji: "🏆",
      title: "Climb the board",
      desc: "Track your rank against friends and the global leaderboard.",
    },
  ];

  return (
    <section id="how" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-10 text-center text-3xl font-bold">How it works</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="text-center">
            <span className="text-4xl">{s.emoji}</span>
            <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───── FAQ ───── */
function FAQ() {
  const faqs = [
    {
      q: "Do I need to own physical cards?",
      a: "Nope! Everything is virtual. You draft cards in the app and earn points based on how those cards perform in real-world tournaments.",
    },
    {
      q: "Is it free?",
      a: "Yes. PokeLeague will be free to play. We might add optional cosmetic stuff later, but gameplay will always be free.",
    },
    {
      q: "When does it launch?",
      a: "We're building it right now. Join the waitlist to get early access as soon as it's ready.",
    },
  ];

  return (
    <section id="faq" className="mx-auto max-w-2xl px-6 py-20">
      <h2 className="mb-10 text-center text-3xl font-bold">FAQ</h2>
      <div className="space-y-6">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-lg border border-gray-800 p-4"
          >
            <summary className="cursor-pointer font-medium group-open:text-yellow-400">
              {f.q}
            </summary>
            <p className="mt-2 text-sm text-gray-400">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} PokeLeague. Built with ☕ and Poké Balls.
    </footer>
  );
}

/* ───── Page ───── */
export default function Home() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}
