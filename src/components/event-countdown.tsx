"use client";

import { useState, useEffect } from "react";

interface Props {
  eventDate: string; // ISO date string e.g. "2026-04-05"
  eventName: string;
  eventId: number;
}

function getTimeLeft(targetDate: string) {
  const now = Date.now();
  const target = new Date(targetDate + "T00:00:00Z").getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, total: diff };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/5 min-w-[52px] h-14 px-2">
        <span className="text-3xl font-black text-yellow-400 tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">{label}</span>
    </div>
  );
}

export default function EventCountdown({ eventDate, eventName, eventId }: Props) {
  const [time, setTime] = useState(() => getTimeLeft(eventDate));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(eventDate)), 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  const isUrgent = time.total < 6 * 3600000; // < 6 hours
  const isToday = time.days === 0;

  return (
    <a href={`/events/${eventId}`} className="block group">
      <div className={`rounded-2xl border p-5 transition-all group-hover:border-yellow-400/50 ${isUrgent ? "border-orange-400/40 bg-orange-400/5" : "border-yellow-400/20 bg-yellow-400/5"}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isUrgent ? "text-orange-400" : "text-yellow-400"}`}>
              {isToday ? "🔴 Starts Today" : "Next Event"}
            </p>
            <p className="font-bold text-base text-white leading-tight">{eventName}</p>
          </div>
          <span className="text-2xl">🏆</span>
        </div>

        {time.total > 0 ? (
          <div className="flex items-end gap-2">
            <Digit value={time.days} label="days" />
            <span className="text-yellow-400/40 text-2xl font-black mb-5">:</span>
            <Digit value={time.hours} label="hrs" />
            <span className="text-yellow-400/40 text-2xl font-black mb-5">:</span>
            <Digit value={time.minutes} label="min" />
            <span className="text-yellow-400/40 text-2xl font-black mb-5">:</span>
            <Digit value={time.seconds} label="sec" />
            <p className="ml-auto text-xs text-gray-500 self-end mb-1 group-hover:text-yellow-400 transition-colors">View →</p>
          </div>
        ) : (
          <p className="text-sm font-semibold text-orange-400">Event in progress — check standings</p>
        )}
      </div>
    </a>
  );
}
