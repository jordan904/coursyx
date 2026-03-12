# Phase 2 — Auth and Database

Phase 1 complete: project initialized, design system applied, landing page built.

NOTE: By default Supabase requires email confirmation. For development:
Supabase dashboard → Authentication → Email → turn OFF "Confirm email".
Document whether this is re-enabled for production in the Phase Status Log.

## Tasks

1. Create all four Supabase helper files from CLAUDE.md exact code.

2. Create middleware.ts in project root (see CLAUDE.md exact code).

3. Build /app/(auth)/login/page.tsx:
   - Dark card on --background, Instrument Serif heading
   - shadcn Input + Label for email and password
   - Zod: email format, password min 8 chars
   - Inline field-level errors (not toast)
   - On success → router.push('/dashboard')
   - Link to signup page

4. Build /app/(auth)/signup/page.tsx:
   - Same structure as login
   - On success → router.push('/course/new')
   - Link to login page

5. Create /app/api/auth/signout/route.ts:
   POST → supabase.auth.signOut() → redirect('/')

6. Run the full database schema SQL from CLAUDE.md in the Supabase SQL editor.
   Create both storage buckets:
   - "course-materials" (private)
   - "course-covers" (PUBLIC — cover images are public marketing assets)

## Self-test checklist
1. Signup creates user in Supabase auth.users
2. Login with correct credentials → redirects to /dashboard
3. Login with wrong password → inline error message (no toast)
4. Unauthenticated request to /dashboard → redirects to /login
5. courses table has all columns including cover_image_url and outline_json
6. Status CHECK constraint includes: draft, outline, generating, complete, failed
7. course-covers bucket exists and is PUBLIC
8. course-materials bucket exists and is private
9. RLS policy exists on courses table
