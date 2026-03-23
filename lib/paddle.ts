import { Environment, Paddle } from '@paddle/paddle-node-sdk'

let _paddle: Paddle | null = null

export function getPaddle(): Paddle {
  if (!_paddle) {
    _paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: process.env.PADDLE_ENV === 'sandbox' ? Environment.sandbox : Environment.production,
    })
  }
  return _paddle
}

export function planFromPriceId(priceId: string): 'pro' | 'max' | null {
  const proIds = ['pri_01kmc1h3qb8kprdzkmpt5creb1', 'pri_01kmc1m4xrszz9avev78mcstt4']
  const maxIds = ['pri_01kmc1pem42a5f09hgyvm82z04', 'pri_01kmc1qze7tj1v72xq7xccrwq3']
  if (proIds.includes(priceId)) return 'pro'
  if (maxIds.includes(priceId)) return 'max'
  return null
}

export function isPayPerCourse(priceId: string): boolean {
  return priceId === 'pri_01kmc1ryjv7wzddhs6w83vw4mb'
}
