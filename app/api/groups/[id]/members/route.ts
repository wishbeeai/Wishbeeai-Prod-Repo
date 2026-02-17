import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const getGroupsStore = () => (global as any).__groupsStore || new Map()

export async function PATCH(
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
      return NextResponse.json({ error: 'Only the group owner can change roles' }, { status: 403 })
    }

    const { email, role } = await req.json()
    if (!email || !role || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Valid email and role (admin|member) required' }, { status: 400 })
    }

    const e = String(email).toLowerCase()
    if (!group.member_emails?.some((x: string) => x.toLowerCase() === e)) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    group.member_roles = group.member_roles || {}
    group.member_roles[e] = role as 'admin' | 'member'
    groupsStore.set(id, group)

    return NextResponse.json({ success: true, email: e, role })
  } catch (err) {
    console.error('[groups] members PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Only the group owner can remove members' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Email query parameter required' }, { status: 400 })
    }

    const e = String(email).toLowerCase()
    const creatorEmail = user.email?.toLowerCase()
    if (e === creatorEmail) {
      return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 })
    }

    group.member_emails = (group.member_emails || []).filter((x: string) => x.toLowerCase() !== e)
    if (group.member_roles) delete group.member_roles[e]
    group.member_count = group.member_emails.length
    groupsStore.set(id, group)

    return NextResponse.json({ success: true, removed: e })
  } catch (err) {
    console.error('[groups] members DELETE error:', err)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
