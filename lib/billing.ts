import { supabaseAdmin } from '@/lib/supabase/admin'

// Server-only. Import only from /app/api/** routes.

type PlanLimits = {
  monthlyLimit: number | null  // null = use lifetime limit instead
  lifetimeLimit: number | null // null = use monthly limit instead
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { monthlyLimit: null, lifetimeLimit: 2 },
  pro:  { monthlyLimit: 15,   lifetimeLimit: null },
  max:  { monthlyLimit: 50,   lifetimeLimit: null },
}

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan: 'free' | 'pro' | 'max'
  status: string
  current_period_start: string | null
  current_period_end: string | null
  monthly_course_count: number
  lifetime_course_count: number
  course_credits: number
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as Subscription | null
}

// Returns the effective plan. If subscription is not active/trialing, treat as free
function effectivePlan(sub: Subscription | null): string {
  if (!sub) return 'free'
  if (['active', 'trialing'].includes(sub.status)) return sub.plan
  return 'free'
}

export async function checkCourseCreationAllowed(userId: string): Promise<{
  allowed: boolean
  error?: string
  usingCredit?: boolean
}> {
  const sub = await getSubscription(userId)
  const plan = effectivePlan(sub)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  if (limits.lifetimeLimit !== null) {
    // Free plan: check lifetime count
    const used = sub?.lifetime_course_count ?? 0
    if (used < limits.lifetimeLimit) {
      return { allowed: true }
    }
    // Over lifetime limit: check credits
    if (sub && sub.course_credits > 0) {
      return { allowed: true, usingCredit: true }
    }
    return {
      allowed: false,
      error: `You've reached the free plan limit of ${limits.lifetimeLimit} courses. Upgrade to Pro or buy a single course to continue.`,
    }
  }

  if (limits.monthlyLimit !== null) {
    // Pro/Max: check monthly count
    const used = sub?.monthly_course_count ?? 0
    if (used < limits.monthlyLimit) {
      return { allowed: true }
    }
    // Over monthly limit: check credits
    if (sub && sub.course_credits > 0) {
      return { allowed: true, usingCredit: true }
    }
    return {
      allowed: false,
      error: `You've used all ${limits.monthlyLimit} courses this month. ${plan === 'pro' ? 'Upgrade to Max for 50/month or buy a single course.' : 'Buy additional courses at $15 each.'}`,
    }
  }

  return { allowed: true }
}

export async function incrementCourseUsage(userId: string, usingCredit: boolean): Promise<void> {
  const sub = await getSubscription(userId)
  if (!sub) return

  if (usingCredit) {
    // Consume a credit. Don't increment monthly/lifetime counts
    await supabaseAdmin
      .from('subscriptions')
      .update({ course_credits: Math.max(0, sub.course_credits - 1) })
      .eq('user_id', userId)
  } else {
    // Increment both monthly and lifetime counters
    await supabaseAdmin
      .from('subscriptions')
      .update({
        monthly_course_count: sub.monthly_course_count + 1,
        lifetime_course_count: sub.lifetime_course_count + 1,
      })
      .eq('user_id', userId)
  }
}

export async function checkCoverImageAllowed(courseId: string): Promise<{
  allowed: boolean
  count: number
  error?: string
}> {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('cover_image_count')
    .eq('id', courseId)
    .single()

  const count = data?.cover_image_count ?? 0

  if (count >= 3) {
    return {
      allowed: false,
      count,
      error: 'This course has used all 3 cover image generations.',
    }
  }

  return { allowed: true, count }
}

export async function incrementCoverImageCount(courseId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('cover_image_count')
    .eq('id', courseId)
    .single()

  const current = data?.cover_image_count ?? 0

  await supabaseAdmin
    .from('courses')
    .update({ cover_image_count: current + 1 })
    .eq('id', courseId)
}
