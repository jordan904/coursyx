import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getStripe, getValidPriceIds, isSubscriptionPrice } from '@/lib/stripe'

const requestSchema = z.object({
  priceId: z.string().min(1).optional(),
  plan: z.enum(['pro_monthly', 'pro_annual', 'max_monthly', 'max_annual', 'pay_per_course']).optional(),
}).refine(data => data.priceId || data.plan, { message: 'Either priceId or plan is required' })

function resolvePriceId(plan: string): string | null {
  const map: Record<string, string | undefined> = {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    max_monthly: process.env.STRIPE_PRICE_MAX_MONTHLY,
    max_annual: process.env.STRIPE_PRICE_MAX_ANNUAL,
    pay_per_course: process.env.STRIPE_PRICE_PAY_PER_COURSE,
  }
  return map[plan] ?? null
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
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Stripe not configured yet. Return friendly message
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Billing is not available yet. Check back soon.' }, { status: 503 })
  }

  const priceId = parsed.data.priceId || (parsed.data.plan ? resolvePriceId(parsed.data.plan) : null)

  if (!priceId) {
    return Response.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  // Validate price ID against allowlist
  const validPrices = getValidPriceIds()
  if (!validPrices.includes(priceId)) {
    return Response.json({ error: 'Invalid price.' }, { status: 400 })
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get or create Stripe customer
  let stripeCustomerId: string

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (sub?.stripe_customer_id) {
    stripeCustomerId = sub.stripe_customer_id
  } else {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    stripeCustomerId = customer.id

    // Upsert subscription row with free plan
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' })
  }

  const isSubscription = isSubscriptionPrice(priceId)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=canceled`,
    }

    if (isSubscription) {
      sessionParams.subscription_data = {
        metadata: { user_id: user.id },
      }
    } else {
      sessionParams.payment_intent_data = {
        metadata: { user_id: user.id },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/billing/checkout]', err)
    return Response.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
