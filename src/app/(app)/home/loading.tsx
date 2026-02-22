export default function HomeLoading() {
  return (
    <div className="text-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 backdrop-blur-md px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-white/10 rounded-full animate-pulse" />
              <div className="h-3 w-40 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Feed skeleton */}
      <div className="px-4 py-4 space-y-4">
        {/* Filter chip skeleton */}
        <div className="h-7 w-24 bg-white/10 rounded-full animate-pulse" />

        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-[#111111] rounded-2xl overflow-hidden border border-white/10"
          >
            {/* Card header */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-white/5 rounded-full animate-pulse" />
            </div>
            {/* Image */}
            <div className="aspect-video w-full bg-white/5 animate-pulse" />
            {/* Footer */}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-white/5 rounded-full animate-pulse" />
                <div className="h-3.5 w-3/4 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-40 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
