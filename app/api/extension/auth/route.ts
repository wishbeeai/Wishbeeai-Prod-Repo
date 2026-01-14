import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
  'Access-Control-Allow-Credentials': 'true',
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/extension/auth
 * Verify extension authentication token and return user info
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
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

