import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/signup') &&
      !request.nextUrl.pathname.startsWith('/api/request-trial') &&
      !request.nextUrl.pathname.startsWith('/api/verify-invite-code') &&
      !request.nextUrl.pathname.startsWith('/api/auth/signup') &&
      !request.nextUrl.pathname.startsWith('/api/billing/webhook') &&
      !request.nextUrl.pathname.startsWith('/terms') &&
      !request.nextUrl.pathname.startsWith('/privacy') &&
      !request.nextUrl.pathname.startsWith('/refund') &&
      request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
