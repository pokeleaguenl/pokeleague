export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 animate-pulse">
      <div className="mb-8">
        <div className="h-9 w-48 rounded-lg bg-gray-800 mb-2" />
        <div className="h-4 w-32 rounded bg-gray-800" />
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-center">
            <div className="h-8 w-12 rounded bg-gray-700 mx-auto mb-1" />
            <div className="h-3 w-20 rounded bg-gray-800 mx-auto" />
          </div>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/20 p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-14 rounded-lg bg-gray-800" />
              <div>
                <div className="h-4 w-48 rounded bg-gray-700 mb-2" />
                <div className="h-3 w-32 rounded bg-gray-800" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
