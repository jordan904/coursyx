'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

const features = [
  { title: 'Upload anything', description: 'PDFs, YouTube links, URLs, or paste your notes directly.' },
  { title: 'Built for Skool', description: 'Every output formatted for Skool Classroom — zero reformatting.' },
  { title: 'Copy and paste ready', description: 'Modules, lessons, and action items ready to drop in.' },
  { title: 'AI cover images', description: 'Professional course covers generated with one click.' },
  { title: 'Quiz and script generator', description: 'Knowledge checks and video scripts for every lesson.' },
]

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', community: '', niche: '' })
  const [annual, setAnnual] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // iOS Safari requires muted to be set via DOM property for autoplay
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.play().catch(() => {})
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('https://formspree.io/f/mbdzkgrb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        toast.error('Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
      toast.success('Request submitted!')
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-start gap-5 animate-fade-up">
              <Image src="/logo.jpg" alt="Coursyx" width={180} height={180} className="w-[120px] md:w-[150px] lg:w-[180px] h-auto shrink-0 -mt-1" />
              <h1
                className="font-heading text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight"
              >
                Turn your knowledge into a Skool course in minutes
              </h1>
            </div>
            <p
              className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-xl animate-fade-up"
              style={{ animationDelay: '80ms' }}
            >
              Coursyx takes your PDF, YouTube link, or pasted notes and builds a complete
              Skool Classroom with modules, quizzes, video scripts, and a cover
              image — ready to paste in under two minutes.
            </p>
            <div
              className="animate-fade-up space-y-3"
              style={{ animationDelay: '160ms' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150"
                >
                  Request Trial Access
                </button>
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center h-12 px-6 border border-[var(--accent)] text-[var(--accent)] font-medium rounded-[6px] hover:bg-[var(--accent)] hover:text-white transition-colors duration-150"
                >
                  Sign Up with Code
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center h-12 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--card)] transition-colors duration-150"
                >
                  Log In
                </a>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                We are in the testing phase and are accepting a limited number of Skool creators to trial the software in exchange for feedback.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="p-5 border border-[var(--border)] rounded-[6px] bg-[var(--card)] animate-fade-up"
                style={{ animationDelay: `${240 + i * 80}ms` }}
              >
                <h3 className="font-heading text-xl mb-1">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <h2
          className="font-heading text-3xl md:text-4xl text-center mb-16 animate-fade-up"
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { step: 1, heading: 'Upload your content', description: 'Drop a PDF, paste a YouTube link, or type your notes.' },
            { step: 2, heading: 'AI builds your course', description: 'Modules, lessons, quizzes, scripts, and a cover image — generated in minutes.' },
            { step: 3, heading: 'Paste into Skool', description: 'Copy each section directly into your Skool Classroom. Zero reformatting.' },
          ].map((item, i) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center space-y-4 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
                {item.step}
              </div>
              <h3 className="font-heading text-xl">{item.heading}</h3>
              <p className="text-[var(--muted-foreground)] text-sm max-w-xs">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <h2
          className="font-heading text-3xl md:text-4xl text-center mb-10 animate-fade-up"
        >
          Simple Pricing
        </h2>

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
          {/* Free */}
          <div
            className="p-6 border border-[var(--border)] rounded-[6px] bg-[var(--card)] flex flex-col animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            <h3 className="font-heading text-2xl mb-1">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                '2 courses lifetime',
                '3 cover images per course',
                'All AI features included',
                'Quizzes & video scripts',
                'Export to Skool',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <span className="text-[var(--accent)] mt-0.5 shrink-0">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--muted)] transition-colors duration-150 text-sm w-full"
            >
              Get Started Free
            </a>
          </div>

          {/* Pro */}
          <div
            className="p-6 border border-[var(--accent)] rounded-[6px] bg-[var(--card)] flex flex-col relative animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-xs px-3 py-1 rounded-full font-medium">
              Most Popular
            </span>
            <h3 className="font-heading text-2xl mb-1">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{annual ? '$590' : '$59'}</span>
              <span className="text-[var(--muted-foreground)] text-sm">/{annual ? 'yr' : 'mo'}</span>
              {annual && (
                <span className="block text-xs text-[var(--muted-foreground)] mt-1">~$49/mo</span>
              )}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                '15 courses per month',
                '3 cover images per course',
                'All AI features included',
                'Quizzes & video scripts',
                'Export to Skool',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <span className="text-[var(--accent)] mt-0.5 shrink-0">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 text-sm w-full"
            >
              Start Pro
            </a>
          </div>

          {/* Max */}
          <div
            className="p-6 border border-[var(--border)] rounded-[6px] bg-[var(--card)] flex flex-col animate-fade-up"
            style={{ animationDelay: '320ms' }}
          >
            <h3 className="font-heading text-2xl mb-1">Max</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{annual ? '$990' : '$99'}</span>
              <span className="text-[var(--muted-foreground)] text-sm">/{annual ? 'yr' : 'mo'}</span>
              {annual && (
                <span className="block text-xs text-[var(--muted-foreground)] mt-1">~$82/mo</span>
              )}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                '50 courses per month',
                '3 cover images per course',
                'All AI features included',
                'Quizzes & video scripts',
                'Export to Skool',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <span className="text-[var(--accent)] mt-0.5 shrink-0">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--muted)] transition-colors duration-150 text-sm w-full"
            >
              Start Max
            </a>
          </div>
        </div>

        {/* Pay Per Course callout */}
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-10 animate-fade-up" style={{ animationDelay: '400ms' }}>
          Need just one more?{' '}
          <span className="underline underline-offset-2 decoration-[var(--muted-foreground)]">
            Add a single course for $15.
          </span>
        </p>
      </div>

      {/* Demo video + TikTok link */}
      <div className="max-w-md mx-auto px-6 pb-24">
        <div className="animate-fade-up" style={{ animationDelay: '600ms' }}>
          <video
            ref={videoRef}
            src="/demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full max-h-[70vh] object-contain rounded-[6px] border border-[var(--border)]"
          />
          <div className="mt-4 text-center">
            <a
              href="https://www.tiktok.com/@novaworks.digital/video/7616781124097887508"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:opacity-80 transition-opacity duration-150 font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.01-.3z"/>
              </svg>
              Follow us on TikTok
            </a>
          </div>
        </div>
      </div>

      {/* Trial access form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !submitting && setShowForm(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[6px] p-6">
            {submitted ? (
              <div className="text-center py-8">
                <h2 className="font-heading text-2xl mb-2">You&apos;re on the list</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-6">
                  We&apos;ll be in touch soon with your trial access details.
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center h-10 px-6 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-xl">Request Trial Access</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150 text-lg leading-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Skool community name <span className="text-[var(--muted)]">(optional)</span></label>
                    <input
                      type="text"
                      value={form.community}
                      onChange={(e) => setForm({ ...form, community: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                      placeholder="e.g. The Fitness Academy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Your niche <span className="text-[var(--muted)]">(optional)</span></label>
                    <input
                      type="text"
                      value={form.niche}
                      onChange={(e) => setForm({ ...form, niche: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[6px] text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] transition-colors duration-150"
                      placeholder="e.g. Fitness, marketing, real estate..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 mt-2 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
