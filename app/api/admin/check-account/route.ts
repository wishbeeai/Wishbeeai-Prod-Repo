import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get user by email - this is a server-side operation
    // Note: Supabase doesn't have a direct "getUserByEmail" in client SDK
    // We'd need to use the admin API, but for now we'll return instructions
    
    return NextResponse.json({
      message: "To check if account exists, try signing up. If it exists, you'll get an error.",
      instructions: [
        "1. If you haven't signed up yet, go to the homepage and click 'Sign Up'",
        "2. Use email: " + ADMIN_EMAIL,
        "3. Choose a password (at least 8 characters)",
        "4. After signing up, you should be able to log in immediately",
        "5. If you get 'User already registered', the account exists - try password reset"
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



