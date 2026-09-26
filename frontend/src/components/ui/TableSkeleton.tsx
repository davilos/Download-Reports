/**
 * Full-table skeleton loader displayed while data is being fetched.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="grid grid-cols-[2fr_1fr_1fr_0.5fr_0.5fr] gap-4 px-6 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-surface-700/50 rounded-md animate-pulse"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid grid-cols-[2fr_1fr_1fr_0.5fr_0.5fr] gap-4 px-6 py-4 border-t border-surface-800/50"
          style={{ animationDelay: `${rowIndex * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-700/50 rounded-xl animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-surface-700/50 rounded-md animate-pulse w-3/4" />
              <div className="h-3 bg-surface-700/30 rounded-md animate-pulse w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-surface-700/50 rounded-md animate-pulse self-center w-2/3" />
          <div className="h-4 bg-surface-700/50 rounded-md animate-pulse self-center w-1/2" />
          <div className="h-6 bg-surface-700/50 rounded-lg animate-pulse self-center w-16" />
          <div className="h-9 w-9 bg-surface-700/50 rounded-xl animate-pulse self-center justify-self-center" />
        </div>
      ))}
    </div>
  );
}
