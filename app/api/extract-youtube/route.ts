export const maxDuration = 60

import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { Supadata } from '@supadata/js'
import { createClient } from '@/lib/supabase/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:extract-youtube',
})

const bodySchema = z.object({
  url: z.string().url('Invalid URL format.'),
})

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid URL format.' }, { status: 400 })
  }

  const { url } = parsed.data

  // Rate limit by user.id
  const { success: rateLimitOk } = await ratelimit.limit(user.id)
  if (!rateLimitOk) {
    return Response.json({ error: "You've hit the limit. Try again in an hour." }, { status: 429 })
  }

  const videoId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1]

  if (!videoId) {
    return Response.json(
      { error: 'Invalid YouTube URL. Use youtube.com/watch?v= or youtu.be/ format.' },
      { status: 422 }
    )
  }

  if (!process.env.SUPADATA_API_KEY) {
    return Response.json(
      { error: 'YouTube transcript service is not configured. Use the Paste Text tab instead.' },
      { status: 503 }
    )
  }

  try {
    const supadata = new Supadata({ apiKey: process.env.SUPADATA_API_KEY })
    const transcript = await supadata.youtube.transcript({ videoId })

    if (!transcript || !Array.isArray(transcript.content) || transcript.content.length === 0) {
      return Response.json(
        { error: 'No transcript available for this video. The video may not have captions. Use the Paste Text tab instead.' },
        { status: 422 }
      )
    }

    const text = transcript.content.map((t: { text: string }) => t.text).join(' ')

    if (text.trim().length < 10) {
      return Response.json(
        { error: 'Transcript is too short or empty. Use the Paste Text tab instead.' },
        { status: 422 }
      )
    }

    return Response.json({ text: text.slice(0, 80000) })
  } catch (err) {
    console.error('[extract-youtube] Supadata error:', err)
    return Response.json(
      {
        error: 'Could not extract transcript. This video may have transcripts disabled. Switch to the Paste Text tab to add the transcript manually.',
      },
      { status: 422 }
    )
  }
}
