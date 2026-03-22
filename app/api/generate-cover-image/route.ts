import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getFal } from '@/lib/fal'
import { checkCoverImageAllowed, incrementCoverImageCount } from '@/lib/billing'

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
  includeTitle: z.boolean().optional(),
})

// ─── Topic detection + visual style mapping ──────────────────────────────────

type TopicStyle = {
  keywords: string[]
  scene: string[]
  colors: Array<{ r: number; g: number; b: number }>
}

const TOPIC_STYLES: TopicStyle[] = [
  {
    keywords: ['code', 'programming', 'software', 'developer', 'web', 'app', 'javascript', 'python', 'data', 'ai', 'machine learning', 'tech', 'api', 'database', 'saas', 'automation'],
    scene: [
      'A sleek dark workspace with a glowing monitor displaying abstract code patterns, clean desk with geometric tech objects, soft cyan light reflecting off surfaces',
      'Abstract network of glowing nodes and pathways on a dark background, clean geometric shapes connected by thin luminous lines, minimal and modern',
      'Futuristic dark control panel with holographic data visualizations floating above it, clean lines, professional tech aesthetic',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 0, g: 180, b: 216 }, { r: 232, g: 98, b: 42 }],
  },
  {
    keywords: ['business', 'marketing', 'sales', 'entrepreneur', 'money', 'finance', 'startup', 'growth', 'revenue', 'brand', 'strategy', 'lead', 'ecommerce', 'consulting'],
    scene: [
      'Elegant dark marble desk surface with a golden chess piece and scattered geometric shapes, dramatic directional lighting from the left, premium editorial feel',
      'Abstract ascending golden staircase against a deep dark background, each step catching warm light, clean and aspirational composition',
      'Luxurious dark workspace with gold accents, a leather-bound notebook and premium pen, warm amber light from one side, editorial photography style',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 196, g: 164, b: 74 }, { r: 232, g: 98, b: 42 }],
  },
  {
    keywords: ['fitness', 'health', 'workout', 'nutrition', 'diet', 'exercise', 'strength', 'yoga', 'wellness', 'body', 'muscle', 'weight', 'gym'],
    scene: [
      'Dramatic close-up of premium fitness equipment on a dark matte surface, a single kettlebell or dumbbell with orange rim lighting, moody and powerful',
      'Dark gym floor with chalk dust particles floating in a beam of warm directional light, minimal composition, raw and authentic energy',
      'Clean arrangement of fitness gear (jump rope, water bottle, towel) on dark concrete surface, overhead shot, editorial style with warm accent lighting',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 232, g: 98, b: 42 }, { r: 220, g: 50, b: 47 }],
  },
  {
    keywords: ['art', 'design', 'creative', 'photo', 'draw', 'paint', 'illustration', 'graphic', 'visual', 'color', 'aesthetic', 'craft', 'ui', 'ux'],
    scene: [
      'A dark artist workspace with paint tubes and brushes arranged artfully, splashes of vivid color against the dark surface, dramatic overhead light',
      'Abstract fluid art frozen mid-pour, vivid magenta and gold paint streams against a pure black background, high contrast editorial shot',
      'Clean dark desk with design tools (a stylus, color swatches, and a sketchbook), soft warm side lighting, minimal and modern',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 200, g: 50, b: 150 }, { r: 232, g: 178, b: 42 }],
  },
  {
    keywords: ['cook', 'food', 'recipe', 'kitchen', 'baking', 'chef', 'cuisine', 'meal', 'restaurant', 'nutrition'],
    scene: [
      'Overhead shot of fresh ingredients artfully arranged on a dark slate surface, herbs and spices with dramatic shadows, warm editorial food photography',
      'A single elegant dish on a dark plate against a moody black background, steam rising, warm directional lighting from the side',
      'Dark kitchen counter with copper cookware and fresh herbs, warm amber light, professional culinary photography aesthetic',
    ],
    colors: [{ r: 30, g: 20, b: 15 }, { r: 196, g: 130, b: 60 }, { r: 232, g: 98, b: 42 }],
  },
  {
    keywords: ['music', 'audio', 'sound', 'production', 'instrument', 'singing', 'beat', 'mix', 'song', 'podcast'],
    scene: [
      'Close-up of a premium microphone on a dark background with subtle purple and blue lighting, professional studio atmosphere, clean composition',
      'Dark recording studio with mixing console, soft neon purple and blue reflections on surfaces, moody and atmospheric',
      'Abstract sound waves visualized as luminous flowing ribbons against a deep dark background, purple and indigo tones, ethereal and modern',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 100, g: 50, b: 180 }, { r: 50, g: 120, b: 220 }],
  },
  {
    keywords: ['writing', 'content', 'copy', 'blog', 'author', 'book', 'story', 'journal', 'publish', 'newsletter'],
    scene: [
      'An open leather-bound journal on a dark wooden desk, warm light from a single source illuminating the pages, elegant pen beside it, editorial still life',
      'Stack of hardcover books on a dark surface with warm side lighting, one book open with pages fanning, moody library atmosphere',
      'Minimalist dark desk with a vintage typewriter, warm amber key light, professional editorial photography, clean negative space',
    ],
    colors: [{ r: 25, g: 20, b: 18 }, { r: 200, g: 180, b: 140 }, { r: 232, g: 98, b: 42 }],
  },
  {
    keywords: ['mindset', 'psychology', 'habit', 'productivity', 'personal', 'self', 'motivation', 'confidence', 'leadership', 'communication', 'relationship', 'coaching', 'spiritual'],
    scene: [
      'A single lit candle on a dark surface creating a warm glow, smooth stones stacked in balance nearby, minimal and contemplative, soft warm light',
      'Abstract sunrise colors emerging from darkness, warm gold and soft orange gradients transitioning from deep black, hopeful and expansive',
      'Clean dark surface with a compass and a clear path of light leading forward, metaphorical and aspirational, warm directional lighting',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 232, g: 178, b: 42 }, { r: 232, g: 98, b: 42 }],
  },
  {
    keywords: ['real estate', 'property', 'investing', 'rental', 'housing', 'mortgage', 'landlord'],
    scene: [
      'Architectural miniature model of a modern home on a dark surface, warm golden light from one side, premium editorial product shot',
      'Dark moody aerial view of city buildings at night with warm window lights, professional architectural photography, high contrast',
      'Golden key on a dark leather surface with soft directional light, minimal and elegant, real estate editorial style',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 196, g: 164, b: 74 }, { r: 80, g: 100, b: 120 }],
  },
  {
    keywords: ['social media', 'instagram', 'tiktok', 'youtube', 'influencer', 'creator', 'viral', 'followers', 'audience'],
    scene: [
      'Smartphone on a dark surface with colorful abstract light streaks emanating from the screen, modern and dynamic, clean editorial shot',
      'Dark flat lay with a phone, ring light reflection, and content creation tools arranged geometrically, warm and cool accent lighting',
      'Abstract network of glowing interconnected dots expanding outward from a central bright point, social graph visualization on dark background',
    ],
    colors: [{ r: 13, g: 15, b: 18 }, { r: 232, g: 98, b: 42 }, { r: 0, g: 180, b: 216 }],
  },
]

