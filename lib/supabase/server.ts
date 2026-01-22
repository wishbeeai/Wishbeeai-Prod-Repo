import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}

/**
 * Create an admin Supabase client that bypasses Row Level Security.
 * 
 * ⚠️ SECURITY WARNING: Only use this for server-side operations that need
 * to access data across users (e.g., public share links, webhooks).
 * NEVER expose this to client-side code.
 * 
 * Returns null if service role key is not configured.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[Supabase] Service role key not configured, admin client unavailable')
    return null
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get a Supabase client for public API routes.
 * Uses admin client if available (bypasses RLS), otherwise falls back to anon client.
 */
export async function createPublicClient() {
  const adminClient = createAdminClient()
  if (adminClient) {
    return adminClient
  }
  
  // Fall back to regular client (will be subject to RLS policies)
  return await createClient()
}
