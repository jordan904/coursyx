export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ] as const

  // These are optional — features degrade gracefully without them
  const optional = [
    'NEXT_PUBLIC_APP_URL',
    'FAL_KEY',
    'FIRECRAWL_API_KEY',
  ] as const

  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}\nCheck .env.example for where to find each value.`)
  }

  const missingOptional = optional.filter(key => !process.env[key])
  if (missingOptional.length > 0) {
    console.warn(`[env] Optional variables not set: ${missingOptional.join(', ')}. Related features will be unavailable.`)
  }
}
