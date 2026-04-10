function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-warm-border/50 rounded animate-pulse-warm ${className ?? ""}`}
    />
  );
}

export function SkeletonPainting() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="w-full h-[400px] sm:h-[500px] rounded-lg" />
      <SkeletonBlock className="h-8 w-2/3" />
      <SkeletonBlock className="h-5 w-1/3" />
      <div className="flex gap-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="w-8 h-8 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(lines)].map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="paper-card p-6 sm:p-8 space-y-4">
      <SkeletonBlock className="h-7 w-1/2" />
      <SkeletonBlock className="h-5 w-1/4" />
      <SkeletonText lines={6} />
    </div>
  );
}
