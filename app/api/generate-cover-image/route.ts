import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getFal } from '@/lib/fal'

export const maxDuration = 60

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  prefix: 'ratelimit:generate-cover-image',
})

const requestSchema = z.object({
  courseId: z.string().uuid(),
  customPrompt: z.string().max(500).optional(),
})

function buildImagePrompt(title: string, audience: string, custom: string, contentSummary: string): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  // Detect topic category from title + content to choose appropriate visual metaphors
  const combined = `${title} ${contentSummary} ${audience}`.toLowerCase()

  type TopicCategory = {
    keywords: string[]
    metaphors: string[]
    palette: string
  }

  const categories: TopicCategory[] = [
    {
      keywords: ['code', 'programming', 'software', 'developer', 'web', 'app', 'javascript', 'python', 'data', 'ai', 'machine learning', 'tech', 'api', 'database'],
      metaphors: [
        'glowing circuit board pathways forming an intricate network, data streams flowing through nodes',
        'abstract 3D wireframe structures with luminous connection points, floating geometric code blocks',
        'crystalline data structures with light flowing through interconnected transparent nodes',
      ],
      palette: 'deep navy base with electric cyan and teal accents, warm amber highlight points',
    },
    {
      keywords: ['business', 'marketing', 'sales', 'entrepreneur', 'money', 'finance', 'startup', 'growth', 'revenue', 'brand', 'strategy', 'lead'],
      metaphors: [
        'ascending geometric steps made of translucent glass catching golden light, each higher than the last',
        'an abstract upward spiral of golden and dark metallic ribbons, suggesting momentum and growth',
        'interlocking gears and arrows in a dynamic composition, precision and forward motion',
      ],
      palette: 'charcoal and deep black base, gold and amber accents, warm directional side lighting',
    },
    {
      keywords: ['fitness', 'health', 'workout', 'nutrition', 'diet', 'exercise', 'strength', 'yoga', 'wellness', 'body', 'muscle', 'weight'],
      metaphors: [
        'abstract human form made of flowing energy lines and light particles, dynamic motion pose',
        'bold geometric shapes suggesting power and movement, intersecting angular forms with kinetic energy',
        'smooth organic curves and sharp angular contrasts representing the balance of strength and flexibility',
      ],
      palette: 'deep black base, vibrant orange and red energy accents, cool blue-white highlights',
    },
    {
      keywords: ['art', 'design', 'creative', 'photo', 'draw', 'paint', 'illustration', 'graphic', 'visual', 'color', 'aesthetic', 'craft'],
      metaphors: [
        'cascading paint-like fluid dynamics in rich colors, frozen mid-splash against a dark void',
        'abstract brushstrokes and geometric shapes layered with depth, a blend of order and creative chaos',
        'a prism splitting a beam of light into vibrant spectral ribbons across a dark canvas',
      ],
      palette: 'deep matte black base, vivid magenta and violet accents, touches of warm gold',
    },
    {
      keywords: ['cook', 'food', 'recipe', 'kitchen', 'baking', 'chef', 'cuisine', 'meal', 'restaurant'],
      metaphors: [
        'artfully arranged ingredients and kitchen tools as an overhead still life, dramatic shadows on dark surface',
        'steam and warm light rising from a central focal point, rich textures and organic forms',
        'elegant arrangement of fresh ingredients with dramatic chiaroscuro lighting, editorial food photography style',
      ],
      palette: 'warm dark brown and charcoal base, rich amber and copper tones, warm overhead lighting',
    },
    {
      keywords: ['music', 'audio', 'sound', 'production', 'instrument', 'singing', 'beat', 'mix', 'song'],
      metaphors: [
        'abstract sound waves rippling outward in concentric patterns, transitioning from solid to translucent',
        'flowing equalizer bars transforming into an organic landscape of peaks and valleys with subtle glow',
        'musical notation symbols dissolving into abstract particle streams of light and rhythm',
      ],
      palette: 'deep indigo and black base, purple and magenta neon accents, cool white rim lighting',
    },
    {
      keywords: ['writing', 'content', 'copy', 'blog', 'author', 'book', 'story', 'journal', 'publish'],
      metaphors: [
        'an open book with abstract light and ideas flowing upward from the pages into dark space',
        'layered translucent pages floating in space with soft light passing through them',
        'flowing ink ribbons forming elegant abstract patterns against a dark atmospheric background',
      ],
      palette: 'warm charcoal base, cream and ivory accents, soft warm directional light from above',
    },
    {
      keywords: ['mindset', 'psychology', 'habit', 'productivity', 'personal', 'self', 'motivation', 'confidence', 'leadership', 'communication', 'relationship'],
      metaphors: [
        'a luminous abstract brain or neural network made of interconnected light points and flowing energy',
        'concentric ripples expanding outward from a central glowing point, calm and purposeful energy',
        'a pathway of light emerging from shadow, growing brighter and wider toward the viewer',
      ],
      palette: 'deep teal and dark slate base, warm gold and soft white accents, gentle volumetric light',
    },
  ]

  // Match category or fall back to a versatile default
  const matched = categories.find(cat => cat.keywords.some(kw => combined.includes(kw)))

  const defaultMetaphors = [
    'abstract geometric composition with interlocking translucent shapes, depth and dimension through layered glass-like forms',
    'a bold central diamond or hexagonal prism refracting light into surrounding space, clean and architectural',
    'smooth flowing ribbons of light weaving through dark space, creating a sense of forward motion and discovery',
  ]
  const defaultPalette = 'deep charcoal base, teal and electric blue accents, warm amber highlight points'

  const metaphor = pick(matched?.metaphors ?? defaultMetaphors)
  const palette = matched?.palette ?? defaultPalette

  // Build a concise, natural-language prompt (under 100 words for best FLUX results)
  const parts: string[] = [
    `Professional editorial illustration for an online course about ${title}.`,
    metaphor + '.',
    `Dark background, high contrast, ${palette}.`,
    `Dramatic directional lighting from the upper left creating depth and dimension.`,
  ]

  if (contentSummary) {
    // Add a brief content hint — keep it short so the prompt stays focused
    const shortSummary = contentSummary.split(',').slice(0, 4).join(',')
    parts.push(`Visual elements should evoke: ${shortSummary}.`)
  }

  if (custom.length > 0) {
    parts.push(custom + '.')
  }

  parts.push('No text, no words, no letters, no watermarks, no people, no faces.')
  parts.push('8K resolution, sharp details, clean composition, professional color grading.')

  return parts.join(' ')
}

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

  const { courseId, customPrompt } = parsed.data
  const safeCustomPrompt = (customPrompt ?? '').replace(/[\n\r]/g, ' ').slice(0, 500)

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

  // Build a content summary from generated_json so the image matches the actual course material
  let contentSummary = ''
  if (Array.isArray(course.generated_json)) {
    const modules = course.generated_json as Array<{ module_title?: string; lessons?: Array<{ lesson_title?: string }> }>
    const topics = modules
      .flatMap(m => [m.module_title, ...(m.lessons ?? []).map(l => l.lesson_title)])
      .filter(Boolean)
      .slice(0, 12)
    contentSummary = topics.join(', ')
  }
  // Fall back to description or raw_content snippet
  if (!contentSummary && course.description) {
    contentSummary = (course.description as string).replace(/[\n\r]/g, ' ').slice(0, 300)
  }
  if (!contentSummary && course.raw_content) {
    contentSummary = (course.raw_content as string).replace(/[\n\r]/g, ' ').slice(0, 300)
  }

  const imagePrompt = buildImagePrompt(safeTitle, safeAudience, safeCustomPrompt, contentSummary)

  try {
    const fal = getFal()

    // Use FLUX Pro v1.1 for dramatically better quality over Schnell
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_images: 1,
        safety_tolerance: '2',
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultData = result as any
    const tempUrl = resultData?.data?.images?.[0]?.url ?? resultData?.images?.[0]?.url
    if (!tempUrl) {
      console.error('[generate-cover-image] No image URL in fal response:', JSON.stringify(resultData).slice(0, 500))
      return Response.json({ error: 'Image generation failed' }, { status: 500 })
    }

    // Download from temp fal.media URL (expires in hours)
    const imageResponse = await fetch(tempUrl)
    if (!imageResponse.ok) {
      console.error('[generate-cover-image] Failed to download image from fal')
      return Response.json({ error: 'Image download failed' }, { status: 500 })
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    // Upload with unique filename (no upsert — we keep history)
    const storagePath = `${user.id}/${courseId}/cover-${Date.now()}.jpg`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('course-covers')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
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

    // Manage cover image history (max 5)
    const currentHistory: string[] = Array.isArray(course.cover_image_history)
      ? course.cover_image_history
      : []

    const newHistory = [...currentHistory, coverImageUrl]

    // If over 5, delete oldest from storage and trim array
    if (newHistory.length > 5) {
      const toRemove = newHistory.shift()!
      try {
        const urlObj = new URL(toRemove)
        const pathMatch = urlObj.pathname.match(/\/course-covers\/(.+)$/)
        if (pathMatch) {
          await supabaseAdmin.storage
            .from('course-covers')
            .remove([decodeURIComponent(pathMatch[1])])
        }
      } catch (err) {
        console.error('[generate-cover-image] Failed to delete old image:', err)
      }
    }

    // Update course record with new URL and history
    await supabaseAdmin
      .from('courses')
      .update({
        cover_image_url: coverImageUrl,
        cover_image_history: newHistory,
      })
      .eq('id', courseId)

    return Response.json({ coverImageUrl, coverImageHistory: newHistory })
  } catch (err) {
    console.error('[generate-cover-image] Error:', err)
    return Response.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
