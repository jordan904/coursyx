import Stripe from 'stripe'
import { getStripe, planFromPriceId } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const maxDuration = 30

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break

      default:
        break
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err)
    return Response.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return Response.json({ received: true })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// The Stripe SDK types changed in recent versions — subscription period fields
// may live at different levels. Use any-typed access for safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSubscriptionPeriod(sub: any): { start: string; end: string } {
  const startTs = sub.current_period_start ?? sub.start_date
  const endTs = sub.current_period_end ?? sub.ended_at
  return {
    start: startTs ? new Date(startTs * 1000).toISOString() : new Date().toISOString(),
    end: endTs ? new Date(endTs * 1000).toISOString() : new Date().toISOString(),
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string

  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription as string
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subAny = subscription as any
    const priceId = subAny.items?.data?.[0]?.price?.id ?? subscription.items.data[0]?.price?.id
    const plan = priceId ? planFromPriceId(priceId) : null

    if (!plan) {
      console.error('[webhook] Could not determine plan from price:', priceId)
      return
    }

    const userId = subAny.metadata?.user_id || session.metadata?.user_id
    if (!userId) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!sub) {
        console.error('[webhook] No user found for customer:', customerId)
        return
      }
    }

    const period = getSubscriptionPeriod(subAny)

    await supabaseAdmin
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscriptionId,
        plan,
        status: 'active',
        current_period_start: period.start,
        current_period_end: period.end,
        monthly_course_count: 0,
      })
      .eq('stripe_customer_id', customerId)
  } else if (session.mode === 'payment') {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('course_credits')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!sub) {
      console.error('[webhook] No subscription row for customer:', customerId)
      return
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({ course_credits: sub.course_credits + 1 })
      .eq('stripe_customer_id', customerId)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any) {
  const customerId = (typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id) as string
  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = priceId ? planFromPriceId(priceId) : null
  const period = getSubscriptionPeriod(subscription)

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('current_period_start')
    .eq('stripe_customer_id', customerId)
    .single()

  const isPeriodRollover = existing?.current_period_start
    ? new Date(period.start) > new Date(existing.current_period_start)
    : false

  const updateData: Record<string, unknown> = {
    status: subscription.status,
    current_period_start: period.start,
    current_period_end: period.end,
  }

  if (plan) {
    updateData.plan = plan
  }

  if (isPeriodRollover) {
    updateData.monthly_course_count = 0
  }

  await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_customer_id', customerId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = (typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id) as string

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
async function handleInvoicePaymentSucceeded(invoice: any) {
  const customerId = (typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id) as string
  const subscriptionId = (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id) as string

  if (!subscriptionId) return

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const period = getSubscriptionPeriod(subscription as any)

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('current_period_start')
    .eq('stripe_customer_id', customerId)
    .single()

  const isPeriodRollover = existing?.current_period_start
    ? new Date(period.start) > new Date(existing.current_period_start)
    : false

  const updateData: Record<string, unknown> = {
    status: 'active',
    current_period_start: period.start,
    current_period_end: period.end,
  }

  if (isPeriodRollover) {
    updateData.monthly_course_count = 0
  }

  await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_customer_id', customerId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = (typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id) as string

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId)
}
