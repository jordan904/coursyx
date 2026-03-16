import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:verify-invite-code',
})

const schema = z.object({
  code: z.string().min(1),
})

export async function POST(request: Request) {
  // Rate limit by IP to prevent brute-force
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Please enter an invite code.' }, { status: 400 })
  }

  const { data: code, error } = await supabaseAdmin
    .from('invite_codes')
    .select('id, used')
    .eq('code', parsed.data.code)
    .single()

  if (error || !code) {
    return Response.json({ valid: false, error: 'Invalid invite code.' }, { status: 200 })
  }

  if (code.used) {
    return Response.json({ valid: false, error: 'This invite code has already been used.' }, { status: 200 })
  }

  return Response.json({ valid: true }, { status: 200 })
}
