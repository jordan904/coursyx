'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Plus, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function DashboardHeader() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const [helpForm, setHelpForm] = useState({ subject: '', message: '', email: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!helpForm.subject.trim() || !helpForm.message.trim() || !helpForm.email.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('https://formspree.io/f/mbdzkgrb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: `[Help] ${helpForm.subject}`,
          email: helpForm.email,
          message: helpForm.message,
        }),
      })
      if (!res.ok) {
        toast.error('Something went wrong. Please try again.')
        return
      }
      toast.success('Message sent! We\'ll get back to you soon.')
      setShowHelp(false)
      setHelpForm({ subject: '', message: '', email: '' })
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
              onClick={() => setShowHelp(true)}
              aria-label="Help & Support"
              className="text-muted-foreground hover:text-foreground"
              style={{ transitionDuration: '150ms' }}
            >
              <HelpCircle className="size-4" />
            </Button>

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

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !submitting && setShowHelp(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[6px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl">Help & Support</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150 text-lg leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Have a question, found a bug, or need more courses? Let us know.
            </p>
            <form onSubmit={handleHelpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={helpForm.email}
                  onChange={(e) => setHelpForm({ ...helpForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={helpForm.subject}
                  onChange={(e) => setHelpForm({ ...helpForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                  placeholder="e.g. Bug report, feature request, need more courses..."
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={helpForm.message}
                  onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150 resize-none"
                  placeholder="Describe your issue or request..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 mt-2 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 text-sm disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
