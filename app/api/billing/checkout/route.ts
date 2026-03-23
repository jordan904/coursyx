import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  plan: z.enum(['pro_monthly', 'pro_annual', 'max_monthly', 'max_annual', 'pay_per_course']),
})

const PRICE_MAP: Record<string, string> = {
  pro_monthly: 'pri_01kmc1h3qb8kprdzkmpt5creb1',
  pro_annual: 'pri_01kmc1m4xrszz9avev78mcstt4',
  max_monthly: 'pri_01kmc1pem42a5f09hgyvm82z04',
  max_annual: 'pri_01kmc1qze7tj1v72xq7xccrwq3',
  pay_per_course: 'pri_01kmc1ryjv7wzddhs6w83vw4mb',
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.PADDLE_API_KEY) {
    return Response.json({ error: 'Billing is not available yet. Check back soon.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const priceId = PRICE_MAP[parsed.data.plan]
  if (!priceId) {
    return Response.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  // Return price ID and user email for client-side Paddle.js checkout
  return Response.json({
    priceId,
    email: user.email,
    userId: user.id,
  })
}
