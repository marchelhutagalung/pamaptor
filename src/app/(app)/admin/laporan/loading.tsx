export default function LaporanLoading() {
  return (
    <div className="text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
        <div className="h-5 w-32 bg-white/10 rounded-full animate-pulse" />
        <div className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
      </div>

      {/* Chart skeleton */}
      <div className="mx-4 mt-4 bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="h-4 w-24 bg-white/10 rounded-full animate-pulse mb-3" />
        <div className="h-36 bg-white/5 rounded-xl animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="px-4 mt-4 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-white/10 rounded-xl animate-pulse" />
          <div className="flex-1 h-9 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-white/10 rounded-xl animate-pulse" />
          <div className="w-16 h-9 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Report list skeleton */}
      <div className="px-4 mt-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 bg-white/10 rounded-full animate-pulse" />
                <div className="h-3 w-32 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-white/5 rounded-full animate-pulse" />
              <div className="h-3.5 w-2/3 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
