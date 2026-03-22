'use client'

import { useState } from 'react'
import { X, Zap, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  plan: string // current plan: 'free' | 'pro' | 'max'
}

type PlanKey = 'pro_monthly' | 'pro_annual' | 'max_monthly' | 'max_annual' | 'pay_per_course'

export function UpgradeModal({ open, onClose, plan }: UpgradeModalProps) {
  const [loading, setLoading] = useState<PlanKey | null>(null)

  if (!open) return null

  const handleUpgrade = async (selectedPlan: PlanKey) => {
    setLoading(selectedPlan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Something went wrong.')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[6px] p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <h2 className="font-heading text-2xl text-[var(--foreground)] mb-1">
          Upgrade your plan
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-5">
          Unlock more courses and features.
        </p>

        {plan === 'free' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Pro card */}
            <div className="border border-[var(--accent)] rounded-[6px] p-4 bg-[var(--background)] relative">
              <div className="absolute -top-2.5 left-3 bg-[var(--accent)] text-white text-[10px] font-medium px-2 py-0.5 rounded-[4px]">
                Popular
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="size-4 text-[var(--accent)]" />
                <span className="font-medium text-sm text-[var(--foreground)]">Pro</span>
              </div>
              <div className="mb-1">
                <span className="text-xl font-heading text-[var(--foreground)]">$59</span>
                <span className="text-xs text-[var(--muted-foreground)]">/mo</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-3">15 courses/month</p>
              <button
                onClick={() => handleUpgrade('pro_monthly')}
                disabled={loading !== null}
                className="w-full h-8 bg-[var(--accent)] text-white text-xs font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {loading === 'pro_monthly' ? 'Redirecting...' : 'Get Pro'}
              </button>
            </div>

            {/* Max card */}
            <div className="border border-[var(--border)] hover:border-[var(--muted-foreground)] rounded-[6px] p-4 bg-[var(--background)] transition-colors duration-150">
              <div className="flex items-center gap-1.5 mb-2">
                <Crown className="size-4 text-[var(--foreground)]" />
                <span className="font-medium text-sm text-[var(--foreground)]">Max</span>
              </div>
              <div className="mb-1">
                <span className="text-xl font-heading text-[var(--foreground)]">$99</span>
                <span className="text-xs text-[var(--muted-foreground)]">/mo</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-3">50 courses/month</p>
              <button
                onClick={() => handleUpgrade('max_monthly')}
                disabled={loading !== null}
                className="w-full h-8 bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {loading === 'max_monthly' ? 'Redirecting...' : 'Get Max'}
              </button>
            </div>
          </div>
        )}

        {plan === 'pro' && (
          <div className="mb-4">
            <div className="border border-[var(--border)] hover:border-[var(--accent)] rounded-[6px] p-4 bg-[var(--background)] transition-colors duration-150">
              <div className="flex items-center gap-1.5 mb-2">
                <Crown className="size-4 text-[var(--accent)]" />
                <span className="font-medium text-sm text-[var(--foreground)]">Max</span>
              </div>
              <div className="mb-1">
                <span className="text-xl font-heading text-[var(--foreground)]">$99</span>
                <span className="text-xs text-[var(--muted-foreground)]">/mo</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-3">50 courses/month</p>
              <button
                onClick={() => handleUpgrade('max_monthly')}
                disabled={loading !== null}
                className="w-full h-8 bg-[var(--accent)] text-white text-xs font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {loading === 'max_monthly' ? 'Redirecting...' : 'Upgrade to Max'}
              </button>
            </div>
          </div>
        )}

        {/* Pay per course link */}
        <div className="text-center">
          <button
            onClick={() => handleUpgrade('pay_per_course')}
            disabled={loading !== null}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors duration-150 underline underline-offset-2 disabled:opacity-50"
          >
            {loading === 'pay_per_course' ? 'Redirecting...' : 'Buy a single course — $15'}
          </button>
        </div>
      </div>
    </div>
  )
}