const DEFAULT_SCENES = [
  'Abstract geometric composition of translucent glass shapes catching warm directional light against a dark background, clean editorial style, bold and modern',
  'Elegant dark surface with a single luminous geometric object casting long shadows, premium and minimal, warm amber accent light',
  'Bold angular shapes and flowing gradients against a deep dark background, modern abstract art, professional and aspirational, high contrast',
]

const DEFAULT_COLORS = [{ r: 13, g: 15, b: 18 }, { r: 0, g: 180, b: 216 }, { r: 232, g: 98, b: 42 }]

function buildPrompt(
  title: string,
  audience: string,
  custom: string,
  contentSummary: string,
  includeTitle: boolean
): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const combined = `${title} ${contentSummary} ${audience}`.toLowerCase()

  const matched = TOPIC_STYLES.find(cat => cat.keywords.some(kw => combined.includes(kw)))
  const scene = pick(matched?.scene ?? DEFAULT_SCENES)

  const parts: string[] = [scene]

  if (contentSummary) {
    const shortSummary = contentSummary.split(',').slice(0, 3).join(',')
    parts.push(`The scene should subtly relate to: ${shortSummary}.`)
  }

  if (includeTitle) {
    // Recraft V3 is specifically good at rendering text in images
    parts.push(`Large bold white text reading "${title.toUpperCase()}" prominently displayed in the lower third of the image. The text should be in a thick modern sans-serif font with a subtle dark shadow for contrast against the background.`)
  } else {
    parts.push('No text, no words, no letters in the image.')
  }

  if (custom.length > 0) {
    parts.push(custom)
  }

  parts.push('16:9 widescreen format. No watermarks. Professional course thumbnail.')

  return parts.join(' ')
}

