import { createBrowserClient } from '@supabase/ssr'

/** Stub used during server render so createBrowserClient (client-only) is never called on the server. */
function createServerStub() {
  const noop = () => {}
  const reject = () => Promise.reject(new Error('Auth is only available in the browser'))
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
      signInWithPassword: reject,
      signUp: reject,
      signOut: () => Promise.resolve({ error: null }),
      resend: reject,
      resetPasswordForEmail: reject,
    },
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
  } as ReturnType<typeof createBrowserClient>
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    return createServerStub()
  }
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return createServerStub()
    }
    browserClient = createBrowserClient(url, key)
  }
  return browserClient
}
