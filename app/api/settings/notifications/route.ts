import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const DEFAULT_NOTIFICATIONS = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  giftReminders: true,
  contributionUpdates: true,
  groupInvites: true,
  weeklyDigest: false,
  marketingEmails: false,
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const db = createAdminClient() ?? await createClient()
    const { data: row, error } = await db
      .from("profiles")
      .select(
        "email_notifications, push_notifications, sms_notifications, gift_reminders, contribution_updates, group_invites, weekly_digest, marketing_emails"
      )
      .eq("id", userId)
      .single()
    if (error && error.code !== "PGRST116") {
      console.error("[settings/notifications] GET error:", error.message)
      return NextResponse.json({ ...DEFAULT_NOTIFICATIONS }, { status: 200 })
    }
    const p = row ?? {}
    return NextResponse.json({
      emailNotifications: p.email_notifications ?? DEFAULT_NOTIFICATIONS.emailNotifications,
      pushNotifications: p.push_notifications ?? DEFAULT_NOTIFICATIONS.pushNotifications,
      smsNotifications: p.sms_notifications ?? DEFAULT_NOTIFICATIONS.smsNotifications,
      giftReminders: p.gift_reminders ?? DEFAULT_NOTIFICATIONS.giftReminders,
      contributionUpdates: p.contribution_updates ?? DEFAULT_NOTIFICATIONS.contributionUpdates,
      groupInvites: p.group_invites ?? DEFAULT_NOTIFICATIONS.groupInvites,
      weeklyDigest: p.weekly_digest ?? DEFAULT_NOTIFICATIONS.weeklyDigest,
      marketingEmails: p.marketing_emails ?? DEFAULT_NOTIFICATIONS.marketingEmails,
    })
  } catch (error) {
    console.error("[settings/notifications] Error:", error)
    return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const db = createAdminClient() ?? await createClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.emailNotifications !== undefined) updates.email_notifications = body.emailNotifications
    if (body.pushNotifications !== undefined) updates.push_notifications = body.pushNotifications
    if (body.smsNotifications !== undefined) updates.sms_notifications = body.smsNotifications
    if (body.giftReminders !== undefined) updates.gift_reminders = body.giftReminders
    if (body.contributionUpdates !== undefined) updates.contribution_updates = body.contributionUpdates
    if (body.groupInvites !== undefined) updates.group_invites = body.groupInvites
    if (body.weeklyDigest !== undefined) updates.weekly_digest = body.weeklyDigest
    if (body.marketingEmails !== undefined) updates.marketing_emails = body.marketingEmails
    const { error } = await db.from("profiles").upsert(
      { id: userId, ...updates },
      { onConflict: "id" }
    )
    if (error) {
      console.error("[settings/notifications] PUT error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: body,
    })
  } catch (error) {
    console.error("[settings/notifications] Error:", error)
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
  }
}
