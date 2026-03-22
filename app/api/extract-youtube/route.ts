export const maxDuration = 60

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  url: z.string().url('Invalid URL format.'),
})

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'

async function extractViaInnerTube(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
    })
    if (!res.ok) {
      console.error('[extract-youtube] InnerTube status:', res.status)
      return null
    }

    const data = await res.json()
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!Array.isArray(tracks) || tracks.length === 0) {
      console.error('[extract-youtube] InnerTube: no caption tracks found')
      return null
    }

    const track = tracks[0]
    const baseUrl = track.baseUrl as string
    if (!baseUrl || !new URL(baseUrl).hostname.endsWith('.youtube.com')) return null

    const captionRes = await fetch(baseUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!captionRes.ok) {
      console.error('[extract-youtube] Caption fetch status:', captionRes.status)
      return null
    }

    const xml = await captionRes.text()
    const result = parseTranscriptXml(xml)
    console.log('[extract-youtube] InnerTube extracted:', result.length, 'chars')
    return result
  } catch (err) {
    console.error('[extract-youtube] InnerTube error:', err)
    return null
  }
}

async function extractViaWebPage(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      console.error('[extract-youtube] WebPage fetch status:', res.status)
      return null
    }

    const html = await res.text()

    if (html.includes('class="g-recaptcha"')) {
      console.error('[extract-youtube] WebPage: hit captcha')
      return null
    }
    if (!html.includes('"playabilityStatus":')) {
      console.error('[extract-youtube] WebPage: no playabilityStatus')
      return null
    }

    // Extract ytInitialPlayerResponse JSON
    const marker = 'var ytInitialPlayerResponse = '
    const startIdx = html.indexOf(marker)
    if (startIdx === -1) return null

    const jsonStart = startIdx + marker.length
    let braceCount = 0
    let endIdx = jsonStart
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') braceCount++
      else if (html[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          endIdx = i + 1
          break
        }
      }
    }

    let playerResponse
    try {
      playerResponse = JSON.parse(html.slice(jsonStart, endIdx))
    } catch {
      return null
    }

    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!Array.isArray(tracks) || tracks.length === 0) return null

    const baseUrl = tracks[0].baseUrl as string
    if (!baseUrl) return null

    const captionRes = await fetch(baseUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!captionRes.ok) return null

    const xml = await captionRes.text()
    return parseTranscriptXml(xml)
  } catch {
    return null
  }
}

function parseTranscriptXml(xml: string): string {
  const segments: string[] = []

  // Try new format: <p t="..." d="...">text</p>
  const pRegex = /<p\s+t="\d+"\s+d="\d+"[^>]*>([\s\S]*?)<\/p>/g
  let match
  while ((match = pRegex.exec(xml)) !== null) {
    const text = match[1]
    // Extract from <s> tags if present
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g
    let sMatch
    let combined = ''
    while ((sMatch = sRegex.exec(text)) !== null) {
      combined += sMatch[1]
    }
    if (!combined) combined = text.replace(/<[^>]+>/g, '')
    combined = decodeEntities(combined).trim()
    if (combined) segments.push(combined)
  }

  // Fallback: old format <text start="..." dur="...">text</text>
  if (segments.length === 0) {
    const textRegex = /<text start="[^"]*" dur="[^"]*">([^<]*)<\/text>/g
    while ((match = textRegex.exec(xml)) !== null) {
      const text = decodeEntities(match[1]).trim()
      if (text) segments.push(text)
    }
  }

  return segments.join(' ')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

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

  const videoId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1]

  if (!videoId) {
    return Response.json(
      { error: 'Invalid YouTube URL. Use youtube.com/watch?v= or youtu.be/ format.' },
      { status: 422 }
    )
  }

  // Try InnerTube API first, then fall back to web page scraping
  const text = await extractViaInnerTube(videoId) ?? await extractViaWebPage(videoId)

  if (!text || text.trim().length < 10) {
    return Response.json(
      {
        error:
          'Could not extract transcript. This video may have transcripts disabled. Switch to the Paste Text tab to add the transcript manually.',
      },
      { status: 422 }
    )
  }

  return Response.json({ text: text.slice(0, 80000) })
}
