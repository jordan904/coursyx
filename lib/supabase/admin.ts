import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only. Import only from /app/api/** routes.
// Lazy singleton to avoid crashing during Next.js build phase
// when env vars are not yet available.
let _admin: SupabaseClient | null = null

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_admin) {
      _admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    return Reflect.get(_admin, prop, receiver)
  },
})
