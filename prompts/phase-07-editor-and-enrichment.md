# Phase 7 — Course Editor and Content Enrichment

Phase 6 complete: AI engine, streaming, JSON repair all working.

## Tasks

1. Create /components/shared/error-boundary.tsx ('use client'):
   Class component. getDerivedStateFromError sets hasError:true.
   Instrument Serif "Something went wrong" + reset() button + "Back to Dashboard" link.

2. Build /app/(dashboard)/course/[id]/page.tsx (server component):
   Fetch course via supabaseAdmin, verify ownership → redirect('/dashboard').
   Wrap <CourseEditor course={course} /> in <ErrorBoundary />.

3. Create /components/course/course-editor.tsx ('use client'):

   ENRICHMENT STATE INITIALIZATION:
   On mount, initialize enrichment state from generated_json so that content
   persists across page refreshes:
   ```ts
   const [modules, setModules] = useState(() =>
     (course.generated_json as GeneratedCourse[]) ?? []
   )
   // Initialize enrichment maps from generated_json
   const [quizMap, setQuizMap] = useState<Record<number, QuizQuestion[] | null>>(() => {
     const map: Record<number, QuizQuestion[] | null> = {}
     modules.forEach((m, i) => { map[i] = m.quiz ?? null })
     return map
   })
   const [postMap, setPostMap] = useState<Record<number, string | null>>(() => {
     const map: Record<number, string | null> = {}
     modules.forEach((m, i) => { map[i] = m.discussion_post ?? null })
     return map
   })
   const [scriptMap, setScriptMap] = useState<Record<string, string | null>>(() => {
     const map: Record<string, string | null> = {}
     modules.forEach((m, i) => {
       m.lessons.forEach((l, j) => { map[`${i}-${j}`] = l.script ?? null })
     })
     return map
   })
   ```

   Full state:
   - modules, selectedModule(0), selectedLesson(0), expandedModules(new Set([0]))
   - bodyText, actionText, saveState, showSettings, expanding
   - generatingImage, generatingQuiz, generatingScript, generatingPost
   - scriptModalOpen, activeScript (from scriptMap or newly generated)
   - quizModalOpen, activeQuiz (from quizMap or newly generated)
   - postModalOpen, activePost (from postMap or newly generated)
   - debounceRef, actionDebounceRef
   - quizMap, postMap, scriptMap (initialized from generated_json above)
   courseId = course.id (always from props)

   When user clicks "Generate Quiz" for module i:
   - If quizMap[i] is already set, open the modal with existing quiz (no API call)
   - Add "Regenerate" button inside the modal to force a new generation
   - On generation: update quizMap[i] with new quiz, also saves to DB (see route below)

   Same pattern for "Generate Discussion Post" (postMap) and "Generate Video Script" (scriptMap).

   SIDEBAR:
   - Course title (Instrument Serif, truncated)
   - Cover image: show course.cover_image_url if present, gradient placeholder if not
     "Generate Cover Image" button → POST /api/generate-cover-image
   - DndContext + SortableContext for modules
   - SortableModuleItem per module
   - Settings gear → setShowSettings(true)

   MAIN PANEL:
   - Breadcrumb, save indicator, "Copy for Skool" button
   - Lesson title h1, body textarea (2s debounce), expand button
   - Action item input (2s debounce)
   - Divider
   - "Generate Video Script" button (shows "Regenerate Script" if already generated)
   - "Generate Quiz" button (shows "Regenerate Quiz" if quizMap has entry)
   - "Generate Discussion Post" button (shows "Regenerate Post" if postMap has entry)
   - Learning outcomes read-only list

   SETTINGS PANEL:
   - Title input (blur → PATCH), target_audience input (blur → PATCH)
   - "Regenerate Course" → AlertDialog → PATCH {status:'draft', generated_json:null, outline_json:null}
     → router.push('/course/'+courseId+'/outline')
   - "Delete Course" → AlertDialog → DELETE → router.push('/dashboard')

   MODALS — Script, Quiz, Discussion Post (same structure as v2.1)

4. Create /app/api/generate-cover-image/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { courseId: z.string().uuid() }
   Fetch course, verify ownership → 403.
   Rate limit: 10 per user per hour.
   Build image prompt from CLAUDE.md template.
   Call fal.ai FLUX Schnell (see CLAUDE.md pattern).
   Download image from temp fal.media URL.
   Upload to Supabase Storage: course-covers/{user.id}/{courseId}/cover.jpg
   Get PUBLIC URL (not signed): supabaseAdmin.storage.from('course-covers').getPublicUrl(path)
   Update courses.cover_image_url with public URL.
   Return { coverImageUrl }.

5. Create /app/api/generate-quiz/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { courseId: z.string().uuid(), moduleIndex: z.number().int().min(0) }
   Fetch course, verify ownership → 403.
   Rate limit: 20 per user per hour.
   Extract module from generated_json[moduleIndex] → 400 if out of bounds.
   Sanitize inputs. Use QUIZ_SYSTEM_PROMPT with generateText.
   Extract JSON with regex, then jsonrepair → JSON.parse.
   SAVE TO DB: deep clone generated_json, set generated_json[moduleIndex].quiz = parsedQuiz,
   PATCH full generated_json back via supabaseAdmin.
   Return { quiz: parsedQuiz }.

6. Create /app/api/generate-video-script/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { courseId: z.string().uuid(), moduleIndex: z.number().int().min(0), lessonIndex: z.number().int().min(0) }
   Fetch course, verify ownership → 403.
   Rate limit: 20 per user per hour.
   Extract lesson. Sanitize. Use SCRIPT_SYSTEM_PROMPT with generateText.
   SAVE TO DB: deep clone generated_json,
   set generated_json[moduleIndex].lessons[lessonIndex].script = scriptText,
   PATCH full generated_json back.
   Return { script: scriptText }.

7. Create /app/api/generate-discussion-post/route.ts:
   export const maxDuration = 60
   Verify auth → 401. Zod: { courseId: z.string().uuid(), moduleIndex: z.number().int().min(0) }
   Fetch course, verify ownership → 403.
   Rate limit: 20 per user per hour.
   Extract module. Use DISCUSSION_SYSTEM_PROMPT with generateText.
   SAVE TO DB: deep clone generated_json,
   set generated_json[moduleIndex].discussion_post = postText,
   PATCH full generated_json back.
   Return { post: postText }.

8. Mobile (< 768px):
   Sidebar hidden. "Modules" button fixed bottom-center → bottom drawer.
   Drag disabled on touch. "Reorder modules on desktop" tooltip.

## Self-test checklist
1. 'use client' in course-editor.tsx
2. Drag reorders sidebar + saves to Supabase
3. Refresh → module order persists
4. Edit body → Saving → Saved → refresh → persists
5. Edit action item → saves independently
6. Cover image: generate → appears in sidebar, public URL stored in DB
7. Refresh → cover image still visible (public URL never expires)
8. Generate Quiz → quiz modal opens, refresh → quiz still present (from generated_json)
9. Generate Video Script → script modal opens, refresh → script still present
10. Generate Discussion Post → post modal opens, refresh → post still present
11. Learning outcomes visible per module
12. Regenerate Course → navigates to outline page
13. Delete Course → navigates to dashboard
14. Mobile: sidebar hidden, Modules button fixed at bottom
15. Another user's course → redirect to /dashboard