function getColors(title: string, contentSummary: string, audience: string): Array<{ r: number; g: number; b: number }> {
  const combined = `${title} ${contentSummary} ${audience}`.toLowerCase()
  const matched = TOPIC_STYLES.find(cat => cat.keywords.some(kw => combined.includes(kw)))
  return matched?.colors ?? DEFAULT_COLORS
}

// ─── Route handler ───────────────────────────────────────────────────────────

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

  const { courseId, customPrompt, includeTitle } = parsed.data
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

  // Cover image limit: 3 per course
  const coverCheck = await checkCoverImageAllowed(courseId)
  if (!coverCheck.allowed) {
    return Response.json(
      { error: coverCheck.error, coverImageCount: coverCheck.count },
      { status: 403 }
    )
  }

  const currentHistory: string[] = Array.isArray(course.cover_image_history)
    ? course.cover_image_history
    : []

  const safeTitle = (course.title ?? '').replace(/[\n\r]/g, ' ').slice(0, 200)
  const safeAudience = (course.target_audience ?? '').replace(/[\n\r]/g, ' ').slice(0, 500)

  // Build content summary from generated_json
  let contentSummary = ''
  if (Array.isArray(course.generated_json)) {
    const modules = course.generated_json as Array<{ module_title?: string; lessons?: Array<{ lesson_title?: string }> }>
    const topics = modules
      .flatMap(m => [m.module_title, ...(m.lessons ?? []).map(l => l.lesson_title)])
      .filter(Boolean)
      .slice(0, 12)
    contentSummary = topics.join(', ')
  }
  if (!contentSummary && course.description) {
    contentSummary = (course.description as string).replace(/[\n\r]/g, ' ').slice(0, 300)
  }
  if (!contentSummary && course.raw_content) {
    contentSummary = (course.raw_content as string).replace(/[\n\r]/g, ' ').slice(0, 300)
  }

  const imagePrompt = buildPrompt(safeTitle, safeAudience, safeCustomPrompt, contentSummary, includeTitle ?? true)
  const colors = getColors(safeTitle, contentSummary, safeAudience)

  try {
    const fal = getFal()

    // Recraft V3: best AI model for text rendering in images
    const result = await fal.subscribe('fal-ai/recraft/v3/text-to-image', {
      input: {
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        style: 'realistic_image',
        colors,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultData = result as any
    const tempUrl = resultData?.data?.images?.[0]?.url ?? resultData?.images?.[0]?.url
    if (!tempUrl) {
      console.error('[generate-cover-image] No image URL in response:', JSON.stringify(resultData).slice(0, 500))
      return Response.json({ error: 'Image generation failed' }, { status: 500 })
    }

    // Download from temp URL (expires quickly)
    const imageResponse = await fetch(tempUrl)
    if (!imageResponse.ok) {
      console.error('[generate-cover-image] Failed to download image')
      return Response.json({ error: 'Image download failed' }, { status: 500 })
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    // Upload with unique filename
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

    // Public URL (course-covers bucket is public)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('course-covers')
      .getPublicUrl(storagePath)

    const coverImageUrl = publicUrlData.publicUrl

    // Append to cover image history and increment count
    const newHistory = [...currentHistory, coverImageUrl]

    await supabaseAdmin
      .from('courses')
      .update({
        cover_image_url: coverImageUrl,
        cover_image_history: newHistory,
      })
      .eq('id', courseId)

    await incrementCoverImageCount(courseId)

    return Response.json({
      coverImageUrl,
      coverImageHistory: newHistory,
      coverImageCount: coverCheck.count + 1,
    })
  } catch (err) {
    console.error('[generate-cover-image] Error:', err)
    return Response.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
