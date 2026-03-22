import Stripe from 'stripe'

// Server-only. Import only from /app/api/** routes.
// Lazy singleton to avoid crashing during Next.js build phase
// when env vars are not yet available.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  }
  return _stripe
}

// Price ID allowlist: only these can be passed to checkout
export function getValidPriceIds(): string[] {
  return [
    process.env.STRIPE_PRICE_PRO_MONTHLY!,
    process.env.STRIPE_PRICE_PRO_ANNUAL!,
    process.env.STRIPE_PRICE_MAX_MONTHLY!,
    process.env.STRIPE_PRICE_MAX_ANNUAL!,
    process.env.STRIPE_PRICE_PAY_PER_COURSE!,
  ].filter(Boolean)
}

export function isSubscriptionPrice(priceId: string): boolean {
  return [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_ANNUAL,
    process.env.STRIPE_PRICE_MAX_MONTHLY,
    process.env.STRIPE_PRICE_MAX_ANNUAL,
  ].includes(priceId)
}

export function planFromPriceId(priceId: string): 'pro' | 'max' | null {
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'pro'
  }
  if (
    priceId === process.env.STRIPE_PRICE_MAX_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_MAX_ANNUAL
  ) {
    return 'max'
  }
  return null
}
