import { fal } from '@fal-ai/client'

// Server-only. Import only from API routes.
// Configure lazily so missing FAL_KEY doesn't crash unrelated pages.
let configured = false

export function getFal() {
  if (!configured) {
    if (!process.env.FAL_KEY) {
      throw new Error('FAL_KEY environment variable is not set.')
    }
    fal.config({ credentials: process.env.FAL_KEY })
    configured = true
  }
  return fal
}
