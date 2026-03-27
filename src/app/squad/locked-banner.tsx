import Link from "next/link";

interface LockedBannerProps {
  eventName: string;
  lockTime: string;
}

export default function LockedBanner({ eventName, lockTime }: LockedBannerProps) {
  const deadline = new Date(lockTime);

  return (
    <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">🔒</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-red-400 text-sm">
            Squad Locked for <span className="text-white">{eventName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Locked since {deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
            Edits re-open after the event ends.
          </p>
        </div>
        <Link
          href="/events"
          className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
