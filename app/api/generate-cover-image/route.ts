import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fal } from '@/lib/fal'

export const maxDuration = 60

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:generate-cover-image',
})

const requestSchema = z.object({
  courseId: z.string().uuid(),
})

export async function POST(request: Request) {
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

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { courseId } = parsed.data

  const { data: course, error: fetchError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (fetchError || !course) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (course.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success: rateLimitOk } = await ratelimit.limit(user.id)
  if (!rateLimitOk) {
    return Response.json({ error: "You've hit the limit. Try again in an hour." }, { status: 429 })
  }

  const safeTitle = (course.title ?? '').replace(/[\n\r]/g, ' ').slice(0, 200)
  const safeAudience = (course.target_audience ?? '').replace(/[\n\r]/g, ' ').slice(0, 500)

  const imagePrompt = `A professional, modern course cover image for a Skool online course.
Course title: "${safeTitle}".
Target audience: ${safeAudience || 'general learners'}.
Style: Clean, editorial, dark background with bold graphic design feel.
Do NOT include any text or words in the image.
Use abstract geometric shapes or relevant conceptual imagery.
High contrast. Suitable for a 16:9 thumbnail. Professional and trustworthy.`.trim()

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultData = result as any
    const tempUrl = resultData?.data?.images?.[0]?.url ?? resultData?.images?.[0]?.url
    if (!tempUrl) {
      console.error('[generate-cover-image] No image URL in fal response')
      return Response.json({ error: 'Image generation failed' }, { status: 500 })
    }

    // Download from temp fal.media URL (expires in hours)
    const imageResponse = await fetch(tempUrl)
    if (!imageResponse.ok) {
      console.error('[generate-cover-image] Failed to download image from fal')
      return Response.json({ error: 'Image download failed' }, { status: 500 })
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    // Upload to Supabase Storage (course-covers is PUBLIC)
    const storagePath = `${user.id}/${courseId}/cover.jpg`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('course-covers')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[generate-cover-image] Upload error:', uploadError)
      return Response.json({ error: 'Image upload failed' }, { status: 500 })
    }

    // Get PUBLIC URL (not signed — course-covers bucket is public)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('course-covers')
      .getPublicUrl(storagePath)

    const coverImageUrl = publicUrlData.publicUrl

    // Update course record
    await supabaseAdmin
      .from('courses')
      .update({ cover_image_url: coverImageUrl })
      .eq('id', courseId)

    return Response.json({ coverImageUrl })
  } catch (err) {
    console.error('[generate-cover-image] Error:', err)
    return Response.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
