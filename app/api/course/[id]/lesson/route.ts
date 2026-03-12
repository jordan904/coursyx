import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function isValidUUID(id: string): boolean {
  return /^[0-9a-f-]{36}$/.test(id)
}

const patchSchema = z.object({
  moduleIndex: z.number().int().min(0),
  lessonIndex: z.number().int().min(0),
  body: z.string().optional(),
  action_item: z.string().optional(),
})

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

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(rawBody)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { moduleIndex, lessonIndex, body, action_item } = parsed.data

  const { data: course, error: fetchError } = await supabaseAdmin
    .from('courses')
    .select('user_id, generated_json')
    .eq('id', id)
    .single()

  if (fetchError || !course) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (course.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generatedJson = course.generated_json as any[]
  if (!generatedJson || !Array.isArray(generatedJson) || moduleIndex >= generatedJson.length) {
    return Response.json({ error: 'Module not found' }, { status: 400 })
  }

  const courseModule = generatedJson[moduleIndex]
  if (!courseModule.lessons || lessonIndex >= courseModule.lessons.length) {
    return Response.json({ error: 'Lesson not found' }, { status: 400 })
  }

  // Deep clone to avoid mutation
  const updatedJson = JSON.parse(JSON.stringify(generatedJson))

  if (body !== undefined) {
    updatedJson[moduleIndex].lessons[lessonIndex].body = body
  }
  if (action_item !== undefined) {
    updatedJson[moduleIndex].lessons[lessonIndex].action_item = action_item
  }

  const { error: updateError } = await supabaseAdmin
    .from('courses')
    .update({ generated_json: updatedJson })
    .eq('id', id)

  if (updateError) {
    console.error('[PATCH /api/course/[id]/lesson]', updateError)
    return Response.json({ error: 'Failed to update lesson' }, { status: 500 })
  }

  return Response.json({ success: true })
}
