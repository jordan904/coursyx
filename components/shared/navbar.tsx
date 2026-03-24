import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

interface NavbarProps {
  backHref?: string
  backLabel?: string
  showAuth?: boolean
}

export function Navbar({ backHref, backLabel, showAuth }: NavbarProps) {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
            >
              <ArrowLeft className="size-4" />
              {backLabel || 'Back'}
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" style={{ transitionDuration: '150ms' }}>
            <Image src="/logo.jpg" alt="Coursyx" width={28} height={28} className="size-7" />
            <span className="font-heading text-lg text-[var(--foreground)]">Coursyx</span>
          </Link>
        </div>

        {showAuth && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-9 px-5 bg-[var(--accent)] text-white text-sm font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150"
            >
              Sign Up Free
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
