export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Auth check
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const file = formData.get('file')
  const courseId = formData.get('courseId')

  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!courseId || typeof courseId !== 'string') {
    return Response.json({ error: 'Missing course ID.' }, { status: 400 })
  }

  // UUID validate courseId
  if (!/^[0-9a-f-]{36}$/.test(courseId)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  // Server-side size check
  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > 10 * 1024 * 1024) {
    return Response.json(
      { error: 'File too large. Maximum 10MB.' },
      { status: 413 }
    )
  }

  // Magic byte validation with file-type (ESM-only, dynamic import required)
  const { fileTypeFromBuffer } = await import('file-type')
  const type = await fileTypeFromBuffer(buffer)
  if (!type || type.mime !== 'application/pdf') {
    return Response.json(
      { error: 'Invalid file type. Please upload a PDF.' },
      { status: 415 }
    )
  }

  // Extract text with unpdf (two-step pattern)
  try {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })

    // Scanned PDF check
    if (text.trim().length < 50) {
      return Response.json(
        {
          error:
            'This PDF appears to be scanned or image-based. Please use the Paste Text tab to add the content manually.',
        },
        { status: 422 }
      )
    }

    return Response.json({ text })
  } catch (err) {
    console.error('[parse-document] PDF extraction failed:', err)
    return Response.json(
      { error: 'Failed to extract text from PDF.' },
      { status: 500 }
    )
  }
}
