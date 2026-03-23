const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.paddle.com https://public.profitwell.com https://www.googletagmanager.com https://www.redditstatic.com https://static.hotjar.com https://t.contentsquare.net https://*.contentsquare.net",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com https://cdn.paddle.com",
      "font-src 'self' fonts.gstatic.com",
      "frame-src 'self' https://buy.paddle.com https://checkout.paddle.com",
      "img-src 'self' data: blob: https://*.fal.media https://*.fal.run https://*.supabase.co https://www.google-analytics.com https://alb.reddit.com https://*.paddle.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://queue.fal.run https://fal.run https://formspree.io https://www.google-analytics.com https://alb.reddit.com https://*.reddit.com https://pixel-config.reddit.com https://*.hotjar.com wss://*.hotjar.com https://*.hotjar.io https://*.contentsquare.net https://*.paddle.com https://*.profitwell.com",
    ].join('; ')
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
