export const maxDuration = 60

import { z } from 'zod'
import { YoutubeTranscript } from 'youtube-transcript'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  url: z.string().url('Invalid URL format.'),
})

export async function POST(request: Request) {
  // Auth check
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // Extract video ID from URL
  const videoId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1]

  if (!videoId) {
    return Response.json(
      {
        error:
          'Invalid YouTube URL. Use youtube.com/watch?v= or youtu.be/ format.',
      },
      { status: 422 }
    )
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    const text = transcript.map((t) => t.text).join(' ')
    return Response.json({ text: text.slice(0, 80000) })
  } catch {
    return Response.json(
      {
        error:
          'Could not extract transcript. This video may have transcripts disabled, or YouTube may have changed their format. Switch to the Paste Text tab to add the transcript manually — your other source content is still saved.',
      },
      { status: 422 }
    )
  }
}
