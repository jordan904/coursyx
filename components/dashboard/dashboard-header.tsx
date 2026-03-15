'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Plus } from 'lucide-react'

export function DashboardHeader() {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80" style={{ transitionDuration: '150ms' }}>
          <Image src="/logo.jpg" alt="Coursyx" width={32} height={32} className="size-8" />
          <h1 className="font-heading text-xl text-foreground">Coursyx</h1>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/course/new">
            <Button
              className="rounded-[6px] bg-accent text-white hover:bg-accent/90"
              style={{ transitionDuration: '150ms' }}
            >
              <Plus className="size-4" />
              New Course
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
            style={{ transitionDuration: '150ms' }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
