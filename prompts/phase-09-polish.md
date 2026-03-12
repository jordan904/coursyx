# Phase 9 — Polish, Audits, and Bug Fixes

Phase 8 complete: all features working end to end.

## Tasks

1. Spawn three parallel audit agents simultaneously:
   - security-auditor
   - a11y-auditor
   - content-enrichment-auditor
   Fix every FAIL. Re-run all three to confirm zero failures.

2. Loading skeletons:
   /app/(dashboard)/dashboard/loading.tsx: 6 CourseCardSkeleton, animate-pulse shimmer
   /app/(dashboard)/course/[id]/loading.tsx: sidebar + main panel skeleton

3. Error pages:
   /app/error.tsx ('use client'): Instrument Serif "Something went wrong" + reset + dashboard link
   /app/not-found.tsx: "Page not found" + dashboard link

4. Toast error messages for all client fetch calls:
   Network failure: "Connection error. Check your internet."
   429: "You've hit the limit. Try again in an hour."
   500: "Something went wrong. We're looking into it."
   422: show specific message from API response

5. Responsive check at 375px, 768px, 1280px, 1440px. Fix any issues.

6. Performance: next/image for all images, no unused imports, zero console.log.

7. Final end-to-end flow via phase-tester:
   Sign up → new course → upload PDF → generate outline → edit outline →
   generate course → edit lesson → expand lesson → generate cover image →
   generate quiz → refresh → quiz still present → generate script →
   refresh → script still present → copy for Skool → download .txt

## Self-test checklist
1. All three audits return zero FAIL items
2. Loading skeletons visible during fetch
3. Network error → user-friendly toast
4. Enrichment content (quiz/script/post) persists across page refreshes
5. Cover image persists (public URL, never expires)
6. Zero console.log in any file
7. Full end-to-end flow works without errors
8. Another user's course → cannot access
