export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-gray-800 mb-2" />
      <div className="h-4 w-40 rounded bg-gray-800 mb-8" />

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 rounded bg-gray-700" />
                <div>
                  <div className="h-4 w-28 rounded bg-gray-700 mb-1" />
                  <div className="h-3 w-20 rounded bg-gray-800" />
                </div>
              </div>
              <div className="h-7 w-16 rounded bg-gray-700" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-10 rounded-lg bg-gray-800" />
              <div className="h-8 w-px bg-gray-800" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="w-10 h-9 rounded-lg bg-gray-800" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
