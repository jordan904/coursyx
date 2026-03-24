'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    annualNote: null,
    period: null,
    features: [
      '2 courses lifetime',
      '3 cover images per course',
      'All AI features included',
      'Quizzes & video scripts',
      'Export to Skool',
    ],
    cta: 'Get Started Free',
    accent: false,
  },
  {
    name: 'Pro',
    monthly: '$59',
    annual: '$590',
    annualNote: '~$49/mo',
    period: true,
    features: [
      '15 courses per month',
      '3 cover images per course',
      'All AI features included',
      'Quizzes & video scripts',
      'Export to Skool',
      'Priority support',
    ],
    cta: 'Start Pro',
    accent: true,
  },
  {
    name: 'Max',
    monthly: '$99',
    annual: '$990',
    annualNote: '~$82/mo',
    period: true,
    features: [
      '50 courses per month',
      '3 cover images per course',
      'All AI features included',
      'Quizzes & video scripts',
      'Export to Skool',
      'Priority support',
    ],
    cta: 'Start Max',
    accent: false,
  },
]

export function PricingToggle(): JSX.Element {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-16 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setAnnual(false)}
          className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors duration-150 ${
            !annual
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors duration-150 ${
            annual
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]'
          }`}
        >
          Annual
        </button>
        {annual && (
          <span className="text-xs text-[var(--accent)] font-medium ml-1">Save 2 months</span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className={`p-6 border ${plan.accent ? 'border-[var(--accent)]' : 'border-[var(--border)]'} rounded-[6px] bg-[var(--card)] flex flex-col ${plan.accent ? 'relative' : ''} animate-fade-up`}
            style={{ animationDelay: `${160 + i * 80}ms` }}
          >
            {plan.accent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </span>
            )}
            <h3 className="font-heading text-2xl mb-1">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{annual ? plan.annual : plan.monthly}</span>
              {plan.period && (
                <span className="text-[var(--muted-foreground)] text-sm">/{annual ? 'yr' : 'mo'}</span>
              )}
              {annual && plan.annualNote && (
                <span className="block text-xs text-[var(--muted-foreground)] mt-1">{plan.annualNote}</span>
              )}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <span className="text-[var(--accent)] mt-0.5 shrink-0">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`inline-flex items-center justify-center h-11 px-6 font-medium rounded-[6px] text-sm w-full transition-all duration-150 ${
                plan.accent
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
