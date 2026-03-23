import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.PADDLE_API_KEY) {
    return Response.json({ error: 'Billing is not available yet. Check back soon.' }, { status: 503 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!sub?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found.' }, { status: 404 })
  }

  // Paddle customer portal URL
  const portalUrl = `https://customer-portal.paddle.com/${sub.stripe_customer_id}`
  return Response.json({ url: portalUrl })
}
