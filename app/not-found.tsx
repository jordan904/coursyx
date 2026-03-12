import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl">Page not found</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard" className="inline-block pt-2">
          <Button className="rounded-[6px] bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </main>
  )
}
