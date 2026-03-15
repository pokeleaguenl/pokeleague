"use client";

import { useEffect, useState } from "react";

interface LockCountdownProps {
  lockTime: string; // ISO string
  eventName: string;
}

export default function LockCountdown({ lockTime, eventName }: LockCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadline = new Date(lockTime);
      const totalSeconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockTime]);

  if (!timeRemaining) return null;

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 6;

  return (
    <div className={`rounded-xl border p-4 ${
      isUrgent 
        ? 'border-red-400/30 bg-red-400/10' 
        : 'border-yellow-400/30 bg-yellow-400/10'
    }`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">⏰</div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
            Squad Lock Countdown
          </p>
          <p className="text-xs text-gray-400">
            Locks for {eventName}
          </p>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className={`text-2xl font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            {timeRemaining.days}
          </div>
          <div className="text-xs text-gray-500">days</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            {timeRemaining.hours}
          </div>
          <div className="text-xs text-gray-500">hours</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            {timeRemaining.minutes}
          </div>
          <div className="text-xs text-gray-500">min</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            {timeRemaining.seconds}
          </div>
          <div className="text-xs text-gray-500">sec</div>
        </div>
      </div>
    </div>
  );
}
