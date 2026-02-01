import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles redirect from Supabase after email confirmation or password reset.
 * Exchanges the code in the URL for a session and redirects to /profile.
 *
 * In Supabase Dashboard: Authentication → URL Configuration → add:
 *   http://127.0.0.1:3001/auth/callback  (and your production URL)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/profile'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
