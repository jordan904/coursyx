# Phase 4 — Multi-Source Intake

Phase 2 complete. This phase runs PARALLEL with Phase 3. Zero file overlap.

Owns: /app/(dashboard)/course/new/**,
      /app/api/parse-document/route.ts,
      /app/api/extract-youtube/route.ts,
      /app/api/scrape-url/route.ts

## Tasks

1. Build /app/(dashboard)/course/new/page.tsx ('use client'):

   STEP 1 — Course details:
   - Step indicator: "Step 1 of 2" with aria-current
   - Instrument Serif h1: "Build a new Skool course"
   - Title input + label (Zod: min(1).max(200))
   - Target audience input + label
   - Language selector dropdown: English, Spanish, French, German, Portuguese, Japanese, Chinese (default: English)
   - Inline Zod errors below each field
   - "Continue" button → Step 2

   STEP 2 — Source material (shadcn Tabs, 4 tabs):

   Tab 1: "PDF Upload"
   - react-dropzone, accept PDF only, maxFiles 3, maxSize 10MB per file
   - onDropRejected → toast.error for file-too-large and file-invalid-type
   - Accepted files shown as chips: filename + X to remove

   Tab 2: "YouTube Video"
   - URL input with label
   - "Extract Transcript" button → POST /api/extract-youtube
   - Success: "✓ Extracted 4,200 characters" in green
   - Error: toast.error with the message from the API
   - IMPORTANT: on error, do NOT clear rawContent state. Other sources are still saved.
     The toast message from the API already tells users to use the Paste Text tab.

   Tab 3: "Website URL"
   - URL input with label
   - "Scrape Content" button → POST /api/scrape-url
   - Success: "✓ Extracted 6,800 characters" in green
   - Error: toast.error
   - IMPORTANT: on error, do NOT clear rawContent state.

   Tab 4: "Paste Text"
   - Large textarea (min-height 200px)
   - Character counter below (max 80,000)

   Shared rawContent state: all sources concatenate with "\n\n"
   On single source failure: only that source's contribution is absent.
   Other sources already added to rawContent are preserved.
   Total character count shown: "Total: 11,000 / 80,000 characters"

   "Generate Outline" accent button (disabled during loading, shows spinner):
   a. supabaseClient.from('courses').insert({title, target_audience, language, status:'draft'}).select('id').single()
   b. For each PDF: POST /api/parse-document with FormData {file, courseId}
      On error: toast.error(data.error) — do NOT return early, continue with other sources
   c. Concatenate all text with "\n\n"
   d. supabaseClient.from('courses').update({raw_content: combined}).eq('id', courseId)
   e. router.push('/course/' + courseId + '/outline')

2. Create /app/api/parse-document/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Get file + courseId from formData.
   Server-side size check → 413 if >10MB.
   Dynamic import file-type, magic byte check → 415 if not application/pdf.
   unpdf two-step extraction (see CLAUDE.md).
   Scanned PDF check: if text.trim().length < 50 → return 422.
   Return { text }.

3. Create /app/api/extract-youtube/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { url: z.string().url() }
   Use youtube-transcript pattern from CLAUDE.md (with try/catch fallback).
   Return { text } or 422 with message mentioning Paste Text tab fallback.

4. Create /app/api/scrape-url/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { url: z.string().url() }
   SSRF validation (see CLAUDE.md URL validation — raw IPs and localhost blocked).
   Firecrawl pattern from CLAUDE.md.
   Return { text } or 422.

## Self-test checklist
1. Upload real multi-page text PDF → extracted text non-empty
2. Rename .exe to .pdf → server returns 415
3. Upload file >10MB → client blocks, curl returns 413
4. Valid YouTube URL with transcript → success, char count shown
5. YouTube URL without transcript → toast error shown, rawContent unchanged
6. After YouTube failure → other tab content still in rawContent state
7. Website URL → scraped content shown with char count
8. localhost URL → server returns 400
9. Raw IP address URL (e.g. http://1.2.3.4) → server returns 400
10. Paste text only → works without PDF or URL
11. All 4 sources combined → rawContent concatenates all with double newline
12. Course row created with status 'draft' and correct language
