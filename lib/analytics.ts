// Reddit Pixel event tracking utility.
// Call this from client components to fire custom conversion events.

declare global {
  interface Window {
    rdt?: (action: string, event: string, params?: Record<string, unknown>) => void
  }
}

export function trackRedditEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.rdt) {
    window.rdt('track', event, params)
  }
}
