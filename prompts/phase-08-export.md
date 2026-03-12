# Phase 8 — Lesson Expansion and Skool Export

Phase 7 complete: editor with all enrichment features working and persisting.

## Tasks

1. Create /app/api/expand-lesson/route.ts:
   export const maxDuration = 60
   Verify auth → 401.
   Zod: { courseId: z.string().uuid(), moduleIndex: z.number().int().min(0),
          lessonIndex: z.number().int().min(0), lessonBody: z.string().min(1).max(3000) }
   Fetch course, verify ownership → 403.
   Rate limit: 20 per user per hour.
   Sanitize lessonBody. Use EXPAND_SYSTEM_PROMPT with streamText. No cacheControl.
   return result.toTextStreamResponse()
   DO NOT use onFinish. Client handles DB save via separate PATCH.

2. Create /app/api/course/[id]/lesson/route.ts:
   PATCH handler. Verify auth → 401. UUID-validate id → 404.
   Zod: { moduleIndex, lessonIndex, body?: string, action_item?: string }
   Fetch course, verify ownership → 403.
   Deep clone generated_json, update specific field(s), save back.
   Note: this route updates body and action_item only. Scripts are saved via
   generate-video-script route, not this route.
   Return { success: true }.

3. Implement handleExpand in CourseEditor:
   setExpanding(true)
   fetch expand-lesson → read stream → setBodyText per chunk
   After stream: 2s debounce PATCH /api/course/[id]/lesson with { body: accumulated }
   setExpanding(false)

4. Implement handleCopyForSkool in CourseEditor.
   Reads from modules state (which includes enrichment from generated_json).
   Format:

   [MODULE TITLE IN ALL CAPS]
   By the end of this module, you will be able to:
   • [learning outcome 1]
   • [learning outcome 2]

   **[Lesson Title]**
   [Lesson body text]

   ✅ Action Item: [action item text]

   ---

   [Next lesson...]

   📝 MODULE QUIZ
   1. [Question]
      a) [Option A]
      b) [Option B]
      c) [Option C]
      d) [Option D]
      ✓ Correct answer: [letter]) [text]
      💡 [Explanation]

   💬 DISCUSSION PROMPT
   [Post text]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Quiz and Discussion sections only appear if they exist in generated_json.
   On copy: toast.success("Copied! Paste directly into your Skool Classroom.")

5. Add "Download as .txt" button next to "Copy for Skool":
   Client-side only. Blob → anchor click. No API route needed.
   Filename: course-title-slug.txt

## Self-test checklist
1. "Expand This Lesson" streams into textarea in real time
2. Expanded text saves to DB after 2s → refresh → persists
3. "Copy for Skool" copies correctly formatted text
4. Module titles ALL CAPS, lesson titles **bold**, action items with ✅
5. Quiz section appears only if quiz exists in generated_json for that module
6. Discussion post appears only if post exists in generated_json for that module
7. "Download as .txt" triggers file download with correct content
8. Empty lessonBody → Zod returns 400
