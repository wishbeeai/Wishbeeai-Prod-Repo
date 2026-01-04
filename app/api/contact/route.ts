import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validated = contactSchema.parse(body)
    
    // In production, you would:
    // 1. Send an email to your support team
    // 2. Store the message in a database
    // 3. Send an auto-reply to the user
    
    // For now, we'll log it and return success
    console.log("[Contact Form] New message received:", {
      name: validated.name,
      email: validated.email,
      subject: validated.subject || "No subject",
      message: validated.message.substring(0, 100) + "...",
      timestamp: new Date().toISOString(),
    })
    
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // TODO: Store in database for tracking
    
    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
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
    
    console.error("[Contact Form] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to send message. Please try again later.",
      },
      { status: 500 }
    )
  }
}

