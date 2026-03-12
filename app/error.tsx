'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl">Something went wrong</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={reset}
            className="rounded-[6px] bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
          >
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-[6px]">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
