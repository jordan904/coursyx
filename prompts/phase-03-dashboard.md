# Phase 3 — Dashboard

Phase 2 complete. This phase runs PARALLEL with Phase 4. Zero file overlap.

Owns: /app/(dashboard)/dashboard/**, /components/dashboard/**,
      /app/api/course/[id]/route.ts, /app/api/course/[id]/duplicate/route.ts

## Tasks

1. Build /app/(dashboard)/dashboard/page.tsx (server component):
   Fetch all courses for current user ordered by created_at desc.
   Render: <DashboardHeader /> + <CourseGrid courses={courses} />

2. Create /components/dashboard/dashboard-header.tsx:
   - Course Kit wordmark (Instrument Serif)
   - "New Course" button → /course/new (--accent)
   - Sign out button → POST /api/auth/signout

3. Create /components/dashboard/course-grid.tsx ('use client'):
   - 3-col desktop / 2-col tablet / 1-col mobile grid
   - Map courses to <CourseCard /> components
   - Empty state: Instrument Serif "No courses yet" + "Build your first course" → /course/new
   - Stuck generation recovery: if course.status === 'generating' AND
     Date.now() - new Date(course.status_updated_at).getTime() > 10 * 60 * 1000,
     render badge as 'failed' visually with "Try Again" link → /course/[id]/generating

4. Create /components/dashboard/course-card.tsx:
   - If course.cover_image_url: show as header image (aspect-ratio: 16/9, object-fit: cover)
   - If no cover image: gradient placeholder using --accent and --card
   - Course title in Instrument Serif
   - Status badge: draft (--muted), outline (blue), generating (amber + pulse),
     complete (green), failed (red)
   - "Edit" button → /course/[id]
   - Duplicate icon button → POST /api/course/[id]/duplicate
   - Delete icon button → AlertDialog confirmation → DELETE /api/course/[id]

5. Create /app/api/course/[id]/route.ts:
   UUID-validate params.id → 404 if invalid
   GET: fetch course, verify ownership → return course JSON
   PATCH: accept title, target_audience, description, language, status,
          generated_json, outline_json, cover_image_url — update course row
   DELETE: delete course row + all associated storage files via supabaseAdmin

6. Create /app/api/course/[id]/duplicate/route.ts:
   POST: verify auth, fetch original, verify ownership.
   Insert new row: same fields, new id, title + " (Copy)", status: 'draft',
   cover_image_url: null, outline_json: null, generated_json: null.
   Return { id: newCourse.id }.

## Self-test checklist
1. Dashboard shows all courses for current user
2. Cover image renders if present; gradient placeholder if not
3. Status badge shows correct color for each status value
4. Delete → AlertDialog → confirm → course removed from grid
5. Duplicate creates new card with "(Copy)" suffix, status: draft
6. Sign out → redirects to landing page
7. Another user's courses are not visible (RLS)
8. Stale generating course (>10 min) shows as failed with Try Again
