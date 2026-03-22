export const maxDuration = 60

import { z } from 'zod'
import FirecrawlApp from '@mendable/firecrawl-js'
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

  const { url: inputUrl } = parsed.data

  // SSRF protection: URL validation
  let parsedUrl: URL
  try {
    parsedUrl = new URL(inputUrl)
  } catch {
    return Response.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return Response.json(
      { error: 'Only HTTP/HTTPS URLs are allowed.' },
      { status: 400 }
    )
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  // Block raw IP addresses entirely
  if (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
    /^[0-9a-f:]+$/.test(hostname)
  ) {
    return Response.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  // Block localhost and known internal hostnames
  const blocklist = ['localhost', '::1']
  if (blocklist.includes(hostname)) {
    return Response.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  try {
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
    const result = await app.scrape(inputUrl, { formats: ['markdown'] })

    if (!result.markdown) {
      return Response.json(
        { error: 'Could not extract content from this URL.' },
        { status: 422 }
      )
    }

    return Response.json({ text: result.markdown.slice(0, 80000) })
  } catch (err) {
    console.error('[scrape-url] Firecrawl error:', err)
    return Response.json(
      { error: 'Could not extract content from this URL.' },
      { status: 422 }
    )
  }
}
