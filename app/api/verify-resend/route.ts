import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

/**
 * GET /api/verify-resend?to=your@email.com
 *
 * Sends a single test email to verify Resend configuration.
 * Only available in development (NODE_ENV=development) to avoid abuse.
 *
 * Returns: { ok, message, id? } or { error }.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Verify endpoint is only available in development." },
      { status: 404 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "RESEND_API_KEY is not set in .env.local. Get a key at https://resend.com/api-keys",
      },
      { status: 503 }
    )
  }

  const to = request.nextUrl.searchParams.get("to")?.trim()
  if (!to || !to.includes("@")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide a valid email: /api/verify-resend?to=your@email.com",
      },
      { status: 400 }
    )
  }

  const from =
    process.env.TRANSPARENCY_EMAIL_FROM?.trim() ||
    process.env.REMIND_EMAIL_FROM?.trim() ||
    "Wishbee <onboarding@resend.dev>"

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Wishbee Resend test",
      html: `<p>If you see this, Resend is configured correctly.</p><p>From: ${from}</p><p>Sent at: ${new Date().toISOString()}</p>`,
    })

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          hint:
            "If 'from' is invalid, add TRANSPARENCY_EMAIL_FROM or REMIND_EMAIL_FROM in .env.local and verify the domain at https://resend.com/domains",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: `Test email sent to ${to}. Check inbox (and spam).`,
      id: data?.id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
