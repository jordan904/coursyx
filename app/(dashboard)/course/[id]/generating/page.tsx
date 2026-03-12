'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function GeneratingPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [phase, setPhase] = useState<'generating' | 'error' | 'rate-limited' | 'timeout'>('generating')
  const [chars, setChars] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const response = await fetch('/api/generate-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })

        if (response.status === 429) {
          setPhase('rate-limited')
          return
        }

        if (response.status === 400) {
          const data = await response.json()
          setErrorMessage(data.error || 'Could not generate course.')
          setPhase('error')
          return
        }

        if (!response.ok || !response.body) {
          setErrorMessage('Failed to generate course. Please try again.')
          setPhase('error')
          return
        }

        const reader = response.body.getReader()
        let accumulated = ''
        let signal = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)

          if (chunk.includes('__DONE__')) {
            signal = '__DONE__'
            const clean = chunk.replace('__DONE__', '')
            if (clean) {
              accumulated += clean
              if (!cancelled) setChars(accumulated.length)
            }
          } else if (chunk.includes('__FAILED__')) {
            signal = '__FAILED__'
            const clean = chunk.replace('__FAILED__', '')
            if (clean) {
              accumulated += clean
              if (!cancelled) setChars(accumulated.length)
            }
          } else {
            accumulated += chunk
            if (!cancelled) setChars(accumulated.length)
          }
        }

        if (cancelled) return

        // Poll Supabase for status
        const supabase = createClient()
        let pollCount = 0
        const maxPolls = 120

        const poll = async (): Promise<void> => {
          if (cancelled || pollCount >= maxPolls) {
            if (pollCount >= maxPolls) {
              setPhase('timeout')
            }
            return
          }

          pollCount++

          const { data: course } = await supabase
            .from('courses')
            .select('status')
            .eq('id', courseId)
            .single()

          if (cancelled) return

          if (course?.status === 'complete') {
            router.push(`/course/${courseId}`)
            return
          }

          if (course?.status === 'failed' || signal === '__FAILED__') {
            setErrorMessage('Course generation failed. Please try again.')
            setPhase('error')
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 600))
          return poll()
        }

        await poll()
      } catch (err) {
        console.error('[generating] generation error:', err)
        if (!cancelled) {
          setErrorMessage('Connection error. Check your internet.')
          setPhase('error')
        }
      }
    }

    generate()

    return () => {
      cancelled = true
    }
  }, [courseId, router])

  // Generating state
  if (phase === 'generating') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Loader2 className="w-10 h-10 text-[#E8622A] animate-spin mx-auto" />
          </div>
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Building your full course...
          </h1>
          <p className="text-[#8A8F98] text-sm mb-4">
            Generating modules, lessons, learning outcomes, and action items from your approved outline.
          </p>
          <div className="bg-[#161A1F] border border-[#2A2E35] rounded-[6px] px-4 py-3">
            <span className="text-[#8A8F98] text-sm">
              {chars.toLocaleString()} characters generated
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Rate limited
  if (phase === 'rate-limited') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Rate limit reached
          </h1>
          <p className="text-[#8A8F98] text-sm mb-6">
            You&apos;ve hit the course generation limit. Try again in an hour.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Timeout
  if (phase === 'timeout') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Taking longer than expected
          </h1>
          <p className="text-[#8A8F98] text-sm mb-6">
            Your course is still being generated. Please check your dashboard in a few minutes.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
          Something went wrong
        </h1>
        <p className="text-[#8A8F98] text-sm mb-6">{errorMessage}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="border border-[#2A2E35] text-[#E8E3D5] px-6 py-2.5 rounded-[6px] text-sm font-medium hover:border-[#3D4148] transition-colors duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
