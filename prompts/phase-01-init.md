# Phase 1 — Project Initialization

Phase 0 complete: env files, validateEnv, .nvmrc, .gitignore done.

## Tasks

1. Initialize Next.js 14:
   npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no
   Add to tsconfig.json: "strict": true
   Add to package.json: "engines": { "node": ">=20.0.0" }

2. Install all dependencies in one command:
   npm install @supabase/ssr @supabase/supabase-js ai @ai-sdk/anthropic unpdf jsonrepair @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @upstash/ratelimit @upstash/redis zod react-hot-toast file-type react-dropzone @fal-ai/client @mendable/firecrawl-js youtube-transcript

   PACKAGE NAMES ARE EXACT:
   - jsonrepair NOT json-repair
   - All three @dnd-kit packages required
   - @fal-ai/client NOT @fal-ai/serverless

3. Initialize shadcn/ui:
   npx shadcn@latest init (New York style, neutral base, yes to CSS variables)
   npx shadcn@latest add button input label textarea card dialog alert-dialog badge tabs

4. Build app/layout.tsx:
   - Instrument_Serif and DM_Sans from next/font/google
   - import type { Metadata } from 'next'
   - validateEnv() called at module level (not inside component)
   - <Toaster /> from react-hot-toast inside <body> (see CLAUDE.md for exact config)
   - Full metadata: title, description, metadataBase, openGraph

5. Override all CSS variables in globals.css (see CLAUDE.md design system).

6. Create next.config.js with all 5 security headers (see CLAUDE.md).
   img-src MUST include https://*.fal.media and https://*.fal.run
   connect-src MUST include https://queue.fal.run and https://fal.run and wss://*.supabase.co

7. Create public/favicon.svg — simple dark SVG, "CK" in #E8622A.

8. Build app/page.tsx — asymmetric dark editorial landing page:
   - Staggered fade-up animation, 80ms delay increments
   - Instrument Serif h1: "Turn your knowledge into a Skool course in minutes"
   - DM Sans subheadline: "Upload a PDF, drop a YouTube link, or paste your notes. Get a complete Skool Classroom with modules, quizzes, video scripts, and a cover image — ready to paste in under two minutes."
   - "Start Building Free" CTA → /signup (--accent, 6px radius)
   - Five feature callouts: "Upload anything" / "Built for Skool" / "Copy and paste ready" / "AI cover images" / "Quiz and script generator"

## Self-test checklist
1. npm run dev starts at localhost:3000 with zero console errors
2. h1 font-family is Instrument Serif (not Inter)
3. DevTools Network shows X-Frame-Options: DENY header on any page
4. CTA button computed background-color is rgb(232, 98, 42)
5. Stagger animation plays on first load
6. No Inter, Roboto, or system-ui fonts appear anywhere
7. Remove one env var from .env.local → server throws with clear error message
8. <Toaster /> container exists in DOM (inspect body)
