/**
 * Card-grid skeleton shown while reports load; it mirrors the report card so nothing jumps when data lands.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando relatórios">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-card bg-card p-5 shadow-card">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-tile" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-tile" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-tile" />
            </div>
          </div>
          <div className="mt-5 flex justify-between">
            <div className="h-8 w-20 animate-pulse rounded-xl bg-tile" />
            <div className="h-8 w-16 animate-pulse rounded-xl bg-tile" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-tile" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-tile" />
          </div>
        </div>
      ))}
    </div>
  );
}
