import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { sendWelcomeEmail, sendSignupNotification } from '@/lib/email'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:signup',
})

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  invite_code: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid email, password, or invite code.' }, { status: 400 })
  }

  const { email, password, invite_code } = parsed.data

  // Rate limit by IP since user is not yet authenticated
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  // Verify invite code if provided
  if (invite_code) {
    const { data: code, error: codeError } = await supabaseAdmin
      .from('invite_codes')
      .select('id, used')
      .eq('code', invite_code)
      .single()

    if (codeError || !code) {
      return Response.json({ error: 'Invalid invite code.' }, { status: 403 })
    }

    if (code.used) {
      return Response.json({ error: 'This invite code has already been used.' }, { status: 403 })
    }
  }

  // Create the user via admin API
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (userError) {
    // Don't leak internal errors. Check for common cases
    if (userError.message?.includes('already been registered') || userError.message?.includes('already exists')) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }
    console.error('[signup] User creation failed:', userError)
    return Response.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
  }

  // Mark the invite code as used (if one was provided)
  if (invite_code) {
    await supabaseAdmin
      .from('invite_codes')
      .update({
        used: true,
        used_by: userData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq('code', invite_code)
  }

  // Send emails in background. Don't block the signup response.
  sendWelcomeEmail(email).catch(() => {})
  sendSignupNotification(email).catch(() => {})

  return Response.json({ success: true })
}
