import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const sendReferralSchema = z.object({
  email: z.string().email("Invalid email address"),
  referralCode: z.string().min(1),
  referralLink: z.string().url("Invalid referral link"),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = sendReferralSchema.parse(body)

    // In production, you would:
    // 1. Send an email with the referral link
    // 2. Store the referral in the database
    // 3. Track referral events
    
    console.log("[Referrals] Sending referral email:", {
      to: validated.email,
      referralCode: validated.referralCode,
      referrerId: user.id,
      timestamp: new Date().toISOString(),
    })

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // TODO: Store referral in database
    // TODO: Send email with referral link

    return NextResponse.json(
      {
        success: true,
        message: "Referral email sent successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error("[Referrals] Error sending referral:", error)
    return NextResponse.json(
      {
        error: "Failed to send referral email",
      },
      { status: 500 }
    )
  }
}

