export default function ReportDetailLoading() {
  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        <div className="h-5 w-32 bg-white/10 rounded-full animate-pulse" />
      </div>

      {/* Image */}
      <div className="aspect-video w-full bg-white/5 animate-pulse" />

      <div className="px-4 py-4 space-y-5">
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse" />
          <div className="h-6 w-28 bg-white/10 rounded-full animate-pulse" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-white/10 rounded-full animate-pulse" />
          <div className="h-3.5 w-full bg-white/5 rounded-full animate-pulse" />
          <div className="h-3.5 w-4/5 bg-white/5 rounded-full animate-pulse" />
          <div className="h-3.5 w-2/3 bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="h-3 w-12 bg-white/10 rounded-full animate-pulse" />
          <div className="h-3.5 w-3/4 bg-white/5 rounded-full animate-pulse" />
          <div className="h-48 w-full bg-white/5 rounded-xl animate-pulse" />
        </div>

        {/* Timestamp */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-white/10 rounded-full animate-pulse" />
          <div className="h-3.5 w-56 bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Reporter card */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 w-28 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="h-3.5 w-40 bg-white/5 rounded-full animate-pulse" />
          <div className="h-3.5 w-32 bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Actions skeleton */}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-white/5 rounded-xl border border-white/10 animate-pulse"
            />
          ))}
        </div>

        {/* Notes skeleton */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="h-3 w-28 bg-white/10 rounded-full animate-pulse" />
          <div className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
