# Phase 5 — AI Outline Generation and Approval

Phases 3 and 4 both complete. All routes and UI confirmed working.

## Tasks

1. Create /app/api/generate-outline/route.ts using the custom ReadableStream
   pattern from CLAUDE.md (not onFinish):

   export const maxDuration = 60
   Verify auth → 401.
   Zod: { courseId: z.string().uuid() }
   Fetch course server-side via supabaseAdmin.
   Verify ownership → 403 on mismatch.
   If raw_content is empty → return 400.
   Upstash rate limit: 10 per user.id per hour → 429.
   Sanitize inputs (see CLAUDE.md).
   Set status to 'outline' before calling API.
   Use OUTLINE_SYSTEM_PROMPT from CLAUDE.md with cacheControl on system message.

   Custom ReadableStream (see CLAUDE.md pattern):
   - Stream text, accumulate
   - Extract JSON with regex: const jsonMatch = accumulated.match(/\[[\s\S]*\]/)
   - const rawJson = jsonMatch ? jsonMatch[0] : accumulated
   - jsonrepair(rawJson) → JSON.parse
   - On success: save outline_json, status stays 'outline', send __DONE__
   - On failure: set status 'failed', send __FAILED__

2. Build /app/(dashboard)/course/[id]/outline/page.tsx ('use client'):
   - On mount: fetch POST /api/generate-outline with { courseId: params.id }
   - Read stream with getReader() — strip __DONE__/__FAILED__ from display:
     ```
     const chunk = new TextDecoder().decode(value)
     if (chunk === '__DONE__' || chunk === '__FAILED__') {
       signal = chunk
     } else {
       accumulated += chunk
       setChars(accumulated.length)
     }
     ```
   - After stream ends: poll Supabase up to 60 × 600ms
     On 'outline': render outline editor
     On 'failed': show error with "Try Again" and "Start Over"
     After 60 polls: show timeout message
   - Handle 429 response
   - Loading state: Instrument Serif "Generating your course outline...", pulse animation

3. Outline editor UI (same page after outline loaded):
   - h1: "Review your course outline"
   - Subheading: "Edit module and lesson titles. Add, remove, or reorder before generating."
   - Editable input per module title (auto-save on blur)
   - Editable input per lesson (indented) + remove icon (min 1 per module)
   - "Add lesson" button under each module
   - dnd-kit drag to reorder modules (aria-roledescription="sortable")
   - "Looks good — Generate Full Course" button (accent):
     IMPORTANT: await the PATCH before navigating to prevent race condition.
     ```ts
     await fetch(`/api/course/${courseId}`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ outline_json: editedOutline })
     })
     router.push('/course/' + courseId + '/generating')
     ```
   - "Start Over" link → router.push('/course/new')

## Self-test checklist
1. Outline streams, __DONE__ received, signal NOT shown in char counter
2. outline_json saved with correct schema: [{module_title, lessons:[string]}]
3. Status: draft → outline (confirmed in DB)
4. All modules and lessons render as editable inputs
5. Edit module title → saves on blur, refresh → persists
6. Add lesson → appears in outline
7. Remove lesson → removed (never below 1)
8. Drag to reorder → order updates
9. "Generate Full Course" awaits PATCH before navigating
10. Empty raw_content → 400 shown to user
11. 11th request in 1 hour → 429 message shown
