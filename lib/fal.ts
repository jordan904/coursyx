import { fal } from '@fal-ai/client'

// Server-only — import only from API routes.
fal.config({ credentials: process.env.FAL_KEY })

export { fal }
