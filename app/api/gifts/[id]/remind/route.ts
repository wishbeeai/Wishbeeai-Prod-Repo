import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY?.trim()
// Resend requires verified domain unless you use their default sender. Use onboarding@resend.dev until you verify your domain at resend.com/domains.
const REMIND_FROM_DEFAULT = "Wishbee <onboarding@resend.dev>"
function getRemindFromEmail(): string {
  const configured = process.env.REMIND_EMAIL_FROM?.trim()
  if (!configured) return REMIND_FROM_DEFAULT
  if (configured.toLowerCase().includes("yourdomain.com")) return REMIND_FROM_DEFAULT
  return configured
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giftId } = await params
    const body = await request.json().catch(() => ({}))
    const { giftName, contributors: contributorCount, message: customMessage } = body

    if (!giftId) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error. SUPABASE_SERVICE_ROLE_KEY is required to send reminders." },
        { status: 503 }
      )
    }

    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .select("id, gift_name, user_id")
      .eq("id", giftId)
      .single()

    if (giftError || !gift) {
      console.error("[Remind] Gift not found:", giftError)
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    const name = giftName || gift.gift_name || "this gift collection"
    const reminderMessage =
      customMessage ||
      `Don't forget to contribute to ${name}! Every contribution counts.`

    const recipients: { email: string; name?: string }[] = []

    // 1) Organizer (gift creator) – get email from Supabase Auth
    try {
      const {
        data: { user: organizer },
      } = await supabase.auth.admin.getUserById(gift.user_id)
      if (organizer?.email) {
        recipients.push({ email: organizer.email, name: organizer.user_metadata?.name || undefined })
      }
    } catch (e) {
      console.warn("[Remind] Could not get organizer email:", e)
    }

    // 2) Contributors – from gift_contributor_emails (if table exists)
    try {
      const { data: rows } = await supabase
        .from("gift_contributor_emails")
        .select("email, contributor_name")
        .eq("gift_id", giftId)
      if (rows?.length) {
        for (const row of rows) {
          if (row.email && !recipients.some((r) => r.email.toLowerCase() === row.email.toLowerCase())) {
            recipients.push({
              email: row.email,
              name: row.contributor_name || undefined,
            })
          }
        }
      }
    } catch (e) {
      console.warn("[Remind] Could not fetch contributor emails (table may not exist):", e)
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          error: "No recipient emails found. Add RESEND_API_KEY and ensure the gift has an organizer; contributor emails are saved when they contribute.",
        },
        { status: 400 }
      )
    }

    if (!resendApiKey) {
      return NextResponse.json(
        {
          error: "Email not configured. Add RESEND_API_KEY to .env.local (get a key at resend.com) and set REMIND_EMAIL_FROM to your verified sender (e.g. Wishbee <notifications@yourdomain.com>).",
        },
        { status: 503 }
      )
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = getRemindFromEmail()
    const subject = `Reminder: ${name}`
    const html = `
      <p>${reminderMessage}</p>
      <p>You can contribute or share the link with friends.</p>
      <p>— Wishbee</p>
    `

    let sent = 0
    let failed = 0
    let domainRestrictionHit = false
    for (const to of recipients) {
      let result = await resend.emails.send({
        from: fromEmail,
        to: to.email,
        subject,
        html,
      })
      // If domain not verified (403), retry with Resend default sender
      if (result.error && (result.error as { statusCode?: number }).statusCode === 403) {
        console.warn("[Remind] Domain not verified, sending from onboarding@resend.dev instead")
        result = await resend.emails.send({
          from: REMIND_FROM_DEFAULT,
          to: to.email,
          subject,
          html,
        })
      }
      const err = result.error as { statusCode?: number; message?: string } | undefined
      if (err && err.statusCode === 403 && err.message?.includes("verify a domain")) {
        domainRestrictionHit = true
      }
      if (result.error) {
        console.error("[Remind] Failed to send to", to.email, result.error)
        failed++
      } else {
        sent++
      }
    }

    if (sent === 0 && domainRestrictionHit) {
      return NextResponse.json(
        {
          error:
            "Resend allows sending only to your Resend account email until you verify a domain. Verify your domain at https://resend.com/domains, then set REMIND_EMAIL_FROM to an email on that domain (e.g. Wishbee <notifications@yourdomain.com>).",
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        sent > 0
          ? `Reminder sent to ${sent} recipient${sent !== 1 ? "s" : ""} for "${name}".`
          : "No reminder emails could be sent.",
      details: {
        giftId,
        giftName: name,
        sent,
        failed,
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[Remind] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send reminders" },
      { status: 500 }
    )
  }
}
