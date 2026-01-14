import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// Helper to get CORS headers with dynamic origin
function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-User-Email',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req) })
}

/**
 * GET /api/extension/auth
 * Verify extension authentication token and return user info
 */
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  
  try {
    let user: any = null

    // Try multiple authentication methods
    
    // Method 1: Check for Authorization header with access token
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7)
      console.log("[Extension Auth] Trying Bearer token auth...")
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const tokenClient = createServiceClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      })
      
      const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser()
      if (tokenUser && !tokenError) {
        user = tokenUser
        console.log("[Extension Auth] Bearer token auth successful:", user.email)
      }
    }

    // Method 2: Try cookie-based auth
    if (!user) {
      const supabase = await createClient()
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      
      if (cookieUser) {
        user = cookieUser
        console.log("[Extension Auth] Cookie auth successful:", user.email)
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[Extension Auth] Error:", error)
    return NextResponse.json(
      { authenticated: false, error: "Authentication failed" },
      { status: 500, headers: corsHeaders }
    )
  }
}

