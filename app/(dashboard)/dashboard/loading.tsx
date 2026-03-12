export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="h-8 w-32 animate-pulse rounded bg-[var(--muted)]" />
          <div className="flex gap-3">
            <div className="h-9 w-28 animate-pulse rounded-[6px] bg-[var(--muted)]" />
            <div className="h-9 w-9 animate-pulse rounded-[6px] bg-[var(--muted)]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="aspect-video w-full animate-pulse bg-[var(--muted)]" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-[var(--muted)]" />
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 animate-pulse rounded-[6px] bg-[var(--muted)]" />
                  <div className="h-9 w-9 animate-pulse rounded-[6px] bg-[var(--muted)]" />
                  <div className="h-9 w-9 animate-pulse rounded-[6px] bg-[var(--muted)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
