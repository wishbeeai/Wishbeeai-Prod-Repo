import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { Resend } from "resend"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function assertCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get("Authorization")?.trim()
  return auth === `Bearer ${secret}`
}

const DEFAULT_FROM = "Wishbee <onboarding@resend.dev>"

/**
 * GET /api/cron/weekly-digest
 * Sends a weekly summary email to users who have weekly_digest = true in their profile.
 * Call from Vercel Cron (e.g. weekly) with: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  if (!assertCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set. Add it to env to send weekly digest." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured (admin client)." },
      { status: 503 }
    )
  }

  try {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name, weekly_digest")
      .eq("weekly_digest", true)

    if (profileError || !profiles?.length) {
      return NextResponse.json({
        sent: 0,
        message: profileError ? profileError.message : "No users with weekly digest enabled.",
      })
    }

    const from = process.env.TRANSPARENCY_EMAIL_FROM?.trim() || DEFAULT_FROM
    const resend = new Resend(resendApiKey)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://wishbee.ai"
    let sent = 0
    const errors: string[] = []

    for (const profile of profiles) {
      const email = profile.email?.trim()
      if (!email) continue

      const name = profile.name || "there"
      const { data: gifts } = await supabase
        .from("gifts")
        .select("id, gift_name, status, created_at")
        .eq("user_id", profile.id)
        .in("status", ["active", "funded", "settled"])
        .order("created_at", { ascending: false })
        .limit(5)

      const giftCount = gifts?.length ?? 0
      const html = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #654321;">Your Weekly Wishbee Summary</h2>
          <p>Hi ${escapeHtml(name)},</p>
          <p>Here’s a quick snapshot of your gift collections on Wishbee.</p>
          ${giftCount > 0 ? `<p>You have <strong>${giftCount}</strong> gift collection(s) in your account.</p>` : "<p>You don’t have any active gift collections yet. Create one to start pooling for the perfect group gift!</p>"}
          <p><a href="${escapeHtml(baseUrl)}/gifts/active" style="color: #DAA520; font-weight: 600;">View your gifts →</a></p>
          <p style="color: #888; font-size: 12px;">You’re receiving this because you turned on Weekly Digest in Settings. To stop these emails, go to Settings → Notifications and turn off Weekly Digest.</p>
        </div>
      `

      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: "Your weekly Wishbee summary",
        html,
      })
      if (error) {
        errors.push(`${email}: ${error.message}`)
        continue
      }
      sent++
    }

    return NextResponse.json({
      sent,
      total: profiles.length,
      errors: errors.length ? errors : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send weekly digest"
    console.error("[cron/weekly-digest]", e)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
