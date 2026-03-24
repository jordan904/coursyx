'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'

const features = [
  { title: 'Upload anything', description: 'PDFs, YouTube links, URLs, or paste your notes directly.' },
  { title: 'Built for Skool', description: 'Every output formatted for Skool Classroom. Zero reformatting.' },
  { title: 'Copy and paste ready', description: 'Modules, lessons, and action items ready to drop in.' },
  { title: 'AI cover images', description: 'Professional course covers generated with one click.' },
  { title: 'Quiz and script generator', description: 'Knowledge checks and video scripts for every lesson.' },
]

export default function LandingPage() {
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

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar showAuth />
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
              image. Ready to paste in under two minutes.
            </p>
            <div
              className="animate-fade-up space-y-3"
              style={{ animationDelay: '160ms' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150"
                >
                  Start Free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-12 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--card)] transition-colors duration-150"
                >
                  Log In
                </Link>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                Free plan includes 2 courses with all features. No credit card required.
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
            { step: 2, heading: 'AI builds your course', description: 'Modules, lessons, quizzes, scripts, and a cover image. All generated in minutes.' },
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
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--muted)] transition-colors duration-150 text-sm w-full"
            >
              Get Started Free
            </Link>
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
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150 text-sm w-full"
            >
              Start Pro
            </Link>
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
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-[6px] hover:bg-[var(--muted)] transition-colors duration-150 text-sm w-full"
            >
              Start Max
            </Link>
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

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">Coursyx | AI Course Builder for Skool</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150">Privacy</Link>
            <Link href="/refund" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
