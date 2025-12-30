import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * This is a development helper route to manually verify admin emails
 * In production, users should verify via email links
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // This route is for development/testing only
    // In production, use Supabase dashboard or email verification links
    return NextResponse.json({
      message: "Email verification should be done through Supabase dashboard or email link",
      instructions: [
        "1. Go to Supabase Dashboard > Authentication > Users",
        "2. Find the user with email: " + email,
        "3. Click on the user and mark email as confirmed",
        "OR",
        "4. Check your email for the verification link",
        "OR",
        "5. Disable email confirmation in Supabase Dashboard > Authentication > Settings > Email Auth > 'Confirm email' toggle (for development only)"
      ]
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



