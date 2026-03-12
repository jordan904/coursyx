import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function isValidUUID(id: string): boolean {
  return /^[0-9a-f-]{36}$/.test(id)
}

export async function POST(
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

  // Fetch original course
  const { data: original, error: fetchError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (original.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insert duplicate with reset fields
  const { data: newCourse, error: insertError } = await supabaseAdmin
    .from('courses')
    .insert({
      user_id: user.id,
      title: `${original.title} (Copy)`,
      target_audience: original.target_audience,
      language: original.language,
      description: original.description,
      raw_content: original.raw_content,
      status: 'draft',
      cover_image_url: null,
      outline_json: null,
      generated_json: null,
    })
    .select('id')
    .single()

  if (insertError || !newCourse) {
    console.error('[POST /api/course/[id]/duplicate]', insertError)
    return Response.json({ error: 'Failed to duplicate course' }, { status: 500 })
  }

  return Response.json({ id: newCourse.id })
}
