import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import {
  type TransparencyEmailEventData,
  sendTransparencyEmail,
  getTransparencyEmailSubject,
} from "@/lib/transparency-email"

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const DEFAULT_FROM = "Wishbee <onboarding@resend.dev>"

/**
 * POST /api/gifts/transparency-email
 * Sends the post-purchase transparency email to contributors.
 *
 * Body:
 *   eventData: TransparencyEmailEventData
 *   to?: { email: string; name?: string }[]  — if omitted, caller must send to their own list
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Body must be a JSON object" },
      { status: 400 }
    )
  }

  const { eventData, to: toList } = body as {
    eventData?: TransparencyEmailEventData
    to?: { email: string; name?: string }[]
  }

  if (!eventData) {
    return NextResponse.json(
      { error: "eventData is required" },
      { status: 400 }
    )
  }

  const {
    recipientName,
    totalFundsCollected,
    finalGiftPrice,
    remainingBalance,
    disposition,
    charityName,
    viewGiftDetailsUrl,
  } = eventData

  if (
    recipientName == null ||
    totalFundsCollected == null ||
    finalGiftPrice == null ||
    remainingBalance == null ||
    !disposition ||
    !viewGiftDetailsUrl
  ) {
    return NextResponse.json(
      { error: "eventData must include recipientName, totalFundsCollected, finalGiftPrice, remainingBalance, disposition, viewGiftDetailsUrl" },
      { status: 400 }
    )
  }

  const normalizedData: TransparencyEmailEventData = {
    recipientName: String(recipientName),
    totalFundsCollected: Number(totalFundsCollected),
    finalGiftPrice: Number(finalGiftPrice),
    remainingBalance: Number(remainingBalance),
    disposition: disposition as TransparencyEmailEventData["disposition"],
    charityName: charityName != null ? String(charityName) : undefined,
    viewGiftDetailsUrl: String(viewGiftDetailsUrl),
  }

  const to = Array.isArray(toList) && toList.length > 0
    ? toList.map((r) => ({ email: r?.email != null ? String(r.email).trim() : "", name: r?.name })).filter((r) => r.email)
    : []

  if (to.length === 0) {
    return NextResponse.json(
      { error: "At least one recipient required. Provide 'to' array with { email, name? }." },
      { status: 400 }
    )
  }

  if (!resendApiKey) {
    return NextResponse.json(
      {
        error: "Email not configured. Add RESEND_API_KEY to .env.local (get a key at resend.com).",
      },
      { status: 503 }
    )
  }

  try {
    const resend = new Resend(resendApiKey)
    const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || DEFAULT_FROM

    const result = await sendTransparencyEmail(normalizedData, {
      to,
      from,
      resend,
    })

    return NextResponse.json({
      ok: result.failed === 0,
      sent: result.sent,
      failed: result.failed,
      subject: getTransparencyEmailSubject(normalizedData),
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send transparency email"
    console.error("[TransparencyEmail]", e)
    return NextResponse.json(
      { error: message, details: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    )
  }
}
