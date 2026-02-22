export default function ProfileLoading() {
  return (
    <div className="text-white pb-24">
      {/* Profile header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2 text-center">
            <div className="h-5 w-36 bg-white/10 rounded-full animate-pulse mx-auto" />
            <div className="h-3.5 w-48 bg-white/5 rounded-full animate-pulse mx-auto" />
          </div>
          {/* Action buttons */}
          <div className="flex gap-3 w-full mt-2">
            <div className="flex-1 h-10 bg-white/10 rounded-full animate-pulse" />
            <div className="flex-1 h-10 bg-white/10 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Posts grid skeleton */}
      <div className="px-4 pt-4">
        <div className="h-4 w-24 bg-white/10 rounded-full animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
