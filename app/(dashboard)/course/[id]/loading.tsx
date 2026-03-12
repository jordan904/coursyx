export default function CourseLoading() {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar skeleton */}
      <div className="hidden w-72 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 md:block">
        <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-4 aspect-video w-full animate-pulse rounded-[6px] bg-[var(--muted)]" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-[6px] bg-[var(--muted)]" />
          ))}
        </div>
      </div>
      {/* Main panel skeleton */}
      <div className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-9 w-32 animate-pulse rounded-[6px] bg-[var(--muted)]" />
        </div>
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-6 h-64 w-full animate-pulse rounded-[6px] bg-[var(--muted)]" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-[6px] bg-[var(--muted)]" />
        <div className="mt-6 flex gap-3">
          <div className="h-9 w-40 animate-pulse rounded-[6px] bg-[var(--muted)]" />
          <div className="h-9 w-32 animate-pulse rounded-[6px] bg-[var(--muted)]" />
          <div className="h-9 w-44 animate-pulse rounded-[6px] bg-[var(--muted)]" />
        </div>
      </div>
    </div>
  )
}
