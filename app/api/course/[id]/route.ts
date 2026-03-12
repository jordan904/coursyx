import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  target_audience: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  language: z.string().max(50).optional(),
  status: z.enum(['draft', 'outline', 'generating', 'complete', 'failed']).optional(),
  generated_json: z.any().optional(),
  outline_json: z.any().optional(),
  cover_image_url: z.string().url().nullable().optional(),
})

function isValidUUID(id: string): boolean {
  return /^[0-9a-f-]{36}$/.test(id)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidUUID(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !course) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (course.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json(course)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidUUID(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Verify ownership
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!course) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (course.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error } = await supabaseAdmin
    .from('courses')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH /api/course/[id]]', error)
    return Response.json({ error: 'Failed to update course' }, { status: 500 })
  }

  return Response.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidUUID(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!course) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (course.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete associated storage files
  try {
    const { data: materials } = await supabaseAdmin.storage
      .from('course-materials')
      .list(`${user.id}/${id}`)

    if (materials && materials.length > 0) {
      const paths = materials.map((f) => `${user.id}/${id}/${f.name}`)
      await supabaseAdmin.storage.from('course-materials').remove(paths)
    }

    const { data: covers } = await supabaseAdmin.storage
      .from('course-covers')
      .list(`${user.id}/${id}`)

    if (covers && covers.length > 0) {
      const paths = covers.map((f) => `${user.id}/${id}/${f.name}`)
      await supabaseAdmin.storage.from('course-covers').remove(paths)
    }
  } catch (err) {
    console.error('[DELETE /api/course/[id]] storage cleanup error:', err)
    // Continue with course deletion even if storage cleanup fails
  }

  const { error } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/course/[id]]', error)
    return Response.json({ error: 'Failed to delete course' }, { status: 500 })
  }

  return Response.json({ success: true })
}
