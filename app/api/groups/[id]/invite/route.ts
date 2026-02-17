import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const getGroupsStore = () => (global as any).__groupsStore || new Map()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupsStore = getGroupsStore()
    const group = groupsStore.get(id)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    if (group.created_by !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can invite members' }, { status: 403 })
    }

    const { emails } = await req.json()
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 })
    }

    group.member_roles = group.member_roles || {}
    group.member_emails = group.member_emails || []
    const added: string[] = []

    for (const email of emails) {
      const e = String(email).trim().toLowerCase()
      if (!e || !e.includes('@')) continue
      if (group.member_emails.some((x: string) => x.toLowerCase() === e)) continue
      group.member_emails.push(e)
      group.member_roles[e] = 'member'
      added.push(e)
    }

    group.member_count = group.member_emails.length
    groupsStore.set(id, group)

    return NextResponse.json({
      success: true,
      added,
      message: added.length > 0 ? `Invited ${added.length} member(s)` : 'No new members added',
    })
  } catch (err) {
    console.error('[groups] invite error:', err)
    return NextResponse.json({ error: 'Failed to invite members' }, { status: 500 })
  }
}
