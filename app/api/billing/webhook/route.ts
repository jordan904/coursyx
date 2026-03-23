import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { planFromPriceId, isPayPerCourse } from '@/lib/paddle'

export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Missing signature.' }, { status: 400 })
  }

  // Verify Paddle webhook signature
  if (!verifyPaddleSignature(body, signature, process.env.PADDLE_WEBHOOK_SECRET)) {
    console.error('[webhook] Paddle signature verification failed')
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const eventType = event.event_type
  const data = event.data

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionChange(data)
        break

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data)
        break

      case 'transaction.completed':
        await handleTransactionCompleted(data)
        break

      default:
        break
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${eventType}:`, err)
    return Response.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return Response.json({ received: true })
}

function verifyPaddleSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    // Paddle signature format: ts=TIMESTAMP;h1=HASH
    const parts: Record<string, string> = {}
    signature.split(';').forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) parts[key] = value
    })

    const ts = parts['ts']
    const h1 = parts['h1']
    if (!ts || !h1) return false

    const payload = `${ts}:${rawBody}`
    const computedHash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(computedHash))
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionChange(data: any) {
  const customerId = data.customer_id as string
  const subscriptionId = data.id as string
  const status = data.status as string // active, paused, past_due, canceled, trialing
  const priceId = data.items?.[0]?.price?.id as string
  const plan = priceId ? planFromPriceId(priceId) : null

  const currentPeriodStart = data.current_billing_period?.starts_at ?? null
  const currentPeriodEnd = data.current_billing_period?.ends_at ?? null

  // Check if this is a period rollover
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('current_period_start, user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  const isPeriodRollover = existing?.current_period_start && currentPeriodStart
    ? new Date(currentPeriodStart) > new Date(existing.current_period_start)
    : false

  // Map Paddle status to our status values
  const mappedStatus = mapPaddleStatus(status)

  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscriptionId,
    status: mappedStatus,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
  }

  if (plan) {
    updateData.plan = plan
  }

  if (isPeriodRollover) {
    updateData.monthly_course_count = 0
  }

  if (existing) {
    await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_customer_id', customerId)
  } else {
    // First time seeing this customer. Try to find user by custom_data or create row.
    const userId = data.custom_data?.user_id
    if (userId) {
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: plan || 'free',
          status: mappedStatus,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          monthly_course_count: 0,
          lifetime_course_count: 0,
          course_credits: 0,
        }, { onConflict: 'user_id' })
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(data: any) {
  const customerId = data.customer_id as string

  await supabaseAdmin
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
    })
    .eq('stripe_customer_id', customerId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTransactionCompleted(data: any) {
  const customerId = data.customer_id as string
  const priceId = data.items?.[0]?.price?.id as string

  // Only handle pay-per-course one-time purchases
  if (!isPayPerCourse(priceId)) return

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('course_credits, user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (sub) {
    await supabaseAdmin
      .from('subscriptions')
      .update({ course_credits: sub.course_credits + 1 })
      .eq('stripe_customer_id', customerId)
  } else {
    // Customer exists in Paddle but not in our DB yet
    const userId = data.custom_data?.user_id
    if (userId) {
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          plan: 'free',
          status: 'active',
          course_credits: 1,
          monthly_course_count: 0,
          lifetime_course_count: 0,
        }, { onConflict: 'user_id' })
    }
  }
}

function mapPaddleStatus(paddleStatus: string): string {
  switch (paddleStatus) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'paused': return 'canceled'
    case 'canceled': return 'canceled'
    default: return 'active'
  }
}
