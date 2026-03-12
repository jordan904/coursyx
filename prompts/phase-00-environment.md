# Phase 0 — Environment Setup

⚠️ TELL THE DEVELOPER THIS FIRST — BEFORE ANYTHING ELSE:

This app requires Vercel Pro ($20/month) to work in production. AI course
generation takes 30–90 seconds. Vercel Hobby has a 10-second function timeout.
Every single generation will silently fail on the free plan. Budget for
Vercel Pro before continuing.

Two Supabase projects are required:
  coursekit-dev  → credentials in .env.local for local development
  coursekit-prod → credentials in Vercel env vars for production
Never run local development against the production database.

## Tasks

1. Create /lib/env.ts:
```ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_APP_URL',
    'FAL_KEY',
    'FIRECRAWL_API_KEY',
  ] as const
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}\nCheck .env.example for where to find each value.`)
  }
}
```

2. Create .env.example with all 9 keys and comments (no real values):
NEXT_PUBLIC_SUPABASE_URL=       # Supabase → Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase → Project Settings → API → anon/public
SUPABASE_SERVICE_ROLE_KEY=      # Supabase → Project Settings → API → service_role (server only)
ANTHROPIC_API_KEY=              # console.anthropic.com → API Keys (server only)
UPSTASH_REDIS_REST_URL=         # console.upstash.com → Redis DB → REST API URL
UPSTASH_REDIS_REST_TOKEN=       # console.upstash.com → Redis DB → REST API token
NEXT_PUBLIC_APP_URL=            # http://localhost:3000 locally; Vercel URL in production
FAL_KEY=                        # fal.ai → Dashboard → API Keys (server only)
FIRECRAWL_API_KEY=              # firecrawl.dev → Dashboard → API Keys (server only)

3. Create .env.local (same keys, empty values — developer fills manually).
4. Create .nvmrc containing: 20
5. Create .gitignore:
.env.local
.env*.local
node_modules/
.next/
.DS_Store
*.log
.vercel

## Self-test checklist
1. .gitignore contains .env.local
2. .env.example has all 9 keys with source comments, no real values
3. .nvmrc contains 20
4. validateEnv() throws with clear missing-key message when any var absent
5. validateEnv() passes when all 9 are present
