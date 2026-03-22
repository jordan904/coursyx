import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Billing is not available yet. Check back soon.' }, { status: 503 })
  }

  if (!sub?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found.' }, { status: 404 })
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    })
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/billing/portal]', err)
    return Response.json({ error: 'Failed to create portal session.' }, { status: 500 })
  }
}
