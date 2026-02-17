import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reference to the in-memory store from the main groups route
// In a real app, this would be a database query
const getGroupsStore = () => {
  // Access the global store
  return (global as any).__groupsStore || new Map()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get group from in-memory store
    const groupsStore = getGroupsStore()
    const group = groupsStore.get(id)

    if (!group) {
      return NextResponse.json({ 
        success: false,
        error: 'Group not found' 
      }, { status: 404 })
    }

    // Check if user has access
    if (group.created_by !== user.id) {
      // Check if user is a member
      const isMember = group.member_emails?.some(
        (email: string) => email.toLowerCase() === user.email?.toLowerCase()
      )
      
      if (!isMember) {
        return NextResponse.json({ 
          success: false,
          error: 'You do not have access to this group' 
        }, { status: 403 })
      }
    }

    const memberRoles = group.member_roles || {}
    const memberList = (group.member_emails || []).map((email: string) => ({
      email,
      role: (memberRoles[email.toLowerCase()] || (group.member_emails?.indexOf(email) === 0 ? 'admin' : 'member')) as 'admin' | 'member',
      status: 'active' as const,
    }))

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        groupName: group.group_name,
        description: group.description,
        groupPhoto: group.group_photo || '/images/groups.png',
        memberCount: group.member_count,
        memberEmails: group.member_emails || [],
        members: memberList,
        createdDate: group.created_at,
        status: group.status,
        isOwner: group.created_by === user.id,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching group:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch group' 
    }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Only the group owner can update settings' }, { status: 403 })
    }

    const body = await req.json()
    if (body.groupName) group.group_name = body.groupName
    if (body.description !== undefined) group.description = body.description
    if (body.groupPhoto !== undefined) group.group_photo = body.groupPhoto
    if (body.members && Array.isArray(body.members)) {
      group.member_emails = body.members.map((m: { email: string }) => m.email)
      group.member_roles = (group.member_roles || {}) as Record<string, 'admin' | 'member'>
      body.members.forEach((m: { email: string; role?: string }) => {
        const e = String(m.email).toLowerCase()
        group.member_roles[e] = (m.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member'
      })
      group.member_count = group.member_emails.length
    }
    groupsStore.set(id, group)

    return NextResponse.json({ success: true, group: { id, groupName: group.group_name } })
  } catch (err) {
    console.error('[groups] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupsStore = getGroupsStore()
    const group = groupsStore.get(id)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Only owner can delete
    if (group.created_by !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can delete this group' }, { status: 403 })
    }

    groupsStore.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
