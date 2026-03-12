# Phase 6 — AI Engine — Full Course Streaming

Phase 5 complete: outline generation and approval working.

## Tasks

1. Create /app/api/generate-course/route.ts using the custom ReadableStream
   pattern from CLAUDE.md:

   export const maxDuration = 60
   Verify auth → 401.
   Zod: { courseId: z.string().uuid() }
   Fetch course server-side via supabaseAdmin.
   Verify ownership → 403.
   Verify outline_json is not null → 400 ("Generate an outline first.").
   Upstash rate limit: 5 per user.id per hour → 429.
   Sanitize inputs. Set status to 'generating'.
   Use COURSE_SYSTEM_PROMPT with cacheControl.
   User message must include BOTH outline_json AND raw_content.

   Custom ReadableStream (see CLAUDE.md pattern):
   - Stream, accumulate
   - Extract JSON: const jsonMatch = accumulated.match(/\[[\s\S]*\]/)
   - jsonrepair → JSON.parse
   - On success: save generated_json (base fields only, no enrichment), set 'complete', send __DONE__
   - On failure: set 'failed', send __FAILED__

2. Build /app/(dashboard)/course/[id]/generating/page.tsx ('use client'):
   - On mount: fetch POST /api/generate-course with { courseId: params.id }
   - Read stream — strip __DONE__/__FAILED__ from display (same pattern as Phase 5)
   - After signal received: poll Supabase up to 120 × 600ms
     On 'complete' → router.push('/course/' + params.id)
     On 'failed' → show error state
     After 120 polls → show "Taking longer than expected" with dashboard link
   - Handle 429 specifically
   - Loading: "Building your full course...", pulse, chars counter

## Self-test checklist
1. Full call completes, generated_json saved with correct base schema
   (module_title, learning_outcomes, lessons — no enrichment fields yet)
2. Status: outline → generating → complete
3. __DONE__ signal not visible in chars counter or UI
4. Manually corrupt JSON → jsonrepair + regex extraction handles it
5. Missing outline_json → 400 returned
6. 6th request in 1 hour → 429
7. Prompt injection in PDF → valid course JSON output
8. Page navigates to /course/[id] after completion
9. Poll count is 120 in source code (grep confirms)
