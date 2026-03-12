# Phase 10 — Production Deployment

Phase 9 complete: all audits pass, zero known bugs.

## Tasks

1. npx tsc --noEmit — zero errors required. Fix root causes, never @ts-ignore.

2. npm run build — zero errors and zero warnings. Never eslint-disable.

3. Create vercel.json:
   {
     "framework": "nextjs",
     "buildCommand": "next build",
     "devCommand": "next dev",
     "installCommand": "npm install",
     "functions": {
       "app/api/generate-outline/route.ts":         { "maxDuration": 60 },
       "app/api/generate-course/route.ts":          { "maxDuration": 60 },
       "app/api/generate-cover-image/route.ts":     { "maxDuration": 60 },
       "app/api/expand-lesson/route.ts":            { "maxDuration": 60 },
       "app/api/parse-document/route.ts":           { "maxDuration": 60 },
       "app/api/extract-youtube/route.ts":          { "maxDuration": 60 },
       "app/api/scrape-url/route.ts":               { "maxDuration": 60 }
     }
   }

4. Set all 9 env vars in Vercel using coursekit-prod credentials:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
   NEXT_PUBLIC_APP_URL (set to Vercel production URL),
   FAL_KEY, FIRECRAWL_API_KEY

5. Run database schema SQL in production Supabase. Create both buckets.
   course-covers must be PUBLIC in production.

6. git push → Vercel auto-deploys.

7. Post-deploy verification:
   a. Landing page loads with correct fonts and accent color
   b. Sign up → redirect to /course/new
   c. Upload PDF → text extracted
   d. Generate outline → editor renders
   e. Generate full course → editor loads
   f. Generate cover image → public URL loads in sidebar
   g. Refresh → cover image still visible
   h. Generate quiz → refresh → quiz still present
   i. Copy for Skool → no garbled characters
   j. securityheaders.com → A or A+

8. Update Phase Status Log: mark all phases complete, record production URL.

## Self-test checklist
1. npx tsc --noEmit exits code 0
2. npm run build exits code 0
3. All 9 env vars in Vercel
4. course-covers bucket is PUBLIC in production
5. Full end-to-end flow in production (not just local)
6. Generation completes without timeout (Vercel Pro confirmed)
7. securityheaders.com A or A+
8. Quiz/script/post persist after page refresh in production
9. Cover image loads in production (public URL)
