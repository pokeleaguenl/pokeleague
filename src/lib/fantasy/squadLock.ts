import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if squad modifications should be locked
 * Squads lock at 00:00 UTC on the event_date of the next upcoming event
 */
export async function isSquadLocked(supabase: SupabaseClient): Promise<{
  locked: boolean;
  reason?: string;
  nextEvent?: {
    id: number;
    name: string;
    event_date: string;
    lockTime: Date;
  };
}> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Get the next upcoming event
  const { data: nextEvent } = await supabase
    .from('fantasy_events')
    .select('id, name, event_date, status')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .single();
  
  if (!nextEvent) {
    // No upcoming events, squads are not locked
    return { locked: false };
  }
  
  // Lock time is midnight UTC on the event date
  const lockTime = new Date(`${nextEvent.event_date}T00:00:00.000Z`);
  if (isNaN(lockTime.getTime())) {
    return { locked: false };
  }

  if (now >= lockTime) {
    // Past the lock deadline
    return {
      locked: true,
      reason: `Squads are locked for ${nextEvent.name}. The deadline was ${lockTime.toUTCString()}.`,
      nextEvent: {
        id: nextEvent.id,
        name: nextEvent.name,
        event_date: nextEvent.event_date,
        lockTime,
      },
    };
  }
  
  // Before the lock deadline
  return {
    locked: false,
    nextEvent: {
      id: nextEvent.id,
      name: nextEvent.name,
      event_date: nextEvent.event_date,
      lockTime,
    },
  };
}

/**
 * Get time remaining until squad lock
 */
export function getTimeUntilLock(lockTime: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const totalSeconds = Math.max(0, Math.floor((lockTime.getTime() - now.getTime()) / 1000));
  
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { days, hours, minutes, seconds, totalSeconds };
}
