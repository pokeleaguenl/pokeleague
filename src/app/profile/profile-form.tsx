"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COUNTRIES = [
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

interface Props {
  initialUsername: string;
  initialDisplayName: string;
  initialFirstName: string;
  initialLastName: string;
  initialDob: string;
  initialCountry: string;
  totalPoints: number;
}

export default function ProfileForm({
  initialUsername, initialDisplayName, initialFirstName,
  initialLastName, initialDob, initialCountry, totalPoints,
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [dob, setDob] = useState(initialDob);
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  async function save() {
    setSaving(true); setMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || null,
      display_name: displayName.trim() || null,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      date_of_birth: dob || null,
      country_code: country || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    setMsg(error ? { text: error.message, ok: false } : { text: "Profile saved!", ok: true });
    setSaving(false);
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm placeholder-gray-500 focus:border-yellow-400/60 focus:outline-none focus:bg-white/8 transition-colors";
  const labelClass = "mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wide";

  return (
    <div className="space-y-6">
      {/* Points card */}
      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 text-center">
        <p className="text-4xl font-bold text-yellow-400">{totalPoints}</p>
        <p className="mt-1 text-sm text-gray-400">Total points earned</p>
      </div>

      {/* Identity */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Identity</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Shown on leaderboard" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username" className={`${inputClass} pl-8`} />
          </div>
          <p className="mt-1 text-xs text-gray-600">Letters, numbers, underscores only</p>
        </div>
      </div>

      {/* Personal details */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Personal Details</h2>
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
            className={`${inputClass} text-gray-300`} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <div className="relative">
            {selectedCountry && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">
                {selectedCountry.flag}
              </span>
            )}
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className={`${inputClass} ${selectedCountry ? "pl-10" : ""} bg-gray-900 appearance-none cursor-pointer`}>
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : "Save Profile"}
      </button>

      {msg && (
        <div className={`rounded-xl border p-3 text-center text-sm ${msg.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          {msg.ok ? "✅" : "❌"} {msg.text}
        </div>
      )}
    </div>
  );
}
