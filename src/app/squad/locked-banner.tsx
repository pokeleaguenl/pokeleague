import Link from "next/link";

interface LockedBannerProps {
  eventName: string;
  lockTime: string; // ISO string
}

export default function LockedBanner({ eventName, lockTime }: LockedBannerProps) {
  const deadline = new Date(lockTime);
  
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🔒</div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-red-400 mb-2">
            Squad Locked
          </h2>
          <p className="text-gray-300 mb-3">
            Your squad is locked for <strong>{eventName}</strong>.
          </p>
          <p className="text-sm text-gray-400">
            The deadline was <strong>{deadline.toUTCString()}</strong>.
            Squad modifications will be available again after the event concludes.
          </p>
          <div className="mt-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              View Event Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
