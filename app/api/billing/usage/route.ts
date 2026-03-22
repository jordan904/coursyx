import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/billing'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sub = await getSubscription(user.id)

  if (!sub) {
    return Response.json({
      plan: 'free',
      status: 'active',
      monthlyLimit: null,
      lifetimeLimit: 2,
      monthlyUsed: 0,
      lifetimeUsed: 0,
      credits: 0,
      currentPeriodEnd: null,
    })
  }

  const effectivePlan = ['active', 'trialing'].includes(sub.status) ? sub.plan : 'free'

  const limits: Record<string, { monthlyLimit: number | null; lifetimeLimit: number | null }> = {
    free: { monthlyLimit: null, lifetimeLimit: 2 },
    pro: { monthlyLimit: 15, lifetimeLimit: null },
    max: { monthlyLimit: 50, lifetimeLimit: null },
  }

  const planLimits = limits[effectivePlan] ?? limits.free

  return Response.json({
    plan: effectivePlan,
    status: sub.status,
    monthlyLimit: planLimits.monthlyLimit,
    lifetimeLimit: planLimits.lifetimeLimit,
    monthlyUsed: sub.monthly_course_count,
    lifetimeUsed: sub.lifetime_course_count,
    credits: sub.course_credits,
    currentPeriodEnd: sub.current_period_end,
  })
}
